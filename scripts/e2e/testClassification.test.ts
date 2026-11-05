import { createFilter } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';

import { escapeTestPathForGlob, getTestProjects } from './testClassification';

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const roots: string[] = [];
const createFixture = () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'test-classification-'));
  roots.push(root);
  mkdirSync(path.join(root, 'src'), { recursive: true });
  mkdirSync(path.join(root, 'scripts/e2e'), { recursive: true });
  writeManifest(root, []);
  return root;
};
const writeFile = (root: string, file: string, source = '') => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), source);
};
const writeManifest = (
  root: string,
  files: string[],
  mockedFiles: string[] = [],
  verifiedFiles: string[] = [],
) =>
  writeFile(
    root,
    'scripts/e2e/db-test-files.json',
    JSON.stringify({
      schemaVersion: 1,
      files: files.map((file) => ({
        path: file,
        reason: '実DBを使うfixture',
        legacyRisks: [],
      })),
      verifiedFiles: verifiedFiles.map((file) => ({
        path: file,
        reason: 'case別の実DB検証',
      })),
      mockedFiles: mockedFiles.map((file) => ({
        path: file,
        reason: 'DB境界をmockで置換する',
      })),
    }),
  );

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true });
});

describe('getTestProjects', () => {
  it('同名adapterも内容と登録に従い、全テストを一度だけ分類する', () => {
    const root = createFixture();
    const unit = 'src/app/(main)/home/__tests__/adapter.test.ts';
    const stub = 'src/components/blocks/SignupModal/__tests__/adapter.test.ts';
    const unitDom =
      'src/components/blocks/SpeedDialFAB/__tests__/focus.test.ts';
    const component = 'src/components/Button/Button.test.tsx';
    const integration =
      'src/app/(main)/sessions/[id]/__tests__/adapter.test.ts';
    const colocated = 'src/lib/example.test.ts';
    for (const file of [
      unit,
      stub,
      unitDom,
      component,
      integration,
      colocated,
    ]) {
      writeFile(root, file);
    }
    writeFile(root, 'src/lib/example.ts');
    writeManifest(root, [integration]);
    expect(getTestProjects(root)).toEqual({
      unit: [unit, stub, colocated],
      'unit-dom': [unitDom],
      component: [component],
      integration: [integration],
      'integration-verified': [],
    });
  });

  it('verifiedのSSOTをlegacy・unitと分離し、所属の重複を拒否する', () => {
    const root = createFixture();
    const legacy = 'src/legacy.test.ts';
    const verified = 'src/verified.integration.test.ts';
    writeFile(root, legacy);
    writeFile(
      root,
      verified,
      "import { createClient } from '@supabase/supabase-js';",
    );
    writeManifest(root, [legacy], [], [verified]);
    expect(getTestProjects(root).integration).toEqual([legacy]);
    expect(getTestProjects(root)['integration-verified']).toEqual([verified]);
    expect(getTestProjects(root).unit).toEqual([]);
    writeManifest(root, [verified], [], [verified]);
    expect(() => getTestProjects(root)).toThrow('重複');
    writeManifest(root, [], [verified], [verified]);
    expect(() => getTestProjects(root)).toThrow('重複');
    writeManifest(root, [], [], []);
    expect(() => getTestProjects(root)).toThrow('未登録のDB依存');
    writeManifest(root, [], [], ['src/missing.integration.test.ts']);
    expect(() => getTestProjects(root)).toThrow('存在しません');
  });

  it('存在しない登録を拒否する', () => {
    const root = createFixture();
    writeManifest(root, ['src/missing.test.ts']);
    expect(() => getTestProjects(root)).toThrow('存在しません');
  });

  it('重複したDB登録を拒否する', () => {
    const root = createFixture();
    const file = 'src/db.test.ts';
    writeFile(root, file);
    writeManifest(root, [file, file]);
    expect(() => getTestProjects(root)).toThrow('重複');
  });

  it('manifestの欠落を無視してDBテストをunitにしない', () => {
    const root = createFixture();
    rmSync(path.join(root, 'scripts/e2e/db-test-files.json'));
    expect(() => getTestProjects(root)).toThrow();
  });

  it.each([
    'import { getTestClient as client } from "@/__tests__/helpers/testClient"',
    'const fixture = await import("@/__tests__/helpers/fixtures")',
    'import { createDbClient } from "@/lib/supabase/server"',
    'import { createClient } from "@supabase/supabase-js"',
    'getTestClient()',
  ])('未登録の実DB依存を拒否する: %s', (source) => {
    const root = createFixture();
    writeFile(root, 'src/new.test.ts', source);
    writeFile(root, 'src/__tests__/helpers/testClient.ts');
    writeFile(root, 'src/__tests__/helpers/fixtures.ts');
    expect(() => getTestProjects(root)).toThrow('未登録のDB依存テスト');
  });

  it('補助コードの再export・循環importを辿ってDB依存を検出する', () => {
    const root = createFixture();
    writeFile(root, 'src/__tests__/new.test.ts', 'import "./helpers/entry"');
    writeFile(
      root,
      'src/__tests__/helpers/entry.ts',
      'export * from "./reader"',
    );
    writeFile(
      root,
      'src/__tests__/helpers/reader.ts',
      'import "./entry"; import { createClient } from "@supabase/supabase-js"',
    );
    expect(() => getTestProjects(root)).toThrow('未登録のDB依存テスト');
  });

  it('型だけのimportとアプリ内の未実行DB処理を混同しない', () => {
    const root = createFixture();
    const file = 'src/app/home/__tests__/adapter.test.ts';
    writeFile(
      root,
      file,
      'import type { SupabaseClient } from "@supabase/supabase-js"; import { type User } from "@supabase/supabase-js"; import { merge } from "../adapter"',
    );
    writeFile(
      root,
      'src/app/home/adapter.ts',
      'import { createDbClient } from "@/lib/supabase/server"',
    );
    expect(getTestProjects(root).unit).toEqual([file]);
  });

  it('理由付きmock境界登録だけをunitとして許可する', () => {
    const root = createFixture();
    const file = 'src/mock.test.ts';
    writeFile(
      root,
      file,
      `
      import { vi } from 'vitest';
      import { createClient } from '@supabase/supabase-js';
      vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
    `,
    );
    expect(() => getTestProjects(root)).toThrow('未登録のDB依存テスト');
    writeManifest(root, [], [file]);
    expect(getTestProjects(root).unit).toEqual([file]);
    writeFile(root, 'src/other.test.ts', 'getTestClient()');
    expect(() => getTestProjects(root)).toThrow('src/other.test.ts');
  });

  it.each([
    'duplicate',
    'integration',
    'missing',
    'empty-reason',
  ])('mock境界登録の不整合を拒否する: %s', (problem) => {
    const root = createFixture();
    const file = 'src/mock.test.ts';
    if (problem !== 'missing') writeFile(root, file);
    writeFile(
      root,
      'scripts/e2e/db-test-files.json',
      JSON.stringify({
        schemaVersion: 1,
        files:
          problem === 'integration'
            ? [{ path: file, reason: '実DB', legacyRisks: [] }]
            : [],
        mockedFiles: Array.from(
          { length: problem === 'duplicate' ? 2 : 1 },
          () => ({
            path: file,
            reason: problem === 'empty-reason' ? '   ' : 'mock境界',
          }),
        ),
      }),
    );
    expect(() => getTestProjects(root)).toThrow();
  });

  it.each([
    undefined,
    {},
    [{ path: '../outside.test.ts', reason: 'mock境界' }],
    [{ path: 'src/mock.test.ts', reason: 'mock境界', extra: true }],
  ])('mock境界登録の不正なschemaを拒否する: %j', (mockedFiles) => {
    const root = createFixture();
    writeFile(root, 'src/mock.test.ts');
    writeFile(
      root,
      'scripts/e2e/db-test-files.json',
      JSON.stringify({
        schemaVersion: 1,
        files: [],
        mockedFiles,
      }),
    );
    expect(() => getTestProjects(root)).toThrow();
  });

  it('基準リポジトリのDB11件とpureの例外を分類できる', () => {
    const root = fileURLToPath(new URL('../..', import.meta.url));
    const projects = getTestProjects(root);
    expect(projects.integration).toHaveLength(11);
    expect(projects.unit).toContain(
      'src/app/(main)/home/__tests__/adapter.test.ts',
    );
    expect(projects.unit).toContain(
      'src/components/blocks/SignupModal/__tests__/adapter.test.ts',
    );
    expect(new Set(Object.values(projects).flat()).size).toBe(
      Object.values(projects).flat().length,
    );
  });
});

describe('escapeTestPathForGlob', () => {
  it('Windows区切りとNextのroute group・動的segmentをliteralとして照合する', () => {
    const file = 'src/app/(main)/sessions/[id]/__tests__/adapter.test.ts';
    const matches = createFilter(
      escapeTestPathForGlob(file.replaceAll('/', '\\')),
      undefined,
      { resolve: false },
    );
    expect(matches(file)).toBe(true);
    expect(matches(file.replace('[id]', 'i'))).toBe(false);
    expect(matches(file.replace('(main)', 'main'))).toBe(false);
  });
});
