import { beforeEach, describe, expect, it, vi } from 'vitest';

import { baselineSchema } from './baseline';
import { captureInputs } from './fingerprint';
import { createLedgerFixture } from './fixtures/ledger';
import { assertGitCommit, gitRead } from './gitObjects';
import { captureGitSnapshot } from './gitSnapshot';
import { inventorySchema, inventoryV1Schema } from './inventorySchema';
import { provePandaOutputs } from './pandaProvenance';
import { buildSnapshotInventories } from './snapshotInventory';
import {
  captureSurfaceMigrationInventories,
  resolveSurfaceMigrationOrigin,
  SURFACE_MIGRATION_V1_ORIGIN,
} from './surfaceMigrationObservation';
import { readRevisionFile, readRevisionLedger } from './trustedRevision';

import { createHash } from 'node:crypto';

vi.mock('./fingerprint', async (original) => ({
  ...(await original<typeof import('./fingerprint')>()),
  captureInputs: vi.fn(),
}));
vi.mock('./gitObjects', async (original) => ({
  ...(await original<typeof import('./gitObjects')>()),
  assertGitCommit: vi.fn(),
  gitRead: vi.fn(),
}));
vi.mock('./gitSnapshot', async (original) => ({
  ...(await original<typeof import('./gitSnapshot')>()),
  captureGitSnapshot: vi.fn(),
}));
vi.mock('./pandaProvenance', () => ({ provePandaOutputs: vi.fn() }));
vi.mock('./snapshotInventory', () => ({ buildSnapshotInventories: vi.fn() }));
vi.mock('./trustedRevision', async (original) => ({
  ...(await original<typeof import('./trustedRevision')>()),
  readRevisionFile: vi.fn(),
  readRevisionLedger: vi.fn(),
}));

const sha = 'a'.repeat(40);
const head = 'b'.repeat(40);
const digest = 'a'.repeat(64);
const root = '/fixture';
const revisions = { base: sha, head };
const artifacts = {
  inventory: 'e2e/ledger/inventory.generated.json',
  baseline: 'e2e/ledger/pending-baseline.json',
  legacy: 'e2e/ledger/legacy-tests.generated.json',
};
const originInput = { root, revisions, artifacts, coreBaselineDigest: digest };
const prRevisions = {
  ...revisions,
  eventPolicy: {
    schemaVersion: 1,
    event: 'pull_request',
    repository: 'example/repo',
    eventRef: 'refs/pull/42/merge',
    head,
    staticBase: { kind: 'comparison', sha },
    impactBase: 'c'.repeat(40),
    execution: 'changed-plus-smoke',
  },
} as const;
const inventory = inventoryV1Schema.parse({
  schemaVersion: 1,
  extractorVersion: '1',
  source: { fingerprint: digest, files: [] },
  nodes: [],
  edges: [],
  diagnostics: [],
});
const current = inventorySchema.parse({
  ...inventory,
  schemaVersion: 2,
  extractorVersion: '2',
  surfaceAnalysis: {
    sites: [],
    bindings: [],
    diagnostics: [],
    storyReferences: [],
  },
});
const baseline = baselineSchema.parse({ schemaVersion: 1, items: [] });
const legacy = {
  schemaVersion: 1,
  tests: [],
  setups: [],
  groups: [],
  registered: [],
};
const files = [
  {
    path: 'styled-system/index.mjs',
    kind: 'raw' as const,
    size: 1,
    sha256: digest,
  },
];
const inputs = {
  schemaVersion: 1 as const,
  algorithm: 'sha256' as const,
  root,
  rules: 'fixed-input-scope-v1-next16-template-v1' as const,
  files,
  digest: createHash('sha256').update(JSON.stringify(files)).digest('hex'),
};
const snapshot = {
  schemaVersion: 1 as const,
  mode: 'ci' as const,
  objectFormat: 'sha1' as const,
  base: sha,
  head,
  eventBase: sha,
  digest,
  indexEntries: [],
  changedPaths: [],
  workingFiles: [],
  reasons: [
    {
      code: 'UNVERSIONED_RUNTIME_INPUT' as const,
      paths: [files[0]?.path ?? ''],
    },
  ],
};
const proven = {
  schemaVersion: 1 as const,
  status: 'proven' as const,
  reason: 'REPLAY_MATCHED' as const,
  snapshotDigest: digest,
  inputDigest: inputs.digest,
  generatorDigest: digest,
  outputDigest: digest,
  paths: ['styled-system/index.mjs'],
  toolchain: {
    panda: '1.8.1' as const,
    node: '',
    platform: '',
    arch: '',
    installedLockDigest: digest,
    cliDigest: digest,
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(assertGitCommit).mockImplementation((_root, revision) => revision);
  vi.mocked(readRevisionFile).mockImplementation((_root, _revision, path) => {
    if (path === artifacts.inventory) return JSON.stringify(inventory);
    if (path === artifacts.baseline) return JSON.stringify(baseline);
    if (path === artifacts.legacy) return JSON.stringify(legacy);
    return undefined;
  });
  vi.mocked(readRevisionLedger).mockResolvedValue(createLedgerFixture());
  vi.mocked(captureInputs).mockResolvedValue(inputs);
  vi.mocked(captureGitSnapshot).mockReturnValue({ snapshot });
  vi.mocked(provePandaOutputs).mockResolvedValue(proven);
  vi.mocked(buildSnapshotInventories).mockReturnValue({
    base: current,
    head: current,
    index: current,
    working: current,
  });
});

describe('初期移行の固定観測元', () => {
  it('通常は影響比較のmerge-baseを使わず静的baseを観測する', () => {
    expect(
      resolveSurfaceMigrationOrigin({ ...originInput, revisions: prRevisions }),
    ).toEqual({
      kind: 'static-base',
      staticBaseSha: sha,
      observationBaseSha: sha,
    });
    expect(gitRead).not.toHaveBeenCalled();
  });

  it('初回PRは正確な既存承認と固定祖先を要求する', () => {
    vi.mocked(readRevisionFile).mockReturnValue(undefined);
    const input = { ...originInput, revisions: prRevisions };
    expect(() => resolveSurfaceMigrationOrigin(input)).toThrow('外部承認');
    expect(() =>
      resolveSurfaceMigrationOrigin({
        ...input,
        bootstrapApproval: JSON.stringify({
          base: sha,
          head,
          digest: '0'.repeat(64),
        }),
      }),
    ).toThrow('一致');
    const approved = {
      ...input,
      bootstrapApproval: JSON.stringify({ base: sha, head, digest }),
    };
    expect(resolveSurfaceMigrationOrigin(approved)).toEqual({
      kind: 'approved-bootstrap-origin',
      staticBaseSha: sha,
      observationBaseSha: SURFACE_MIGRATION_V1_ORIGIN,
    });
    expect(gitRead).toHaveBeenCalledExactlyOnceWith(root, [
      'merge-base',
      '--is-ancestor',
      SURFACE_MIGRATION_V1_ORIGIN,
      head,
    ]);
    vi.mocked(gitRead).mockImplementationOnce(() => {
      throw new Error('祖先なし');
    });
    expect(() => resolveSurfaceMigrationOrigin(approved)).toThrow('祖先なし');
  });

  it('初回pushではPR承認を流用せず実在するbeforeのpush承認を要求する', () => {
    vi.mocked(readRevisionFile).mockReturnValue(undefined);
    const input = {
      ...originInput,
      revisions: {
        ...revisions,
        eventPolicy: {
          ...prRevisions.eventPolicy,
          event: 'push',
          eventRef: 'refs/heads/main',
          impactBase: null,
          execution: 'full-required',
        },
      },
    } as const;
    expect(() =>
      resolveSurfaceMigrationOrigin({
        ...input,
        bootstrapApproval: JSON.stringify({ base: sha, head, digest }),
      }),
    ).toThrow('外部承認');
    expect(
      resolveSurfaceMigrationOrigin({
        ...input,
        bootstrapApproval: JSON.stringify({
          event: 'push',
          repository: 'example/repo',
          ref: 'refs/heads/main',
          before: sha,
          head,
          baselineDigest: digest,
        }),
      }).observationBaseSha,
    ).toBe(SURFACE_MIGRATION_V1_ORIGIN);
  });

  it('静的成果物が一部だけある場合は固定祖先へ戻らない', () => {
    vi.mocked(readRevisionFile).mockImplementation((_root, _revision, path) =>
      path === artifacts.legacy ? JSON.stringify(legacy) : undefined,
    );
    expect(() =>
      resolveSurfaceMigrationOrigin({
        ...originInput,
        revisions: prRevisions,
        bootstrapApproval: JSON.stringify({ base: sha, head, digest }),
      }),
    ).toThrow('部分欠落');
    expect(gitRead).not.toHaveBeenCalled();
  });
});

describe('初期移行の固定VFS', () => {
  const observe = () =>
    captureSurfaceMigrationInventories({
      root,
      artifacts,
      revisions: prRevisions,
      directory: '/fixture/panda',
      origin: resolveSurfaceMigrationOrigin({
        ...originInput,
        revisions: prRevisions,
      }),
    });

  it('証明した生成物だけをVFSへ渡し、旧版とのcore一致を確認する', async () => {
    await expect(observe()).resolves.toMatchObject({
      old: current,
      current,
      oldCoreBaseline: baseline,
      snapshotDigest: digest,
    });
    expect(captureGitSnapshot).toHaveBeenCalledWith({
      root,
      base: sha,
      expectedHead: head,
      eventBase: sha,
      mode: 'ci',
      runtimeInputPaths: ['styled-system/index.mjs'],
    });
    expect(buildSnapshotInventories).toHaveBeenCalledExactlyOnceWith(
      { snapshot },
      ['styled-system/index.mjs'],
    );
  });

  it('旧版にsurface例外がある場合は観測を開始しない', async () => {
    const oldLedger = createLedgerFixture();
    const deficiency = {
      target: `surface:${digest}`,
      aspect: 'contract' as const,
      layer: null,
      caseId: null,
      variant: null,
      actorBindings: null,
      profile: null,
      project: null,
      runtime: null,
    };
    oldLedger.exceptions.push({
      id: 'fixture',
      deficiency,
      reason: 'fixture',
      tracker: 'fixture',
      reviewCondition: 'fixture',
    });
    vi.mocked(readRevisionLedger).mockResolvedValueOnce(oldLedger);
    await expect(observe()).rejects.toThrow('旧v1台帳');
    expect(provePandaOutputs).not.toHaveBeenCalled();
  });

  it('Panda由来の不成立、core不一致、snapshot変動を拒否する', async () => {
    vi.mocked(provePandaOutputs).mockResolvedValueOnce({
      ...proven,
      status: 'unproven',
    });
    await expect(observe()).rejects.toThrow('Panda生成物の由来');
    vi.mocked(buildSnapshotInventories).mockReturnValueOnce({
      base: {
        ...current,
        source: { ...current.source, fingerprint: '0'.repeat(64) },
      },
      head: current,
      index: current,
      working: current,
    });
    await expect(observe()).rejects.toThrow('再観測のcore');
    vi.mocked(captureGitSnapshot)
      .mockReturnValueOnce({ snapshot })
      .mockReturnValueOnce({
        snapshot: { ...snapshot, digest: '0'.repeat(64) },
      });
    await expect(observe()).rejects.toThrow('固定入力が変化');
  });
});
