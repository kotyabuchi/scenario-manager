import { isNil } from 'ramda';
import { z } from 'zod';

import { ISOLATED_APP_PORT } from '../../e2e/isolatedRuntime';
import { runLocalCommand } from './environmentCommands';
import { assertFixtureConnection } from './environmentCredentials';
import { readArtifact, writeArtifact } from './ledgerArtifacts';

import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { basename, dirname, join, relative } from 'node:path';

import type { FixtureConnection } from './environmentCredentials';

/** probeとNext runnerが共同で予約する専用アプリport。 */
export const APP_PORT = ISOLATED_APP_PORT;
const BASE_URL = `http://127.0.0.1:${APP_PORT}`;
const NEXT_VERSION = '16.1.6';
const BUILD_TIMEOUT_MS = 20 * 60_000;
const READINESS_TIMEOUT_MS = 90_000;
const OPERATION_TIMEOUT_MS = 20 * 60_000;
const REQUEST_TIMEOUT_MS = 2_000;
const POLL_INTERVAL_MS = 250;
const OS_KEYS = new Set([
  'PATH',
  'PATHEXT',
  'SYSTEMROOT',
  'WINDIR',
  'COMSPEC',
  'TEMP',
  'TMP',
  'USERPROFILE',
  'APPDATA',
  'LOCALAPPDATA',
  'HOME',
]);
const lockFileSchema = z.object({
  path: z.string(),
  dev: z.string(),
  ino: z.string(),
  contentsHash: z.string().regex(/^[a-f0-9]{64}$/),
});
const runtimeSchema = z.object({
  additionalPorts: z.array(z.number().int()),
  lockFiles: z.array(lockFileSchema),
});
const metadataSchema = z.object({
  runId: z.string(),
  ownerNonce: z.string(),
  projectId: z.string(),
  worktreeRoot: z.string(),
  registryRoot: z.string(),
  repoKey: z.string(),
  reservation: z.string(),
  ports: z.array(z.number().int()),
});
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
type AppContext = {
  baseURL: string;
  env: NodeJS.ProcessEnv;
  signal: AbortSignal;
};

/** build/server/testへはOS起動条件と明示したlocal公開設定だけを渡す。 */
export const isolatedAppEnvironment = (
  connection: FixtureConnection,
  source: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv => {
  assertFixtureConnection(connection);
  const env = { ...source };
  for (const key of Object.keys(env))
    if (!OS_KEYS.has(key.toUpperCase())) Reflect.deleteProperty(env, key);
  return Object.assign(env, {
    NODE_ENV: 'production',
    CI: '1',
    NO_COLOR: '1',
    NEXT_TELEMETRY_DISABLED: '1',
    SCENARIO_E2E_BUILD: '1',
    SCENARIO_E2E_RUN_ID: connection.manifest.runId,
    // Next 16.1.6のloadEnvConfig/processEnv境界。版固定と実@next/env回帰で保証する。
    __NEXT_PROCESSED_ENV: 'true',
    NEXT_PUBLIC_SUPABASE_URL: connection.manifest.apiUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: connection.anonKey,
  });
};

const assertReservations = async (connection: FixtureConnection) => {
  const { manifest, lease } = connection;
  const runtime = runtimeSchema.parse(
    JSON.parse(
      readArtifact(
        manifest.worktreeRoot,
        join(manifest.workdir, 'runtime.json'),
      ) ?? 'null',
    ),
  );
  if (!runtime.additionalPorts.includes(APP_PORT))
    throw new Error('app portの予約がありません。');
  const required = new Set([
    `port-${APP_PORT}`,
    `worktree-${hash(manifest.worktreeRoot)}`,
  ]);
  for (const record of runtime.lockFiles) {
    const reservation = basename(record.path, '.lock');
    if (!required.has(reservation)) continue;
    const stat = await lstat(record.path, { bigint: true });
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.nlink !== BigInt(1) ||
      stat.dev.toString() !== record.dev ||
      stat.ino.toString() !== record.ino ||
      stat.size > BigInt(65_536)
    )
      throw new Error('appの所有lockが置換されています。');
    const contents = await readFile(record.path, 'utf8');
    const metadata = metadataSchema.parse(JSON.parse(contents));
    if (
      hash(contents) !== record.contentsHash ||
      metadata.reservation !== reservation ||
      metadata.runId !== lease.runId ||
      metadata.ownerNonce !== lease.ownerNonce ||
      metadata.projectId !== lease.projectId ||
      metadata.worktreeRoot !== lease.worktreeRoot ||
      metadata.repoKey !== manifest.repoRoot ||
      !metadata.ports.includes(APP_PORT) ||
      (await realpath(dirname(record.path))) !== metadata.registryRoot
    )
      throw new Error('appの所有lockとleaseが一致しません。');
    required.delete(reservation);
  }
  if (required.size > 0)
    throw new Error('appのport/worktree lockを確認できません。');
};

const assertFreePort = async () => {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(
      { host: '127.0.0.1', port: APP_PORT, exclusive: true },
      () => {
        server.removeListener('error', reject);
        server.close((error) => (isNil(error) ? resolve() : reject(error)));
      },
    );
  });
};
const plainDirectory = async (path: string) => {
  const stat = await lstat(path);
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    (await realpath(path)) !== path
  )
    throw new Error('appの保存先は物理directoryに限定してください。');
};
const wait = (signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new Error('app準備を中断しました。'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, POLL_INTERVAL_MS);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
const ready = async (runId: string, signal: AbortSignal) => {
  const deadline = AbortSignal.timeout(READINESS_TIMEOUT_MS);
  const combined = AbortSignal.any([signal, deadline]);
  while (!combined.aborted) {
    try {
      const response = await fetch(BASE_URL, {
        redirect: 'manual',
        signal: AbortSignal.any([
          combined,
          AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        ]),
      });
      const isReady =
        response.ok && response.headers.get('x-scenario-e2e-run-id') === runId;
      await response.body?.cancel();
      if (isReady) return;
    } catch {
      /* 起動途中の接続拒否は期限内だけ再試行する。 */
    }
    await wait(combined);
  }
  throw new Error('appのreadiness期限を超過または中断しました。');
};

/** 予約済み所有環境で本番build/startを行い、operationとserverの終了確認後だけ返す。 */
export const withIsolatedApp = async (
  connection: FixtureConnection,
  signal: AbortSignal,
  operation: (context: AppContext) => Promise<void>,
): Promise<void> => {
  const { manifest } = connection;
  let phase = 'preflight';
  let statusFile: string | undefined;
  let nextEnvBefore: string | undefined;
  let hasCapturedInputs = false;
  let nextEnvChanged: boolean | null = null;
  const failures: string[] = [];
  const controller = new AbortController();
  const serverController = new AbortController();
  const abort = () => {
    controller.abort();
    serverController.abort();
  };
  signal.addEventListener('abort', abort, { once: true });
  let isStopping = false;
  let serverResult: Promise<boolean> | undefined;
  let operationResult: Promise<void> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const save = (status: 'running' | 'passed' | 'failed') => {
    if (!isNil(statusFile))
      writeArtifact(
        manifest.worktreeRoot,
        statusFile,
        `${JSON.stringify({ schemaVersion: 1, runId: manifest.runId, phase, status, failures, nextEnvChanged }, null, 2)}\n`,
      );
  };
  try {
    if (signal.aborted) abort();
    controller.signal.throwIfAborted();
    assertFixtureConnection(connection);
    await plainDirectory(manifest.worktreeRoot);
    await plainDirectory(manifest.workdir);
    await assertReservations(connection);
    await assertFreePort();
    const require = createRequire(join(manifest.worktreeRoot, 'package.json'));
    const nextPackage = z
      .object({ version: z.literal(NEXT_VERSION) })
      .parse(
        JSON.parse(
          await readFile(require.resolve('next/package.json'), 'utf8'),
        ),
      );
    if (nextPackage.version !== NEXT_VERSION)
      throw new Error('Nextの版が不正です。');
    const nextCLI = require.resolve('next/dist/bin/next');
    const appDirectory = join(manifest.workdir, 'app');
    await mkdir(appDirectory, { mode: 0o700 });
    await plainDirectory(appDirectory);
    const distRoot = join(manifest.worktreeRoot, '.next-e2e');
    await mkdir(distRoot, { recursive: true });
    await plainDirectory(distRoot);
    await mkdir(join(distRoot, `run-${manifest.runId}`));
    statusFile = relative(
      manifest.worktreeRoot,
      join(appDirectory, 'status.json'),
    );
    // Turbopackでも解決できるよう、run内configからの相対pathで統一する。
    const configRoot = relative(appDirectory, manifest.worktreeRoot).replaceAll(
      '\\',
      '/',
    );
    await writeFile(
      join(appDirectory, 'tsconfig.json'),
      JSON.stringify(
        {
          extends: `${configRoot}/tsconfig.json`,
          include: [
            'next-env.d.ts',
            'src/**/*.ts',
            'src/**/*.tsx',
            'next.config.ts',
            `.next-e2e/run-${manifest.runId}/types/**/*.ts`,
          ].map((file) => `${configRoot}/${file}`),
          exclude: [
            'node_modules',
            'test-results',
            'styled-system/**/*.d.ts',
            'styled-system/**/*.js',
            'styled-system/**/*.mjs',
          ].map((file) => `${configRoot}/${file}`),
        },
        null,
        2,
      ),
      { flag: 'wx', mode: 0o600 },
    );
    nextEnvBefore = readArtifact(manifest.worktreeRoot, 'next-env.d.ts');
    hasCapturedInputs = true;
    const env = isolatedAppEnvironment(connection);
    phase = 'build';
    save('running');
    deadline = setTimeout(() => controller.abort(), BUILD_TIMEOUT_MS);
    await runLocalCommand('node', [nextCLI, 'build'], {
      cwd: manifest.worktreeRoot,
      env,
      signal: controller.signal,
      log: join(appDirectory, 'build.private.log'),
    });
    clearTimeout(deadline);
    controller.signal.throwIfAborted();
    await assertFreePort();
    phase = 'readiness';
    save('running');
    serverResult = runLocalCommand(
      'node',
      [nextCLI, 'start', '--hostname', '127.0.0.1', '--port', String(APP_PORT)],
      {
        cwd: manifest.worktreeRoot,
        env,
        signal: serverController.signal,
        shouldAllowAbort: true,
        log: join(appDirectory, 'server.private.log'),
      },
    ).then(
      () => true,
      () => false,
    );
    serverResult.then(() => {
      if (!isStopping && !controller.signal.aborted) {
        failures.push('server-exit');
        controller.abort();
      }
    });
    await ready(manifest.runId, controller.signal);
    controller.signal.throwIfAborted();
    phase = 'operation';
    save('running');
    deadline = setTimeout(() => controller.abort(), OPERATION_TIMEOUT_MS);
    operationResult = operation({
      baseURL: BASE_URL,
      env,
      signal: controller.signal,
    });
    await operationResult;
    controller.signal.throwIfAborted();
  } catch {
    failures.push(phase);
  } finally {
    clearTimeout(deadline);
    isStopping = true;
    controller.abort();
    serverController.abort();
    // operationへ中断を伝えた後も、子test終了前にstack cleanupへ進めない。
    await operationResult?.catch(() => undefined);
    if (!isNil(serverResult) && !(await serverResult))
      failures.push('server-stop');
    signal.removeEventListener('abort', abort);
    phase = 'finished';
    try {
      if (hasCapturedInputs)
        nextEnvChanged =
          readArtifact(manifest.worktreeRoot, 'next-env.d.ts') !==
          nextEnvBefore;
      save(failures.length === 0 ? 'passed' : 'failed');
    } catch {
      failures.push('report');
    }
  }
  if (failures.length > 0)
    throw new Error(
      `専用appの処理に失敗しました: ${[...new Set(failures)].join(', ')}`,
    );
};

export type { AppContext };
