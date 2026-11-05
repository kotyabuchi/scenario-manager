import { beforeEach, describe, expect, it, vi } from 'vitest';

import { captureInputs } from './fingerprint';
import { captureGitSnapshot } from './gitSnapshot';
import { serializeInventory } from './inventory';
import { inventorySchema } from './inventorySchema';
import { readArtifact, writeArtifact } from './ledgerArtifacts';
import { migrateSurfaceLedger } from './ledgerRefresh';
import { legacyKey } from './legacy';
import { ARTIFACTS, collectStaticState } from './staticGate';
import {
  prepareSurfaceMigration,
  readSurfaceStateAtRevision,
  SURFACE_ARTIFACTS,
} from './surfaceGate';
import {
  buildSurfaceMigrationRecord,
  serializeSurfacePending,
  surfaceMigrationDigest,
  surfacePendingDigest,
} from './surfaceMigration';
import { surfacePendingSchema } from './surfaceMigrationSchema';
import { SURFACE_RULE_DIGEST } from './surfaceProjection';
import { readRevisionFile, resolveRevisions } from './trustedRevision';

import { createHash } from 'node:crypto';

import type { StaticState } from './staticGate';

vi.mock('./fingerprint', async (original) => ({
  ...(await original<typeof import('./fingerprint')>()),
  captureInputs: vi.fn(),
}));
vi.mock('./gitSnapshot', async (original) => ({
  ...(await original<typeof import('./gitSnapshot')>()),
  captureGitSnapshot: vi.fn(),
}));
vi.mock('./ledgerArtifacts', async (original) => ({
  ...(await original<typeof import('./ledgerArtifacts')>()),
  readArtifact: vi.fn(),
  writeArtifact: vi.fn(),
}));
vi.mock('./staticGate', async (original) => ({
  ...(await original<typeof import('./staticGate')>()),
  collectStaticState: vi.fn(),
}));
vi.mock('./surfaceGate', async (original) => ({
  ...(await original<typeof import('./surfaceGate')>()),
  prepareSurfaceMigration: vi.fn(),
  readSurfaceStateAtRevision: vi.fn(),
}));
vi.mock('./trustedRevision', async (original) => ({
  ...(await original<typeof import('./trustedRevision')>()),
  resolveRevisions: vi.fn(),
  readRevisionFile: vi.fn(),
}));

const ROOT = '/surface-recovery';
const BASE = 'a'.repeat(40);
const HEAD = 'b'.repeat(40);
const DIGEST = 'c'.repeat(64);
const INPUT_DIGEST = createHash('sha256').update('[]').digest('hex');
const LEGACY = {
  schemaVersion: 1 as const,
  tests: [],
  registered: [],
  setups: [],
  groups: [],
};
const files = new Map<string, string>();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('CI', '');
  vi.stubEnv('GITHUB_ACTIONS', '');
  files.clear();
  files.set(ARTIFACTS.legacy, JSON.stringify(LEGACY));
  vi.mocked(readRevisionFile).mockImplementation((_root, revision, path) =>
    revision === HEAD && path === ARTIFACTS.legacy
      ? JSON.stringify(LEGACY)
      : undefined,
  );
  vi.mocked(resolveRevisions).mockResolvedValue({
    base: BASE,
    head: HEAD,
    mode: 'local',
  });
  vi.mocked(readSurfaceStateAtRevision).mockReturnValue(null);
  vi.mocked(captureInputs).mockResolvedValue({
    schemaVersion: 1,
    algorithm: 'sha256',
    root: ROOT,
    rules: 'fixed-input-scope-v1-next16-template-v1',
    files: [],
    digest: INPUT_DIGEST,
  });
  vi.mocked(captureGitSnapshot).mockReturnValue({
    snapshot: {
      schemaVersion: 1,
      mode: 'local',
      objectFormat: 'sha1',
      base: BASE,
      head: HEAD,
      digest: DIGEST,
      indexEntries: [],
      changedPaths: [],
      workingFiles: [],
      reasons: [],
    },
  });
  vi.mocked(readArtifact).mockImplementation((_root, path) => files.get(path));
  vi.mocked(writeArtifact).mockImplementation((_root, path, value) => {
    files.set(path, value);
  });

  const inventory = inventorySchema.parse({
    schemaVersion: 2,
    extractorVersion: '2',
    source: { fingerprint: DIGEST, files: [] },
    nodes: [],
    edges: [],
    diagnostics: [],
    surfaceAnalysis: {
      sites: [],
      bindings: [],
      storyReferences: [],
      diagnostics: [],
    },
  });
  const pending = surfacePendingSchema.parse({ schemaVersion: 1, items: [] });
  const migration = buildSurfaceMigrationRecord({
    observationBaseSha: BASE,
    ruleDigest: SURFACE_RULE_DIGEST,
    old: { pending, observationDigest: DIGEST },
    current: { pending, observationDigest: DIGEST },
  });
  vi.mocked(collectStaticState).mockResolvedValue({
    inventory,
    baseline: { schemaVersion: 1, items: [] },
    ledger: {
      schemaVersion: 1,
      profiles: [],
      fixtures: [],
      contracts: [],
      scenarios: [],
      executionGroups: [],
      exceptions: [],
    },
    legacy: LEGACY,
    registrations: 0,
    surfacePending: pending,
  } satisfies StaticState);
  vi.mocked(prepareSurfaceMigration).mockResolvedValue({
    pending,
    migration,
    receipt: {
      surfacePendingDigest: surfacePendingDigest(pending),
      surfaceMigrationDigest: surfaceMigrationDigest(migration),
      observationBaseSha: BASE,
      surfaceMigrationOrigin: {
        kind: 'static-base',
        staticBaseSha: BASE,
        observationBaseSha: BASE,
      },
      surfaceMigrationSnapshotDigest: DIGEST,
    },
  });
});

describe('UI初期移行の途中保存からの復旧', () => {
  it('正確な途中出力だけを補完して再実行できる', async () => {
    vi.mocked(writeArtifact).mockImplementationOnce((_root, path, value) =>
      files.set(path, value),
    );
    vi.mocked(writeArtifact).mockImplementationOnce((_root, path, value) =>
      files.set(path, value),
    );
    vi.mocked(writeArtifact).mockImplementationOnce(() => {
      throw new Error('保存中断');
    });
    await expect(migrateSurfaceLedger(ROOT, BASE)).rejects.toThrow('保存中断');
    expect(files.has(SURFACE_ARTIFACTS.pending)).toBe(true);
    expect(files.has(SURFACE_ARTIFACTS.migration)).toBe(false);

    vi.mocked(writeArtifact).mockImplementation((_root, path, value) =>
      files.set(path, value),
    );
    await expect(migrateSurfaceLedger(ROOT, BASE)).resolves.toMatchObject({
      mode: 'migrate-surface',
      reviewRequired: true,
    });
    expect(
      vi
        .mocked(writeArtifact)
        .mock.calls.slice(-1)
        .map((call) => call[1]),
    ).toEqual([SURFACE_ARTIFACTS.migration]);
    expect(files.get(SURFACE_ARTIFACTS.migration)).toBeDefined();
  });

  it('途中出力が候補と異なる場合は補完しない', async () => {
    const state = await collectStaticState(ROOT);
    files.set(
      'e2e/ledger/inventory.generated.json',
      serializeInventory(state.inventory),
    );
    files.set(
      SURFACE_ARTIFACTS.pending,
      `${serializeSurfacePending(state.surfacePending)} `,
    );
    await expect(migrateSurfaceLedger(ROOT, BASE)).rejects.toThrow('固定観測');
    expect(writeArtifact).not.toHaveBeenCalled();
  });
});

describe('UI初期移行で登録済みlegacy metadataを同期する', () => {
  const oldEntry = {
    file: 'e2e/isolated/schedule-confirmation.spec.ts',
    titlePath: ['日程確定', '作成者'],
    project: 'chromium',
    repeatEachIndex: 0,
    expectedStatus: 'passed' as const,
    annotations: [],
    key: legacyKey('isolated', {
      file: 'e2e/isolated/schedule-confirmation.spec.ts',
      titlePath: ['日程確定', '作成者'],
      project: 'chromium',
      repeatEachIndex: 0,
    }),
    profile: 'isolated',
    fingerprint: 'a'.repeat(64),
    serialGroup: null,
    caseId: 'schedule-confirm-persist',
    variant: 'creator-only',
    binding: 'main',
  };
  const oldLegacy = { ...LEGACY, registered: [oldEntry] };
  const nextLegacy = {
    ...LEGACY,
    registered: [{ ...oldEntry, fingerprint: 'b'.repeat(64) }],
  };

  const setLegacyState = async () => {
    const state = await collectStaticState(ROOT);
    vi.mocked(collectStaticState).mockResolvedValue({
      ...state,
      legacy: nextLegacy,
    });
    vi.mocked(readRevisionFile).mockImplementation((_root, revision, path) =>
      revision === HEAD && path === ARTIFACTS.legacy
        ? JSON.stringify(oldLegacy)
        : undefined,
    );
    files.set(ARTIFACTS.legacy, JSON.stringify(oldLegacy));
    files.set(ARTIFACTS.inventory, serializeInventory(state.inventory));
    files.set(
      SURFACE_ARTIFACTS.pending,
      serializeSurfacePending(state.surfacePending),
    );
    const candidate = await prepareSurfaceMigration({
      root: ROOT,
      revisions: { base: BASE, head: HEAD },
      state,
      artifacts: ARTIFACTS,
    });
    files.set(
      SURFACE_ARTIFACTS.migration,
      `${JSON.stringify(candidate.migration, null, 2)}\n`,
    );
  };

  it('完成済みUI成果物を保持して登録済みfingerprintだけを更新する', async () => {
    await setLegacyState();
    const surfaceBefore = [
      files.get(ARTIFACTS.inventory),
      files.get(SURFACE_ARTIFACTS.pending),
      files.get(SURFACE_ARTIFACTS.migration),
    ];
    await expect(migrateSurfaceLedger(ROOT, BASE)).resolves.toMatchObject({
      mode: 'migrate-surface',
      reviewRequired: true,
    });
    expect(vi.mocked(writeArtifact).mock.calls.map((call) => call[1])).toEqual([
      ARTIFACTS.legacy,
    ]);
    expect(JSON.parse(files.get(ARTIFACTS.legacy) ?? '')).toEqual(nextLegacy);
    expect([
      files.get(ARTIFACTS.inventory),
      files.get(SURFACE_ARTIFACTS.pending),
      files.get(SURFACE_ARTIFACTS.migration),
    ]).toEqual(surfaceBefore);
    vi.mocked(writeArtifact).mockClear();
    await migrateSurfaceLedger(ROOT, BASE);
    expect(writeArtifact).not.toHaveBeenCalled();
  });

  it('未登録testの作業ツリー改変を拒否する', async () => {
    await setLegacyState();
    const {
      caseId: _caseId,
      variant: _variant,
      binding: _binding,
      ...entry
    } = oldEntry;
    files.set(
      ARTIFACTS.legacy,
      JSON.stringify({
        ...oldLegacy,
        tests: [
          {
            ...entry,
            file: 'e2e/isolated/extra.spec.ts',
            key: legacyKey('isolated', {
              ...entry,
              file: 'e2e/isolated/extra.spec.ts',
            }),
          },
        ],
      }),
    );
    await expect(migrateSurfaceLedger(ROOT, BASE)).rejects.toThrow(
      '未登録test',
    );
    expect(writeArtifact).not.toHaveBeenCalled();
  });

  it('登録済みtestのfingerprint以外の変更を拒否する', async () => {
    await setLegacyState();
    const state = await collectStaticState(ROOT);
    vi.mocked(collectStaticState).mockResolvedValue({
      ...state,
      legacy: {
        ...nextLegacy,
        registered: [
          { ...oldEntry, fingerprint: 'b'.repeat(64), caseId: 'other' },
        ],
      },
    });
    await expect(migrateSurfaceLedger(ROOT, BASE)).rejects.toThrow('identity');
    expect(writeArtifact).not.toHaveBeenCalled();
  });

  it('再列挙でlegacy groupが増えた場合は拒否する', async () => {
    await setLegacyState();
    const state = await collectStaticState(ROOT);
    vi.mocked(collectStaticState).mockResolvedValue({
      ...state,
      legacy: {
        ...nextLegacy,
        groups: [
          {
            id: 'serial:changed',
            profile: 'isolated',
            project: 'chromium',
            file: oldEntry.file,
            reason: 'new suite',
            testKeys: [oldEntry.key],
          },
        ],
      },
    });
    await expect(migrateSurfaceLedger(ROOT, BASE)).rejects.toThrow(
      '未登録test',
    );
    expect(writeArtifact).not.toHaveBeenCalled();
  });

  it('登録済みfingerprintの第三の途中値を拒否する', async () => {
    await setLegacyState();
    files.set(
      ARTIFACTS.legacy,
      JSON.stringify({
        ...oldLegacy,
        registered: [{ ...oldEntry, fingerprint: 'c'.repeat(64) }],
      }),
    );
    await expect(migrateSurfaceLedger(ROOT, BASE)).rejects.toThrow('metadata');
    expect(writeArtifact).not.toHaveBeenCalled();
  });
});
