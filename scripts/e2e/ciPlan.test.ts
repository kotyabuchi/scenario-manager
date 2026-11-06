import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assertCiUnchanged,
  captureCiInputs,
  readCiContext,
  readCiLedgers,
  writeCiArtifact,
} from './ciContext';
import { ciPartitionManifestSchema } from './ciPartitionSchema';
import { planCiVerification } from './ciPlan';
import { ciRuntimeFixture } from './fixtures/ciRuntime';
import { inventoryFixture } from './fixtures/selection';
import { surfaceLedgerFixture } from './fixtures/surfaceLedger';
import { mergeImpactGraphs } from './impactGraph';
import { loadImpactRules } from './loadImpactRules';
import { PlaywrightSelectionRepresentationError } from './playwrightTestList';
import { prepareChangedVerification } from './prepareChangedVerification';
import { runQualityChecks } from './qualityChecks';
import * as selectionPreparation from './selectedPreparation';
import { prepareVerificationDirectory } from './verificationContext';

vi.mock('./ciContext', () => ({
  assertCiUnchanged: vi.fn(),
  captureCiInputs: vi.fn(),
  readCiContext: vi.fn(),
  readCiLedgers: vi.fn(),
  writeCiArtifact: vi.fn(),
}));
vi.mock('./prepareChangedVerification', () => ({
  prepareChangedVerification: vi.fn(),
}));
vi.mock('./qualityChecks', () => ({ runQualityChecks: vi.fn() }));
vi.mock('./verificationContext', () => ({
  prepareVerificationDirectory: vi.fn(),
}));

const root = 'fixture-ci-planner';
const env = { ...process.env, CI: 'true' };
const signal = new AbortController().signal;
const order: string[] = [];

const selectionFixture = () => {
  const setup = ciRuntimeFixture();
  const { prepared, initial, fixture, context } = setup;
  const { eventPolicy } = context;
  if (eventPolicy.event !== 'pull_request')
    throw new Error('PR fixtureが必要です');
  const revisions = {
    base: eventPolicy.staticBase.sha,
    head: eventPolicy.head,
    mode: 'ci' as const,
    eventPolicy,
  };
  const core = inventoryFixture();
  const graph = mergeImpactGraphs({
    base: core,
    head: core,
    index: core,
    working: core,
  });
  const raw = JSON.stringify({
    schemaVersion: 1,
    features: [],
    alwaysFull: [],
    databaseWide: [],
    docsOnly: [
      {
        id: 'readme',
        reason: '案内だけ',
        paths: [{ kind: 'file', path: 'README.md' }],
      },
    ],
  });
  const rules = loadImpactRules({
    current: raw,
    base: raw,
    ledger: prepared.ledger,
  });
  const decision = {
    ...fixture.changeDecision,
    graphDigest: graph.digest,
    rulesDigest: rules.digest,
  };
  const selection: Awaited<ReturnType<typeof prepareChangedVerification>> = {
    revisions,
    eventPolicy,
    prepared,
    capture: { snapshot: initial.snapshot },
    graph,
    rules,
    decision,
    effective: null,
    proof: null,
    provenUnversionedPaths: [],
    staticReport: {
      ...surfaceLedgerFixture().receipt,
      ...revisions,
      status: 'passed',
      issues: [],
      policyDeltas: [],
      isBootstrap: false,
      baselineDigest: 'a'.repeat(64),
      registrations: 3,
      pendingItems: 0,
      legacyTests: 14,
    },
    checkpoint: vi.fn(async (phase: string) => {
      order.push(phase);
      return initial.snapshot;
    }),
  };
  return { ...setup, selection };
};
let setup = selectionFixture();

beforeEach(() => {
  vi.resetAllMocks();
  order.length = 0;
  setup = selectionFixture();
  vi.mocked(readCiContext).mockResolvedValue(setup.context);
  vi.mocked(captureCiInputs).mockResolvedValue(setup.initial);
  vi.mocked(assertCiUnchanged).mockImplementation(async () => {
    order.push('checkpoint');
    return setup.initial;
  });
  vi.mocked(readCiLedgers).mockResolvedValue(setup.ledgers);
  vi.mocked(prepareVerificationDirectory).mockReturnValue('fixture-directory');
  vi.mocked(runQualityChecks).mockImplementation(async ({ checkpoint }) => {
    order.push('quality');
    await checkpoint?.('check:ci');
  });
  vi.mocked(prepareChangedVerification).mockImplementation(async () => {
    order.push('prepare');
    return setup.selection;
  });
  vi.mocked(writeCiArtifact).mockImplementation((_root, path) => {
    order.push(path);
  });
});

describe('CI planner', () => {
  it('品質前段とNoOp検査の後に、固定smokeを含むmanifestを出す', async () => {
    const result = await planCiVerification(root, env, signal);
    expect(result).toEqual({
      status: 'passed',
      phase: 'plan',
      workflow: setup.context.workflow,
      head: setup.context.eventPolicy.head,
    });
    expect(order).toEqual([
      'quality',
      'checkpoint',
      'prepare',
      'ci-plan',
      'checkpoint',
      'plan/manifest.json',
      'plan/static.json',
    ]);
    const writes = vi.mocked(writeCiArtifact).mock.calls;
    const manifest = ciPartitionManifestSchema.parse(writes[0]?.[2]);
    expect(manifest).toMatchObject({
      eventPolicy: setup.context.eventPolicy,
      inputsDigest: setup.initial.inputs.digest,
      snapshotDigest: setup.initial.snapshot.digest,
      fullCollectionDigest: setup.fixture.manifest.fullCollectionDigest,
      changeDecision: setup.selection.decision,
    });
    expect(
      manifest.shards.map(({ id, requiredKeys }) => [id, requiredKeys]),
    ).toEqual([
      ['required', [setup.fixture.storyRow.key]],
      ['legacy-local', [setup.fixture.appRow.key]],
    ]);
    expect(writes[1]).toEqual([
      root,
      'plan/static.json',
      {
        ...setup.selection.staticReport,
        workflow: setup.context.workflow,
        snapshotDigest: setup.initial.snapshot.digest,
        inputsDigest: setup.initial.inputs.digest,
      },
    ]);
  });

  it('固定smoke追加後の表現不能を、元の差分判断を保持して全件へ拡大する', async () => {
    const prepare = vi.spyOn(selectionPreparation, 'selectedPreparation');
    prepare.mockImplementationOnce(() => {
      throw new PlaywrightSelectionRepresentationError();
    });
    try {
      await expect(
        planCiVerification(root, env, signal),
      ).resolves.toMatchObject({ status: 'passed' });
      const manifest = ciPartitionManifestSchema.parse(
        vi.mocked(writeCiArtifact).mock.calls[0]?.[2],
      );
      expect(manifest.runnerSelectionFallback).toBe(true);
      expect(manifest.changeDecision).toEqual(setup.selection.decision);
      expect(manifest.effectivePlanDigest).toBe(manifest.fullPlanDigest);
      expect(manifest.projectionReasons).toContainEqual(
        expect.objectContaining({ code: 'RUNNER_SELECTION_UNREPRESENTABLE' }),
      );
      expect(prepare.mock.results[1]?.value).toMatchObject({
        runnerSelections: [
          expect.objectContaining({ unfiltered: true }),
          expect.objectContaining({ unfiltered: true }),
        ],
      });
    } finally {
      prepare.mockRestore();
    }
  });

  it('品質前段の失敗や由来の差があればmanifestを出さない', async () => {
    vi.mocked(runQualityChecks).mockRejectedValueOnce(new Error('前段の失敗'));
    const onProgress = vi.fn();
    await expect(
      planCiVerification(root, env, signal, onProgress),
    ).rejects.toThrow('前段');
    expect(onProgress).toHaveBeenLastCalledWith({ phase: 'quality' });
    expect(vi.mocked(prepareChangedVerification)).not.toHaveBeenCalled();
    vi.mocked(prepareChangedVerification).mockResolvedValueOnce({
      ...setup.selection,
      capture: {
        snapshot: { ...setup.initial.snapshot, digest: '0'.repeat(64) },
      },
    });
    await expect(planCiVerification(root, env, signal)).rejects.toThrow('由来');
    expect(vi.mocked(writeCiArtifact)).not.toHaveBeenCalled();
  });

  it('0件の理由が固定差分を説明できなければsmokeで埋めず失敗する', async () => {
    vi.mocked(prepareChangedVerification).mockResolvedValueOnce({
      ...setup.selection,
      decision: {
        ...setup.selection.decision,
        reasons: [
          {
            code: 'NO_CHANGES',
            changedPaths: [],
            viaNodes: [],
            ruleIds: [],
            caseIds: [],
          },
        ],
      },
    });
    await expect(planCiVerification(root, env, signal)).rejects.toThrow('0件');
    expect(vi.mocked(writeCiArtifact)).not.toHaveBeenCalled();
  });
});
