import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import { captureInputs } from './fingerprint';
import { snapshotFixture } from './fixtures/selection';
import { verificationFixture } from './fixtures/verification';
import { captureGitSnapshot } from './gitSnapshot';
import { writeArtifact } from './ledgerArtifacts';
import { runQualityChanged } from './qualityChanged';
import { runQualityChecks } from './qualityChecks';
import { runChangedVerification } from './runChangedVerification';
import { resolveRevisions } from './trustedRevision';
import { prepareVerificationDirectory } from './verificationContext';
import { digestVerificationPlan } from './verificationPlanDigest';
import { loadVerificationArtifacts } from './verificationReceipt';

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { SelectionDecision } from './selectionSchema';

vi.mock('./environmentCommands', async (original) => ({
  ...(await original<typeof import('./environmentCommands')>()),
  runLocalCommand: vi.fn(),
}));
vi.mock('./fingerprint', () => ({ captureInputs: vi.fn() }));
vi.mock('./gitSnapshot', () => ({ captureGitSnapshot: vi.fn() }));
vi.mock('./ledgerArtifacts', () => ({ writeArtifact: vi.fn() }));
vi.mock('./runChangedVerification', () => ({
  runChangedVerification: vi.fn(),
}));
vi.mock('./trustedRevision', () => ({ resolveRevisions: vi.fn() }));
vi.mock('./verificationContext', () => ({
  prepareVerificationDirectory: vi.fn(),
}));
vi.mock('./verificationReceipt', () => ({
  loadVerificationArtifacts: vi.fn(),
}));

const ROOT = realpathSync(process.cwd());
const DIRECTORY = join(ROOT, 'test-results', 'verification', 'fixture');
const PRIVATE = 'fixture-token=private-text';
const TEMP = realpathSync(tmpdir());
const roots: string[] = [];
const SNAPSHOT = snapshotFixture([]);
const INPUTS: Awaited<ReturnType<typeof captureInputs>> = {
  schemaVersion: 1,
  algorithm: 'sha256',
  root: ROOT,
  rules: 'fixed-input-scope-v1-next16-template-v1',
  digest: 'd'.repeat(64),
  files: [],
};

const temporaryRoot = () => {
  const root = mkdtempSync(join(TEMP, 'quality-changed-'));
  roots.push(root);
  return root;
};

const mockSelection = (
  mode: SelectionDecision['mode'],
  shadowRequested = false,
) => {
  const { plan: fullPlan } = verificationFixture();
  const partialPlan = { ...fullPlan, allowedExtraTests: [] };
  const decision: SelectionDecision = {
    schemaVersion: 1,
    mode,
    snapshotDigest: SNAPSHOT.digest,
    base: SNAPSHOT.base,
    head: SNAPSHOT.head,
    rulesDigest: 'f'.repeat(64),
    graphDigest: 'e'.repeat(64),
    fullPlanDigest: digestVerificationPlan(fullPlan),
    caseIds: [],
    targetIds: [],
    requestedRequiredKeys:
      mode === 'docs-only'
        ? []
        : fullPlan.requirements.slice(0, 1).map(({ key }) => key),
    reasons: [],
    coverageGaps: [],
    coverageStatus: 'no-known-gaps',
    legacyPolicy: 'omit',
  };
  const noOp = mode === 'docs-only';
  const fallback = mode === 'full-required';
  const selection = {
    snapshotDigest: SNAPSHOT.digest,
    fullPlanDigest: decision.fullPlanDigest,
    decisionDigest: createHash('sha256')
      .update(`${JSON.stringify(decision)}\n`)
      .digest('hex'),
  };
  const counts = {
    business: 2,
    support: 1,
    extras: 0,
    required: 3,
    passed: 3,
    stages: 1,
  };
  const partialId = '1'.repeat(12);
  const fullId = '2'.repeat(12);
  const full = { verificationId: fullId, status: 'passed' as const, counts };
  const partial = {
    verificationId: partialId,
    status: 'passed' as const,
    counts,
  };
  vi.mocked(runChangedVerification).mockResolvedValue({
    schemaVersion: 1,
    selectionId: '3'.repeat(12),
    status: 'passed',
    phase: 'complete',
    decision,
    effectiveSelectionDigest: noOp
      ? null
      : digestVerificationPlan(fallback ? fullPlan : partialPlan),
    partial: noOp ? null : fallback ? full : partial,
    full: fallback || shadowRequested ? full : null,
    shadow:
      !fallback && shadowRequested
        ? {
            status: 'matched',
            missedRequiredKeys: [],
            divergentRequiredKeys: [],
            reasons: [],
          }
        : null,
    shadowRequested,
    noOp,
    failure: null,
  });
  vi.mocked(loadVerificationArtifacts).mockImplementation((_root, id) => {
    const plan = id === partialId ? partialPlan : fullPlan;
    return {
      plan,
      inputsStart: INPUTS,
      inputsEnd: INPUTS,
      receipt: {
        schemaVersion: 1,
        verificationId: id,
        mode: id === partialId ? 'partial' : 'full-required',
        selection,
        status: 'passed',
        phase: 'complete',
        selectionDigest: digestVerificationPlan(plan),
        inputDigestBefore: INPUTS.digest,
        inputDigestAfter: INPUTS.digest,
        checkpoints: [],
        execution: null,
        verification: { counts, issues: [] },
        failure: null,
        legacyLocalRequested: false,
        integrationLegacyExecuted: false,
      },
    };
  });
  return { partialId, fullId };
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(captureInputs).mockResolvedValue(INPUTS);
  vi.mocked(captureGitSnapshot).mockReturnValue({ snapshot: SNAPSHOT });
  vi.mocked(resolveRevisions).mockResolvedValue({
    base: SNAPSHOT.base,
    head: SNAPSHOT.head,
    mode: 'local',
  });
  vi.mocked(prepareVerificationDirectory).mockReturnValue(DIRECTORY);
  vi.mocked(runLocalCommand).mockResolvedValue('');
});

afterEach(() => {
  for (const root of roots.splice(0)) {
    if (dirname(realpathSync(root)) !== TEMP)
      throw new Error('一時ディレクトリが不正です');
    rmSync(root, { recursive: true, force: true });
  }
});

it('readonly lint、型、unit、toolsの順で実行し、部分・全件receiptを照合する', async () => {
  const { partialId, fullId } = mockSelection('partial', true);
  const result = await runQualityChanged(ROOT, { base: 'HEAD' });
  expect(result).toMatchObject({
    status: 'passed',
    phase: 'complete',
    verifiedRunIds: [partialId, fullId],
  });
  expect(
    vi
      .mocked(runLocalCommand)
      .mock.calls.map(([command, args, { log }]) => [
        command,
        args.slice(1),
        log,
      ]),
  ).toEqual([
    ['node', ['check'], join(DIRECTORY, 'check-ci.log')],
    ['node', ['--noEmit'], join(DIRECTORY, 'typecheck.log')],
    [
      'node',
      ['run', '--config', 'vitest.config.ts'],
      join(DIRECTORY, 'test-unit.log'),
    ],
    [
      'node',
      ['run', '--config', 'scripts/e2e/vitest.config.ts'],
      join(DIRECTORY, 'test-e2e-tools.log'),
    ],
  ]);
  expect(runChangedVerification).toHaveBeenCalledExactlyOnceWith(
    ROOT,
    expect.objectContaining({
      base: SNAPSHOT.base,
      signal: expect.any(AbortSignal),
    }),
  );
  expect(loadVerificationArtifacts).toHaveBeenNthCalledWith(1, ROOT, partialId);
  expect(loadVerificationArtifacts).toHaveBeenNthCalledWith(2, ROOT, fullId);
  expect(captureInputs).toHaveBeenCalledTimes(7);
  expect(captureGitSnapshot).toHaveBeenCalledTimes(7);
  expect(writeArtifact).toHaveBeenCalledWith(
    ROOT,
    result.receiptPath,
    expect.stringContaining('"passed"'),
  );
  expect(writeArtifact).toHaveBeenCalledWith(
    ROOT,
    'test-results/quality/changed.json',
    expect.stringContaining(result.qualityId),
  );
});

it('全件fallbackの同じrunを二重に照合しない', async () => {
  const { fullId } = mockSelection('full-required', true);
  const result = await runQualityChanged(ROOT, {
    base: 'HEAD',
    forceFull: true,
  });
  expect(result).toMatchObject({ status: 'passed', verifiedRunIds: [fullId] });
  expect(loadVerificationArtifacts).toHaveBeenCalledExactlyOnceWith(
    ROOT,
    fullId,
  );
});

it('CIでは静的比較のSHAと影響比較のSHAを分けて固定する', async () => {
  const staticBase = 'e'.repeat(40);
  vi.mocked(resolveRevisions).mockResolvedValue({
    base: staticBase,
    head: SNAPSHOT.head,
    mode: 'ci',
    eventPolicy: {
      schemaVersion: 1,
      repository: 'owner/repo',
      event: 'pull_request',
      eventRef: 'refs/pull/1/merge',
      head: SNAPSHOT.head,
      staticBase: { kind: 'comparison', sha: staticBase },
      impactBase: SNAPSHOT.base,
      execution: 'changed-plus-smoke',
    },
  });
  mockSelection('docs-only');
  const result = await runQualityChanged(ROOT, { shadow: false });
  expect(result).toMatchObject({ status: 'passed', base: SNAPSHOT.base });
  expect(captureGitSnapshot).toHaveBeenCalledWith(
    expect.objectContaining({ base: SNAPSHOT.base, eventBase: staticBase }),
  );
  expect(
    vi.mocked(runChangedVerification).mock.calls[0]?.[1],
  ).not.toHaveProperty('base');
});

it('shadowなしのNoOpには子runnerの合格を追加しない', async () => {
  mockSelection('docs-only');
  const result = await runQualityChanged(ROOT, { base: 'HEAD', shadow: false });
  expect(result).toMatchObject({
    status: 'passed',
    selection: { noOp: true, partial: null, full: null },
    verifiedRunIds: [],
  });
  expect(loadVerificationArtifacts).not.toHaveBeenCalled();
});

it('子receiptの実効plan digestが差分選択と違う場合は失敗する', async () => {
  mockSelection('partial');
  const load = vi.mocked(loadVerificationArtifacts).getMockImplementation();
  if (!load) throw new Error('fixtureのreceipt loaderがありません');
  vi.mocked(loadVerificationArtifacts).mockImplementation((...args) => {
    const value = load(...args);
    return {
      ...value,
      receipt: { ...value.receipt, selectionDigest: '0'.repeat(64) },
    };
  });
  const result = await runQualityChanged(ROOT, { base: 'HEAD', shadow: false });
  expect(result).toMatchObject({
    status: 'failed',
    phase: 'receipt',
    failure: 'RECEIPT_MISMATCH',
    verifiedRunIds: [],
  });
});

it('入力またはGitが初期snapshotと違えば次の段階を起動しない', async () => {
  vi.mocked(captureGitSnapshot)
    .mockReturnValueOnce({ snapshot: SNAPSHOT })
    .mockReturnValueOnce({ snapshot: { ...SNAPSHOT, digest: 'f'.repeat(64) } });
  const result = await runQualityChanged(ROOT, { base: 'HEAD' });
  expect(result).toMatchObject({
    status: 'failed',
    phase: 'check:ci',
    failure: 'INPUT_UNSTABLE',
    checks: { 'check:ci': 'failed' },
  });
  expect(runLocalCommand).toHaveBeenCalledOnce();
  expect(runChangedVerification).not.toHaveBeenCalled();
});

it('コマンド失敗では次を実行せず、例外の本文をreceiptに出さない', async () => {
  vi.mocked(runLocalCommand).mockRejectedValueOnce(new Error(PRIVATE));
  const result = await runQualityChanged(ROOT, { base: 'HEAD' });
  expect(result).toMatchObject({
    status: 'failed',
    failure: 'QUALITY_CHECK_FAILED',
  });
  expect(runLocalCommand).toHaveBeenCalledOnce();
  expect(runChangedVerification).not.toHaveBeenCalled();
  expect(JSON.stringify(vi.mocked(writeArtifact).mock.calls)).not.toContain(
    PRIVATE,
  );
});

it('中断をコマンドへ伝え、コマンドが終了するまでrunを完了しない', async () => {
  const controller = new AbortController();
  const entered = Promise.withResolvers<AbortSignal | undefined>();
  const close = Promise.withResolvers<string>();
  vi.mocked(runLocalCommand).mockImplementationOnce(
    (_tool, _args, { signal }) => {
      entered.resolve(signal);
      return close.promise;
    },
  );
  const pending = runQualityChanged(ROOT, {
    base: 'HEAD',
    signal: controller.signal,
  });
  const signal = await Promise.race([
    entered.promise,
    pending.then(() => undefined),
  ]);
  controller.abort();
  expect(signal?.aborted).toBe(true);
  expect(vi.mocked(writeArtifact).mock.calls.at(-1)?.[2]).toContain(
    '"status": "running"',
  );
  close.reject(new Error(PRIVATE));
  await expect(pending).resolves.toMatchObject({
    status: 'failed',
    failure: 'INTERRUPTED',
  });
  expect(runChangedVerification).not.toHaveBeenCalled();
});

it('package scriptが固定のreadonlyコマンドから逸脱した場合は実行しない', async () => {
  const root = temporaryRoot();
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ scripts: { 'check:ci': 'biome check --write' } }),
  );
  await expect(
    runQualityChecks({
      root,
      directory: root,
      signal: new AbortController().signal,
    }),
  ).rejects.toThrow('固定コマンド');
  expect(runLocalCommand).not.toHaveBeenCalled();
});

it('実CLIはbase未指定の一時cwdで準備段階の失敗とreceiptを返す', () => {
  const root = temporaryRoot();
  const entry = fileURLToPath(new URL('./qualityChanged.ts', import.meta.url));
  const tsx = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;
  const env = { ...process.env };
  for (const name of Object.keys(env))
    if (['CI', 'GITHUB_ACTIONS', 'NODE_OPTIONS'].includes(name.toUpperCase()))
      Reflect.deleteProperty(env, name);
  const output = spawnSync(process.execPath, ['--import', tsx, entry], {
    cwd: root,
    encoding: 'utf8',
    env,
    timeout: 15_000,
    windowsHide: true,
  });
  expect(output.error).toBeUndefined();
  expect(output.status, output.stderr).toBe(1);
  expect(output.stderr).toBe('');
  const receipt = JSON.parse(output.stdout);
  expect(receipt).toMatchObject({
    status: 'failed',
    phase: 'preparation',
    failure: 'PREPARATION_FAILED',
    checks: {},
  });
  expect(
    JSON.parse(
      readFileSync(join(root, 'test-results/quality/changed.json'), 'utf8'),
    ),
  ).toEqual(receipt);
}, 20_000);
