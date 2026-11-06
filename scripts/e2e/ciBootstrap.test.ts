import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BOOTSTRAP_SMOKE_KEY_DIGEST,
  BOOTSTRAP_SMOKE_REVISION,
} from './ciBootstrap';
import { readCiLedgers } from './ciContext';
import {
  createCiPartitionManifest,
  validateCiPartitionManifest,
} from './ciPartition';
import { assertCiStaticReport, digestCiSurfaceHistory } from './ciStaticReport';
import { ciPartitionFixture } from './fixtures/ciPartition';
import { surfaceLedgerFixture } from './fixtures/surfaceLedger';
import { assertGitCommit, gitRead } from './gitObjects';
import { loadLedger } from './ledger';
import { readArtifact } from './ledgerArtifacts';
import { legacyKey } from './legacy';
import { ARTIFACTS, baselineDigest } from './staticGate';
import {
  SURFACE_MIGRATION_INTRODUCTION,
  SURFACE_MIGRATION_V1_ORIGIN,
  type SurfaceMigrationHistoryProof,
} from './surfaceMigrationHistory';
import { readRevisionFile } from './trustedRevision';
import { digestVerificationPlan } from './verificationPlanDigest';

vi.mock('./gitObjects', async (original) => ({
  ...(await original<typeof import('./gitObjects')>()),
  assertGitCommit: vi.fn(),
  gitRead: vi.fn(),
}));
vi.mock('./ledger', async (original) => ({
  ...(await original<typeof import('./ledger')>()),
  loadLedger: vi.fn(),
}));
vi.mock('./ledgerArtifacts', async (original) => ({
  ...(await original<typeof import('./ledgerArtifacts')>()),
  readArtifact: vi.fn(),
}));
vi.mock('./trustedRevision', async (original) => ({
  ...(await original<typeof import('./trustedRevision')>()),
  readRevisionFile: vi.fn(),
}));

// UI初期移行はsurfaceReceipt.test.tsの独立fixtureで検査する。
vi.mock('./surfaceReceipt', async (original) => ({
  ...(await original<typeof import('./surfaceReceipt')>()),
  assertSurfaceReceipt: vi.fn(),
}));

const root = 'fixture-ci-root';
const baseline = { schemaVersion: 1 as const, items: [] };

const setup = (isBootstrap = true) => {
  const input = ciPartitionFixture(isBootstrap);
  const { eventPolicy: policy } = input;
  if (policy.event !== 'pull_request')
    throw new Error('PR fixtureがありません。');
  const report = {
    ...surfaceLedgerFixture().receipt,
    workflow: input.workflow,
    snapshotDigest: input.snapshotDigest,
    inputsDigest: input.inputsDigest,
    status: 'passed',
    mode: 'ci',
    base: policy.staticBase.sha,
    head: policy.head,
    eventPolicy: policy,
    issues: [],
    isBootstrap,
    baselineDigest: baselineDigest(baseline),
  };
  vi.mocked(loadLedger).mockResolvedValue(input.ledger);
  vi.mocked(readArtifact).mockImplementation((_root, path) =>
    path === ARTIFACTS.baseline
      ? JSON.stringify(baseline)
      : JSON.stringify(input.legacy),
  );
  vi.mocked(readRevisionFile).mockImplementation((_root, revision, path) => {
    if (revision === BOOTSTRAP_SMOKE_REVISION && path === ARTIFACTS.legacy)
      return JSON.stringify(input.smokeReference.legacy);
    if (revision === policy.staticBase.sha && !isBootstrap)
      return path === ARTIFACTS.baseline
        ? JSON.stringify(baseline)
        : JSON.stringify(input.smokeReference.legacy);
    return undefined;
  });
  vi.mocked(assertGitCommit).mockReturnValue(BOOTSTRAP_SMOKE_REVISION);
  vi.mocked(gitRead).mockReturnValue(Buffer.alloc(0));
  return { input, policy, report };
};

beforeEach(() => vi.resetAllMocks());

describe('初回PRの固定legacy smoke比較元', () => {
  it('履歴移行の証拠を現在のイベントとworkflow・固定入力へ結び付ける', async () => {
    const { input, policy, report } = setup();
    const raw = {
      ...report,
      surfaceMigrationHistory: {
        schemaVersion: 1,
        observationBaseSha: SURFACE_MIGRATION_V1_ORIGIN,
        introductionSha: SURFACE_MIGRATION_INTRODUCTION,
        snapshotDigest: 'd'.repeat(64),
        baselineDigest: report.baselineDigest,
        surfaceMigrationDigest: report.surfaceMigrationDigest,
        surfacePendingDigest: report.surfacePendingDigest,
      } satisfies SurfaceMigrationHistoryProof,
    };
    const checked = assertCiStaticReport(root, raw, policy, report);
    const digest = digestCiSurfaceHistory(checked);
    const ledgers = await readCiLedgers(root, policy, raw, report);
    expect(ledgers.surfaceMigrationHistoryDigest).toBe(digest);
    expect(digest).toMatch(/^[a-f0-9]{64}$/u);
    expect(
      createCiPartitionManifest({ ...input, ...ledgers }).manifest
        .surfaceMigrationHistoryDigest,
    ).toBe(digest);
    for (const changed of [
      { ...checked, workflow: { ...checked.workflow, runId: '999' } },
      { ...checked, workflow: { ...checked.workflow, attempt: 2 } },
      { ...checked, base: 'd'.repeat(40) },
      { ...checked, head: 'd'.repeat(40) },
      { ...checked, baselineDigest: 'd'.repeat(64) },
      { ...checked, snapshotDigest: 'd'.repeat(64) },
      { ...checked, inputsDigest: 'd'.repeat(64) },
      {
        ...checked,
        eventPolicy: { ...checked.eventPolicy, repository: 'different/repo' },
      },
      {
        ...checked,
        surfaceMigrationHistory: {
          ...raw.surfaceMigrationHistory,
          schemaVersion: 1 as const,
          snapshotDigest: 'e'.repeat(64),
        },
      },
    ])
      expect(digestCiSurfaceHistory(changed)).not.toBe(digest);
    expect(
      digestCiSurfaceHistory(
        assertCiStaticReport(root, report, policy, report),
      ),
    ).toBeUndefined();
  });

  it('承認済み静的証拠と固定祖先の14キーを照合し、元の差分判断を残して全件にする', async () => {
    const { input, policy, report } = setup();
    const ledgers = await readCiLedgers(root, policy, report, report);
    const { manifest, plans } = createCiPartitionManifest({
      ...input,
      ...ledgers,
    });
    expect(gitRead).toHaveBeenCalledExactlyOnceWith(root, [
      'merge-base',
      '--is-ancestor',
      BOOTSTRAP_SMOKE_REVISION,
      policy.head,
    ]);
    expect(manifest.smokeReference).toEqual({
      kind: 'approved-bootstrap-origin',
      isBootstrap: true,
      revision: BOOTSTRAP_SMOKE_REVISION,
      keyDigest: BOOTSTRAP_SMOKE_KEY_DIGEST,
    });
    expect(manifest.changeDecision).toEqual(input.changeDecision);
    expect(manifest.effectivePlanDigest).toBe(manifest.fullPlanDigest);
    expect(manifest.projectionReasons).toContainEqual(
      expect.objectContaining({ code: 'FORCED_FULL' }),
    );
    expect(plans.required.requirements).toEqual([
      input.storyRow,
      input.isolatedRow,
    ]);
    expect(validateCiPartitionManifest({ ...ledgers, manifest }).plans).toEqual(
      plans,
    );
    if (manifest.smokeReference === null) throw new Error('fixture不足');
    manifest.smokeReference.keyDigest = '0'.repeat(64);
    expect(() => validateCiPartitionManifest({ ...ledgers, manifest })).toThrow(
      /分割/u,
    );
  });

  it('通常PRはイベントbaseの目録を使い、固定祖先の探索も全件追加もしない', async () => {
    const { input, policy, report } = setup(false);
    const ledgers = await readCiLedgers(root, policy, report, report);
    const { manifest, plans } = createCiPartitionManifest({
      ...input,
      ...ledgers,
    });
    expect(gitRead).not.toHaveBeenCalled();
    expect(manifest.smokeReference).toMatchObject({
      kind: 'static-base',
      revision: policy.staticBase.sha,
      isBootstrap: false,
    });
    expect(plans.required.requirements).toEqual([input.storyRow]);
  });

  it('承認済み初回を示す静的証拠がない場合は固定祖先を使わない', async () => {
    const { policy, report } = setup();
    await expect(
      readCiLedgers(root, policy, { ...report, status: 'failed' }, report),
    ).rejects.toThrow();
    await expect(
      readCiLedgers(root, policy, { ...report, isBootstrap: false }, report),
    ).rejects.toThrow(/baseline/u);
    expect(gitRead).not.toHaveBeenCalled();
  });

  it.each([
    ARTIFACTS.baseline,
    ARTIFACTS.legacy,
  ])('比較元の片側だけが欠ける場合はbootstrapとして補わない（%s）', async (missing) => {
    const { input, policy, report } = setup(missing === ARTIFACTS.baseline);
    vi.mocked(readRevisionFile).mockImplementation((_root, _revision, path) =>
      path === missing
        ? undefined
        : JSON.stringify(
            path === ARTIFACTS.baseline
              ? baseline
              : input.smokeReference.legacy,
          ),
    );
    await expect(readCiLedgers(root, policy, report, report)).rejects.toThrow(
      /比較元/u,
    );
    expect(gitRead).not.toHaveBeenCalled();
  });

  it.each([
    'object',
    'ancestor',
  ] as const)('固定originの%sが証明できなければ失敗する', async (proof) => {
    const { policy, report } = setup();
    const fail = () => {
      throw new Error('固定originを検証できません');
    };
    if (proof === 'object')
      vi.mocked(assertGitCommit).mockImplementationOnce(fail);
    else vi.mocked(gitRead).mockImplementationOnce(fail);
    await expect(readCiLedgers(root, policy, report, report)).rejects.toThrow(
      /固定origin/u,
    );
  });

  it('固定originに同数の別キーがある場合も拒否する', async () => {
    const { input, policy, report } = setup();
    const entry = input.smokeReference.legacy.tests[0];
    if (entry === undefined) throw new Error('fixture不足');
    entry.titlePath = ['別の登録'];
    entry.key = legacyKey(entry.profile, entry);
    await expect(readCiLedgers(root, policy, report, report)).rejects.toThrow(
      /key digest/u,
    );
  });

  it('現行smokeを同数の別キーに置換しても固定originと一致しない', async () => {
    const { input, policy, report } = setup();
    const entry = input.legacy.tests[0];
    const extra = input.fullPlan.allowedExtraTests[0];
    if (entry === undefined || extra === undefined)
      throw new Error('fixture不足');
    entry.titlePath = ['別の登録'];
    entry.key = legacyKey(entry.profile, entry);
    extra.test.titlePath = entry.titlePath;
    extra.legacy.key = entry.key;
    input.changeDecision.fullPlanDigest = digestVerificationPlan(
      input.fullPlan,
    );
    const ledgers = await readCiLedgers(root, policy, report, report);
    expect(() => createCiPartitionManifest({ ...input, ...ledgers })).toThrow(
      /exact key/u,
    );
  });
});
