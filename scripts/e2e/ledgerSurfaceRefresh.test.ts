import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { serializeBaseline } from './baseline';
import { captureInputs } from './fingerprint';
import { assertGitCommit, resolveGitCommit } from './gitObjects';
import { captureGitSnapshot, readSnapshotFile } from './gitSnapshot';
import {
  projectInventoryV1,
  serializeInventory,
  serializeInventoryV1,
} from './inventory';
import { inventorySchema } from './inventorySchema';
import { parseArtifact, readArtifact, writeArtifact } from './ledgerArtifacts';
import { migrateSurfaceLedger, refreshLedger } from './ledgerRefresh';
import { buildSnapshotInventories } from './snapshotInventory';
import { ARTIFACTS, collectStaticState } from './staticGate';
import { SURFACE_ARTIFACTS } from './surfaceGate';
import {
  buildSurfaceMigrationRecord,
  serializeSurfacePending,
  surfaceMigrationDigest,
  surfacePendingDigest,
} from './surfaceMigration';
import {
  surfaceMigrationSchema,
  surfacePendingSchema,
} from './surfaceMigrationSchema';
import {
  buildSurfacePending,
  surfaceObservationDigest,
} from './surfacePending';
import { SURFACE_RULE_DIGEST } from './surfaceProjection';
import { readRevisionFile, readRevisionLedger } from './trustedRevision';
import { prepareVerificationDirectory } from './verificationContext';

import { createHash } from 'node:crypto';

import type { PendingBaseline } from './baseline';
import type { InputFingerprint } from './fingerprint';
import type { GitSnapshotCapture } from './gitSnapshot';
import type { StaticState } from './staticGate';

vi.mock('./fingerprint', async (original) => ({
  ...(await original<typeof import('./fingerprint')>()),
  captureInputs: vi.fn(),
}));
vi.mock('./gitObjects', async (original) => ({
  ...(await original<typeof import('./gitObjects')>()),
  assertGitCommit: vi.fn(),
  resolveGitCommit: vi.fn(),
}));
vi.mock('./gitSnapshot', async (original) => ({
  ...(await original<typeof import('./gitSnapshot')>()),
  captureGitSnapshot: vi.fn(),
  readSnapshotFile: vi.fn(),
}));
vi.mock('./ledgerArtifacts', async (original) => ({
  ...(await original<typeof import('./ledgerArtifacts')>()),
  readArtifact: vi.fn(),
  writeArtifact: vi.fn(),
}));
vi.mock('./snapshotInventory', () => ({ buildSnapshotInventories: vi.fn() }));
vi.mock('./staticGate', async (original) => ({
  ...(await original<typeof import('./staticGate')>()),
  collectStaticState: vi.fn(),
}));
vi.mock('./trustedRevision', async (original) => ({
  ...(await original<typeof import('./trustedRevision')>()),
  readRevisionFile: vi.fn(),
  readRevisionLedger: vi.fn(),
}));
vi.mock('./verificationContext', async (original) => ({
  ...(await original<typeof import('./verificationContext')>()),
  prepareVerificationDirectory: vi.fn(),
}));

const ROOT = '/ledger-writer-fixture';
const BASE = 'a'.repeat(40);
const HEAD = 'b'.repeat(40);
const BASE_REF = 'review/base';
const SOURCE = { file: 'src/app/page.tsx', line: 1, column: 1 };
const PAGE = 'page:src/app/page.tsx';
const DIGEST = 'a'.repeat(64);
const CORE_BASELINE: PendingBaseline = { schemaVersion: 1, items: [] };
const LEGACY = {
  schemaVersion: 1 as const,
  tests: [],
  registered: [],
  setups: [],
  groups: [],
};
const ARTIFACT_FILES = new Map<string, string>();
const HEAD_FILES = new Map<string, string>();
const BASE_FILES = new Map<string, string>();
const SAVED = new Map<string, string>();

const fingerprint = (
  files: InputFingerprint['files'] = [],
): InputFingerprint => ({
  schemaVersion: 1,
  algorithm: 'sha256',
  root: ROOT,
  rules: 'fixed-input-scope-v1-next16-template-v1',
  files,
  digest: createHash('sha256').update(JSON.stringify(files)).digest('hex'),
});

const makeState = (): StaticState => {
  const inventory = inventorySchema.parse({
    schemaVersion: 2,
    extractorVersion: '2',
    source: { fingerprint: DIGEST, files: [] },
    nodes: [{ id: PAGE, kind: 'page', source: SOURCE, slots: [] }],
    edges: [],
    diagnostics: [],
    surfaceAnalysis: {
      sites: [],
      bindings: [],
      storyReferences: [],
      diagnostics: [
        {
          code: 'SURFACE_UNRESOLVED_RENDER_VALUE',
          message: '未対応の描画fixture',
          source: SOURCE,
          anchor: { ownerId: PAGE, syntaxHash: DIGEST, occurrence: 0 },
          entry: { kind: 'product', id: PAGE },
          mountSiteIds: [],
        },
      ],
    },
  });
  return {
    inventory,
    baseline: CORE_BASELINE,
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
    surfacePending: buildSurfacePending(inventory, []),
  };
};

const capture: GitSnapshotCapture = {
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
};
let state: StaticState;
const migrated = () => {
  const pending = state.surfacePending;
  const observation = {
    pending,
    observationDigest: surfaceObservationDigest(state.inventory),
  };
  const migration = buildSurfaceMigrationRecord({
    observationBaseSha: BASE,
    ruleDigest: SURFACE_RULE_DIGEST,
    old: observation,
    current: observation,
  });
  return { pending, migration };
};
const setMigration = (files: Map<string, string>, pair = migrated()) => {
  files.set(SURFACE_ARTIFACTS.pending, serializeSurfacePending(pair.pending));
  files.set(SURFACE_ARTIFACTS.migration, JSON.stringify(pair.migration));
};
const expectNoWrites = () => {
  expect(writeArtifact).not.toHaveBeenCalled();
  expect(SAVED.size).toBe(0);
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('CI', '');
  vi.stubEnv('GITHUB_ACTIONS', '');
  state = makeState();
  for (const files of [ARTIFACT_FILES, HEAD_FILES, BASE_FILES, SAVED]) {
    files.clear();
    if (files !== SAVED) files.set(ARTIFACTS.legacy, JSON.stringify(LEGACY));
  }
  for (const files of [ARTIFACT_FILES, HEAD_FILES, BASE_FILES])
    files.set(ARTIFACTS.baseline, serializeBaseline(CORE_BASELINE));
  ARTIFACT_FILES.set(
    ARTIFACTS.migrations,
    JSON.stringify({ schemaVersion: 1, entries: [] }),
  );
  BASE_FILES.set(
    ARTIFACTS.inventory,
    serializeInventoryV1(projectInventoryV1(state.inventory)),
  );
  vi.mocked(readArtifact).mockImplementation((_root, path) =>
    ARTIFACT_FILES.get(path),
  );
  vi.mocked(writeArtifact).mockImplementation((_root, path, value) => {
    SAVED.set(path, value);
  });
  vi.mocked(readRevisionFile).mockImplementation((_root, ref, path) =>
    (ref === BASE ? BASE_FILES : ref === HEAD ? HEAD_FILES : undefined)?.get(
      path,
    ),
  );
  vi.mocked(resolveGitCommit).mockImplementation((_root, ref) => {
    if (ref === BASE_REF) return BASE;
    if (ref === 'HEAD') return HEAD;
    throw new Error('fixtureの比較元が固定されていません。');
  });
  vi.mocked(assertGitCommit).mockImplementation((_root, sha) => sha);
  vi.mocked(readRevisionLedger).mockResolvedValue(state.ledger);
  vi.mocked(captureInputs).mockResolvedValue(fingerprint());
  vi.mocked(captureGitSnapshot).mockReturnValue(capture);
  vi.mocked(readSnapshotFile).mockImplementation((_capture, revision, path) => {
    const value = revision === 'working' ? ARTIFACT_FILES.get(path) : undefined;
    return value === undefined ? undefined : Buffer.from(value);
  });
  vi.mocked(prepareVerificationDirectory).mockReturnValue(
    `${ROOT}/verification-fixture`,
  );
  vi.mocked(collectStaticState).mockResolvedValue(state);
  const inventory = state.inventory;
  vi.mocked(buildSnapshotInventories).mockReturnValue({
    base: inventory,
    head: inventory,
    index: inventory,
    working: inventory,
  });
});

afterEach(() => vi.unstubAllEnvs());

describe('UI台帳の専用移行writer', () => {
  it('refとHEADを固定し、検査したinventory・不足・履歴のtupleだけを保存する', async () => {
    const result = await migrateSurfaceLedger(ROOT, BASE_REF);
    expect(resolveGitCommit).toHaveBeenNthCalledWith(1, ROOT, BASE_REF);
    expect(resolveGitCommit).toHaveBeenNthCalledWith(2, ROOT, 'HEAD');
    expect(captureGitSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        base: BASE,
        expectedHead: HEAD,
        mode: 'local',
      }),
    );
    expect([...SAVED.keys()]).toEqual([
      ARTIFACTS.inventory,
      SURFACE_ARTIFACTS.pending,
      SURFACE_ARTIFACTS.migration,
    ]);
    const parseSaved = (path: string) => parseArtifact(SAVED.get(path), path);
    expect(inventorySchema.parse(parseSaved(ARTIFACTS.inventory))).toEqual(
      state.inventory,
    );
    const pending = surfacePendingSchema.parse(
      parseSaved(SURFACE_ARTIFACTS.pending),
    );
    const migration = surfaceMigrationSchema.parse(
      parseSaved(SURFACE_ARTIFACTS.migration),
    );
    expect({ pending, migration }).toEqual(migrated());
    expect(result).toMatchObject({
      mode: 'migrate-surface',
      reviewRequired: true,
      observationBaseSha: BASE,
      surfaceMigrationSnapshotDigest: capture.snapshot.digest,
      surfacePendingDigest: surfacePendingDigest(pending),
      surfaceMigrationDigest: surfaceMigrationDigest(migration),
    });
  });

  it('旧v1のcore投影が一致しない場合はcandidateを保存しない', async () => {
    const old = projectInventoryV1(state.inventory);
    BASE_FILES.set(
      ARTIFACTS.inventory,
      serializeInventoryV1({
        ...old,
        source: { ...old.source, fingerprint: '0'.repeat(64) },
      }),
    );
    await expect(migrateSurfaceLedger(ROOT, BASE_REF)).rejects.toThrow(
      '再観測のcore',
    );
    expectNoWrites();
  });

  it('観測されたcore不足と保存済みbaselineが不一致ならcandidateを保存しない', async () => {
    vi.mocked(collectStaticState).mockResolvedValueOnce({
      ...state,
      baseline: {
        schemaVersion: 1,
        items: [
          {
            category: 'source-diagnostic',
            code: 'UNRESOLVED_CALL',
            anchor: { ownerId: PAGE, syntaxHash: DIGEST, occurrence: 0 },
          },
        ],
      },
    });
    await expect(migrateSurfaceLedger(ROOT, BASE_REF)).rejects.toThrow(
      'MISSING_BASELINE_ITEM',
    );
    expectNoWrites();
  });

  it('旧観測にない新しいUI不足はcandidateにできない', async () => {
    const inventory = structuredClone(state.inventory);
    inventory.surfaceAnalysis.diagnostics.push({
      code: 'SURFACE_NEW_UNKNOWN',
      source: SOURCE,
      message: '新規不足fixture',
      anchor: { ownerId: PAGE, syntaxHash: '0'.repeat(64), occurrence: 0 },
      entry: { kind: 'product', id: PAGE },
      mountSiteIds: [],
    });
    vi.mocked(collectStaticState).mockResolvedValueOnce({
      ...state,
      inventory,
      surfacePending: buildSurfacePending(inventory, []),
    });
    vi.mocked(buildSnapshotInventories).mockReturnValueOnce({
      base: state.inventory,
      head: state.inventory,
      index: state.inventory,
      working: inventory,
    });
    await expect(migrateSurfaceLedger(ROOT, BASE_REF)).rejects.toThrow(
      '存在しないUI不足',
    );
    expectNoWrites();
  });

  it('候補生成中に入力が変わればcandidateを保存しない', async () => {
    vi.mocked(buildSnapshotInventories).mockImplementationOnce(() => {
      vi.mocked(captureInputs).mockResolvedValue(
        fingerprint([
          { path: 'e2e/changed.spec.ts', kind: 'raw', size: 1, sha256: DIGEST },
        ]),
      );
      const inventory = state.inventory;
      return {
        base: inventory,
        head: inventory,
        index: inventory,
        working: inventory,
      };
    });
    await expect(migrateSurfaceLedger(ROOT, BASE_REF)).rejects.toThrow(
      '固定入力が変化',
    );
    expectNoWrites();
  });

  it('既に移行履歴のある比較元を使って初期化を繰り返さない', async () => {
    setMigration(BASE_FILES);
    await expect(migrateSurfaceLedger(ROOT, BASE_REF)).rejects.toThrow(
      '既に記録',
    );
    expectNoWrites();
  });

  it('古いv1を指定してもHEADの確定済み移行を上書きしない', async () => {
    setMigration(HEAD_FILES);
    await expect(migrateSurfaceLedger(ROOT, BASE_REF)).rejects.toThrow(
      '固定HEAD',
    );
    expect(collectStaticState).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it('同一の未commit候補は再利用し、別の候補を自動で上書きしない', async () => {
    setMigration(ARTIFACT_FILES);
    ARTIFACT_FILES.set(
      ARTIFACTS.inventory,
      serializeInventory(state.inventory),
    );
    await expect(migrateSurfaceLedger(ROOT, BASE_REF)).resolves.toMatchObject({
      mode: 'migrate-surface',
      reviewRequired: true,
    });
    expectNoWrites();
    ARTIFACT_FILES.set(ARTIFACTS.inventory, '別のinventory');
    await expect(migrateSurfaceLedger(ROOT, BASE_REF)).rejects.toThrow(
      '固定観測',
    );
    expectNoWrites();
    ARTIFACT_FILES.delete(SURFACE_ARTIFACTS.pending);
    await expect(migrateSurfaceLedger(ROOT, BASE_REF)).rejects.toThrow(
      '固定観測',
    );
    expectNoWrites();
  });

  it('最初の静的収集から候補観測までに入力が変わっても保存しない', async () => {
    vi.mocked(collectStaticState).mockImplementationOnce(async () => {
      vi.mocked(captureInputs).mockResolvedValue(
        fingerprint([
          { path: 'e2e/changed.spec.ts', kind: 'raw', size: 1, sha256: DIGEST },
        ]),
      );
      return state;
    });
    await expect(migrateSurfaceLedger(ROOT, BASE_REF)).rejects.toThrow(
      '固定入力が変化',
    );
    expectNoWrites();
  });
});

describe('通常更新の保存境界', () => {
  it('UI移行履歴がなければ通常更新で初期化しない', async () => {
    await expect(refreshLedger(ROOT, 'update')).rejects.toThrow(
      /surface|UI移行/u,
    );
    expectNoWrites();
  });

  it('workingに有効なtupleを置いても固定履歴がなければ通常更新しない', async () => {
    setMigration(ARTIFACT_FILES);
    await expect(refreshLedger(ROOT, 'update')).rejects.toThrow(
      /surface|UI移行/u,
    );
    expectNoWrites();
  });

  it('固定移行後は解消した不足だけを更新し、履歴を上書きしない', async () => {
    setMigration(HEAD_FILES);
    setMigration(ARTIFACT_FILES);
    const pending = { schemaVersion: 1 as const, items: [] };
    vi.mocked(collectStaticState).mockResolvedValueOnce({
      ...state,
      surfacePending: pending,
    });
    await expect(refreshLedger(ROOT, 'update')).resolves.toMatchObject({
      mode: 'update',
    });
    expect(SAVED.get(SURFACE_ARTIFACTS.pending)).toBe(
      serializeSurfacePending(pending),
    );
    expect(SAVED.has(SURFACE_ARTIFACTS.migration)).toBe(false);
  });

  it('固定HEADで解消済みの不足をworkingの古い候補で再追加できない', async () => {
    setMigration(HEAD_FILES, {
      ...migrated(),
      pending: { schemaVersion: 1, items: [] },
    });
    setMigration(ARTIFACT_FILES);
    await expect(refreshLedger(ROOT, 'update')).rejects.toThrow(
      '存在しないUI不足',
    );
    expectNoWrites();
  });

  it('通常更新の静的検査中にGit snapshotが変われば保存しない', async () => {
    setMigration(HEAD_FILES);
    setMigration(ARTIFACT_FILES);
    vi.mocked(captureGitSnapshot)
      .mockReturnValueOnce(capture)
      .mockReturnValueOnce({
        snapshot: { ...capture.snapshot, digest: '0'.repeat(64) },
      });
    await expect(refreshLedger(ROOT, 'update')).rejects.toThrow(
      '固定入力が変化',
    );
    expectNoWrites();
  });

  it('v1専用の旧bootstrapからv2を初期化しない', async () => {
    ARTIFACT_FILES.delete(ARTIFACTS.baseline);
    await expect(refreshLedger(ROOT, 'bootstrap')).rejects.toThrow('v1専用');
    expect(collectStaticState).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it.each([
    'CI',
    'GITHUB_ACTIONS',
  ] as const)('%sではwriterが候補検査と保存へ進まない', async (key) => {
    vi.stubEnv(key, 'true');
    await expect(migrateSurfaceLedger(ROOT, BASE_REF)).rejects.toThrow(/CI/u);
    await expect(refreshLedger(ROOT, 'update')).rejects.toThrow(/CI/u);
    await expect(refreshLedger(ROOT, 'bootstrap')).rejects.toThrow(/CI/u);
    expect(collectStaticState).not.toHaveBeenCalled();
    expectNoWrites();
  });
});
