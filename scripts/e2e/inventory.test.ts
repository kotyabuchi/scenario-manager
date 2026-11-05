import { afterEach, describe, expect, it } from 'vitest';

import { saveInventory, serializeInventory } from './inventory';
import { inventorySchema } from './inventorySchema';

import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directories: string[] = [];
const temporaryRoot = () => {
  const directory = mkdtempSync(join(tmpdir(), 'e2e-inventory-'));
  directories.push(directory);
  return directory;
};
const example = () =>
  inventorySchema.parse({
    schemaVersion: 2,
    extractorVersion: '2',
    surfaceAnalysis: {
      sites: [],
      bindings: [],
      diagnostics: [],
      storyReferences: [],
    },
    source: { fingerprint: 'a'.repeat(64), files: [] },
    nodes: ['z', 'A'].map((name) => ({
      id: `page:${name}`,
      kind: 'page',
      source: { file: `src/app/${name}/page.tsx`, line: 1, column: 1 },
      url: `/${name}`,
    })),
    edges: [],
    diagnostics: [],
  });

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe('inventoryの保存', () => {
  it('生成順とlocaleに依存せず同じJSONになり、入力を変更しない', () => {
    const inventory = example();
    const reversed = { ...inventory, nodes: [...inventory.nodes].reverse() };
    expect(serializeInventory(inventory)).toBe(serializeInventory(reversed));
    expect(inventory.nodes[0]?.id).toBe('page:z');
    expect(serializeInventory(inventory).indexOf('page:A')).toBeLessThan(
      serializeInventory(inventory).indexOf('page:z'),
    );
  });

  it('更新後のcheckは成功し、一時ファイルを残さない', () => {
    const root = temporaryRoot();
    saveInventory(root, 'inventory.json', example(), false);
    saveInventory(root, 'inventory.json', example(), true);
    expect(readdirSync(root)).toEqual(['inventory.json']);
  });

  it('置換に失敗した場合も一時ファイルを残さない', () => {
    const root = temporaryRoot();
    mkdirSync(join(root, 'blocked'));
    expect(() => saveInventory(root, 'blocked', example(), false)).toThrow();
    expect(readdirSync(root)).toEqual(['blocked']);
  });

  it('古い生成物をcheckしても書き換えない', () => {
    const root = temporaryRoot();
    writeFileSync(join(root, 'inventory.json'), 'stale');
    expect(() =>
      saveInventory(root, 'inventory.json', example(), true),
    ).toThrow('最新ではありません');
    expect(readFileSync(join(root, 'inventory.json'), 'utf8')).toBe('stale');
  });

  it('作業ルート内のsymlinkから外へ出力しない', () => {
    const root = temporaryRoot();
    const outside = temporaryRoot();
    symlinkSync(outside, join(root, 'linked'), 'junction');
    expect(() =>
      saveInventory(root, 'linked/inventory.json', example(), false),
    ).toThrow('symlink');
    expect(readdirSync(outside)).toEqual([]);
  });

  it('staleなcheckでも構文エラーの位置を出力し、生成物を変更しない', () => {
    const root = temporaryRoot();
    execFileSync('git', ['init', '--quiet'], { cwd: root, windowsHide: true });
    mkdirSync(join(root, 'src/app'), { recursive: true });
    writeFileSync(
      join(root, 'src/app/page.tsx'),
      'export default function Page( {',
    );
    writeFileSync(
      join(root, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { noLib: true, types: [] },
      }),
    );
    writeFileSync(join(root, 'inventory.json'), 'stale');
    const result = spawnSync(
      process.execPath,
      [
        createRequire(import.meta.url).resolve('tsx/cli'),
        fileURLToPath(new URL('./inventory.ts', import.meta.url)),
        '--check',
        '--output',
        'inventory.json',
      ],
      { cwd: root, encoding: 'utf8', windowsHide: true },
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('src/app/page.tsx');
    expect(result.stdout).toContain('"severity":"error"');
    expect(result.stderr).toContain('最新ではありません');
    expect(readFileSync(join(root, 'inventory.json'), 'utf8')).toBe('stale');
  });

  it('生成物の欠落とルート外の出力を拒否する', () => {
    const root = temporaryRoot();
    expect(() => saveInventory(root, 'missing.json', example(), true)).toThrow(
      '最新ではありません',
    );
    expect(() =>
      saveInventory(root, '../outside.json', example(), false),
    ).toThrow('作業ルート内');
    expect(readdirSync(root)).toEqual([]);
  });
});
