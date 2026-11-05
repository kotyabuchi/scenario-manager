import { beforeEach, describe, expect, it, vi } from 'vitest';

import { inputFingerprintSchema } from './fingerprint';
import {
  calendarFile,
  impactFixture,
  snapshotFixture,
} from './fixtures/selection';
import { verificationFixture } from './fixtures/verification';
import { integrationCollectionSchema } from './integrationSchema';
import { writeArtifact } from './ledgerArtifacts';
import { prepareChangedVerification } from './prepareChangedVerification';
import { runVerification, type VerificationRunOptions } from './run';
import { runChangedVerification } from './runChangedVerification';
import { projectSelection, selectImpacts } from './select';
import { selectionConsoleSummary } from './selectionConsoleSummary';
import { observeSelectionRun } from './selectionObservation';
import { prepareVerificationDirectory } from './verificationContext';
import { digestVerificationPlan } from './verificationPlanDigest';

import type { Discovery } from './discoverySchema';

vi.mock('./prepareChangedVerification', () => ({
  prepareChangedVerification: vi.fn(),
}));
vi.mock('./run', () => ({ runVerification: vi.fn() }));
vi.mock('./ledgerArtifacts', () => ({ writeArtifact: vi.fn() }));
vi.mock('./verificationContext', () => ({
  prepareVerificationDirectory: vi.fn(),
}));
vi.mock('./selectionObservation', () => ({
  observeSelectionRun: vi.fn(),
}));

const firstRunId = '111111111111';
const secondRunId = '222222222222';
const privateError = 'fixture-token=private-text';
const repository = process.cwd();
const integrationOptions = {
  mode: 'run',
  fails: false,
  concurrent: false,
  retry: 0,
  repeats: 0,
} as const;

const prepare = (path: string, forceFull = false) => {
  const fixture = impactFixture();
  const snapshot = snapshotFixture([
    { origin: 'unstaged', status: 'M', newPath: path },
  ]);
  const input = { ...fixture, snapshot, forceFull };
  const decision = selectImpacts(input);
  const effective = projectSelection({ ...input, decision });
  const integrationRows = fixture.fullPlan.requirements.filter(
    ({ profile }) => profile === 'integration',
  );
  const integrationDiscovery: Discovery = {
    schemaVersion: 1,
    profile: 'integration',
    projects: [
      { name: 'desktop', testDir: 'src', repeatEach: 1, dependencies: [] },
    ],
    tests: integrationRows.map(({ test }) => test),
    errors: [],
  };
  const integrationExpected = integrationRows.map(
    ({ test, claim, execution, checks }) => {
      if (claim === null || execution === null) throw new Error('fixture不足');
      return {
        test,
        claim,
        actorBindings: execution.actorBindings,
        checks: checks.map((check) => ({
          ...check,
          layer: 'integration' as const,
        })),
        fixture: 'schedule' as const,
        options: integrationOptions,
      };
    },
  );
  const storybookDiscovery: Discovery = {
    schemaVersion: 1,
    profile: 'storybook',
    projects: [
      {
        name: 'desktop',
        testDir: '.storybook/tests',
        repeatEach: 2,
        dependencies: [],
      },
    ],
    // 部分filterでは表現できないtitleも、全件fallbackなら既存runnerへ渡せる。
    tests: fixture.fullPlan.requirements
      .filter(({ profile }) => profile === 'storybook')
      .map(({ test }) => ({ ...test, titlePath: ['fixture › title'] })),
    errors: [],
  };
  const prepared = {
    plan: fixture.fullPlan,
    ledger: fixture.ledger,
    legacy: fixture.legacy,
    inputs: inputFingerprintSchema.parse({
      schemaVersion: 1,
      algorithm: 'sha256',
      root: repository,
      rules: 'fixed-input-scope-v1-next16-template-v1',
      files: [],
      digest: 'f'.repeat(64),
    }),
    scheduleExpected: [],
    integrationExpected,
    discoveries: [storybookDiscovery, integrationDiscovery],
    integrationCollection: integrationCollectionSchema.parse({
      schemaVersion: 1,
      runner: {
        name: 'vitest',
        version: '3.2.4',
        project: 'integration',
        pool: 'threads',
        fileParallelism: false,
        maxWorkers: 1,
        includeTaskLocation: true,
      },
      config: 'vitest.integration.collect.config.ts',
      discovery: integrationDiscovery,
      registrations: [],
    }),
  };
  const selection = {
    prepared,
    capture: { snapshot },
    graph: fixture.graph,
    rules: fixture.rules,
    decision,
    effective,
    proof: null,
    provenUnversionedPaths: [],
    staticReport: {
      status: 'passed',
      base: snapshot.base,
      head: snapshot.head,
      mode: 'local' as const,
      issues: [],
      policyDeltas: [],
      isBootstrap: false,
      baselineDigest: 'e'.repeat(64),
      registrations: 55,
      pendingItems: 0,
      legacyTests: 2,
    },
    checkpoint: vi.fn(async (_phase: string) => snapshot),
  } satisfies Awaited<ReturnType<typeof prepareChangedVerification>>;
  vi.mocked(prepareChangedVerification).mockResolvedValue(selection);
  return selection;
};

const runResult = (
  options: VerificationRunOptions | undefined,
  verificationId: string,
  status: 'passed' | 'failed' = 'passed',
): Awaited<ReturnType<typeof runVerification>> => {
  const { prepared } = options ?? {};
  if (prepared === undefined) throw new Error('fixtureの実行plan不足');
  return {
    schemaVersion: 1,
    verificationId,
    mode: options?.mode ?? 'full-required',
    selection: options?.selection ?? null,
    status,
    phase: status === 'passed' ? 'complete' : 'verification',
    selectionDigest: digestVerificationPlan(prepared.plan),
    inputDigestBefore: prepared.inputs.digest,
    inputDigestAfter: prepared.inputs.digest,
    checkpoints: [],
    execution: { stages: [verificationFixture().stage], runs: [] },
    verification: null,
    failure: null,
    legacyLocalRequested: prepared.plan.requirements.some(
      ({ profile }) => profile === 'app',
    ),
    integrationLegacyExecuted: false,
  };
};

const latestReceipt = () =>
  vi
    .mocked(writeArtifact)
    .mock.calls.filter(
      ([, file]) => file === 'test-results/quality/selection.json',
    )
    .at(-1)?.[2];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prepareVerificationDirectory).mockReturnValue(
    'fixture-owned-directory',
  );
  vi.mocked(runVerification)
    .mockImplementationOnce(async (_root, options) =>
      runResult(options, firstRunId),
    )
    .mockImplementationOnce(async (_root, options) =>
      runResult(options, secondRunId),
    );
  vi.mocked(observeSelectionRun).mockImplementation(
    ({ run, plan, provenance }) => ({
      ...provenance,
      verificationId: run.verificationId,
      selectionDigest: digestVerificationPlan(plan),
      requiredKeys: plan.requirements.map(({ key }) => key),
      failedRequiredKeys: [],
      status: 'complete',
    }),
  );
});

describe('差分検証のroot入口', () => {
  it('部分と全件を順に実行し、同じ固定入力・全列挙から別の実行contextを作る', async () => {
    const selection = prepare(calendarFile);
    const result = await runChangedVerification(repository, {
      base: 'fixture-base',
    });
    expect(result).toMatchObject({
      status: 'passed',
      phase: 'complete',
      noOp: false,
      partial: { verificationId: firstRunId },
      full: { verificationId: secondRunId },
      shadow: { status: 'matched' },
    });
    expect(prepareChangedVerification).toHaveBeenCalledOnce();
    expect(runVerification).toHaveBeenCalledTimes(2);
    const partial = vi.mocked(runVerification).mock.calls[0]?.[1];
    const full = vi.mocked(runVerification).mock.calls[1]?.[1];
    expect(partial).toMatchObject({
      mode: 'partial',
      runnerSelections: [{ kind: 'vitest', files: [calendarFile] }],
      continueAfterFailure: true,
    });
    expect(partial?.prepared?.plan).toBe(selection.effective?.plan);
    expect(partial?.prepared?.inputs).toBe(selection.prepared.inputs);
    expect(
      partial?.prepared?.integrationExpected.map(({ test }) => test.file),
    ).toEqual([calendarFile, calendarFile]);
    expect(full?.prepared).toBe(selection.prepared);
    expect(full?.runnerSelections).toBeUndefined();
    expect(full?.selection).toEqual(partial?.selection);
    expect(full?.selection?.snapshotDigest).toBe(
      selection.capture.snapshot.digest,
    );
    expect(full?.selection?.fullPlanDigest).toBe(
      digestVerificationPlan(selection.prepared.plan),
    );
    expect(selection.checkpoint.mock.calls).toEqual([
      ['before-shadow'],
      ['final-snapshot-check'],
    ]);
    expect(JSON.parse(latestReceipt() ?? '{}')).toEqual(result);
    expect(writeArtifact).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringMatching(/\/shadow-observations\.json$/u),
      expect.any(String),
    );
  });

  it('全件fallbackを元の全件planで一度だけ実行する', async () => {
    const selection = prepare('supabase/migrations/new.sql');
    const result = await runChangedVerification(repository);
    expect(result).toMatchObject({
      status: 'passed',
      decision: { mode: 'full-required' },
      partial: { verificationId: firstRunId },
      full: { verificationId: firstRunId },
      shadow: null,
    });
    expect(runVerification).toHaveBeenCalledOnce();
    const options = vi.mocked(runVerification).mock.calls[0]?.[1];
    expect(options?.prepared).toBe(selection.prepared);
    expect(options?.runnerSelections).toBeUndefined();
    expect(selectionConsoleSummary(result)).toMatchObject({
      status: 'passed',
      coverageStatus: 'insufficient',
      coverageGapCodes: expect.arrayContaining(['LEGACY_DATABASE_UNVERIFIED']),
      noOp: false,
      selectedLegacyPolicy: 'legacy-local',
      integrationLegacyExecuted: false,
      shadowFailureClassification: {
        attributable: 'storybook-assertions',
        otherRunnerFailures: 'inconclusive',
      },
      scope: {
        required: 'registered-cases',
        integrationLegacy: 'not-executed',
      },
    });
  });

  it.each([
    false,
    true,
  ])('文書だけの変更を別検査し、shadow=%sの方針で実行する', async (shadow) => {
    const selection = prepare('README.md');
    const result = await runChangedVerification(repository, { shadow });
    expect(result).toMatchObject({
      status: 'passed',
      noOp: true,
      partial: null,
      decision: { mode: 'docs-only', requestedRequiredKeys: [] },
    });
    expect(selection.checkpoint.mock.calls[0]).toEqual(['no-op']);
    expect(runVerification).toHaveBeenCalledTimes(shadow ? 1 : 0);
    const summary = selectionConsoleSummary(result);
    expect(summary).toMatchObject({
      mode: 'docs-only',
      noOp: true,
      coverageStatus: 'no-known-gaps',
      coverageGapCodes: [],
      shadowRequested: shadow,
      selectedLegacyPolicy: 'omit',
      receiptPath: 'test-results/quality/selection.json',
    });
    if (shadow) expect(summary.shadow).toBe('matched');
    else expect(summary.full).toBeNull();
  });

  it.each([
    '理由',
    'snapshot',
  ])('0件の%sが一致しなければ実行なしの成功にしない', async (evidence) => {
    const selection = prepare('README.md');
    if (evidence === 'snapshot') {
      selection.checkpoint.mockResolvedValueOnce({
        ...selection.capture.snapshot,
        digest: '0'.repeat(64),
      });
    } else {
      const reason = selection.decision.reasons[0];
      if (reason === undefined) throw new Error('fixtureの0件理由不足');
      reason.changedPaths = ['docs/unknown.md'];
    }
    const result = await runChangedVerification(repository, { shadow: false });
    expect(result).toMatchObject({
      status: 'failed',
      phase: 'no-op',
      noOp: false,
    });
    expect(runVerification).not.toHaveBeenCalled();
  });

  it('全体静的検査に失敗した場合は0件選択へ進まず、生の例外を保存しない', async () => {
    vi.mocked(prepareChangedVerification).mockRejectedValueOnce(
      new Error(privateError),
    );
    const result = await runChangedVerification(repository, { shadow: false });
    expect(result).toMatchObject({
      status: 'failed',
      phase: 'preparation',
      noOp: false,
      decision: null,
      failure: 'SELECTION_VERIFICATION_FAILED',
    });
    expect(runVerification).not.toHaveBeenCalled();
    expect(
      vi
        .mocked(writeArtifact)
        .mock.calls.every(([, , contents]) => !contents.includes(privateError)),
    ).toBe(true);
    expect(JSON.parse(latestReceipt() ?? '{}')).toEqual(result);
  });

  it.each([
    'missed-required-failure',
    'inconclusive',
  ] as const)('shadowが%sなら全体を失敗とする', async (status) => {
    const selection = prepare(calendarFile);
    vi.mocked(runVerification)
      .mockReset()
      .mockImplementationOnce(async (_root, options) =>
        runResult(options, firstRunId),
      )
      .mockImplementationOnce(async (_root, options) =>
        runResult(options, secondRunId, 'failed'),
      );
    const observe = vi.mocked(observeSelectionRun).getMockImplementation();
    if (observe === undefined) throw new Error('fixtureのshadow観測不足');
    vi.mocked(observeSelectionRun)
      .mockImplementationOnce(observe)
      .mockImplementationOnce((input) => ({
        ...observe(input),
        status: status === 'inconclusive' ? 'inconclusive' : 'complete',
        failedRequiredKeys: status === 'inconclusive' ? [] : ['rpc'],
      }));
    const result = await runChangedVerification(repository);
    expect(result).toMatchObject({
      status: 'failed',
      shadow: {
        status,
        missedRequiredKeys: status === 'inconclusive' ? [] : ['rpc'],
      },
    });
    expect(selection.checkpoint).toHaveBeenLastCalledWith(
      'final-snapshot-check',
    );
  });

  it('部分実行後にGit snapshotが変わればshadowのownerを起動しない', async () => {
    const selection = prepare(calendarFile);
    selection.checkpoint.mockRejectedValueOnce(new Error(privateError));
    const result = await runChangedVerification(repository);
    expect(result).toMatchObject({
      status: 'failed',
      phase: 'shadow-full',
      partial: { verificationId: firstRunId },
      full: null,
      failure: 'SELECTION_VERIFICATION_FAILED',
    });
    expect(runVerification).toHaveBeenCalledOnce();
    expect(selection.checkpoint).toHaveBeenCalledExactlyOnceWith(
      'before-shadow',
    );
    expect(latestReceipt()).not.toContain(privateError);
  });

  it('所有資源の解放を確認できない場合はshadowを起動しない', async () => {
    prepare(calendarFile);
    vi.mocked(runVerification)
      .mockReset()
      .mockImplementationOnce(async (_root, options) => ({
        ...runResult(options, firstRunId, 'failed'),
        execution: null,
      }));
    const result = await runChangedVerification(repository);
    expect(result).toMatchObject({
      status: 'failed',
      phase: 'partial-cleanup-check',
      full: null,
    });
    expect(runVerification).toHaveBeenCalledOnce();
  });

  it('SIGINT時はownerのcleanupを待って中断を保存し、shadowを起動しない', async () => {
    prepare(calendarFile);
    const entered = Promise.withResolvers<VerificationRunOptions | undefined>();
    const cleanup = Promise.withResolvers<void>();
    vi.mocked(runVerification)
      .mockReset()
      .mockImplementationOnce(async (_root, options) => {
        entered.resolve(options);
        await cleanup.promise;
        return {
          ...runResult(options, firstRunId, 'failed'),
          failure: 'INTERRUPTED',
        };
      });
    const before = new Set(process.rawListeners('SIGINT'));
    let settled = false;
    const resultPromise = runChangedVerification(repository).then((result) => {
      settled = true;
      return result;
    });
    const options = await Promise.race([
      entered.promise,
      resultPromise.then(() => {
        throw new Error('ownerの起動前にrunが完了しました。');
      }),
    ]);
    try {
      const interrupt = process
        .rawListeners('SIGINT')
        .find((listener) => !before.has(listener));
      if (interrupt === undefined)
        throw new Error('SIGINTの登録がありません。');
      interrupt.call(process, 'SIGINT');
      expect(options?.signal?.aborted).toBe(true);
      await Promise.resolve();
      expect(settled).toBe(false);
    } finally {
      cleanup.resolve();
    }
    const result = await resultPromise;
    expect(result).toMatchObject({
      status: 'failed',
      full: null,
      failure: 'INTERRUPTED',
      phase: 'partial',
    });
    expect(runVerification).toHaveBeenCalledOnce();
    expect(process.rawListeners('SIGINT')).toEqual([...before]);
  });
});
