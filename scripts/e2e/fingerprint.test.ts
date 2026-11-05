import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  captureInputs,
  compareInputs,
  inputFingerprintSchema,
} from './fingerprint';

import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';

const hooks = vi.hoisted(() => ({
  beforeOpen: undefined as (() => void) | undefined,
}));
vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...original,
    open: async (...args: Parameters<typeof original.open>) => {
      const hook = hooks.beforeOpen;
      hooks.beforeOpen = undefined;
      hook?.();
      return original.open(...args);
    },
  };
});

const roots: string[] = [];
const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'e2e-fingerprint-'));
  roots.push(root);
  const write = (path: string, contents: string | Buffer = 'fixture\n') => {
    const absolute = join(root, path);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, contents);
  };
  return { root, write };
};
const nextEnv = (dist = '.next') =>
  `/// <reference types="next" />\n/// <reference types="next/image-types/global" />\nimport "./${dist}/types/routes.d.ts";\n\n// NOTE: This file should not be edited\n// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.\n`;

afterEach(() => {
  hooks.beforeOpen = undefined;
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) {
    const target = resolve(root);
    const child = relative(resolve(tmpdir()), target);
    if (
      !child ||
      child.startsWith(`..${sep}`) ||
      child === '..' ||
      !child.startsWith('e2e-fingerprint-')
    )
      throw new Error('fixture cleanupのpathが不正です');
    rmSync(target, { recursive: true, force: true });
  }
});

describe('captureInputs', () => {
  it('固定scopeのraw bytesをPOSIX順で採取し、Gitやenv/DBなしで利用できる', async () => {
    const { root, write } = fixture();
    const files = [
      'src/z.ts',
      'src/build/runtime.ts',
      'scripts/e2e/fixtures/test-results/input.json',
      'scripts/e2e/fixtures/dist/input.js',
      'public/logo.bin',
      'styled-system/css/index.mjs',
      'e2e/ledger/scenarios/a.json',
      'e2e/fixtures/a.ts',
      'scripts/stubs/a.js',
      'supabase/migrations/001.sql',
      'src/lib/db/migrations/ignored.sql',
      'supabase/seed.sql',
      '.storybook/main.ts',
      'patches/library.patch',
      'pnpm-lock.yaml',
      'package.json',
      'tsconfig.json',
      'next.config.ts',
      'vitest.integration.verified.config.ts',
      'wrangler.jsonc',
      '.gitignore',
    ];
    for (const path of files) write(path, Buffer.from([0, 10, 13, 255]));
    const result = await captureInputs(root);
    expect(result.files.map((file) => file.path)).toEqual(
      [...files, 'next-env.d.ts'].sort(),
    );
    expect(
      result.files.find((file) => file.path === 'public/logo.bin'),
    ).toMatchObject({
      kind: 'raw',
      size: 4,
      sha256: createHash('sha256')
        .update(Buffer.from([0, 10, 13, 255]))
        .digest('hex'),
    });
    expect(compareInputs(result, await captureInputs(root))).toEqual({
      added: [],
      removed: [],
      changed: [],
    });
  });

  it('ignored入力はgitignoreの内容にかかわらず採取する', async () => {
    const { root, write } = fixture();
    write('.gitignore', '*\n');
    write('styled-system/tokens/index.mjs');
    write('src/untracked.ts');
    const before = await captureInputs(root);
    write('styled-system/tokens/index.mjs', 'changed');
    expect(compareInputs(before, await captureInputs(root)).changed).toEqual([
      'styled-system/tokens/index.mjs',
    ]);
    expect(before.files.some((file) => file.path === 'src/untracked.ts')).toBe(
      true,
    );
  });

  it('追加・削除・rename・dirty変更を区別し、内容を差分に出さない', async () => {
    const { root, write } = fixture();
    write('src/old.ts');
    write('src/change.ts');
    write('src/delete.ts');
    const before = await captureInputs(root);
    renameSync(join(root, 'src/old.ts'), join(root, 'src/renamed.ts'));
    unlinkSync(join(root, 'src/delete.ts'));
    write('src/change.ts', 'changed-secret-body');
    write('src/new.ts');
    expect(compareInputs(before, await captureInputs(root))).toEqual({
      added: ['src/new.ts', 'src/renamed.ts'],
      removed: ['src/delete.ts', 'src/old.ts'],
      changed: ['src/change.ts'],
    });
  });

  it('raw入力のLF/CRLFは異なるhashにする', async () => {
    const { root, write } = fixture();
    write('src/a.ts', 'a\n');
    const before = await captureInputs(root);
    write('src/a.ts', 'a\r\n');
    expect(compareInputs(before, await captureInputs(root)).changed).toEqual([
      'src/a.ts',
    ]);
  });

  it('env・認証state・実行出力・依存物・秘密鍵は内容も名前も返さない', async () => {
    const { root, write } = fixture();
    for (const path of [
      '.env',
      '.mcp.json',
      '.npmrc',
      '.netrc',
      '.env.local',
      'src/.env.secret',
      'src/key.pem',
      'node_modules/library/index.js',
      '.next/types/routes.d.ts',
      '.next-e2e/run-a/output',
      'test-results/run/private.json',
      'e2e/.auth/user.json',
      'supabase/.temp/config',
      'storybook-static/index.html',
      'tsconfig.tsbuildinfo',
      'storybook.log',
    ])
      write(path, 'secret');
    const before = await captureInputs(root);
    expect(before.files.map((file) => file.path)).toEqual(['next-env.d.ts']);
    write('.env', 'new-secret');
    write('test-results/new.json');
    expect(compareInputs(before, await captureInputs(root)).changed).toEqual(
      [],
    );
  });

  it.each([
    '.next',
    '.next-e2e',
    '.next-e2e/run-012345abcdef',
  ])('既知Next template %sと初回未生成を同値にする', async (dist) => {
    const { root, write } = fixture();
    const before = await captureInputs(root);
    write('next-env.d.ts', nextEnv(dist).replaceAll('\n', '\r\n'));
    expect(compareInputs(before, await captureInputs(root))).toEqual({
      added: [],
      removed: [],
      changed: [],
    });
  });

  it.each([
    `${nextEnv()}import "./src/extra";\n`,
    nextEnv('../external'),
    nextEnv('.next-e2e/run-not-a-run'),
    nextEnv().replace('types="next"', 'types="arbitrary"'),
    nextEnv().replace('app/api-reference', 'pages/api-reference'),
    nextEnv().replace('import ', 'export '),
    '',
  ])('未知next-env内容をfail closedする %#', async (contents) => {
    const { root, write } = fixture();
    write('next-env.d.ts', contents);
    await expect(captureInputs(root)).rejects.toThrow('next-env.d.ts');
  });

  it.each([
    'GIT_DIR',
    'GIT_WORK_TREE',
    'GIT_CONFIG_COUNT',
    'git_replace_ref_base',
  ])('Git環境%sに左右されず指定rootだけを採取する', async (name) => {
    const { root, write } = fixture();
    write('src/a.ts');
    const before = await captureInputs(root);
    vi.stubEnv(name, 'secret-external-repo');
    expect(await captureInputs(root)).toEqual(before);
  });

  it('外部向けdirectory junctionを拒否する', async () => {
    const { root, write } = fixture();
    const outside = fixture();
    outside.write('private.ts', 'private');
    write('src/a.ts');
    symlinkSync(outside.root, join(root, 'src/external'), 'junction');
    await expect(captureInputs(root)).rejects.toThrow('symlink');
  });

  it('rootそのもののjunctionも拒否する', async () => {
    const { root } = fixture();
    const outside = fixture();
    symlinkSync(outside.root, join(root, 'linked'), 'junction');
    await expect(captureInputs(join(root, 'linked'))).rejects.toThrow(
      '物理directory',
    );
  });

  it('scan後・open前の実file変更を拒否する', async () => {
    const { root, write } = fixture();
    write('src/a.ts', 'before');
    hooks.beforeOpen = () => write('src/a.ts', 'modified during capture');
    await expect(captureInputs(root)).rejects.toThrow('採取中');
  });

  it('scan後に加わった入力も返却前の再走査で拒否する', async () => {
    const { root, write } = fixture();
    write('src/a.ts');
    hooks.beforeOpen = () => write('src/new.ts');
    await expect(captureInputs(root)).rejects.toThrow('採取中');
  });

  it('実filesystemのUnicode正規化衝突も拒否する', async () => {
    const { root, write } = fixture();
    write('src/é.ts');
    write('src/e\u0301.ts');
    await expect(captureInputs(root)).rejects.toThrow('衝突');
  });

  it('比較時も大文字衝突・順序・正規化種別を拒否する', async () => {
    const { root, write } = fixture();
    write('src/a.ts');
    const original = await captureInputs(root);
    const source = original.files.find((file) => file.path === 'src/a.ts');
    if (!source) throw new Error('fixture sourceがありません');
    const duplicate = [...original.files, { ...source, path: 'src/A.ts' }].sort(
      (left, right) => (left.path < right.path ? -1 : 1),
    );
    expect(() =>
      compareInputs(original, { ...original, files: duplicate }),
    ).toThrow('重複');
    expect(() =>
      compareInputs(original, {
        ...original,
        files: [...original.files].reverse(),
      }),
    ).toThrow('順序');
    expect(() =>
      compareInputs(original, {
        ...original,
        files: original.files.map((file) => ({ ...file, kind: 'raw' })),
      }),
    ).toThrow('正規化');
  });

  it('異なるrootおよび改竄されたdigestを比較しない', async () => {
    const left = await captureInputs(fixture().root);
    const right = await captureInputs(fixture().root);
    expect(() => compareInputs(left, right)).toThrow('root');
    expect(() =>
      compareInputs(left, { ...left, digest: '0'.repeat(64) }),
    ).toThrow('digest');
    expect(
      inputFingerprintSchema.safeParse({
        ...left,
        files: [{ ...left.files[0], path: '../secret' }],
      }).success,
    ).toBe(false);
  });
});
