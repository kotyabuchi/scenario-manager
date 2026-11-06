import { beforeEach, describe, expect, it, vi } from 'vitest';

import { baselineSchema } from './baseline';
import { inventoryFixture } from './fixtures/selection';
import { surfaceLedgerFixture } from './fixtures/surfaceLedger';
import { assertGitCommit, gitRead } from './gitObjects';
import { captureGitSnapshot } from './gitSnapshot';
import { gitSnapshotSchema } from './gitSnapshotSchema';
import { projectInventoryV1 } from './inventory';
import { baselineDigest } from './staticGate';
import { SURFACE_ARTIFACTS } from './surfaceGate';
import {
  surfaceMigrationDigest,
  surfacePendingDigest,
} from './surfaceMigration';
import { SURFACE_MIGRATION_INTRODUCTION } from './surfaceMigrationHistory';
import { SURFACE_MIGRATION_V1_ORIGIN } from './surfaceMigrationObservation';
import { surfaceObservationDigest } from './surfacePending';
import { assertSurfaceReceipt, surfaceReceiptSchema } from './surfaceReceipt';
import { readRevisionFile } from './trustedRevision';

import type { InputFingerprint } from './fingerprint';
import type { GithubEventPolicy } from './githubEventSchema';
import type { SavedSurfaceState } from './surfaceMigration';
import type { SurfaceMigrationHistoryProof } from './surfaceMigrationHistory';

vi.mock('./gitObjects', async (original) => ({
  ...(await original<typeof import('./gitObjects')>()),
  assertGitCommit: vi.fn(),
  gitRead: vi.fn(),
}));
vi.mock('./gitSnapshot', async (original) => ({
  ...(await original<typeof import('./gitSnapshot')>()),
  captureGitSnapshot: vi.fn(),
}));
vi.mock('./trustedRevision', async (original) => ({
  ...(await original<typeof import('./trustedRevision')>()),
  readRevisionFile: vi.fn(),
}));

const root = '/fixture';
const base = 'a'.repeat(40);
const head = 'b'.repeat(40);
const digest = 'a'.repeat(64);
const policy = {
  schemaVersion: 1,
  event: 'pull_request',
  repository: 'example/repo',
  eventRef: 'refs/pull/42/merge',
  head,
  staticBase: { kind: 'comparison', sha: base },
  impactBase: 'c'.repeat(40),
  execution: 'changed-plus-smoke',
} as const satisfies GithubEventPolicy;
const artifacts = {
  inventory: 'e2e/ledger/inventory.generated.json',
  baseline: 'e2e/ledger/pending-baseline.json',
  legacy: 'e2e/ledger/legacy-tests.generated.json',
};
const inputs: InputFingerprint = {
  schemaVersion: 1,
  algorithm: 'sha256',
  root,
  rules: 'fixed-input-scope-v1-next16-template-v1',
  files: [],
  digest,
};
const snapshot = gitSnapshotSchema.parse({
  schemaVersion: 1,
  mode: 'ci',
  base,
  head,
  eventBase: base,
  objectFormat: 'sha1',
  indexEntries: [],
  changedPaths: [],
  workingFiles: [],
  reasons: [],
  digest,
});
const fixture = surfaceLedgerFixture();
const inventory = inventoryFixture();
const baseline = baselineSchema.parse({ schemaVersion: 1, items: [] });
const files = new Map<string, string>();
const put = (revision: string, path: string, data: unknown) =>
  files.set(`${revision}:${path}`, JSON.stringify(data));
const save = (revision: string, saved: SavedSurfaceState) => {
  put(revision, SURFACE_ARTIFACTS.pending, saved.pending);
  put(revision, SURFACE_ARTIFACTS.migration, saved.migration);
};
const report = {
  ...fixture.receipt,
  base,
  baselineDigest: baselineDigest(baseline),
};
const input = { root, policy, artifacts, report, inputs };

beforeEach(() => {
  vi.resetAllMocks();
  files.clear();
  save(head, fixture);
  put(head, artifacts.inventory, inventory);
  put(head, artifacts.baseline, baseline);
  vi.mocked(readRevisionFile).mockImplementation((_root, revision, path) =>
    files.get(`${revision}:${path}`),
  );
  vi.mocked(assertGitCommit).mockImplementation((_root, revision) => revision);
  vi.mocked(gitRead).mockReturnValue(Buffer.alloc(0));
  vi.mocked(captureGitSnapshot).mockReturnValue({ snapshot });
});

describe('移行済みbaseのCI静的証跡', () => {
  it('固定HEADと履歴を照合し、観測時のGit snapshotを作り直さない', () => {
    save(base, fixture);
    put(base, artifacts.inventory, inventory);
    expect(() => assertSurfaceReceipt(input)).not.toThrow();
    expect(captureGitSnapshot).not.toHaveBeenCalled();
    expect(() =>
      assertSurfaceReceipt({
        ...input,
        report: { ...report, surfaceMigrationSnapshotDigest: digest },
      }),
    ).toThrow('初期移行として');
    expect(() =>
      assertSurfaceReceipt({
        ...input,
        report: {
          ...report,
          surfaceMigrationHistory: {
            schemaVersion: 1,
            observationBaseSha: SURFACE_MIGRATION_V1_ORIGIN,
            introductionSha: SURFACE_MIGRATION_INTRODUCTION,
            snapshotDigest: digest,
            baselineDigest: digest,
            surfaceMigrationDigest: digest,
            surfacePendingDigest: digest,
          },
        },
      }),
    ).toThrow('初期移行として');
  });

  it.each([
    'surfacePendingDigest',
    'surfaceMigrationDigest',
    'observationBaseSha',
  ] as const)('%sだけを取り違えた成果物を拒否する', (field) => {
    save(base, fixture);
    put(base, artifacts.inventory, inventory);
    expect(() =>
      assertSurfaceReceipt({
        ...input,
        report: { ...report, [field]: '0'.repeat(64) },
      }),
    ).toThrow('固定HEAD');
  });

  it('報告とHEADのdigestが合っても、移行履歴改変や比較元の片側欠落を拒否する', () => {
    save(base, fixture);
    put(base, artifacts.inventory, inventory);
    const migration = {
      ...fixture.migration,
      newObservationDigest: '0'.repeat(64),
    };
    save(head, { ...fixture, migration });
    const changed = {
      ...report,
      surfaceMigrationDigest: surfaceMigrationDigest(migration),
    };
    expect(() => assertSurfaceReceipt({ ...input, report: changed })).toThrow(
      '移行記録は変更できません',
    );
    files.delete(`${base}:${SURFACE_ARTIFACTS.migration}`);
    expect(() => assertSurfaceReceipt({ ...input, report: changed })).toThrow(
      SURFACE_ARTIFACTS.migration,
    );
  });
});

const initial = (observationBaseSha = base) => {
  put(observationBaseSha, artifacts.inventory, projectInventoryV1(inventory));
  put(observationBaseSha, artifacts.baseline, baseline);
  put(observationBaseSha, artifacts.legacy, {
    schemaVersion: 1,
    tests: [],
    setups: [],
    groups: [],
    registered: [],
  });
  const migration = {
    ...fixture.migration,
    observationBaseSha,
    newObservationDigest: surfaceObservationDigest(inventory),
  };
  save(head, { ...fixture, migration });
  return {
    ...report,
    observationBaseSha,
    surfaceMigrationDigest: surfaceMigrationDigest(migration),
    surfaceMigrationOrigin: {
      kind:
        observationBaseSha === base
          ? ('static-base' as const)
          : ('approved-bootstrap-origin' as const),
      staticBaseSha: base,
      observationBaseSha,
    },
    surfaceMigrationSnapshotDigest: digest,
  };
};

describe('初期移行のCI静的証跡', () => {
  it('静的baseからGit snapshotを再取得し、影響merge-baseで代用しない', () => {
    const report = initial();
    expect(() => assertSurfaceReceipt({ ...input, report })).not.toThrow();
    expect(captureGitSnapshot).toHaveBeenCalledExactlyOnceWith({
      root,
      base,
      expectedHead: head,
      mode: 'ci',
      eventBase: base,
      runtimeInputPaths: [],
    });
    expect(() =>
      assertSurfaceReceipt({
        ...input,
        report: { ...report, surfaceMigrationSnapshotDigest: '0'.repeat(64) },
      }),
    ).toThrow('Git snapshot');
  });

  it('保存inventoryのUI観測を置き換えると初期証跡が一致しない', () => {
    const report = initial();
    put(head, artifacts.inventory, {
      ...inventory,
      surfaceAnalysis: {
        ...inventory.surfaceAnalysis,
        storyReferences: [
          {
            id: 'fixture-story',
            kind: 'entry',
            source: { file: 'src/fixture.stories.tsx', line: 1, column: 1 },
          },
        ],
      },
    });
    expect(() => assertSurfaceReceipt({ ...input, report })).toThrow(
      '現在の観測',
    );
  });

  const historical = () => {
    const initialReport = initial(SURFACE_MIGRATION_V1_ORIGIN);
    const migration = {
      ...fixture.migration,
      observationBaseSha: SURFACE_MIGRATION_V1_ORIGIN,
      newObservationDigest: '0'.repeat(64),
      newPendingDigest: surfacePendingDigest(fixture.pending),
    };
    save(SURFACE_MIGRATION_INTRODUCTION, { ...fixture, migration });
    put(SURFACE_MIGRATION_INTRODUCTION, artifacts.baseline, baseline);
    const pending = { schemaVersion: 1 as const, items: [] };
    save(head, { pending, migration });
    const report = {
      ...initialReport,
      surfacePendingDigest: surfacePendingDigest(pending),
      surfaceMigrationDigest: surfaceMigrationDigest(migration),
      surfaceMigrationSnapshotDigest: null,
      surfaceMigrationHistory: {
        schemaVersion: 1,
        observationBaseSha: SURFACE_MIGRATION_V1_ORIGIN,
        introductionSha: SURFACE_MIGRATION_INTRODUCTION,
        snapshotDigest: digest,
        baselineDigest: initialReport.baselineDigest,
        surfaceMigrationDigest: surfaceMigrationDigest(migration),
        surfacePendingDigest: surfacePendingDigest(fixture.pending),
      } satisfies SurfaceMigrationHistoryProof,
    };
    return { report, migration };
  };

  it('台帳未導入のPRは外部承認・固定祖先・導入時の成果物を独立照合する', () => {
    const { report } = historical();
    const approved = {
      ...input,
      report,
      bootstrapApproval: JSON.stringify({
        base,
        head,
        digest: report.baselineDigest,
      }),
    };
    expect(() => assertSurfaceReceipt({ ...input, report })).toThrow(
      '外部承認',
    );
    expect(() => assertSurfaceReceipt(approved)).not.toThrow();
    expect(gitRead).toHaveBeenCalledWith(root, [
      'merge-base',
      '--is-ancestor',
      SURFACE_MIGRATION_V1_ORIGIN,
      SURFACE_MIGRATION_INTRODUCTION,
    ]);
    expect(gitRead).toHaveBeenCalledWith(root, [
      'merge-base',
      '--is-ancestor',
      SURFACE_MIGRATION_INTRODUCTION,
      head,
    ]);
    expect(captureGitSnapshot).not.toHaveBeenCalled();
  });

  it('履歴証跡の欠落・snapshot重複・digest改変・固定導入祖先の欠落を拒否する', () => {
    const { report } = historical();
    const approved = {
      ...input,
      bootstrapApproval: JSON.stringify({
        base,
        head,
        digest: report.baselineDigest,
      }),
    };
    const { surfaceMigrationHistory, ...missing } = report;
    expect(() =>
      assertSurfaceReceipt({ ...approved, report: missing }),
    ).toThrow('履歴証跡');
    expect(() =>
      assertSurfaceReceipt({
        ...approved,
        report: { ...report, surfaceMigrationSnapshotDigest: digest },
      }),
    ).toThrow('重複');
    expect(() =>
      assertSurfaceReceipt({
        ...approved,
        report: {
          ...report,
          surfaceMigrationHistory: {
            ...surfaceMigrationHistory,
            surfacePendingDigest: '0'.repeat(64),
          },
        },
      }),
    ).toThrow('固定導入');
    vi.mocked(gitRead).mockImplementation((_root, args) => {
      if (args[2] === SURFACE_MIGRATION_INTRODUCTION)
        throw new Error('祖先なし');
      return Buffer.alloc(0);
    });
    expect(() => assertSurfaceReceipt({ ...approved, report })).toThrow(
      '祖先なし',
    );
  });

  it('履歴証跡を通常の初期移行に指定できない', () => {
    const { report: historicalReport } = historical();
    const report = initial();
    expect(() =>
      assertSurfaceReceipt({
        ...input,
        report: {
          ...report,
          surfaceMigrationHistory: historicalReport.surfaceMigrationHistory,
        },
      }),
    ).toThrow('通常のUI初期移行');
  });

  it('証跡の初期移行フィールドを省略できない', () => {
    const { surfaceMigrationSnapshotDigest, ...missing } = fixture.receipt;
    expect(surfaceMigrationSnapshotDigest).toBeNull();
    expect(surfaceReceiptSchema.safeParse(missing).success).toBe(false);
  });
});
