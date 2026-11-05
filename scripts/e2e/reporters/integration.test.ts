import { afterEach, describe, expect, it } from 'vitest';

import { integrationReportSchema } from '../integrationSchema';

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0)) {
    if (dirname(root) !== resolve('test-results'))
      throw new Error('fixture削除先が不正です');
    await rm(root, { recursive: true, force: true });
  }
});

describe('Vitest integration reporterの標準API', () => {
  it.each([
    false,
    true,
  ])('標準result/options/locationとhook失敗を保存し、error本文を公開しない: hook=%s', async (hookFailure) => {
    const parent = resolve('test-results');
    await mkdir(parent, { recursive: true });
    const root = await mkdtemp(join(parent, 'integration-reporter-'));
    roots.push(root);
    await writeFile(join(root, 'package.json'), '{"type":"module"}');
    await writeFile(
      join(root, 'vitest.integration.verified.config.ts'),
      `
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { name:'integration', include:['sample.test.ts'], pool:'forks',
  fileParallelism:false, maxWorkers:1, includeTaskLocation:true, retry:0,
  reporters:[${JSON.stringify(resolve('scripts/e2e/reporters/integration.ts'))}], watch:false } });
`,
    );
    await writeFile(
      join(root, 'sample.test.ts'),
      `
import { describe, test, expect, afterAll } from 'vitest';
describe('suite', () => {
  test('pass', { meta:{ ledger:{caseId:'example',variant:'pass',binding:'main'}, unsafeSecret:'private-metadata-sentinel' } }, () => { expect(1).toBe(1); });
  test.skip('skip', { meta:{ ledger:{caseId:'example',variant:'skip',binding:'main'} } }, () => {});
  afterAll(() => { ${hookFailure ? 'throw new Error("private-hook-sentinel")' : ''} });
});
`,
    );
    const cli = createRequire(join(root, 'package.json')).resolve(
      'vitest/vitest.mjs',
    );
    let failed = false;
    try {
      await promisify(execFile)(
        process.execPath,
        [
          cli,
          'run',
          '--config',
          join(root, 'vitest.integration.verified.config.ts'),
        ],
        {
          cwd: root,
          env: { ...process.env, SCENARIO_E2E_RUN_ID: '012345abcdef' },
          windowsHide: true,
          timeout: 30_000,
        },
      );
    } catch {
      failed = true;
    }
    expect(failed).toBe(hookFailure);
    const raw = await readFile(
      join(root, 'test-results/integration/012345abcdef/vitest.json'),
      'utf8',
    );
    expect(raw).not.toContain('private-hook-sentinel');
    expect(raw).not.toContain('private-metadata-sentinel');
    const report = integrationReportSchema.parse(JSON.parse(raw));
    expect(report.reason).toBe(hookFailure ? 'failed' : 'passed');
    expect(report.reporterErrorCount).toBe(0);
    expect(report.tests).toHaveLength(2);
    const passed = report.tests.find(({ claim }) => claim.variant === 'pass');
    expect(passed).toMatchObject({
      file: 'sample.test.ts',
      titlePath: ['suite', 'pass'],
      fullName: 'suite > pass',
      line: 4,
      state: 'passed',
      options: {
        mode: 'run',
        fails: false,
        concurrent: false,
        retry: 0,
        repeats: 0,
      },
      diagnostic: { retryCount: 0, repeatCount: 0, flaky: false },
      meta: null,
    });
    expect(
      report.tests.find(({ claim }) => claim.variant === 'skip'),
    ).toMatchObject({
      state: 'skipped',
      options: { mode: 'skip' },
      meta: null,
    });
    expect(report.modules).toHaveLength(1);
    expect(report.modules[0]?.state).toBe(hookFailure ? 'failed' : 'passed');
    expect(report.modules[0]?.suiteErrorCount).toBe(hookFailure ? 2 : 0);
  }, 45_000);
});
