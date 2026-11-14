import { isNil } from 'ramda';

import { ISOLATED_SUPABASE_PORTS } from '../../e2e/isolatedRuntime';
import { measureCliStep } from './cliTiming';
import { runEnvironment } from './environment';
import {
  checkEnvironmentCatalog,
  ENVIRONMENT_AUTHORIZATION_GAPS,
  ENVIRONMENT_CATALOG_QUERY,
} from './environmentCatalog';
import {
  localCommandEnvironment,
  runLocalCommand,
} from './environmentCommands';
import { createDockerDriver } from './environmentDocker';
import { prepareEnvironmentInputs } from './environmentInputs';
import { acquireEnvironmentLock } from './environmentLock';
import { createEnvironmentPlan } from './environmentOwnership';
import { environmentLeaseSchema } from './environmentSchema';
import { writeArtifact } from './ledgerArtifacts';
import { seedSupabaseUpdateCache, verifySupabaseCli } from './supabaseCli';

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type {
  EnvironmentManifest,
  EnvironmentRunPhase,
} from './environmentSchema';

const PORTS = ISOLATED_SUPABASE_PORTS;
const EXCLUDED_SERVICES = [
  'realtime',
  'imgproxy',
  'mailpit',
  'postgres-meta',
  'studio',
  'edge-runtime',
  'logflare',
  'vector',
  'supavisor',
].join(',');
type CatalogCheck = Omit<
  ReturnType<typeof checkEnvironmentCatalog>,
  'fingerprint'
> & { fingerprint: string | null };

type EnvironmentProbeProgress = {
  phase:
    | 'checking-cli'
    | 'locking'
    | 'preparing-inputs'
    | 'starting'
    | 'inspecting'
    | 'working'
    | 'cleanup';
  runId?: string;
  workdir?: string;
};

const probeWithSignal = async (
  root: string,
  signal: AbortSignal,
  progress: (value: EnvironmentProbeProgress) => void,
  operation?: (
    manifest: EnvironmentManifest,
    signal: AbortSignal,
  ) => Promise<void>,
  additionalPorts: number[] = [],
) => {
  progress({ phase: 'checking-cli' });
  const worktreeRoot = await realpath(root);
  signal.throwIfAborted();
  const dockerHost = (
    await measureCliStep('docker-context', () =>
      runLocalCommand(
        'docker',
        ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'],
        { cwd: worktreeRoot, env: process.env, signal },
      ),
    )
  ).trim();
  const env = localCommandEnvironment(process.env, dockerHost);
  // cleanup用runnerへ中断signalを渡さず、停止確認は中断後も実行する。
  const run = (tool: 'docker' | 'supabase' | 'git', args: string[]) =>
    runLocalCommand(tool, args, { cwd: worktreeRoot, env });
  const runChecked = (tool: 'docker' | 'supabase' | 'git', args: string[]) => {
    signal.throwIfAborted();
    return runLocalCommand(tool, args, { cwd: worktreeRoot, env, signal });
  };
  await measureCliStep('supabase-version', () =>
    verifySupabaseCli(env, signal),
  );
  const dockerVersion = (
    await measureCliStep('docker-info', () =>
      runChecked('docker', ['info', '--format', '{{.ServerVersion}}']),
    )
  ).trim();
  const commit = (
    await measureCliStep('git-head', () =>
      runChecked('git', ['rev-parse', 'HEAD']),
    )
  ).trim();
  const repoRoot = dirname(
    await realpath(
      resolve(
        worktreeRoot,
        (
          await measureCliStep('git-common-dir', () =>
            runChecked('git', ['rev-parse', '--git-common-dir']),
          )
        ).trim(),
      ),
    ),
  );
  const runId = randomBytes(6).toString('hex');
  const ownerNonce = randomUUID();
  const projectId = `sm-e2e-${runId}`;
  signal.throwIfAborted();
  progress({ phase: 'locking', runId });
  const lock = await acquireEnvironmentLock({
    registryRoot: join(
      await realpath(tmpdir()),
      'scenario-manager-e2e-locks-v1',
    ),
    repoKey: repoRoot,
    worktreeRoot,
    runId,
    ownerNonce,
    projectId,
    ports: [...Object.values(PORTS), ...additionalPorts],
  });
  let isLifecycleOwner = false;
  try {
    signal.throwIfAborted();
    progress({ phase: 'preparing-inputs', runId });
    const prepared = await prepareEnvironmentInputs(worktreeRoot, {
      runId,
      ports: PORTS,
    });
    signal.throwIfAborted();
    const { workdir, inputHashes } = prepared;
    progress({ phase: 'preparing-inputs', runId, workdir });
    const manifest = createEnvironmentPlan({
      runId,
      ownerNonce,
      worktreeRoot,
      repoRoot,
      commit,
      ports: PORTS,
      inputHashes,
      createdAt: new Date().toISOString(),
    });
    const lease = environmentLeaseSchema.parse({
      runId,
      ownerNonce,
      projectId,
      worktreeRoot,
    });
    const leasePath = join(workdir, 'owner.json');
    await writeFile(leasePath, JSON.stringify(lease), {
      flag: 'wx',
      mode: 0o600,
    });
    await writeFile(
      join(workdir, 'runtime.json'),
      JSON.stringify(
        {
          dockerVersion,
          dockerHost,
          additionalPorts,
          lockFiles: lock.lockFiles,
        },
        null,
        2,
      ),
      { flag: 'wx', mode: 0o600 },
    );
    const readLease = async () =>
      environmentLeaseSchema.parse(
        JSON.parse(await readFile(leasePath, 'utf8')),
      );
    signal.throwIfAborted();
    let hasReplayedMigrations = false;
    const catalogState: {
      check: CatalogCheck | null;
      status: 'verified' | 'mismatch' | 'not-reached';
    } = { check: null, status: 'not-reached' };
    let failurePhase: EnvironmentRunPhase | undefined;
    isLifecycleOwner = true;
    const result = await runEnvironment(manifest, {
      docker: createDockerDriver((args) => run('docker', args)),
      save: async (value) => {
        writeArtifact(
          worktreeRoot,
          relative(worktreeRoot, join(workdir, 'manifest.json')),
          `${JSON.stringify(value, null, 2)}\n`,
        );
        // cleanupの失敗記録がmanifestを更新しても、最初の実行失敗段階を保持する。
        failurePhase ??= value.failure?.phase;
        if (value.state === 'stopping')
          progress({ phase: 'cleanup', runId, workdir });
      },
      readLease,
      start: async () => {
        signal.throwIfAborted();
        progress({ phase: 'starting', runId, workdir });
        const actual = await readLease();
        if (
          Object.entries(lease).some(
            ([key, value]) => Reflect.get(actual, key) !== value,
          )
        )
          throw new Error('所有markerが一致しません。');
        const config = await readFile(join(workdir, 'supabase/config.toml'));
        if (
          createHash('sha256').update(config).digest('hex') !==
          inputHashes.config
        )
          throw new Error('起動前にconfigが変更されました。');
        signal.throwIfAborted();
        // 固定版の更新通知だけを所有workdir内で抑制し、startの検査は維持する。
        await seedSupabaseUpdateCache(workdir);
        signal.throwIfAborted();
        await runLocalCommand(
          'supabase',
          ['start', '--workdir', workdir, '--exclude', EXCLUDED_SERVICES],
          {
            cwd: workdir,
            env,
            signal,
            log: join(workdir, 'start.private.log'),
          },
        );
        // startがseedまで完了した事実を、後続検査やcleanupの成否から分離する。
        hasReplayedMigrations = true;
      },
      verify: async (running) => {
        signal.throwIfAborted();
        progress({ phase: 'inspecting', runId, workdir });
        const database = running.resources.containers.find(
          (resource) =>
            resource.name === `supabase_db_${projectId}` &&
            resource.projectLabel === projectId,
        );
        if (isNil(database))
          throw new Error('所有DB containerが確認できません。');
        const catalog = await runChecked('docker', [
          'exec',
          database.id,
          'psql',
          '-X',
          '-U',
          'postgres',
          '-d',
          'postgres',
          '-t',
          '-A',
          '-v',
          'ON_ERROR_STOP=1',
          '-c',
          ENVIRONMENT_CATALOG_QUERY,
        ]);
        catalogState.status = 'mismatch';
        await writeFile(join(workdir, 'catalog.json'), catalog, {
          flag: 'wx',
        });
        try {
          const input: unknown = JSON.parse(catalog);
          catalogState.check = checkEnvironmentCatalog(input);
        } catch {
          // 生のJSONやvalidation errorを公開せず、失敗した検査もartifactに残す。
          catalogState.check = {
            schemaVersion: 1,
            schemaParityPassed: false,
            authorizationStatus: 'not-verified',
            fingerprint: null,
            issues: [
              {
                code: 'CATALOG_INVALID',
                subject: 'catalog.json',
                message: 'catalogのJSONまたはmetadata構造が不正です。',
              },
            ],
            knownAuthorizationGaps: ENVIRONMENT_AUTHORIZATION_GAPS,
          };
        }
        catalogState.status = catalogState.check.schemaParityPassed
          ? 'verified'
          : 'mismatch';
        writeArtifact(
          worktreeRoot,
          relative(worktreeRoot, join(workdir, 'catalog-check.json')),
          `${JSON.stringify(catalogState.check, null, 2)}\n`,
        );
        if (!catalogState.check.schemaParityPassed)
          throw new Error('catalogが固定期待値と一致しません。');
        if (!isNil(operation)) {
          signal.throwIfAborted();
          progress({ phase: 'working', runId, workdir });
          // fixture・build・testも所有lockの生存期間内で完了させる。
          await operation(structuredClone(running), signal);
          signal.throwIfAborted();
        }
      },
      release: () => lock.release(),
    });
    const report = {
      runId,
      workdir,
      cliVersion: manifest.cliVersion,
      inputHashes,
      migrationReplayPassed: hasReplayedMigrations,
      schemaParityPassed: catalogState.check?.schemaParityPassed ?? false,
      catalogStatus: catalogState.status,
      authorizationStatus: 'not-verified' as const,
      fingerprint: catalogState.check?.fingerprint ?? null,
      catalogIssues: catalogState.check?.issues ?? [],
      knownAuthorizationGaps: ENVIRONMENT_AUTHORIZATION_GAPS,
      passed:
        result.passed && (catalogState.check?.schemaParityPassed ?? false),
      cleanup: result.manifest.cleanup,
      ...(isNil(failurePhase) ? {} : { failurePhase }),
    };
    writeArtifact(
      worktreeRoot,
      relative(worktreeRoot, join(workdir, 'replay.json')),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    return report;
  } finally {
    if (!isLifecycleOwner) await lock.release();
  }
};

/**
 * 空DBへのmigration→seedと固定catalog期待値の一致を検査し、認可の安全性とは区別する。
 * lock取得前から中断を監視し、初期化失敗と全cleanupの終了後に監視を外す。
 * 呼出元のAbortSignalでも協調中断できる。SIGKILLやWindowsコンソールによる
 * process treeの強制終了ではfinallyの実行を保証できず、所有journalからの復旧が必要。
 */
export const probeEnvironment = async (
  root: string,
  signal?: AbortSignal,
  onProgress?: (value: EnvironmentProbeProgress) => void,
  operation?: (
    manifest: EnvironmentManifest,
    signal: AbortSignal,
  ) => Promise<void>,
  additionalPorts: number[] = [],
) => {
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  const forwardAbort = () => controller.abort(signal?.reason);
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  signal?.addEventListener('abort', forwardAbort, { once: true });
  try {
    if (signal?.aborted) forwardAbort();
    controller.signal.throwIfAborted();
    return await probeWithSignal(
      root,
      controller.signal,
      (value) => {
        try {
          onProgress?.(value);
        } catch {
          // 表示先の失敗で所有resourceのcleanupを止めない。
        }
      },
      operation,
      additionalPorts,
    );
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
    signal?.removeEventListener('abort', forwardAbort);
  }
};

/** CLIでは安全な段階情報をstderr、診断結果JSONをstdoutへ分けて出す。 */
export const runEnvironmentProbeCli = async (
  root: string,
  signal?: AbortSignal,
): Promise<number> => {
  let latest: EnvironmentProbeProgress = { phase: 'checking-cli' };
  try {
    const report = await probeEnvironment(root, signal, (value) => {
      latest = value;
      process.stderr.write(`[e2e-environment] ${JSON.stringify(value)}\n`);
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report.passed ? 0 : 1;
  } catch {
    // 初期化前にはlog/manifestが存在しない。既存workdirだけを案内する。
    const workdir =
      !isNil(latest.workdir) && existsSync(latest.workdir)
        ? latest.workdir
        : undefined;
    process.stderr.write(
      `[e2e-environment] ${JSON.stringify({
        status: 'failed',
        phase: latest.phase,
        runId: latest.runId,
        workdir,
        message:
          '専用環境の診断に失敗しました。表示された段階の設定を確認してください。',
      })}\n`,
    );
    return 1;
  }
};

if (
  !isNil(process.argv[1]) &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  runEnvironmentProbeCli(process.cwd()).then((code) => {
    process.exitCode = code;
  });
}

export type { EnvironmentProbeProgress };
