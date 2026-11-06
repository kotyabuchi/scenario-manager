import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assertGitCommit, gitRead } from './gitObjects';
import { readSnapshotFile } from './gitSnapshot';
import { gitSnapshotSchema } from './gitSnapshotSchema';
import { inventorySchema } from './inventorySchema';
import { readArtifact } from './ledgerArtifacts';
import { baselineDigest } from './staticGate';
import {
  checkSurfaceState,
  prepareSurfaceMigration,
  SURFACE_ARTIFACTS,
} from './surfaceGate';
import {
  surfaceMigrationDigest,
  surfacePendingDigest,
} from './surfaceMigration';
import {
  SURFACE_MIGRATION_INTRODUCTION,
  SURFACE_MIGRATION_V1_ORIGIN,
} from './surfaceMigrationHistory';
import {
  captureSurfaceMigrationInventories,
  resolveSurfaceMigrationOrigin,
} from './surfaceMigrationObservation';
import { replaySurfaceMigration } from './surfaceMigrationReplay';
import { buildSurfacePending } from './surfacePending';
import { readRevisionFile } from './trustedRevision';

import type { Ledger } from '../../e2e/ledger/schema';
import type { PendingBaseline } from './baseline';
import type { SavedSurfaceState } from './surfaceMigration';
import type { SurfaceMigrationHistoryProof } from './surfaceMigrationHistory';

vi.mock('./gitObjects', async (original) => ({
  ...(await original<typeof import('./gitObjects')>()),
  assertGitCommit: vi.fn(),
  gitRead: vi.fn(),
}));
vi.mock('./gitSnapshot', async (original) => ({
  ...(await original<typeof import('./gitSnapshot')>()),
  readSnapshotFile: vi.fn(),
}));
vi.mock('./ledgerArtifacts', async (original) => ({
  ...(await original<typeof import('./ledgerArtifacts')>()),
  readArtifact: vi.fn(),
}));
vi.mock('./surfaceMigrationObservation', () => ({
  captureSurfaceMigrationInventories: vi.fn(),
  resolveSurfaceMigrationOrigin: vi.fn(),
}));
vi.mock('./surfaceMigrationReplay', () => ({
  replaySurfaceMigration: vi.fn(),
}));
vi.mock('./trustedRevision', async (original) => ({
  ...(await original<typeof import('./trustedRevision')>()),
  readRevisionFile: vi.fn(),
}));

const base = 'a'.repeat(40);
const head = 'b'.repeat(40);
const digest = 'a'.repeat(64);
const root = '/fixture';
const revisions = { base, head };
const artifacts = {
  inventory: 'e2e/ledger/inventory.generated.json',
  baseline: 'e2e/ledger/pending-baseline.json',
  legacy: 'e2e/ledger/legacy-tests.generated.json',
};
const source = { file: 'src/app/page.tsx', line: 1, column: 1 };
const inventory = inventorySchema.parse({
  schemaVersion: 2,
  extractorVersion: '2',
  source: { fingerprint: digest, files: [] },
  nodes: [{ id: 'page:src/app/page.tsx', kind: 'page', source, slots: [] }],
  edges: [],
  diagnostics: [],
  surfaceAnalysis: {
    sites: [],
    bindings: [],
    storyReferences: [],
    diagnostics: [
      {
        code: 'UNRESOLVED_SURFACE_RENDER',
        message: '未知の描画',
        source,
        anchor: {
          ownerId: 'page:src/app/page.tsx',
          syntaxHash: digest,
          occurrence: 0,
        },
        entry: { kind: 'product', id: 'page:src/app/page.tsx' },
        mountSiteIds: [],
      },
    ],
  },
});
const baseline: PendingBaseline = { schemaVersion: 1, items: [] };
const ledger: Ledger = {
  schemaVersion: 1,
  profiles: [],
  fixtures: [],
  contracts: [],
  scenarios: [],
  executionGroups: [],
  exceptions: [],
};
const origin = {
  kind: 'static-base' as const,
  staticBaseSha: base,
  observationBaseSha: base,
};
const capture = {
  snapshot: gitSnapshotSchema.parse({
    schemaVersion: 1,
    mode: 'local',
    base,
    head,
    digest,
    objectFormat: 'sha1',
    indexEntries: [],
    changedPaths: [],
    workingFiles: [],
    reasons: [],
  }),
};
const observed = {
  old: inventory,
  current: inventory,
  oldLedger: ledger,
  oldCoreBaseline: baseline,
  capture,
  snapshotDigest: digest,
};
const input = {
  root,
  revisions,
  artifacts,
  directory: '/fixture/panda',
  state: {
    inventory,
    ledger,
    baseline,
    surfacePending: buildSurfacePending(inventory, []),
  },
};
const fixedArtifacts = new Map<string, string>();
const workingArtifacts = new Map<string, string>();
const historicalArtifacts = new Map<string, string>();
const introducedArtifacts = new Map<string, string>();
const save = (saved: SavedSurfaceState, files: Map<string, string>) => {
  files.set(SURFACE_ARTIFACTS.pending, JSON.stringify(saved.pending));
  files.set(SURFACE_ARTIFACTS.migration, JSON.stringify(saved.migration));
};

beforeEach(() => {
  vi.resetAllMocks();
  fixedArtifacts.clear();
  workingArtifacts.clear();
  historicalArtifacts.clear();
  introducedArtifacts.clear();
  fixedArtifacts.set(artifacts.baseline, JSON.stringify(baseline));
  vi.mocked(readRevisionFile).mockImplementation((_root, revision, path) =>
    (revision === SURFACE_MIGRATION_INTRODUCTION
      ? introducedArtifacts
      : historicalArtifacts
    ).get(path),
  );
  vi.mocked(assertGitCommit).mockImplementation((_root, revision) => revision);
  vi.mocked(gitRead).mockReturnValue(Buffer.alloc(0));
  vi.mocked(readArtifact).mockImplementation((_root, path) =>
    workingArtifacts.get(path),
  );
  vi.mocked(readSnapshotFile).mockImplementation(
    (_capture, _revision, path) => {
      const contents = fixedArtifacts.get(path);
      return contents === undefined ? undefined : Buffer.from(contents);
    },
  );
  vi.mocked(resolveSurfaceMigrationOrigin).mockReturnValue(origin);
  vi.mocked(captureSurfaceMigrationInventories).mockResolvedValue(observed);
});

describe('UI初期移行の静的接続', () => {
  it('候補作成と検査が同じ固定観測を使い、検査はsnapshot内の保存物を読む', async () => {
    const saved = await prepareSurfaceMigration(input);
    save(saved, fixedArtifacts);
    workingArtifacts.set(SURFACE_ARTIFACTS.migration, '古いworking artifact');
    await expect(checkSurfaceState(input)).resolves.toEqual(saved.receipt);
    expect(saved.receipt).toMatchObject({
      surfaceMigrationOrigin: origin,
      observationBaseSha: base,
      surfaceMigrationSnapshotDigest: digest,
    });
    expect(readArtifact).not.toHaveBeenCalled();
  });

  it('保存UI不足・記録・core baselineをsnapshotから省略できない', async () => {
    const saved = await prepareSurfaceMigration(input);
    save(saved, fixedArtifacts);
    fixedArtifacts.delete(SURFACE_ARTIFACTS.pending);
    await expect(checkSurfaceState(input)).rejects.toThrow(
      SURFACE_ARTIFACTS.pending,
    );
    save(saved, fixedArtifacts);
    fixedArtifacts.delete(SURFACE_ARTIFACTS.migration);
    await expect(checkSurfaceState(input)).rejects.toThrow(
      SURFACE_ARTIFACTS.migration,
    );
    fixedArtifacts.delete(artifacts.baseline);
    await expect(prepareSurfaceMigration(input)).rejects.toThrow(
      artifacts.baseline,
    );
  });

  it('UI観測が同じでも現在のcore sourceが違えば候補を作らない', async () => {
    vi.mocked(captureSurfaceMigrationInventories).mockResolvedValueOnce({
      ...observed,
      current: {
        ...inventory,
        source: { ...inventory.source, fingerprint: '0'.repeat(64) },
      },
    });
    await expect(prepareSurfaceMigration(input)).rejects.toThrow(
      '固定inventory',
    );
  });

  it('現在のcore不足を保存から外しても、旧不足を超えても拒否する', async () => {
    const currentBaseline: PendingBaseline = {
      schemaVersion: 1,
      items: [
        {
          category: 'source-diagnostic',
          code: 'UNRESOLVED_CALL',
          anchor: {
            ownerId: 'page:src/app/page.tsx',
            syntaxHash: digest,
            occurrence: 0,
          },
        },
      ],
    };
    const changed = {
      ...input,
      state: { ...input.state, baseline: currentBaseline },
    };
    await expect(prepareSurfaceMigration(changed)).rejects.toThrow(
      'MISSING_BASELINE_ITEM',
    );
    fixedArtifacts.set(artifacts.baseline, JSON.stringify(currentBaseline));
    await expect(prepareSurfaceMigration(changed)).rejects.toThrow(
      'NEW_PENDING_ITEM',
    );
  });
});

describe('承認済みUI初期移行の履歴再生', () => {
  const historical = async () => {
    const saved = await prepareSurfaceMigration(input);
    const migration = {
      ...saved.migration,
      observationBaseSha: SURFACE_MIGRATION_V1_ORIGIN,
      newObservationDigest: '0'.repeat(64),
    };
    const pending = { schemaVersion: 1 as const, items: [] };
    save({ pending: saved.pending, migration }, introducedArtifacts);
    save({ pending, migration }, workingArtifacts);
    for (const files of [
      historicalArtifacts,
      introducedArtifacts,
      workingArtifacts,
    ])
      files.set(artifacts.baseline, JSON.stringify(baseline));
    const proof: SurfaceMigrationHistoryProof = {
      schemaVersion: 1,
      observationBaseSha: SURFACE_MIGRATION_V1_ORIGIN,
      introductionSha: SURFACE_MIGRATION_INTRODUCTION,
      snapshotDigest: digest,
      baselineDigest: baselineDigest(baseline),
      surfaceMigrationDigest: surfaceMigrationDigest(migration),
      surfacePendingDigest: surfacePendingDigest(saved.pending),
    };
    vi.mocked(resolveSurfaceMigrationOrigin).mockReturnValue({
      kind: 'approved-bootstrap-origin',
      staticBaseSha: base,
      observationBaseSha: SURFACE_MIGRATION_V1_ORIGIN,
    });
    vi.mocked(captureSurfaceMigrationInventories).mockClear();
    vi.mocked(replaySurfaceMigration).mockResolvedValue(proof);
    return {
      changed: { ...input, state: { ...input.state, surfacePending: pending } },
      proof,
    };
  };

  it('導入時からの不足退役を許可し、現行依存で旧UIを観測しない', async () => {
    const { changed, proof } = await historical();
    const signal = new AbortController().signal;
    await expect(
      checkSurfaceState({ ...changed, signal }),
    ).resolves.toMatchObject({
      surfaceMigrationSnapshotDigest: null,
      surfaceMigrationHistory: proof,
      surfacePendingDigest: surfacePendingDigest(changed.state.surfacePending),
    });
    expect(replaySurfaceMigration).toHaveBeenCalledExactlyOnceWith({
      root,
      directory: input.directory,
      signal,
    });
    expect(captureSurfaceMigrationInventories).not.toHaveBeenCalled();
  });

  it('外部承認または固定導入祖先がなければ再生しない', async () => {
    const { changed } = await historical();
    vi.mocked(resolveSurfaceMigrationOrigin).mockImplementationOnce(() => {
      throw new Error('外部承認なし');
    });
    await expect(checkSurfaceState(changed)).rejects.toThrow('外部承認なし');
    vi.mocked(gitRead).mockImplementationOnce(() => {
      throw new Error('祖先なし');
    });
    await expect(checkSurfaceState(changed)).rejects.toThrow('祖先なし');
    expect(replaySurfaceMigration).not.toHaveBeenCalled();
  });

  it('現行保存物の改変または再生のdigest不一致を拒否する', async () => {
    const { changed, proof } = await historical();
    await expect(checkSurfaceState(input)).rejects.toThrow('保存');
    expect(replaySurfaceMigration).not.toHaveBeenCalled();
    vi.mocked(replaySurfaceMigration).mockResolvedValueOnce({
      ...proof,
      baselineDigest: '0'.repeat(64),
    });
    await expect(checkSurfaceState(changed)).rejects.toThrow('固定導入');
  });
});

describe('UI移行後の静的接続', () => {
  it('通常更新は初回再観測をせず、履歴と現在不足を照合する', async () => {
    const saved = await prepareSurfaceMigration(input);
    save(saved, historicalArtifacts);
    historicalArtifacts.set(artifacts.inventory, JSON.stringify(inventory));
    const resolved = { schemaVersion: 1 as const, items: [] };
    save({ ...saved, pending: resolved }, workingArtifacts);
    vi.mocked(captureSurfaceMigrationInventories).mockClear();
    const changed = {
      ...input,
      state: { ...input.state, surfacePending: resolved },
    };
    await expect(checkSurfaceState(changed)).resolves.toMatchObject({
      observationBaseSha: base,
      surfaceMigrationOrigin: null,
      surfaceMigrationSnapshotDigest: null,
    });
    expect(captureSurfaceMigrationInventories).not.toHaveBeenCalled();
    await expect(prepareSurfaceMigration(changed)).rejects.toThrow('既に記録');
    save({ ...saved, pending: resolved }, historicalArtifacts);
    save(saved, workingArtifacts);
    await expect(checkSurfaceState(input)).rejects.toThrow('存在しないUI不足');
  });

  it('base側の移行記録が欠けるか固定規則が変われば初回として再作成しない', async () => {
    const saved = await prepareSurfaceMigration(input);
    save(saved, historicalArtifacts);
    save(saved, workingArtifacts);
    historicalArtifacts.set(artifacts.inventory, JSON.stringify(inventory));
    historicalArtifacts.delete(SURFACE_ARTIFACTS.migration);
    await expect(checkSurfaceState(input)).rejects.toThrow(
      SURFACE_ARTIFACTS.migration,
    );
    save(
      {
        ...saved,
        migration: { ...saved.migration, ruleDigest: '0'.repeat(64) },
      },
      historicalArtifacts,
    );
    await expect(checkSurfaceState(input)).rejects.toThrow('必須化の規則');
  });
});
