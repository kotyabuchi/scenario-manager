import { isNil } from 'ramda';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadStorySurfaceContext } from './extractors/surfaceRoots';
import { snapshotFixture } from './fixtures/selection';
import { getSnapshotFiles } from './gitSnapshot';
import { mergeImpactGraphs } from './impactGraph';
import { buildInventory, serializeInventory } from './inventory';
import { buildSnapshotInventories } from './snapshotInventory';
import { loadSource } from './source';
import { createStablePackageSystem } from './sourceSnapshotSystem';

import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import type { GitSnapshotCapture, GitSnapshotRevision } from './gitSnapshot';

vi.mock('./gitSnapshot', () => ({ getSnapshotFiles: vi.fn() }));
vi.mock('./inventory', async (original) => {
  const inventory = await original<typeof import('./inventory')>();
  return { ...inventory, buildInventory: vi.fn(inventory.buildInventory) };
});
vi.mock('./source', async (original) => {
  const source = await original<typeof import('./source')>();
  return { ...source, loadSource: vi.fn(source.loadSource) };
});

type Files = Record<string, string | Buffer | undefined>;
const config = (paths = {}) =>
  JSON.stringify({
    compilerOptions: {
      noLib: true,
      types: [],
      module: 'esnext',
      moduleResolution: 'bundler',
      baseUrl: '.',
      paths,
    },
    include: ['src/**/*'],
  });
const files = {
  'tsconfig.json': config(),
  'src/app/page.ts': 'export default function Page() { return null; }',
};
const generated = 'styled-system/generated.ts';
const temp = realpathSync.native(tmpdir());
const roots: string[] = [];
const makeFixture = (
  revisions: Partial<Record<GitSnapshotRevision, Files>> = {},
  reasons: GitSnapshotCapture['snapshot']['reasons'] = [],
) => {
  const root = mkdtempSync(join(temp, 'e2e-snapshot-inventory-'));
  roots.push(root);
  const preload = {
    base: vi.fn(),
    head: vi.fn(),
    index: vi.fn(),
    working: vi.fn(),
  };
  vi.mocked(getSnapshotFiles).mockImplementation((_, revision) => {
    const input = new Map(Object.entries(revisions[revision] ?? files));
    return {
      root,
      files: input.keys(),
      preload: preload[revision],
      read: (path) => {
        const value = input.get(path);
        return isNil(value) ? undefined : Buffer.from(value);
      },
    };
  });
  const capture = { snapshot: { ...snapshotFixture([]), reasons } };
  return { root, preload, capture };
};

afterEach(() => {
  vi.resetAllMocks();
  for (const root of roots.splice(0)) {
    if (dirname(realpathSync.native(root)) !== temp)
      throw new Error('snapshot inventory fixtureの削除先が不正です');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('固定snapshotの同一入力の再利用', () => {
  it('path順に依存せず4枠を保ち、解析結果とgraphが独立buildと一致する', () => {
    const { root, capture, preload } = makeFixture({
      head: {
        'src/app/page.ts': files['src/app/page.ts'],
        'tsconfig.json': files['tsconfig.json'],
      },
    });
    const inventories = buildSnapshotInventories(capture);
    expect(Object.keys(inventories)).toEqual([
      'base',
      'head',
      'index',
      'working',
    ]);
    expect(inventories.head).toBe(inventories.base);
    expect(inventories.index).toBe(inventories.base);
    expect(inventories.working).toBe(inventories.base);
    expect(buildInventory).toHaveBeenCalledTimes(1);
    expect(loadSource).toHaveBeenCalledTimes(2);
    for (const warm of Object.values(preload))
      expect(warm).toHaveBeenCalledTimes(1);

    const packages = createStablePackageSystem();
    const source = new Map(Object.entries(files));
    const snapshot = {
      files: [...source.keys()],
      packages: packages.system,
      read: (path: string) => source.get(path),
    };
    const independent = () =>
      buildInventory(
        loadSource(root, snapshot),
        loadStorySurfaceContext(root, snapshot),
      );
    const expected = {
      base: independent(),
      head: independent(),
      index: independent(),
      working: independent(),
    };
    for (const revision of ['base', 'head', 'index', 'working'] as const)
      expect(serializeInventory(inventories[revision])).toBe(
        serializeInventory(expected[revision]),
      );
    expect(mergeImpactGraphs(inventories)).toEqual(mergeImpactGraphs(expected));

    vi.mocked(buildInventory).mockClear();
    vi.mocked(loadSource).mockClear();
    expect(buildSnapshotInventories(capture).base).not.toBe(inventories.base);
    expect(buildInventory).toHaveBeenCalledTimes(1);
    expect(loadSource).toHaveBeenCalledTimes(2);
  });

  it('同じ文字列へ復号されるBOM違いも別のraw入力とする', () => {
    const withBom = {
      ...files,
      'src/app/page.ts': `\uFEFF${files['src/app/page.ts']}`,
    };
    const { capture } = makeFixture({ head: withBom });
    const { base, head, index } = buildSnapshotInventories(capture);
    expect(head).not.toBe(base);
    expect(index).toBe(base);
    expect(serializeInventory(head)).toBe(serializeInventory(base));
    expect(buildInventory).toHaveBeenCalledTimes(2);
  });

  it('bytesが同じでもpathの大小文字とStorybook入口の追加を区別する', () => {
    const widget = 'export function Widget() { return null; }';
    const original = { ...files, 'src/widget.ts': widget };
    const { capture } = makeFixture({
      base: original,
      head: { ...files, 'src/Widget.ts': widget },
      index: {
        ...original,
        'src/widget.stories.ts':
          "import { Widget } from './widget'; export default { component: Widget }; export const Example = {};",
      },
      working: original,
    });
    const { base, head, index, working } = buildSnapshotInventories(capture);
    expect(head.source.files.map(({ path }) => path)).toContain(
      'src/Widget.ts',
    );
    expect(base.source.files.map(({ path }) => path)).toContain(
      'src/widget.ts',
    );
    expect(index.surfaceAnalysis.storyReferences).not.toEqual(
      base.surfaceAnalysis.storyReferences,
    );
    expect(working).toBe(base);
    expect(buildInventory).toHaveBeenCalledTimes(3);
  });

  it('設定だけの差で旧aliasの接続先を借用しない', () => {
    const input = {
      ...files,
      'src/app/page.ts':
        "import { read } from '@adapter'; export default function Page() { return read(); }",
      'src/a.ts': 'export const read = () => 1;',
      'src/b.ts': 'export const read = () => 2;',
    };
    const baseFiles = {
      ...input,
      'tsconfig.json': config({ '@adapter': ['./src/a'] }),
    };
    const headFiles = {
      ...input,
      'tsconfig.json': config({ '@adapter': ['./src/b'] }),
    };
    const { capture } = makeFixture({
      base: baseFiles,
      head: headFiles,
      index: headFiles,
      working: baseFiles,
    });
    const { base, head, index, working } = buildSnapshotInventories(capture);
    for (const [inventory, adapter] of [
      [base, 'a'],
      [head, 'b'],
    ] as const)
      expect(inventory.edges).toContainEqual(
        expect.objectContaining({
          kind: 'imports',
          from: 'module:src/app/page.ts',
          to: `module:src/${adapter}.ts`,
        }),
      );
    expect(index).toBe(head);
    expect(working).toBe(base);
    expect(buildInventory).toHaveBeenCalledTimes(2);
  });

  it.each([
    '',
    'export const value = 1;',
  ])('追跡bytes %j をoverlayより優先する', (tracked) => {
    const overlay = 'export const value = 2;';
    const input = {
      ...files,
      'src/app/page.ts':
        "import { value } from '../../styled-system/generated'; export default function Page() { return value; }",
    };
    const { capture } = makeFixture(
      {
        base: { ...input, [generated]: tracked },
        head: input,
        index: input,
        working: { ...input, [generated]: overlay },
      },
      [{ code: 'UNVERSIONED_RUNTIME_INPUT', paths: [generated] }],
    );
    const { base, head, index, working } = buildSnapshotInventories(capture, [
      generated,
    ]);
    const sha = (text: string) =>
      createHash('sha256').update(text).digest('hex');
    expect(base.source.files).toContainEqual(
      expect.objectContaining({ path: generated, hash: sha(tracked) }),
    );
    expect(head.source.files).toContainEqual(
      expect.objectContaining({ path: generated, hash: sha(overlay) }),
    );
    expect(index).toBe(head);
    expect(working).toBe(head);
    expect(buildInventory).toHaveBeenCalledTimes(2);
  });

  it('読めない宣言済みpathと空ファイルを区別し、欠落がある枠を再利用しない', () => {
    const empty = { ...files, 'src/ambient.d.ts': '' };
    const missing = { ...files, 'src/ambient.d.ts': undefined };
    const { capture } = makeFixture({
      base: empty,
      head: missing,
      index: missing,
      working: empty,
    });
    const { base, head, index, working } = buildSnapshotInventories(capture);
    expect(head).not.toBe(base);
    expect(index).not.toBe(head);
    expect(working).toBe(base);
    expect(buildInventory).toHaveBeenCalledTimes(3);
  });

  it('各revisionでoverlayとのpath衝突を拒否する', () => {
    const overlay = { ...files, [generated]: 'export {};' };
    const { capture } = makeFixture(
      {
        head: { ...files, 'styled-system/Generated.ts': 'export {};' },
        working: overlay,
      },
      [{ code: 'UNVERSIONED_RUNTIME_INPUT', paths: [generated] }],
    );
    expect(() => buildSnapshotInventories(capture, [generated])).toThrow(
      'Unicode正規化が衝突',
    );
    expect(buildInventory).toHaveBeenCalledTimes(1);
  });

  it('依存変更をsnapshot読込前に拒否する', () => {
    const { capture } = makeFixture({}, [
      { code: 'DEPENDENCY_INPUT_CHANGED', paths: ['pnpm-lock.yaml'] },
    ]);
    expect(() => buildSnapshotInventories(capture)).toThrow('依存が変わった');
    expect(getSnapshotFiles).not.toHaveBeenCalled();
    expect(buildInventory).not.toHaveBeenCalled();
  });

  it('共有する場合でも解析中の物理依存変更を拒否する', async () => {
    const input = {
      ...files,
      'src/app/page.ts':
        "import { value } from 'fixture-pkg'; export default function Page() { return value; }",
    };
    const { capture, root, preload } = makeFixture({
      base: input,
      head: input,
      index: input,
      working: input,
    });
    const dependency = join(root, 'node_modules', 'fixture-pkg');
    mkdirSync(dependency, { recursive: true });
    writeFileSync(
      join(dependency, 'package.json'),
      JSON.stringify({ types: './index.d.ts' }),
    );
    const declaration = join(dependency, 'index.d.ts');
    writeFileSync(declaration, 'export declare const value: number;');
    const original =
      await vi.importActual<typeof import('./inventory')>('./inventory');
    vi.mocked(buildInventory).mockImplementationOnce((...args) => {
      const inventory = original.buildInventory(...args);
      writeFileSync(declaration, 'export declare const value: string;');
      return inventory;
    });

    expect(() => buildSnapshotInventories(capture)).toThrow(
      'node_modulesまたはTypeScript標準型が変化',
    );
    expect(buildInventory).toHaveBeenCalledTimes(1);
    for (const warm of Object.values(preload))
      expect(warm).toHaveBeenCalledTimes(1);
  });
});
