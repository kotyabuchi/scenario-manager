import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { discover } from './discover';
import { playwrightSourceMapOptions } from './playwrightSourceMaps';

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const roots: string[] = [];
const location = { file: z.string(), line: z.number(), column: z.number() };
const specSchema = z.object({
  ...location,
  id: z.string(),
  title: z.string(),
  tests: z.array(
    z.object({
      projectName: z.string(),
      status: z.string(),
      results: z.array(
        z.object({
          status: z.string(),
          attachments: z.array(
            z.object({ name: z.string(), body: z.string().optional() }),
          ),
        }),
      ),
    }),
  ),
});
const reportSchema = z.object({
  errors: z.array(z.unknown()),
  suites: z.array(z.object({ specs: z.array(specSchema) })),
  stats: z.object({
    expected: z.number(),
    unexpected: z.number(),
    skipped: z.number(),
    flaky: z.number(),
  }),
});
const identitySchema = z.object({
  testId: z.string(),
  project: z.string(),
  line: z.number(),
  column: z.number(),
});

afterEach(async () => {
  for (const root of roots.splice(0)) {
    if (dirname(root) !== resolve('test-results'))
      throw new Error('fixture削除先が不正です');
    await rm(root, { recursive: true, force: true });
  }
});

describe('実行と列挙の原TS座標', () => {
  it('2projectと同一位置のloop2caseを、実workerのID/座標まで同じ正本へ揃える', async () => {
    const parent = resolve('test-results');
    await mkdir(parent, { recursive: true });
    const root = await mkdtemp(join(parent, 'source-map-run-'));
    roots.push(root);
    await mkdir(join(root, 'specs'));
    await writeFile(join(root, 'package.json'), '{"type":"module"}');
    await writeFile(
      join(root, 'playwright.config.ts'),
      `
import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './specs', workers: 2, retries: 0,
  outputDir: './output', projects: [{ name: 'desktop' }, { name: 'mobile' }] });
`,
    );
    // 型の消去でcompiled行が変わるESMを使い、位置を無視する実装では通らない比較にする。
    const source = `import { test, expect } from '@playwright/test';
type Row = {
  name: string;
  value: number;
};
const rows: Row[] = [{ name: 'one', value: 1 }, { name: 'two', value: 2 }];
for (const row of rows) {
  test(row.name, async ({}, info) => {
    await info.attach('identity', { contentType: 'application/json', body: Buffer.from(JSON.stringify({
      testId: info.testId, project: info.project.name, line: info.line, column: info.column,
    })) });
    expect(row.value).toBeGreaterThan(0);
  });
}
`;
    await writeFile(join(root, 'specs/main.spec.ts'), source);
    const discovery = await discover({
      root,
      profile: 'fixture',
      config: 'playwright.config.ts',
      setupProjects: [],
    });
    expect(discovery.tests).toHaveLength(4);
    expect(
      discovery.tests.every((test) => test.line === 8 && test.column === 3),
    ).toBe(true);
    const cli = createRequire(join(root, 'package.json')).resolve(
      '@playwright/test/cli',
    );
    const options = await playwrightSourceMapOptions(cli);
    const reportFile = join(root, 'report.json');
    await promisify(execFile)(
      process.execPath,
      [
        ...options.args,
        cli,
        'test',
        '--config',
        join(root, 'playwright.config.ts'),
        '--reporter',
        'json',
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          ...options.env,
          PLAYWRIGHT_JSON_OUTPUT_FILE: reportFile,
        },
        timeout: 30_000,
        windowsHide: true,
      },
    );
    const report = reportSchema.parse(
      JSON.parse(await readFile(reportFile, 'utf8')),
    );
    expect(report.errors).toEqual([]);
    expect(report.stats).toMatchObject({
      expected: 4,
      unexpected: 0,
      skipped: 0,
      flaky: 0,
    });
    const seen = new Set<string>();
    for (const suite of report.suites)
      for (const spec of suite.specs) {
        const candidates = discovery.tests.filter(
          (test) =>
            test.file === `specs/${spec.file}` &&
            test.titlePath.length === 1 &&
            test.titlePath[0] === spec.title,
        );
        expect(candidates).toHaveLength(2);
        expect(candidates.some((test) => test.testId === spec.id)).toBe(true);
        for (const result of spec.tests) {
          const test = candidates.find(
            (test) => test.project === result.projectName,
          );
          if (test === undefined) throw new Error('未知project結果');
          expect(spec.line).toBe(test.line);
          expect(spec.column).toBe(test.column);
          expect(result.status).toBe('expected');
          expect(result.results).toHaveLength(1);
          const attempt = result.results[0];
          expect(attempt?.status).toBe('passed');
          const attachments =
            attempt?.attachments.filter(({ name }) => name === 'identity') ??
            [];
          expect(attachments).toHaveLength(1);
          const identity = identitySchema.parse(
            JSON.parse(
              Buffer.from(attachments[0]?.body ?? '', 'base64').toString(
                'utf8',
              ),
            ),
          );
          expect(identity).toEqual({
            testId: test.testId,
            project: test.project,
            line: test.line,
            column: test.column,
          });
          expect(seen.has(test.testId)).toBe(false);
          seen.add(test.testId);
        }
      }
    expect(seen.size).toBe(4);
  }, 45_000);
});
