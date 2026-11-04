import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vitest';

import fixture from './fixtures/source/project.json';
import routeFixture from './fixtures/source/routes.json';
import { buildInventory } from './inventory';
import { loadSource } from './source';

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const roots: string[] = [];
const git = (root: string, ...args: string[]) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    stdio: 'pipe',
  });
const write = (root: string, file: string, content: string) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), content);
};
const createProject = (crlf = false) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'inventory-source-'));
  roots.push(root);
  for (const [file, content] of Object.entries(fixture)) {
    write(root, file, crlf ? content.replaceAll('\n', '\r\n') : content);
  }
  git(root, 'init', '--quiet');
  git(root, 'add', '--', 'src/app/page.tsx');
  return root;
};

afterEach(() => {
  for (const root of roots.splice(0)) {
    if (path.dirname(root) !== path.resolve(os.tmpdir()))
      throw new Error('fixtureの削除範囲が不正です');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('loadSource', () => {
  it('trackedとuntrackedを列挙しtests・stories・生成物・ignoreを入口から除く', () => {
    const source = loadSource(createProject());
    expect(source.files.map((file) => file.path)).toEqual([
      'src/app/page.tsx',
      'src/components/Widget.jsx',
      'src/generated/code.ts',
      'src/lib/CamelCase.ts',
      'src/lib/space name.js',
      'src/lib/value.ts',
      'src/stories/helper.ts',
      'src/tests/helper.ts',
    ]);
    expect(source.diagnostics).toEqual([]);
    expect(source.manifest.files.map((file) => file.path)).toContain(
      'src/db/types.ts',
    );
    expect(source.manifest.files.map((file) => file.path)).toContain(
      'src/global.d.ts',
    );
  });

  it('一般名のapp segmentとActionを保持し、全ファイルの変更をfingerprintへ反映する', () => {
    const root = createProject();
    for (const [file, content] of Object.entries(routeFixture))
      write(root, file, content);
    const before = loadSource(root);
    const inventory = buildInventory(before);
    for (const file of Object.keys(routeFixture)) {
      expect(before.files.map((entry) => entry.path)).toContain(file);
      if (!file.endsWith('/actions.ts')) {
        expect(inventory.nodes.map((node) => node.source.file)).toContain(file);
      }
    }
    // noLibのsource探索fixtureではError/Responseの実体は解決できない。
    // 新しい依存抽出も通常segmentの呼出を捨てず、3箇所を診断する。
    expect(before.diagnostics).toEqual([]);
    expect(
      inventory.diagnostics.map(({ code, source }) => ({
        code,
        file: source?.file,
      })),
    ).toEqual([
      { code: 'UNRESOLVED_CALL', file: 'src/app/api/tests/route.ts' },
      { code: 'UNRESOLVED_CALL', file: 'src/stories/helper.ts' },
      { code: 'UNRESOLVED_CALL', file: 'src/tests/helper.ts' },
    ]);
    for (const [file, content] of Object.entries(routeFixture))
      write(root, file, `${content}// 更新\n`);
    const after = loadSource(root);
    expect(after.manifest.fingerprint).not.toBe(before.manifest.fingerprint);
    for (const file of Object.keys(routeFixture)) {
      expect(
        after.manifest.files.find((entry) => entry.path === file)?.hash,
      ).not.toBe(
        before.manifest.files.find((entry) => entry.path === file)?.hash,
      );
    }
  });

  it.each([
    'relative',
    'symlink',
  ])('通常の外部継承configを拒否する: %s', (mode) => {
    const root = createProject();
    const outside = createProject();
    let extendsPath = path
      .relative(root, path.join(outside, 'tsconfig.base.json'))
      .replaceAll('\\', '/');
    if (mode === 'symlink') {
      symlinkSync(
        outside,
        path.join(root, 'linked'),
        process.platform === 'win32' ? 'junction' : 'dir',
      );
      extendsPath = './linked/tsconfig.base.json';
    }
    write(
      root,
      'tsconfig.json',
      JSON.stringify({
        extends: extendsPath,
        compilerOptions: { noLib: true, types: [] },
        include: ['src/**/*'],
      }),
    );
    const source = loadSource(root);
    expect(source.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'SOURCE_OUTSIDE_ROOT',
    );
    expect(source.manifest.files.map((file) => file.path)).not.toContain(
      extendsPath,
    );
    expect(
      source.manifest.files.every(
        (file) =>
          !file.path.startsWith('../') && !file.path.startsWith('linked/'),
      ),
    ).toBe(true);
  });

  it('正規node_modules packageからの継承configは外部storeでも読める', () => {
    const root = createProject();
    const outside = createProject();
    write(
      outside,
      'package/tsconfig.json',
      '{ "compilerOptions": { "noLib": true, "types": [] } }',
    );
    mkdirSync(path.join(root, 'node_modules/@fixture'), { recursive: true });
    symlinkSync(
      path.join(outside, 'package'),
      path.join(root, 'node_modules/@fixture/config'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    write(
      root,
      'tsconfig.json',
      JSON.stringify({
        extends: '@fixture/config/tsconfig.json',
        include: ['src/**/*'],
      }),
    );
    const source = loadSource(root);
    expect(source.diagnostics).toEqual([]);
    expect(source.manifest.files.map((file) => file.path)).toContain(
      'node_modules/@fixture/config/tsconfig.json',
    );
    expect(
      source.manifest.files.every((file) => !file.path.startsWith('../')),
    ).toBe(true);
  });

  it('通常sourceのsymlinkはpath中のnode_modulesという文字列で許可されない', () => {
    const root = createProject();
    const outside = createProject();
    write(outside, 'exposed/remote.ts', 'export const remote = 1;');
    mkdirSync(path.join(root, 'src/nested'), { recursive: true });
    symlinkSync(
      path.join(outside, 'exposed'),
      path.join(root, 'src/nested/node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    write(
      root,
      'src/importer.ts',
      "import { remote } from './nested/node_modules/remote'; export { remote };",
    );
    const source = loadSource(root);
    expect(source.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'SOURCE_OUTSIDE_ROOT',
    );
    expect(
      source.program
        .getSourceFiles()
        .some((file) => file.text.includes('export const remote = 1')),
    ).toBe(false);
  });

  it('extendsとpathsを使ってalias先の型を解決する', () => {
    const source = loadSource(createProject());
    const page = source.files.find(
      (file) => file.path === 'src/app/page.tsx',
    )?.sourceFile;
    expect(page).toBeDefined();
    const declaration = page?.statements.find(ts.isImportDeclaration);
    const bindings = declaration?.importClause?.namedBindings;
    expect(bindings && ts.isNamedImports(bindings)).toBe(true);
    if (!bindings || !ts.isNamedImports(bindings))
      throw new Error('fixtureのimportがありません');
    const name = bindings.elements[0]?.name;
    if (!name) throw new Error('fixtureのsymbolがありません');
    const alias = source.checker.getSymbolAtLocation(name);
    if (!alias) throw new Error('aliasを解決できません');
    const target = source.checker.getAliasedSymbol(alias);
    expect(target.getName()).toBe('value');
    expect(
      source.checker.typeToString(source.checker.getTypeAtLocation(name)),
    ).toBe('string');
  });

  it('allowJs未指定でもGitのJS・JSX入口を抽出対象に保つ', () => {
    const root = createProject();
    const config = readFileSync(path.join(root, 'tsconfig.base.json'), 'utf8');
    write(root, 'tsconfig.base.json', config.replace('"allowJs":true,', ''));
    const source = loadSource(root);
    expect(source.files.map((file) => file.path)).toContain(
      'src/lib/space name.js',
    );
    expect(source.files.map((file) => file.path)).toContain(
      'src/components/Widget.jsx',
    );
  });

  it('配置・drive区切り・CRLFが異なっても同じsnapshotはbyte一致する', () => {
    const root = createProject();
    const first = loadSource(root);
    const second = loadSource(createProject(true).replaceAll('\\', '/'));
    expect(JSON.stringify(first.manifest)).toBe(
      JSON.stringify(second.manifest),
    );
    expect(loadSource(root).manifest).toEqual(first.manifest);
    expect(JSON.stringify(first.manifest)).not.toContain(root);
    expect(
      first.files.every((file) => !file.sourceFile.text.includes('\r')),
    ).toBe(true);
    expect(
      second.files.every((file) => !file.sourceFile.text.includes('\r')),
    ).toBe(true);
  });

  it('継承configと生成型の変更もfingerprintへ反映する', () => {
    const root = createProject();
    const original = loadSource(root).manifest.fingerprint;
    const config = readFileSync(path.join(root, 'tsconfig.base.json'), 'utf8');
    write(
      root,
      'tsconfig.base.json',
      config.replace('"noLib":true', '"noLib":true,"strict":true'),
    );
    const changedConfig = loadSource(root).manifest.fingerprint;
    expect(changedConfig).not.toBe(original);
    write(root, 'src/db/types.ts', 'export type Row = { title: number };');
    expect(loadSource(root).manifest.fingerprint).not.toBe(changedConfig);
  });

  it('ignoreパターンと一致してもtrackedなら入口として保持する', () => {
    const root = createProject();
    git(root, 'add', '--force', '--', 'src/ignored.ts');
    const source = loadSource(root);
    expect(source.files.map((file) => file.path)).toContain('src/ignored.ts');
    expect(source.diagnostics).toEqual([]);
  });

  it('構文エラーをsource位置付きで報告し、アプリを実行しない', () => {
    const root = createProject();
    write(
      root,
      'src/broken.ts',
      "throw new Error('never execute');\nexport const broken = ;\n",
    );
    expect(loadSource(root).diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'SOURCE_PARSE_ERROR',
        severity: 'error',
        source: expect.objectContaining({ file: 'src/broken.ts', line: 2 }),
      }),
    );
  });

  it('未stage削除を現在snapshotから除き、不正configは診断する', () => {
    const root = createProject();
    rmSync(path.join(root, 'src/app/page.tsx'));
    write(
      root,
      'tsconfig.json',
      '{ "compilerOptions": { "target": "invalid" } }',
    );
    const source = loadSource(root);
    expect(source.files.map((file) => file.path)).not.toContain(
      'src/app/page.tsx',
    );
    expect(source.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'SOURCE_CONFIG_ERROR',
    );
  });

  it('リポジトリ外へのdirectory symlinkを入口とimport解決の両方で拒否する', () => {
    const root = createProject();
    const outside = createProject();
    write(outside, 'exposed/remote.ts', 'export const remote = 1;');
    symlinkSync(
      path.join(outside, 'exposed'),
      path.join(root, 'src/external'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    expect(
      loadSource(root).diagnostics.map((diagnostic) => diagnostic.code),
    ).toContain('SOURCE_OUTSIDE_ROOT');
    write(
      root,
      'src/importer.ts',
      "import { remote } from './external/remote'; export { remote };",
    );
    const source = loadSource(root);
    expect(
      source.files.some((file) => file.path.startsWith('src/external/')),
    ).toBe(false);
    expect(source.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'SOURCE_OUTSIDE_ROOT',
    );
    expect(
      source.program
        .getSourceFiles()
        .some((file) => file.text.includes('export const remote = 1')),
    ).toBe(false);
  });
});
