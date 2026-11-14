import { afterEach, describe, expect, it } from 'vitest';

import { loadStorySurfaceContext } from './extractors/surfaceRoots';
import { loadSource } from './source';
import { createSourceReadWitness } from './sourceReadWitness';

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const temp = realpathSync(tmpdir());
const roots: string[] = [];
const write = (root: string, file: string, content: string) => {
  const destination = join(root, file);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, content);
};
const git = (root: string, ...args: string[]) =>
  execFileSync('git', args, { cwd: root, windowsHide: true, stdio: 'pipe' });
const createProject = () => {
  const root = mkdtempSync(join(temp, 'source-read-witness-'));
  roots.push(root);
  write(root, '.gitignore', 'node_modules/\nsrc/ignored.ts\n');
  write(
    root,
    'tsconfig.json',
    JSON.stringify({
      compilerOptions: {
        noLib: true,
        types: [],
        module: 'ESNext',
        moduleResolution: 'Bundler',
      },
      include: ['src/**/*'],
    }),
  );
  write(
    root,
    'src/app/page.tsx',
    'export default function Page() { return null }\n',
  );
  git(root, 'init', '--quiet');
  git(root, 'add', '--', 'src/app/page.tsx');
  return root;
};
const packageSource = (source: ReturnType<typeof loadSource>, suffix: string) =>
  source.program
    .getSourceFiles()
    .find((file) => file.fileName.replaceAll('\\', '/').endsWith(suffix))?.text;

afterEach(() => {
  for (const root of roots.splice(0)) {
    if (dirname(realpathSync(root)) !== temp)
      throw new Error('source witness fixtureの削除先が不正です');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('source read witness', () => {
  it('初回readを省略せず同じqueryだけを初出順に再読し、次の照合でもfreshに読む', () => {
    const witness = createSourceReadWitness();
    const calls: string[] = [];
    const read = (name: string) => () => {
      calls.push(name);
      return name;
    };
    const first = { operation: 'ts.readFile', arguments: ['first'] } as const;
    const second = { operation: 'fs.exists', arguments: ['second'] } as const;
    witness.observe(read('first'), first);
    witness.observe(read('second'), second);
    witness.observe(read('first'), first);
    expect(calls).toEqual(['first', 'second', 'first']);
    calls.length = 0;
    expect(witness.matches()).toBe(true);
    expect(calls).toEqual(['first', 'second']);
    calls.length = 0;
    expect(witness.matches()).toBe(true);
    expect(calls).toEqual(['first', 'second']);
  });

  it('同じqueryの初回観測値が揺れたら最初の値へ戻っても共有を拒否する', () => {
    const witness = createSourceReadWitness();
    let value = 'before';
    const query = { operation: 'ts.readFile', arguments: ['same'] } as const;
    witness.observe(() => value, query);
    value = 'after';
    witness.observe(() => value, query);
    value = 'before';
    expect(witness.matches()).toBe(false);
  });

  it('operation・rootを含むパス・全列挙引数の相違を共有しない', () => {
    const witness = createSourceReadWitness();
    const queries = [
      { operation: 'ts.readFile', arguments: ['/root/a'] },
      { operation: 'ts.fileExists', arguments: ['/root/a'] },
      { operation: 'ts.readFile', arguments: ['/other/a'] },
      {
        operation: 'ts.readDirectory',
        arguments: ['/root', ['.ts'], undefined, ['a'], 1],
      },
      {
        operation: 'ts.readDirectory',
        arguments: ['/root', ['.tsx'], undefined, ['a'], 1],
      },
      {
        operation: 'ts.readDirectory',
        arguments: ['/root', ['.ts'], ['skip'], ['a'], 1],
      },
      {
        operation: 'ts.readDirectory',
        arguments: ['/root', ['.ts'], undefined, ['b'], 1],
      },
      {
        operation: 'ts.readDirectory',
        arguments: ['/root', ['.ts'], undefined, ['a'], 2],
      },
      {
        operation: 'ts.readDirectory',
        arguments: ['/root', undefined, undefined, undefined, undefined],
      },
      {
        operation: 'ts.readDirectory',
        arguments: ['/root', [], [], [], undefined],
      },
    ] as const;
    const values = queries.map(() => 'before');
    for (const [index, query] of queries.entries()) {
      witness.observe(() => values[index], query);
    }
    expect(witness.matches()).toBe(true);
    for (const index of values.keys()) {
      values[index] = 'after';
      expect(witness.matches()).toBe(false);
      values[index] = 'before';
    }
  });

  it('queryなしのreadは共有せず、再照合中のread例外を成功に変換しない', () => {
    const witness = createSourceReadWitness();
    let count = 0;
    let shouldFail = false;
    const read = () => {
      count += 1;
      if (shouldFail) throw new Error('read-failed');
      return 'stable';
    };
    witness.observe(read);
    witness.observe(read);
    expect(witness.matches()).toBe(true);
    expect(count).toBe(4);
    shouldFail = true;
    expect(witness.matches()).toBe(false);
  });

  it('空・直列化不能・元read例外を安全に扱い、値のidentityを保つ', () => {
    expect(createSourceReadWitness().matches()).toBe(false);
    const witness = createSourceReadWitness();
    const value = { nodes: ['a'] };
    expect(witness.observe(() => value)).toBe(value);
    expect(witness.matches()).toBe(true);
    expect(witness.observe(() => Symbol('private'))).toBeTypeOf('symbol');
    expect(witness.matches()).toBe(false);

    const failure = new Error('original-read-failure');
    const failed = createSourceReadWitness();
    let thrown: unknown;
    try {
      failed.observe(() => {
        throw failure;
      });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBe(failure);
    expect(failed.matches()).toBe(false);
  });

  it('最初の差で再読を止め、途中で消えたread先を一致扱いしない', () => {
    const root = createProject();
    write(root, 'src/probe.ts', 'before');
    const file = join(root, 'src/probe.ts');
    const witness = createSourceReadWitness();
    let laterReads = 0;
    witness.observe(() => readFileSync(file, 'utf8'));
    witness.observe(() => {
      laterReads += 1;
      return 'stable';
    });
    rmSync(file);
    expect(witness.matches()).toBe(false);
    expect(laterReads).toBe(1);
  });

  it('working bytesが同じでもGit入口を変えたらfresh sourceとの差を検出する', () => {
    const root = createProject();
    write(root, 'src/ignored.ts', 'export const staged = true\n');
    const witness = createSourceReadWitness();
    const before = loadSource(root, undefined, {
      observeRead: witness.observe,
    });
    expect(before.files.map(({ path }) => path)).not.toContain(
      'src/ignored.ts',
    );

    git(root, 'add', '--force', '--', 'src/ignored.ts');
    const fresh = loadSource(root);
    expect(fresh.files.map(({ path }) => path)).toContain('src/ignored.ts');
    expect(witness.matches()).toBe(false);
  });

  it('継承package configと型宣言の実体変更をfresh解析との差として検出する', () => {
    const root = createProject();
    write(
      root,
      'node_modules/fixture-config/tsconfig.json',
      '{"compilerOptions":{"noLib":true,"types":[]}}',
    );
    write(
      root,
      'tsconfig.json',
      '{"extends":"fixture-config/tsconfig.json","include":["src/**/*"]}',
    );
    write(
      root,
      'src/app/page.tsx',
      "import type { Value } from 'fixture-type'; export const pageValue: Value = 'before'\n",
    );
    write(
      root,
      'node_modules/fixture-type/index.d.ts',
      'export type Value = string\n',
    );
    const witness = createSourceReadWitness();
    const before = loadSource(root, undefined, {
      observeRead: witness.observe,
    });
    expect(packageSource(before, '/fixture-type/index.d.ts')).toContain(
      'string',
    );

    write(
      root,
      'node_modules/fixture-type/index.d.ts',
      'export type Value = number\n',
    );
    const freshType = loadSource(root);
    expect(packageSource(freshType, '/fixture-type/index.d.ts')).toContain(
      'number',
    );
    expect(witness.matches()).toBe(false);

    const configWitness = createSourceReadWitness();
    const beforeConfig = loadSource(root, undefined, {
      observeRead: configWitness.observe,
    });
    write(
      root,
      'node_modules/fixture-config/tsconfig.json',
      '{"compilerOptions":{"noLib":true,"types":[],"strict":true}}',
    );
    expect(loadSource(root).manifest.fingerprint).not.toBe(
      beforeConfig.manifest.fingerprint,
    );
    expect(configWitness.matches()).toBe(false);
  });

  it('未存在のpackage型とdirectoryが追加されたらfresh解析へ戻せる', () => {
    const root = createProject();
    write(
      root,
      'src/app/page.tsx',
      "import type { Added } from 'new-package'; export const value: Added = 'new'\n",
    );
    const witness = createSourceReadWitness();
    const before = loadSource(root, undefined, {
      observeRead: witness.observe,
    });
    expect(packageSource(before, '/new-package/index.d.ts')).toBeUndefined();

    write(
      root,
      'node_modules/new-package/index.d.ts',
      'export type Added = string\n',
    );
    const fresh = loadSource(root);
    expect(packageSource(fresh, '/new-package/index.d.ts')).toContain('string');
    expect(witness.matches()).toBe(false);
  });

  it('既存directory内の負のfileExistsとroot tsconfig変更を検出する', () => {
    const root = createProject();
    write(
      root,
      'src/app/page.tsx',
      "import type { Added } from 'fixture-later'; export const value: Added = 'new'\n",
    );
    mkdirSync(join(root, 'node_modules/fixture-later'), { recursive: true });
    const witness = createSourceReadWitness();
    const before = loadSource(root, undefined, {
      observeRead: witness.observe,
    });
    expect(packageSource(before, '/fixture-later/index.d.ts')).toBeUndefined();
    write(
      root,
      'node_modules/fixture-later/index.d.ts',
      'export type Added = string\n',
    );
    expect(
      packageSource(loadSource(root), '/fixture-later/index.d.ts'),
    ).toContain('string');
    expect(witness.matches()).toBe(false);

    const configWitness = createSourceReadWitness();
    const beforeConfig = loadSource(root, undefined, {
      observeRead: configWitness.observe,
    });
    write(
      root,
      'tsconfig.json',
      '{"compilerOptions":{"noLib":true,"types":[],"strict":true},"include":["src/**/*"]}',
    );
    expect(loadSource(root).manifest.fingerprint).not.toBe(
      beforeConfig.manifest.fingerprint,
    );
    expect(configWitness.matches()).toBe(false);
  });

  it('Story専用importの変更はStory側witnessで検出する', () => {
    const root = createProject();
    write(
      root,
      'src/Widget.stories.tsx',
      "import type { StoryValue } from 'story-type'; export default {}; export const Example: StoryValue = 'before'\n",
    );
    write(
      root,
      'node_modules/story-type/index.d.ts',
      'export type StoryValue = string\n',
    );
    const productWitness = createSourceReadWitness();
    loadSource(root, undefined, { observeRead: productWitness.observe });
    const storyWitness = createSourceReadWitness();
    const storyBefore = loadStorySurfaceContext(
      root,
      undefined,
      storyWitness.observe,
    );
    expect(packageSource(storyBefore, '/story-type/index.d.ts')).toContain(
      'string',
    );

    write(
      root,
      'node_modules/story-type/index.d.ts',
      'export type StoryValue = number\n',
    );
    const storyFresh = loadStorySurfaceContext(root);
    expect(packageSource(storyFresh, '/story-type/index.d.ts')).toContain(
      'number',
    );
    expect(storyWitness.matches()).toBe(false);
    expect(productWitness.matches()).toBe(true);
  });

  it('node_modulesのjunction先が変われば型のfresh解析差を検出する', () => {
    const root = createProject();
    const packages = mkdtempSync(join(temp, 'source-package-target-'));
    roots.push(packages);
    write(
      root,
      'src/app/page.tsx',
      "import type { Value } from 'linked-type'; export const value: Value = 'first'\n",
    );
    write(packages, 'first/index.d.ts', 'export type Value = string\n');
    write(packages, 'second/index.d.ts', 'export type Value = number\n');
    mkdirSync(join(root, 'node_modules'), { recursive: true });
    const link = join(root, 'node_modules/linked-type');
    symlinkSync(
      join(packages, 'first'),
      link,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    const witness = createSourceReadWitness();
    const before = loadSource(root, undefined, {
      observeRead: witness.observe,
    });
    expect(
      before.program
        .getSourceFiles()
        .some((file) => file.text.includes('export type Value = string')),
    ).toBe(true);

    rmSync(link, { recursive: true, force: true });
    symlinkSync(
      join(packages, 'second'),
      link,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    const fresh = loadSource(root);
    expect(
      fresh.program
        .getSourceFiles()
        .some((file) => file.text.includes('export type Value = number')),
    ).toBe(true);
    expect(witness.matches()).toBe(false);
  });
});
