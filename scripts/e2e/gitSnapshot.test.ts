import { afterEach, describe, expect, it, vi } from 'vitest';

import { appendGitFixtureConfig } from './fixtures/gitFixtureConfig';
import { gitTokens, parseGitChanges } from './gitRecords';
import {
  captureGitSnapshot,
  listSnapshotFiles,
  readSnapshotFile,
} from './gitSnapshot';
import { readWorkingFiles } from './gitWorkingFiles';
import { buildSnapshotInventories } from './snapshotInventory';

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

vi.mock('./gitWorkingFiles', async (importOriginal) => {
  const original = await importOriginal<typeof import('./gitWorkingFiles')>();
  return { ...original, readWorkingFiles: vi.fn(original.readWorkingFiles) };
});

const temp = realpathSync.native(tmpdir());
const roots: string[] = [];
const renamePayload = Array.from(
  { length: 40 },
  (_, index) => `rename payload ${index}\n`,
).join('');
afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(readWorkingFiles).mockReset();
  for (const root of roots.splice(0)) {
    if (dirname(realpathSync.native(root)) !== temp)
      throw new Error('Git snapshot fixtureの削除先が不正です');
    rmSync(root, { recursive: true, force: true });
  }
});

const fixture = (format = 'sha1') => {
  const root = mkdtempSync(join(temp, 'e2e-git-snapshot-'));
  roots.push(root);
  const git = (args: string[], input?: string) =>
    execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      input,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  git(['init', '--template=', `--object-format=${format}`]);
  appendGitFixtureConfig(root, 'Snapshot fixture');
  const write = (file: string, contents: string) => {
    const target = join(root, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  };
  const commit = () => {
    git(['add', '--all']);
    git([
      '-c',
      'core.hooksPath=/dev/null',
      'commit',
      '--allow-empty',
      '-m',
      'fixture',
    ]);
    return git(['rev-parse', 'HEAD']);
  };
  write('.gitignore', '.env*\nstyled-system/\nnode_modules/\n');
  write('old file.txt', renamePayload);
  write('delete.txt', 'deleted in commit\n');
  write('dirty.txt', 'base\n');
  const base = commit();
  return {
    root,
    git,
    write,
    commit,
    base,
    capture: (runtimeInputPaths?: string[]) =>
      captureGitSnapshot({
        root,
        base,
        mode: 'local',
        ...(runtimeInputPaths && { runtimeInputPaths }),
      }),
  };
};

describe('Git snapshot', { timeout: 30_000 }, () => {
  it.each([
    'sha1',
    'sha256',
  ])('%sのcommit・stage・work・untrackedを固定する', (format) => {
    const { root, write, commit, git, base, capture } = fixture(format);
    renameSync(join(root, 'old file.txt'), join(root, 'new file.txt'));
    write('new file.txt', renamePayload.replace('payload 0', 'updated 0'));
    rmSync(join(root, 'delete.txt'));
    const head = commit();
    write('dirty.txt', 'staged\n');
    git(['add', 'dirty.txt']);
    write('dirty.txt', 'working\n');
    write('new untracked.txt', 'PRIVATE CONTENT');
    write('.env.local', 'PRIVATE SECRET');
    write('styled-system/ignored.ts', 'export {}');
    const saved = capture(['styled-system/ignored.ts', 'next-env.d.ts']);
    expect(saved.snapshot).toMatchObject({
      base,
      head,
      objectFormat: format,
      changedPaths: expect.arrayContaining([
        {
          origin: 'committed',
          status: 'R',
          oldPath: 'old file.txt',
          newPath: 'new file.txt',
        },
        { origin: 'committed', status: 'D', oldPath: 'delete.txt' },
        { origin: 'staged', status: 'M', newPath: 'dirty.txt' },
        { origin: 'unstaged', status: 'M', newPath: 'dirty.txt' },
        { origin: 'untracked', status: 'A', newPath: 'new untracked.txt' },
      ]),
      reasons: [
        {
          code: 'UNVERSIONED_RUNTIME_INPUT',
          paths: ['styled-system/ignored.ts'],
        },
      ],
    });
    expect(capture(['styled-system/ignored.ts']).snapshot.digest).toBe(
      saved.snapshot.digest,
    );
    expect(JSON.stringify(saved)).not.toMatch(/PRIVATE|\.env\.local/);
    expect(listSnapshotFiles(saved, 'base')).toContain('delete.txt');
    expect(listSnapshotFiles(saved, 'head')).not.toContain('delete.txt');
    write('dirty.txt', 'after capture\n');
    expect(readSnapshotFile(saved, 'base', 'dirty.txt')?.toString()).toBe(
      'base\n',
    );
    expect(readSnapshotFile(saved, 'index', 'dirty.txt')?.toString()).toBe(
      'staged\n',
    );
    expect(readSnapshotFile(saved, 'working', 'dirty.txt')?.toString()).toBe(
      'working\n',
    );
    expect(capture().snapshot.digest).not.toBe(saved.snapshot.digest);
  }, 30_000);

  it('置換ref・GIT環境変数・外部diffとassume-unchangedの影響を受けない', () => {
    const { root, write, commit, git, base, capture } = fixture();
    write('dirty.txt', 'head\n');
    const head = commit();
    git(['replace', base, head]);
    git(['update-index', '--assume-unchanged', 'dirty.txt']);
    write('dirty.txt', '実際には更新済み');
    vi.stubEnv('GIT_DIR', join(root, 'invalid'));
    vi.stubEnv('GIT_INDEX_FILE', join(root, 'invalid-index'));
    vi.stubEnv('GIT_EXTERNAL_DIFF', 'invalid-external-diff');
    vi.stubEnv('GIT_CONFIG_COUNT', 'invalid-config-count');
    vi.stubEnv('GIT_WORK_TREE', dirname(root));
    const saved = capture();
    expect(readSnapshotFile(saved, 'base', 'dirty.txt')?.toString()).toBe(
      'base\n',
    );
    expect(saved.snapshot.changedPaths).toEqual([
      { origin: 'committed', status: 'M', newPath: 'dirty.txt' },
      { origin: 'unstaged', status: 'M', newPath: 'dirty.txt' },
    ]);
  });

  it('要求されたCI commitとcheckoutが一致する場合だけ受理する', () => {
    const { root, base, commit } = fixture();
    const head = commit();
    expect(() =>
      captureGitSnapshot({ root, base, mode: 'ci', expectedHead: base }),
    ).toThrow('HEAD');
    expect(() =>
      captureGitSnapshot({
        root,
        base: 'HEAD',
        mode: 'ci',
        expectedHead: head,
      }),
    ).toThrow();
    expect(() =>
      captureGitSnapshot({ root, base: 'missing', mode: 'local' }),
    ).toThrow();
    expect(
      captureGitSnapshot({
        root,
        base,
        mode: 'ci',
        expectedHead: head,
        eventBase: head,
      }).snapshot,
    ).toMatchObject({ base, head, eventBase: head, mode: 'ci' });
  });

  it('大小文字だけのworking renameを変更なしとして扱わない', () => {
    const { root, git, capture } = fixture();
    if (process.platform === 'win32')
      git(['config', 'core.ignorecase', 'true']);
    renameSync(join(root, 'dirty.txt'), join(root, 'intermediate'));
    renameSync(join(root, 'intermediate'), join(root, 'Dirty.txt'));
    expect(() => capture()).toThrow(/物理path|衝突/);
  });

  it.each([
    'conflict',
    'symlink',
    'submodule',
    'case collision',
    'unicode collision',
  ])('不正なindex (%s) を拒否する', (kind) => {
    const { git, base, capture } = fixture();
    const blob = git(['rev-parse', 'HEAD:dirty.txt']);
    if (kind === 'conflict') {
      git(['update-index', '--force-remove', 'dirty.txt']);
      git(['update-index', '--index-info'], `100644 ${blob} 1\tdirty.txt\n`);
    } else if (kind === 'symlink' || kind === 'submodule') {
      const mode = kind === 'symlink' ? '120000' : '160000';
      git([
        'update-index',
        '--add',
        '--cacheinfo',
        `${mode},${kind === 'symlink' ? blob : base},bad-entry`,
      ]);
    } else {
      const names =
        kind === 'case collision' ? ['Foo/x', 'foo/y'] : ['é/x', 'e\u0301/y'];
      git(
        ['update-index', '--index-info'],
        names.map((name) => `100644 ${blob}\t${name}\n`).join(''),
      );
    }
    expect(() => capture()).toThrow();
  });

  it.each([
    'working',
    'index',
    'HEAD',
  ])('採取の途中で%sが変わった場合を拒否する', async (kind) => {
    const { write, git, commit, capture } = fixture();
    const actual =
      await vi.importActual<typeof import('./gitWorkingFiles')>(
        './gitWorkingFiles',
      );
    vi.mocked(readWorkingFiles).mockImplementationOnce((...args) => {
      const first = actual.readWorkingFiles(...args);
      if (kind === 'HEAD') commit();
      else {
        write('dirty.txt', 'mutation');
        if (kind === 'index') {
          git(['add', 'dirty.txt']);
          write('dirty.txt', 'base\n');
        }
      }
      return first;
    });
    expect(() => capture()).toThrow('採取中');
  });

  it('NUL framingからrename/copy両端を取得し、制御文字や不完全な記録を拒否する', () => {
    expect(
      parseGitChanges(
        Buffer.from('R100\0old file\0new file\0C075\0a\0b\0'),
        'staged',
      ),
    ).toEqual([
      {
        origin: 'staged',
        status: 'R',
        oldPath: 'old file',
        newPath: 'new file',
      },
      { origin: 'staged', status: 'C', oldPath: 'a', newPath: 'b' },
    ]);
    expect(() =>
      parseGitChanges(Buffer.from('M\0has\tspace\0'), 'staged'),
    ).toThrow();
    expect(() =>
      parseGitChanges(Buffer.from('M\0has\nline\0'), 'staged'),
    ).toThrow();
    expect(() => parseGitChanges(Buffer.from('R100\0a\0'), 'staged')).toThrow();
    expect(() => gitTokens(Buffer.from('not terminated'))).toThrow();
    expect(() => gitTokens(Buffer.from([0xff, 0]))).toThrow();
  });

  it('異なるcommitでも同じtree・index・作業内容から同じInventoryを使う', () => {
    const { root, write, commit } = fixture();
    write('tsconfig.json', '{"compilerOptions":{"noLib":true,"types":[]}}');
    write('src/app/page.ts', 'export default function Page() { return null; }');
    const base = commit();
    const head = commit();
    expect(head).not.toBe(base);
    const inventories = buildSnapshotInventories(
      captureGitSnapshot({ root, base, mode: 'local' }),
    );
    expect(inventories.head).toBe(inventories.base);
    expect(inventories.index).toBe(inventories.base);
    expect(inventories.working).toBe(inventories.base);
  });

  it('削除済みのalias・extendsを復元し、各時点で異なる依存を解決する', () => {
    const { root, write, commit, git } = fixture();
    const config = (adapter: string) =>
      JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: { '@adapter': [`./src/${adapter}`] },
        },
      });
    write(
      'node_modules/@fixture/config/tsconfig.json',
      JSON.stringify({
        compilerOptions: {
          module: 'esnext',
          moduleResolution: 'bundler',
          noLib: true,
          types: [],
        },
      }),
    );
    write(
      'tsconfig.json',
      JSON.stringify({
        extends: ['@fixture/config/tsconfig.json', './settings.json'],
        include: ['src/**/*'],
      }),
    );
    write('settings.json', config('old'));
    write('src/old.ts', 'export const read = () => 1;');
    write(
      'src/app/page.ts',
      "import { read } from '@adapter'; import { generated } from '../../styled-system/generated'; export default function Page() { return read() + generated; }",
    );
    const generated = 'styled-system/generated.ts';
    write(generated, 'export const generated = 1;');
    const base = commit();
    rmSync(join(root, 'src/old.ts'));
    write('src/new.ts', 'export const read = () => 2;');
    write('settings.json', config('new'));
    commit();
    write('src/staged.ts', 'export const read = () => 3;');
    write('settings.json', config('staged'));
    git(['add', '--all']);
    write('src/working.ts', 'export const read = () => 4;');
    write('settings.json', config('working'));
    const snapshot = captureGitSnapshot({
      root,
      base,
      mode: 'local',
      runtimeInputPaths: [generated],
    });
    write('settings.json', config('missing'));
    write(generated, 'throw new Error("checkout after capture");');
    expect(() =>
      buildSnapshotInventories(snapshot, ['src/app/page.ts']),
    ).toThrow('生成物');
    const inventories = buildSnapshotInventories(snapshot, [generated]);
    for (const [revision, target] of Object.entries({
      base: 'old',
      head: 'new',
      index: 'staged',
      working: 'working',
    })) {
      const inventory = Object.entries(inventories).find(
        ([name]) => name === revision,
      )?.[1];
      expect(
        inventory?.diagnostics.filter(
          ({ code }) => code === 'SOURCE_CONFIG_ERROR',
        ),
      ).toEqual([]);
      expect(inventory?.source.files).toContainEqual(
        expect.objectContaining({ path: generated }),
      );
      expect(inventory?.edges).toContainEqual(
        expect.objectContaining({
          from: 'module:src/app/page.ts',
          to: `module:src/${target}.ts`,
          kind: 'imports',
        }),
      );
    }
  }, 30_000);
});
