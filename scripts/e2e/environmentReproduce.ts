import { isNil } from 'ramda';

import { renderEnvironmentConfig } from './environmentInputs';
import { probeEnvironment } from './environmentProbe';
import {
  environmentCleanupSchema,
  environmentLeaseSchema,
  environmentManifestSchema,
} from './environmentSchema';
import { parseArtifact, readArtifact, writeArtifact } from './ledgerArtifacts';

import { createHash } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import type { EnvironmentProbeProgress } from './environmentProbe';
import type {
  EnvironmentIssue,
  EnvironmentManifest,
} from './environmentSchema';

const RECEIPT = 'test-results/quality/environment-reproduction.json';
const SERVICES = ['db', 'rest', 'kong', 'storage', 'auth'] as const;
type EnvironmentProof = {
  report: Awaited<ReturnType<typeof probeEnvironment>>;
  manifest: EnvironmentManifest;
};
const issue = (
  code: string,
  subject: string,
  message: string,
): EnvironmentIssue => ({ code, subject, message });
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const serviceImages = (manifest: EnvironmentManifest) =>
  SERVICES.map((service) => ({
    service,
    images: manifest.resources.containers
      .filter(
        (resource) =>
          resource.name === `supabase_${service}_${manifest.projectId}` &&
          resource.projectLabel === manifest.projectId,
      )
      .map((resource) => resource.imageId),
  }));

const checkProof = ({
  report,
  manifest: raw,
}: EnvironmentProof): EnvironmentIssue[] => {
  const parsed = environmentManifestSchema.safeParse(raw);
  if (!parsed.success)
    return [
      issue('PROOF_INVALID', 'manifest', '環境manifestの構造が不正です。'),
    ];
  const manifest = parsed.data;
  const issues: EnvironmentIssue[] = [];
  const fail = (code: string, subject: string, message: string) =>
    issues.push(issue(code, `${manifest.runId}:${subject}`, message));
  if (
    !report.passed ||
    !report.migrationReplayPassed ||
    !report.schemaParityPassed ||
    report.catalogStatus !== 'verified' ||
    report.authorizationStatus !== 'not-verified' ||
    isNil(report.fingerprint) ||
    !/^[a-f0-9]{64}$/.test(report.fingerprint) ||
    report.catalogIssues.length > 0
  )
    fail(
      'PROOF_FAILED',
      'report',
      'migration・seed・catalogの検査が完了していません。',
    );
  if (
    report.runId !== manifest.runId ||
    report.workdir !== manifest.workdir ||
    report.cliVersion !== manifest.cliVersion ||
    !isDeepStrictEqual(report.inputHashes, manifest.inputHashes)
  )
    fail('PROOF_MISMATCH', 'report', '診断結果と環境manifestが一致しません。');
  if (!isNil(manifest.failure))
    fail(
      'RUN_FAILED',
      'lifecycle',
      `環境lifecycleで失敗が記録されています: ${manifest.failure.code}`,
    );
  const cleanup = environmentCleanupSchema.safeParse(report.cleanup);
  if (
    manifest.state !== 'stopped' ||
    manifest.cleanup?.status !== 'complete' ||
    !cleanup.success ||
    cleanup.data.status !== 'complete' ||
    !isDeepStrictEqual(cleanup.data, manifest.cleanup)
  )
    fail(
      'CLEANUP_FAILED',
      'cleanup',
      '所有resourceのcleanup完了を確認できません。',
    );
  if (
    hash(
      renderEnvironmentConfig({ runId: manifest.runId, ports: manifest.ports }),
    ) !== manifest.inputHashes.config
  )
    fail(
      'CONFIG_MISMATCH',
      'config',
      'configは固定CLI用の専用設定と一致する必要があります。',
    );
  for (const { service, images } of serviceImages(manifest))
    if (images.length !== 1)
      fail(
        'SERVICE_MISSING',
        service,
        '必須サービスの所有imageを一意に確認できません。',
      );
  return issues;
};

/** 独立した2環境の成功証跡を比較する。schema一致を認可検証へ昇格させない。 */
export const compareEnvironmentProofs = (
  first: EnvironmentProof,
  second: EnvironmentProof,
): EnvironmentIssue[] => {
  const issues = [...checkProof(first), ...checkProof(second)];
  if (issues.length > 0) return issues;
  const left = first.manifest;
  const right = second.manifest;
  if (
    left.runId === right.runId ||
    left.projectId === right.projectId ||
    left.ownerNonce === right.ownerNonce
  )
    issues.push(
      issue(
        'RUN_REUSED',
        'run',
        'run・project・所有nonceは各復元で新規に作成してください。',
      ),
    );
  for (const field of [
    'commit',
    'repoRoot',
    'worktreeRoot',
    'cliVersion',
    'ports',
  ] as const)
    if (!isDeepStrictEqual(left[field], right[field]))
      issues.push(
        issue(
          'REPRODUCTION_MISMATCH',
          field,
          '2回の復元で実行条件が変わりました。',
        ),
      );
  // configにはrun IDが含まれるため、各runの固定renderと照合してからportを比較する。
  for (const field of ['migrations', 'seed'] as const)
    if (left.inputHashes[field] !== right.inputHashes[field])
      issues.push(
        issue(
          'REPRODUCTION_MISMATCH',
          field,
          '2回の復元で入力SQLが変わりました。',
        ),
      );
  if (first.report.fingerprint !== second.report.fingerprint)
    issues.push(
      issue(
        'REPRODUCTION_MISMATCH',
        'catalog',
        '2回の復元でcatalogの内容が変わりました。',
      ),
    );
  if (!isDeepStrictEqual(serviceImages(left), serviceImages(right)))
    issues.push(
      issue(
        'REPRODUCTION_MISMATCH',
        'images',
        '必須5サービスのimage IDが一致しません。',
      ),
    );
  return issues;
};

const readProof = (
  root: string,
  report: EnvironmentProof['report'],
): EnvironmentProof => {
  const runId = environmentLeaseSchema.shape.runId.parse(report.runId);
  const folder = join('test-results', 'environments', `run-${runId}`);
  const file = join(folder, 'manifest.json');
  const manifest = environmentManifestSchema.parse(
    parseArtifact(readArtifact(root, file), file),
  );
  if (
    report.workdir !== join(root, folder) ||
    manifest.worktreeRoot !== root ||
    manifest.workdir !== report.workdir
  )
    throw new Error('今回のworktreeとrunに属するmanifestではありません。');
  const config = readArtifact(root, join(folder, 'supabase', 'config.toml'));
  if (
    config !==
    renderEnvironmentConfig({ runId: manifest.runId, ports: manifest.ports })
  )
    throw new Error('保存されたconfigが固定設定と一致しません。');
  return { report, manifest };
};

const summarize = ({ report, manifest }: EnvironmentProof) => ({
  runId: manifest.runId,
  projectId: manifest.projectId,
  workdir: manifest.workdir,
  repoRoot: manifest.repoRoot,
  worktreeRoot: manifest.worktreeRoot,
  commit: manifest.commit,
  cliVersion: manifest.cliVersion,
  ports: manifest.ports,
  inputHashes: manifest.inputHashes,
  catalogFingerprint: report.fingerprint,
  migrationReplayPassed: report.migrationReplayPassed,
  catalogStatus: report.catalogStatus,
  catalogIssues: report.catalogIssues,
  knownAuthorizationGaps: report.knownAuthorizationGaps,
  schemaParityPassed: report.schemaParityPassed,
  authorizationStatus: report.authorizationStatus,
  serviceImages: serviceImages(manifest),
  cleanup: manifest.cleanup,
  lifecycleFailure: manifest.failure,
});
type EnvironmentReproductionProgress = EnvironmentProbeProgress & {
  run: number;
};
type ReproductionReceipt = {
  schemaVersion: 1;
  status: 'running' | 'passed' | 'failed';
  authorizationStatus: 'not-verified';
  runs: ReturnType<typeof summarize>[];
  failure?: EnvironmentReproductionProgress;
  issues: EnvironmentIssue[];
};

/** 2回を直列に復元し、最初の失敗で停止する。旧成功結果は起動前に無効化する。 */
export const reproduceEnvironment = async (
  root: string,
  signal?: AbortSignal,
  onProgress?: (value: EnvironmentReproductionProgress) => void,
): Promise<ReproductionReceipt> => {
  const physicalRoot = realpathSync(root);
  const receipt: ReproductionReceipt = {
    schemaVersion: 1,
    status: 'running',
    authorizationStatus: 'not-verified',
    runs: [],
    issues: [],
  };
  const save = () =>
    writeArtifact(
      physicalRoot,
      RECEIPT,
      `${JSON.stringify(receipt, null, 2)}\n`,
    );
  save();
  let latest: EnvironmentReproductionProgress = {
    run: 1,
    phase: 'checking-cli',
  };
  try {
    const proofs: EnvironmentProof[] = [];
    for (let index = 0; index < 2; index++) {
      signal?.throwIfAborted();
      latest = { run: index + 1, phase: 'checking-cli' };
      const report = await probeEnvironment(physicalRoot, signal, (value) => {
        latest = { ...value, run: index + 1 };
        try {
          onProgress?.(latest);
        } catch {
          // 表示先の失敗で起動・cleanupを妨げない。
        }
      });
      const proof = readProof(physicalRoot, report);
      receipt.runs.push(summarize(proof));
      receipt.issues.push(...checkProof(proof));
      const previous = proofs[0];
      if (!isNil(previous) && receipt.issues.length === 0)
        receipt.issues.push(...compareEnvironmentProofs(previous, proof));
      proofs.push(proof);
      if (receipt.issues.length > 0) break;
      save();
    }
    receipt.status =
      proofs.length === 2 && receipt.issues.length === 0 ? 'passed' : 'failed';
  } catch {
    receipt.status = 'failed';
    const workdir =
      !isNil(latest.workdir) && existsSync(latest.workdir)
        ? latest.workdir
        : undefined;
    receipt.failure = {
      run: latest.run,
      phase: latest.phase,
      ...(isNil(latest.runId) ? {} : { runId: latest.runId }),
      ...(isNil(workdir) ? {} : { workdir }),
    };
    receipt.issues.push(
      issue(
        'REPRODUCTION_FAILED',
        'probe',
        isNil(workdir)
          ? '環境の準備に失敗しました。failureに示す段階の設定を確認してください。'
          : '環境の復元または検査に失敗しました。failureに示すworkdirの診断記録を確認してください。',
      ),
    );
  }
  save();
  return receipt;
};

if (
  !isNil(process.argv[1]) &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  reproduceEnvironment(process.cwd(), undefined, (value) => {
    process.stderr.write(`[e2e-environment] ${JSON.stringify(value)}\n`);
  })
    .then((receipt) => {
      process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
      process.exitCode = receipt.status === 'passed' ? 0 : 1;
    })
    .catch(() => {
      process.stderr.write('環境再現の結果を保存できませんでした。\n');
      process.exitCode = 1;
    });
}

export type {
  EnvironmentProof,
  EnvironmentReproductionProgress,
  ReproductionReceipt,
};
