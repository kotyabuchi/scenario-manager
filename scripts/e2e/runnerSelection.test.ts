import { afterEach, describe, expect, it } from 'vitest';

import { discover } from './discover';
import { discoverIntegration } from './discoverIntegration';
import { localCommandEnvironment } from './environmentCommands';
import {
  integrationRuntimeFiles,
  VERIFIED_INTEGRATION_FILES_ENV,
} from './integrationVerifiedFiles';
import { playwrightSourceMapOptions } from './playwrightSourceMaps';
import {
  createRunnerSelection,
  emitPlaywrightTestList,
  projectRunnerExpectations,
} from './runnerSelection';

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const parent = resolve('test-results');
const roots: string[] = [];
const command = promisify(execFile);
const fixture = async () => {
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(join(parent, 'runner-selection-'));
  roots.push(root);
  await writeFile(join(root, 'package.json'), '{"type":"module"}');
  return root;
};
const put = async (root: string, file: string, contents: string) => {
  const path = join(root, file);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents);
};
const observed = async (root: string) =>
  (await readFile(join(root, 'observed.log'), 'utf8'))
    .trim()
    .split('\n')
    .sort();
const recordPlaywright = `
import { appendFileSync } from 'node:fs';
const record = (title, info) => appendFileSync('observed.log',
  [info.project.name, title, info.repeatEachIndex].join(':')+'\\n');
`;

afterEach(async () => {
  for (const root of roots.splice(0)) {
    if (
      dirname(root) !== parent ||
      !basename(root).startsWith('runner-selection-')
    )
      throw new Error('fixture削除先が不正です');
    await rm(root, { recursive: true, force: true });
  }
});

describe('無DBの絞り込み付き実runner', () => {
  it('Playwright 1.57は同一行の別タイトル、repeat、兄弟directoryのsetupを正確に扱う', async () => {
    const root = await fixture();
    const config = 'playwright.config.ts';
    await put(
      root,
      config,
      `import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir:'./specs', workers:1, forbidOnly:true,
  projects:[{name:'setup', testDir:'./setup'},
    {name:'chosen', dependencies:['setup'], repeatEach:2},
    {name:'unselected'}] });`,
    );
    await put(
      root,
      'setup/boot.spec.ts',
      `import { test } from '@playwright/test';
${recordPlaywright}
for (const name of ['boot','warmup']) test(name, ({}, info) => record(name, info));`,
    );
    await put(
      root,
      'specs/main.spec.ts',
      `import { test } from '@playwright/test';
${recordPlaywright}
test.describe('serial group', () => {
  test.describe.configure({ mode:'serial' });
  for (const name of ['one > literal [x]','another']) test(name, ({}, info) => record(name, info));
});
test('not selected', () => { throw Error('unselected test ran'); });
test('unsafe › separator', () => { throw Error('unsafe test ran'); });`,
    );
    const full = await discover({
      root,
      profile: 'fixture',
      config,
      setupProjects: ['setup'],
    });
    const tests = full.tests.filter(
      ({ project, titlePath }) =>
        project === 'setup' ||
        (project === 'chosen' &&
          ['one > literal [x]', 'another'].includes(titlePath.at(-1) ?? '')),
    );
    expect(tests).toHaveLength(6);
    expect(
      new Set(
        tests
          .filter(({ project }) => project === 'chosen')
          .map(({ line }) => line),
      ).size,
    ).toBe(1);
    const create = (selected: typeof tests) =>
      createRunnerSelection({
        discovery: full,
        tests: selected,
        playwrightRootDir: 'specs',
      });
    const selection = create(tests);
    if (selection.kind !== 'playwright')
      throw new Error('Playwright selection is required');
    expect(() =>
      create(tests.filter(({ repeatEachIndex }) => repeatEachIndex === 0)),
    ).toThrow('全repeat');
    expect(() =>
      create(tests.filter(({ titlePath }) => !titlePath.includes('warmup'))),
    ).toThrow('依存project');
    expect(() =>
      create(
        full.tests.filter(
          ({ project, titlePath }) =>
            project === 'unselected' &&
            titlePath.includes('unsafe › separator'),
        ),
      ),
    ).toThrow('表現できない');
    const filtered = await discover({
      root,
      profile: 'fixture',
      config,
      selection,
    });
    expect(filtered.tests).toEqual(tests);
    await expect(
      discover({
        root,
        profile: 'fixture',
        config,
        selection: {
          ...selection,
          expected: {
            ...selection.expected,
            tests: tests.filter(({ project }) => project !== 'setup'),
          },
        },
      }),
    ).rejects.toThrow('有効planと一致しません');
    expect(
      emitPlaywrightTestList(selection).split('\n').filter(Boolean),
    ).toHaveLength(4);

    const list = join(root, 'runner-test-list.log');
    await writeFile(list, emitPlaywrightTestList(selection));
    const cli = createRequire(join(root, 'package.json')).resolve(
      '@playwright/test/cli',
    );
    const sourceMaps = await playwrightSourceMapOptions(cli);
    await command(
      process.execPath,
      [
        ...sourceMaps.args,
        cli,
        'test',
        '--config',
        config,
        '--test-list',
        list,
      ],
      {
        cwd: root,
        env: { ...localCommandEnvironment(process.env), ...sourceMaps.env },
      },
    );
    expect(await observed(root)).toEqual([
      'chosen:another:0',
      'chosen:another:1',
      'chosen:one > literal [x]:0',
      'chosen:one > literal [x]:1',
      'setup:boot:0',
      'setup:warmup:0',
    ]);
  }, 90_000);

  it('Playwrightの無名projectを限定し、再収集で宣言の変化を拒否する', async () => {
    const root = await fixture();
    const config = 'playwright.config.ts';
    const spec = 'specs/main.spec.ts';
    await put(
      root,
      config,
      `import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir:'./specs', workers:1 });`,
    );
    await put(
      root,
      spec,
      `import { test } from '@playwright/test';
test('first', () => {}); test('second', () => {});`,
    );
    const full = await discover({ root, profile: 'fixture', config });
    const tests = full.tests.filter(({ titlePath }) =>
      titlePath.includes('first'),
    );
    const selection = createRunnerSelection({
      discovery: full,
      tests,
      playwrightRootDir: 'specs',
    });
    if (selection.kind !== 'playwright')
      throw new Error('Playwright selection is required');
    expect(emitPlaywrightTestList(selection)).toBe(
      '[] › main.spec.ts › first\n',
    );
    expect(
      (await discover({ root, profile: 'fixture', config, selection })).tests,
    ).toEqual(tests);
    await put(
      root,
      spec,
      `import { test } from '@playwright/test';
test.skip('first', () => {}); test('second', () => {});`,
    );
    await expect(
      discover({ root, profile: 'fixture', config, selection }),
    ).rejects.toThrow('一致しません');
  }, 60_000);

  it('Vitestはファイル中の全登録を再収集し、非選択moduleを評価しない', async () => {
    const root = await fixture();
    const chosen = 'src/scenario/[id]/sample.integration.test.ts';
    const others = [
      'src/scenario/[id]/sample-extra.integration.test.ts',
      'src/other.integration.test.ts',
    ];
    const meta =
      "{meta:{ledger:{caseId:'fixture',variant:'default',binding:'main'}}}";
    await put(
      root,
      chosen,
      `import { test } from 'vitest';
import { appendFileSync } from 'node:fs';
for (const name of ['first','second']) test(name, ${meta}, () => appendFileSync('observed.log', name+'\\n'));`,
    );
    for (const path of others)
      await put(
        root,
        path,
        `import { test } from 'vitest';
if (process.env.${VERIFIED_INTEGRATION_FILES_ENV}) throw Error('non-selected module evaluated');
test('first', ${meta}, () => { throw Error('unselected body ran'); });`,
      );
    await put(
      root,
      'scripts/e2e/db-test-files.json',
      JSON.stringify({
        schemaVersion: 1,
        files: [],
        mockedFiles: [],
        verifiedFiles: [chosen, ...others].map((path) => ({
          path,
          reason: '無DBの実runner fixture',
        })),
      }),
    );
    const { discovery } = await discoverIntegration({ root });
    expect(discovery.tests).toHaveLength(4);
    const env = localCommandEnvironment(process.env);
    expect(() =>
      integrationRuntimeFiles(root, {
        ...env,
        [VERIFIED_INTEGRATION_FILES_ENV]: 'null',
      }),
    ).toThrow();
    expect(() =>
      integrationRuntimeFiles(root, {
        ...env,
        [VERIFIED_INTEGRATION_FILES_ENV]: JSON.stringify([`${chosen}*`]),
      }),
    ).toThrow('verified一覧');
    const tests = discovery.tests.filter(({ file }) => file === chosen);
    expect(() =>
      createRunnerSelection({ discovery, tests: tests.slice(0, 1) }),
    ).toThrow('ファイル内の全登録');
    const selection = createRunnerSelection({ discovery, tests });
    if (selection.kind !== 'vitest')
      throw new Error('Vitest selection is required');
    expect(selection.files).toEqual([chosen]);
    const filtered = await discoverIntegration({ root, selection });
    expect(filtered.discovery.tests).toEqual(tests);
    expect(
      projectRunnerExpectations(
        selection,
        discovery.tests.map((test) => ({ test })),
      ),
    ).toEqual(tests.map((test) => ({ test })));

    const importPath = (name: string) =>
      JSON.stringify(resolve('scripts/e2e', name).replaceAll('\\', '/'));
    await put(
      root,
      'vitest.config.ts',
      `import { defineConfig } from 'vitest/config';
import { integrationRuntimeFiles } from ${importPath('integrationVerifiedFiles.ts')};
import { escapeTestPathForGlob } from ${importPath('testClassification.ts')};
export default defineConfig({ test:{ include:integrationRuntimeFiles(process.cwd(), process.env).map(escapeTestPathForGlob),
  pool:'forks', maxWorkers:1, minWorkers:1, fileParallelism:false, passWithNoTests:false } });`,
    );
    const cli = createRequire(join(root, 'package.json')).resolve(
      'vitest/vitest.mjs',
    );
    await command(
      process.execPath,
      [cli, 'run', '--config', 'vitest.config.ts'],
      {
        cwd: root,
        env: {
          ...localCommandEnvironment(process.env),
          [VERIFIED_INTEGRATION_FILES_ENV]: JSON.stringify(selection.files),
        },
      },
    );
    expect(await observed(root)).toEqual(['first', 'second']);
  }, 60_000);
});
