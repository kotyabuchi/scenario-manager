import { afterEach, describe, expect, it, vi } from 'vitest';

import { discover } from './discover';

import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const roots: string[] = [];
const createFixture = async (spec: string, config = '') => {
  const parent = resolve('test-results');
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(join(parent, 'discovery-fixture-'));
  roots.push(root);
  await mkdir(join(root, 'specs'));
  await writeFile(join(root, 'package.json'), '{"type":"module"}');
  await writeFile(join(root, 'specs/main.spec.ts'), spec);
  await writeFile(
    join(root, 'playwright.config.ts'),
    config ||
      `
    import { defineConfig } from '@playwright/test';
    export default defineConfig({ testDir: './specs' });
  `,
  );
  return root;
};

afterEach(async () => {
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) {
    if (dirname(root) !== resolve('test-results'))
      throw new Error('fixtureの削除先が不正です');
    await rm(root, { recursive: true, force: true });
  }
});

describe('Playwright実登録の安全な列挙', () => {
  it('body・hook・setup・webServerを実行せずproject/loop/repeatを保存する', async () => {
    const root = await createFixture(
      `
      import { test } from '@playwright/test';
      test.beforeAll(() => { throw new Error('hook must not run'); });
      test.describe('business', () => {
        for (const row of [1, 2]) test('row ' + row, {
          tag: ['@case:example', '@variant:row-' + row],
        }, async () => { throw new Error('body must not run'); });
      });
    `,
      `
      import { defineConfig } from '@playwright/test';
      export default defineConfig({
        testDir: './specs', repeatEach: 2,
        globalSetup: './global-setup.ts',
        webServer: { command: 'node server.cjs', port: 37999 },
        projects: [
          { name: 'setup', testMatch: /setup.spec.ts/ },
          { name: 'desktop', testIgnore: /setup.spec.ts/, dependencies: ['setup'] },
          { name: 'mobile', testIgnore: /setup.spec.ts/, dependencies: ['setup'] },
        ],
      });
    `,
    );
    await writeFile(
      join(root, 'specs/setup.spec.ts'),
      `
      import { test } from '@playwright/test';
      test('authenticate', async () => { throw new Error('setup must not run'); });
    `,
    );
    await writeFile(
      join(root, 'global-setup.ts'),
      `throw new Error('global setup must not load'); export default () => {};`,
    );
    await writeFile(
      join(root, 'server.cjs'),
      `throw new Error('webServer must not run');`,
    );
    const result = await discover({
      root,
      profile: 'fixture',
      config: 'playwright.config.ts',
      setupProjects: ['setup'],
    });
    expect(result.errors).toEqual([]);
    expect(result.tests).toHaveLength(10);
    expect(result.tests.filter((test) => test.isSetup)).toHaveLength(2);
    expect(result.projects.map((project) => project.repeatEach)).toEqual([
      2, 2, 2,
    ]);
    const business = result.tests.filter((test) => !test.isSetup);
    expect(new Set(business.map((test) => test.repeatEachIndex))).toEqual(
      new Set([0, 1]),
    );
    expect(new Set(business.map((test) => test.project))).toEqual(
      new Set(['desktop', 'mobile']),
    );
    expect(
      business.every(
        (test) =>
          test.file === 'specs/main.spec.ts' &&
          test.titlePath[0] === 'business',
      ),
    ).toBe(true);
    expect(business.every((test) => test.tags.includes('@case:example'))).toBe(
      true,
    );
    expect(
      result.projects.find((project) => project.name === 'desktop')
        ?.dependencies,
    ).toEqual(['setup']);
    expect(
      result.projects.every((project) => project.testDir === 'specs'),
    ).toBe(true);
  }, 30_000);

  it('skip/xfailの注釈と列挙時の期待statusをそのまま保存する', async () => {
    const root = await createFixture(`
      import { test } from '@playwright/test';
      test.skip('unavailable', async () => {});
      test.fail('known failure', async () => {});
    `);
    const result = await discover({
      root,
      profile: 'fixture',
      config: 'playwright.config.ts',
    });
    expect(result.tests.map((test) => test.expectedStatus).sort()).toEqual([
      'passed',
      'skipped',
    ]);
    expect(
      result.tests
        .flatMap((test) =>
          test.annotations.map((annotation) => annotation.type),
        )
        .sort(),
    ).toEqual(['fail', 'skip']);
  }, 30_000);

  it.each([
    'module',
    'commonjs',
  ])('%sでも元のTSの行・列を一度だけ逆引きする', async (moduleType) => {
    const source = [
      "import { test } from '@playwright/test';",
      "import { value } from '../value';",
      '',
      'type Value = number;',
      'const typed: Value = value;',
      '',
      "test('direct', async () => { void typed; });",
      '',
      "test.describe('nested', () => {",
      '',
      '  for (const row of [1, 2]) {',
      "    test('row ' + row, async () => {});",
      '  }',
      '});',
    ].join('\n');
    const root = await createFixture(source);
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ type: moduleType }),
    );
    await writeFile(join(root, 'value.ts'), 'export const value: number = 1;');
    const result = await discover({
      root,
      profile: 'fixture',
      config: 'playwright.config.ts',
    });
    expect(
      result.tests.map(({ titlePath, line, column }) => ({
        titlePath,
        line,
        column,
      })),
    ).toEqual([
      {
        titlePath: ['direct'],
        line: 7,
        column: moduleType === 'commonjs' ? 5 : 1,
      },
      {
        titlePath: ['nested', 'row 1'],
        line: 12,
        column: moduleType === 'commonjs' ? 9 : 5,
      },
      {
        titlePath: ['nested', 'row 2'],
        line: 12,
        column: moduleType === 'commonjs' ? 9 : 5,
      },
    ]);
  }, 30_000);

  it('親の資格情報やNODE_OPTIONSを継承しない', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'must-not-inherit');
    vi.stubEnv('E2E_PASSWORD', 'must-not-inherit');
    vi.stubEnv('NODE_OPTIONS', '--definitely-invalid');
    const root = await createFixture(`
      import { test } from '@playwright/test';
      if (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.E2E_PASSWORD || process.env.NODE_OPTIONS)
        throw new Error('credentials inherited');
      test('listed', async () => {});
    `);
    const result = await discover({
      root,
      profile: 'fixture',
      config: 'playwright.config.ts',
    });
    expect(result.tests).toHaveLength(1);
  }, 30_000);

  it('登録中のエラーとrunner終了codeを失わずログを保持する', async () => {
    const root = await createFixture(
      `throw new Error('registration fixture failure');`,
    );
    await expect(
      discover({ root, profile: 'fixture', config: 'playwright.config.ts' }),
    ).rejects.toThrow('code=1');
    const directory = (await readdir(join(root, 'test-results/discovery')))[0];
    if (!directory) throw new Error('実行ディレクトリがありません');
    const report = await readFile(
      join(root, 'test-results/discovery', directory, 'discovery.json'),
      'utf8',
    );
    expect(report).toContain('registration fixture failure');
    expect(
      await readdir(join(root, 'test-results/discovery', directory)),
    ).toEqual(expect.arrayContaining(['stdout.log', 'stderr.log']));
  }, 30_000);

  it('exit 0でもreportがない列挙を失敗にする', async () => {
    const root = await createFixture('process.exit(0);');
    await expect(
      discover({ root, profile: 'fixture', config: 'playwright.config.ts' }),
    ).rejects.toThrow('reportが欠落');
  }, 30_000);

  it('握りつぶされたimport時の副作用も違反記録で失敗にする', async () => {
    const root = await createFixture(`
      import { test } from '@playwright/test';
      import { writeFileSync } from 'node:fs';
      try { writeFileSync('unexpected.txt', 'must not write'); } catch {}
      test('listed', async () => {});
    `);
    await expect(
      discover({ root, profile: 'fixture', config: 'playwright.config.ts' }),
    ).rejects.toThrow('副作用');
    expect(await readdir(root)).not.toContain('unexpected.txt');
  }, 30_000);

  it('列挙が終了しない場合にtimeoutを報告する', async () => {
    const root = await createFixture('while (true) {}');
    await expect(
      discover({
        root,
        profile: 'fixture',
        config: 'playwright.config.ts',
        timeoutMs: 1000,
      }),
    ).rejects.toThrow('timeout=true');
  }, 10_000);

  it('異なるrootの未検証runner版をツール側の版で誤承認しない', async () => {
    const root = await createFixture('');
    const packageDirectory = join(root, 'node_modules/@playwright/test');
    await mkdir(packageDirectory, { recursive: true });
    await mkdir(join(root, 'node_modules/playwright'), { recursive: true });
    await writeFile(
      join(packageDirectory, 'package.json'),
      JSON.stringify({
        name: '@playwright/test',
        version: '9.9.9-fixture',
        exports: { './cli': './cli.cjs' },
      }),
    );
    await writeFile(
      join(root, 'node_modules/playwright/package.json'),
      JSON.stringify({
        name: 'playwright',
        version: '9.9.9-fixture',
      }),
    );
    await writeFile(
      join(packageDirectory, 'cli.cjs'),
      `
      const fs = require('node:fs'); const path = require('node:path');
      fs.writeFileSync(path.join(process.env.E2E_DISCOVERY_DIRECTORY, 'discovery.json'),
        JSON.stringify({ schemaVersion: 1, profile: process.env.E2E_DISCOVERY_PROFILE,
          projects: [], tests: [], errors: [] }));
    `,
    );
    await expect(
      discover({ root, profile: 'fixture', config: 'playwright.config.ts' }),
    ).rejects.toThrow('code=1');
    const directory = (await readdir(join(root, 'test-results/discovery')))[0];
    if (!directory) throw new Error('実行ディレクトリがありません');
    const resultDirectory = join(root, 'test-results/discovery', directory);
    expect(await readdir(resultDirectory)).not.toContain('discovery.json');
    const stderr = await readFile(join(resultDirectory, 'stderr.log'), 'utf8');
    expect(stderr).toContain(
      'source map adapterはPlaywright 1.57.0で検証済みです: 9.9.9-fixture',
    );
  });

  it('プロジェクト外のconfigを読み込まない', async () => {
    const root = await createFixture('');
    await expect(
      discover({
        root,
        profile: 'fixture',
        config: resolve('playwright.config.ts'),
      }),
    ).rejects.toThrow('プロジェクト内');
  });
});
