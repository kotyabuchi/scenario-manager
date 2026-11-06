import { beforeEach, describe, expect, it, vi } from 'vitest';

import { aggregateCiVerification } from './ciAggregate';
import {
  assertCiUnchanged,
  captureCiInputs,
  readCiArtifact,
  readCiContext,
  readCiLedgers,
  writeCiArtifact,
} from './ciContext';
import { runCiShard } from './ciShard';
import { assertCiStaticReport } from './ciStaticReport';
import { ciRuntimeFixture } from './fixtures/ciRuntime';
import { inventoryFixture } from './fixtures/selection';
import { surfaceLedgerFixture } from './fixtures/surfaceLedger';
import { readArtifact } from './ledgerArtifacts';
import { prepareVerificationDetails } from './prepareVerification';
import { ARTIFACTS, baselineDigest } from './staticGate';
import { SURFACE_ARTIFACTS } from './surfaceGate';
import { readRevisionFile } from './trustedRevision';
import {
  loadVerificationArtifacts,
  validateVerificationArtifacts,
} from './verificationReceipt';
import { runVerification } from './verificationRun';

vi.mock('./ciContext', () => ({
  assertCiUnchanged: vi.fn(),
  captureCiInputs: vi.fn(),
  readCiArtifact: vi.fn(),
  readCiContext: vi.fn(),
  readCiLedgers: vi.fn(),
  writeCiArtifact: vi.fn(),
}));
vi.mock('./prepareVerification', () => ({
  prepareVerificationDetails: vi.fn(),
}));
vi.mock('./verificationReceipt', async (original) => ({
  ...(await original<typeof import('./verificationReceipt')>()),
  loadVerificationArtifacts: vi.fn(),
}));
vi.mock('./verificationRun', () => ({ runVerification: vi.fn() }));
vi.mock('./ledgerArtifacts', async (original) => ({
  ...(await original<typeof import('./ledgerArtifacts')>()),
  readArtifact: vi.fn(),
}));
vi.mock('./trustedRevision', async (original) => ({
  ...(await original<typeof import('./trustedRevision')>()),
  readRevisionFile: vi.fn(),
}));

const root = 'fixture-ci-root';
const env = {
  ...process.env,
  CI_FIXTURES_RESULT: 'success',
  CI_PLANNER_RESULT: 'success',
  CI_REQUIRED_RESULT: 'success',
  CI_LEGACY_RESULT: 'success',
};
const signal = new AbortController().signal;
const surface = surfaceLedgerFixture();
const artifacts = new Map<string, unknown>();
let setup = ciRuntimeFixture();

beforeEach(() => {
  vi.resetAllMocks();
  setup = ciRuntimeFixture();
  const { context, initial, ledgers, prepared, fixture } = setup;
  artifacts.clear();
  artifacts.set('plan/manifest.json', fixture.manifest);
  const baseline = { schemaVersion: 1 as const, items: [] };
  const { eventPolicy } = context;
  const base =
    eventPolicy.staticBase.kind === 'push-bootstrap'
      ? eventPolicy.head
      : eventPolicy.staticBase.sha;
  artifacts.set('plan/static.json', {
    workflow: fixture.manifest.workflow,
    snapshotDigest: fixture.manifest.snapshotDigest,
    inputsDigest: fixture.manifest.inputsDigest,
    status: 'passed',
    mode: 'ci',
    base,
    head: eventPolicy.head,
    eventPolicy,
    issues: [],
    isBootstrap: false,
    baselineDigest: baselineDigest(baseline),
    ...surface.receipt,
  });
  vi.mocked(readArtifact).mockImplementation((_root, path) =>
    path === ARTIFACTS.baseline ? JSON.stringify(baseline) : undefined,
  );
  const savedFiles = new Map<string, unknown>([
    [ARTIFACTS.baseline, baseline],
    [ARTIFACTS.inventory, inventoryFixture()],
    [SURFACE_ARTIFACTS.pending, surface.pending],
    [SURFACE_ARTIFACTS.migration, surface.migration],
  ]);
  vi.mocked(readRevisionFile).mockImplementation((_root, _revision, path) =>
    savedFiles.has(path) ? JSON.stringify(savedFiles.get(path)) : undefined,
  );
  for (const [shard, { envelope, verification }] of Object.entries(
    fixture.shards,
  )) {
    artifacts.set(`${shard}/envelope.json`, envelope);
    artifacts.set(`${shard}/plan.json`, verification.plan);
    artifacts.set(`${shard}/receipt.json`, verification.receipt);
    artifacts.set(`${shard}/inputs-start.json`, verification.inputsStart);
    artifacts.set(`${shard}/inputs-end.json`, verification.inputsEnd);
  }
  vi.mocked(readCiArtifact).mockImplementation((_root, path) => {
    if (!artifacts.has(path)) throw new Error(`artifactがありません: ${path}`);
    return artifacts.get(path);
  });
  vi.mocked(readCiContext).mockResolvedValue(context);
  vi.mocked(readCiLedgers).mockImplementation(
    async (root, policy, report, binding, options) => {
      assertCiStaticReport(root, report, policy, binding, options);
      return ledgers;
    },
  );
  vi.mocked(captureCiInputs).mockResolvedValue(initial);
  vi.mocked(assertCiUnchanged).mockResolvedValue(initial);
  vi.mocked(prepareVerificationDetails).mockResolvedValue(prepared);
});

describe('CI worker', () => {
  it.each([
    'required',
    'legacy-local',
  ] as const)('%sだけを実行し、独立IDの証拠を許可された名前だけに出す', async (shard) => {
    const { fixture } = setup;
    const { envelope, verification } = fixture.shards[shard];
    vi.mocked(runVerification).mockImplementationOnce(
      async (_root, options) => {
        await options?.checkpoint?.('during-run');
        return verification.receipt;
      },
    );
    vi.mocked(loadVerificationArtifacts).mockReturnValueOnce(verification);
    await expect(runCiShard(root, env, shard, signal)).resolves.toEqual({
      status: 'passed',
      phase: shard,
      verificationId: envelope.verificationId,
    });
    expect(vi.mocked(runVerification)).toHaveBeenCalledExactlyOnceWith(
      root,
      expect.objectContaining({
        mode: 'partial',
        prepared: expect.objectContaining({ plan: verification.plan }),
        runnerSelections:
          shard === 'required'
            ? [
                expect.objectContaining({
                  kind: 'playwright',
                  expected: expect.objectContaining({ profile: 'storybook' }),
                }),
              ]
            : [],
        selection: {
          snapshotDigest: fixture.manifest.snapshotDigest,
          fullPlanDigest: fixture.manifest.fullPlanDigest,
          decisionDigest: fixture.manifest.decisionDigest,
        },
      }),
    );
    expect(vi.mocked(assertCiUnchanged)).toHaveBeenCalledTimes(3);
    expect(
      vi.mocked(loadVerificationArtifacts),
    ).toHaveBeenCalledExactlyOnceWith(root, envelope.verificationId);
    expect(vi.mocked(writeCiArtifact).mock.calls).toEqual([
      [root, `${shard}/envelope.json`, envelope],
      [root, `${shard}/plan.json`, verification.plan],
      [root, `${shard}/receipt.json`, verification.receipt],
      [root, `${shard}/inputs-start.json`, verification.inputsStart],
      [root, `${shard}/inputs-end.json`, verification.inputsEnd],
    ]);
  });

  it.each([
    'attempt',
    'input',
    'snapshot',
  ] as const)('%sが異なると全収集やownerへ進まない', async (kind) => {
    const { context, initial } = setup;
    if (kind === 'attempt')
      vi.mocked(readCiContext).mockResolvedValueOnce({
        ...context,
        workflow: { ...context.workflow, attempt: 2 },
      });
    else
      vi.mocked(captureCiInputs).mockResolvedValueOnce({
        ...initial,
        ...(kind === 'input'
          ? { inputs: { ...initial.inputs, digest: '0'.repeat(64) } }
          : { snapshot: { ...initial.snapshot, digest: '0'.repeat(64) } }),
      });
    await expect(runCiShard(root, env, 'required', signal)).rejects.toThrow(
      'イベント・入力',
    );
    expect(vi.mocked(prepareVerificationDetails)).not.toHaveBeenCalled();
    expect(vi.mocked(runVerification)).not.toHaveBeenCalled();
    expect(vi.mocked(writeCiArtifact)).not.toHaveBeenCalled();
  });

  it.each([
    'collection',
    'full plan',
  ] as const)('%sの非選択登録でも不一致ならownerを起動しない', async (kind) => {
    const { prepared } = setup;
    vi.mocked(prepareVerificationDetails).mockResolvedValueOnce({
      ...prepared,
      ...(kind === 'collection'
        ? {
            discoveries: prepared.discoveries.filter(
              ({ profile }) => profile !== 'isolated',
            ),
          }
        : {
            plan: {
              ...prepared.plan,
              requirements: prepared.plan.requirements.filter(
                ({ profile }) => profile !== 'isolated',
              ),
            },
          }),
    });
    await expect(runCiShard(root, env, 'required', signal)).rejects.toThrow(
      '全登録',
    );
    expect(vi.mocked(runVerification)).not.toHaveBeenCalled();
    expect(vi.mocked(writeCiArtifact)).not.toHaveBeenCalled();
  });

  it('独立IDのreceiptが失敗または欠落なら成功artifactを輸出しない', async () => {
    const { receipt } = setup.fixture.shards.required.verification;
    vi.mocked(runVerification).mockResolvedValueOnce({
      ...receipt,
      status: 'failed',
    });
    vi.mocked(loadVerificationArtifacts).mockImplementationOnce(() => {
      throw new Error('独立IDのreceiptが失敗しました');
    });
    await expect(runCiShard(root, env, 'required', signal)).rejects.toThrow(
      'receipt',
    );
    expect(vi.mocked(writeCiArtifact)).not.toHaveBeenCalled();
  });

  it('後続の未起動stageがある場合は資源の残留を断定しない', async () => {
    const { receipt } = setup.fixture.shards.required.verification;
    const run = structuredClone(receipt);
    const execution = run.execution;
    const finished = execution?.stages[0];
    if (!execution || !finished) throw new Error('実行fixtureがありません。');
    run.status = 'failed';
    finished.exitCode = 1;
    const context = { ...finished.context, stageId: 'isolated' };
    execution.stages.push({
      ...finished,
      context,
      report: null,
      exitCode: null,
      evidence: {
        ...finished.evidence,
        kind: 'schedule',
        context,
        result: { issues: [{ code: 'STAGE_NOT_RUN' }], counts: {} },
      },
      cleanup: null,
      processCleanup: { exited: false, errorCount: 0 },
    });
    vi.mocked(runVerification).mockResolvedValueOnce(run);
    vi.mocked(loadVerificationArtifacts).mockImplementationOnce(() => {
      throw new Error('独立IDのreceiptが失敗しました');
    });
    const onProgress = vi.fn();
    await expect(
      runCiShard(root, env, 'required', signal, onProgress),
    ).rejects.toThrow('receipt');
    expect(onProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({
        phase: 'receipt',
        verificationId: run.verificationId,
        cleanup: 'unknown',
      }),
    );
    expect(vi.mocked(writeCiArtifact)).not.toHaveBeenCalled();
  });

  it('同じ検証IDでも選択digestが異なる有効な証拠は公開しない', async () => {
    const { verification } = setup.fixture.shards.required;
    const foreign = structuredClone(verification);
    if (!foreign.receipt.selection)
      throw new Error('選択fixtureがありません。');
    foreign.receipt.selection.decisionDigest = '0'.repeat(64);
    expect(validateVerificationArtifacts(foreign).receipt.status).toBe(
      'passed',
    );
    vi.mocked(runVerification).mockResolvedValueOnce(verification.receipt);
    vi.mocked(loadVerificationArtifacts).mockReturnValueOnce(foreign);

    await expect(runCiShard(root, env, 'required', signal)).rejects.toThrow(
      '選択由来',
    );
    expect(loadVerificationArtifacts).toHaveBeenCalledExactlyOnceWith(
      root,
      verification.receipt.verificationId,
    );
    expect(writeCiArtifact).not.toHaveBeenCalled();
  });
});

describe('CI aggregate', () => {
  it('plan manifestが読めないときはmanifest段階を報告する', async () => {
    artifacts.delete('plan/manifest.json');
    const onProgress = vi.fn();
    await expect(
      aggregateCiVerification(root, env, signal, onProgress),
    ).rejects.toThrow('plan/manifest');
    expect(onProgress).toHaveBeenLastCalledWith({ phase: 'manifest' });
  });

  it('2つの独立したrunner証拠を自分のcontextと照合してから成功を保存する', async () => {
    const result = await aggregateCiVerification(root, env, signal);
    expect(result.status).toBe('passed');
    expect(vi.mocked(assertCiUnchanged)).toHaveBeenCalledExactlyOnceWith(
      root,
      env,
      setup.context,
      setup.initial,
    );
    expect(vi.mocked(writeCiArtifact)).toHaveBeenCalledExactlyOnceWith(
      root,
      'aggregate/receipt.json',
      result,
    );
  });

  it.each([
    'CI_FIXTURES_RESULT',
    'CI_PLANNER_RESULT',
    'CI_REQUIRED_RESULT',
    'CI_LEGACY_RESULT',
  ])('%sの失敗を成功artifactで代用しない', async (name) => {
    await expect(
      aggregateCiVerification(root, { ...env, [name]: 'skipped' }, signal),
    ).rejects.toThrow();
    expect(vi.mocked(writeCiArtifact)).not.toHaveBeenCalled();
  });

  it('片方のshard artifact欠落または自身の入力変化なら合格を保存しない', async () => {
    artifacts.delete('legacy-local/receipt.json');
    await expect(aggregateCiVerification(root, env, signal)).rejects.toThrow(
      'legacy-local/receipt',
    );
    artifacts.set(
      'legacy-local/receipt.json',
      setup.fixture.shards['legacy-local'].verification.receipt,
    );
    vi.mocked(assertCiUnchanged).mockRejectedValueOnce(
      new Error('集約中に入力が変化'),
    );
    await expect(aggregateCiVerification(root, env, signal)).rejects.toThrow(
      '入力が変化',
    );
    expect(vi.mocked(writeCiArtifact)).not.toHaveBeenCalled();
  });

  it.each([
    'workflow',
    'snapshotDigest',
    'inputsDigest',
  ] as const)('同じHEADでも静的証跡だけの%sが異なれば合格を保存しない', async (field) => {
    const { manifest } = setup.fixture;
    const stale =
      field === 'workflow'
        ? {
            workflow: {
              ...manifest.workflow,
              attempt: manifest.workflow.attempt + 1,
            },
          }
        : { [field]: '0'.repeat(64) };
    const original = artifacts.get('plan/static.json');
    if (typeof original !== 'object' || original === null)
      throw new Error('静的証跡fixtureがありません。');
    artifacts.set('plan/static.json', { ...original, ...stale });

    await expect(aggregateCiVerification(root, env, signal)).rejects.toThrow(
      'workflow attemptまたは固定入力',
    );
    expect(vi.mocked(writeCiArtifact)).not.toHaveBeenCalled();
  });

  it('同じjob成功でも静的receiptが欠落または別baselineなら合格を保存しない', async () => {
    artifacts.delete('plan/static.json');
    await expect(aggregateCiVerification(root, env, signal)).rejects.toThrow(
      'plan/static',
    );
    const { manifest } = setup.fixture;
    artifacts.set('plan/static.json', {
      workflow: manifest.workflow,
      snapshotDigest: manifest.snapshotDigest,
      inputsDigest: manifest.inputsDigest,
      status: 'passed',
      mode: 'ci',
      base: 'a'.repeat(40),
      head: setup.context.eventPolicy.head,
      eventPolicy: setup.context.eventPolicy,
      issues: [],
      isBootstrap: false,
      baselineDigest: 'b'.repeat(64),
      ...surface.receipt,
    });
    await expect(aggregateCiVerification(root, env, signal)).rejects.toThrow(
      'baseline',
    );
    expect(vi.mocked(writeCiArtifact)).not.toHaveBeenCalled();
  });
});
