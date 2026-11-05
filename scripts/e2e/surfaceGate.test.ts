import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readSnapshotFile } from './gitSnapshot';
import { gitSnapshotSchema } from './gitSnapshotSchema';
import { inventorySchema } from './inventorySchema';
import { readArtifact } from './ledgerArtifacts';
import {
  checkSurfaceState,
  prepareSurfaceMigration,
  SURFACE_ARTIFACTS,
} from './surfaceGate';
import {
  captureSurfaceMigrationInventories,
  resolveSurfaceMigrationOrigin,
} from './surfaceMigrationObservation';
import { buildSurfacePending } from './surfacePending';
import { readRevisionFile } from './trustedRevision';

import type { Ledger } from '../../e2e/ledger/schema';
import type { PendingBaseline } from './baseline';
import type { SavedSurfaceState } from './surfaceMigration';

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
const save = (saved: SavedSurfaceState, files: Map<string, string>) => {
  files.set(SURFACE_ARTIFACTS.pending, JSON.stringify(saved.pending));
  files.set(SURFACE_ARTIFACTS.migration, JSON.stringify(saved.migration));
};

beforeEach(() => {
  vi.resetAllMocks();
  fixedArtifacts.clear();
  workingArtifacts.clear();
  historicalArtifacts.clear();
  fixedArtifacts.set(artifacts.baseline, JSON.stringify(baseline));
  vi.mocked(readRevisionFile).mockImplementation((_root, _revision, path) =>
    historicalArtifacts.get(path),
  );
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
