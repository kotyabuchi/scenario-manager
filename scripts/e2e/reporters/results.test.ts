import { isNil } from 'ramda';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { discover } from '../discover';
import { createVerificationResultsFixture } from '../fixtures/verificationResults';
import { playwrightSourceMapOptions } from '../playwrightSourceMaps';
import { verificationReportSchema } from '../verificationSchema';

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const roots: string[] = [];
const context = {
  verificationId: '123456abcdef',
  stageId: 'fixture',
  selectionDigest: 'a'.repeat(64),
  inputDigest: 'b'.repeat(64),
};

afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});

const run = async (
  mode: Parameters<typeof createVerificationResultsFixture>[2],
  output: 'normal' | 'existing' | 'missing' = 'normal',
) => {
  await mkdir(resolve('test-results'), { recursive: true });
  const root = await mkdtemp(resolve('test-results/verification-reporter-'));
  roots.push(root);
  const config = await createVerificationResultsFixture(
    root,
    resolve('scripts/e2e/reporters/results.ts'),
    mode,
  );
  const directory = join(
    root,
    'test-results/verification',
    context.verificationId,
    context.stageId,
  );
  const file = join(directory, 'playwright.json');
  if (output !== 'missing') await mkdir(directory, { recursive: true });
  if (output === 'existing') await writeFile(file, 'OLD_REPORT');
  const cli = createRequire(join(root, 'package.json')).resolve(
    '@playwright/test/cli',
  );
  const options = await playwrightSourceMapOptions(cli);
  let exitCode = 0;
  try {
    await promisify(execFile)(
      process.execPath,
      [...options.args, cli, 'test', '--config', config],
      {
        cwd: root,
        env: {
          ...process.env,
          ...options.env,
          SCENARIO_E2E_VERIFICATION_ID: context.verificationId,
          SCENARIO_E2E_STAGE_ID: context.stageId,
          SCENARIO_E2E_SELECTION_DIGEST: context.selectionDigest,
          SCENARIO_E2E_INPUT_DIGEST: context.inputDigest,
        },
        timeout: 30_000,
        windowsHide: true,
      },
    );
  } catch (error) {
    // stdout/stderrは検証用の秘密markerを含むので、失敗診断に転記しない。
    const parsed = z.object({ code: z.number().int() }).safeParse(error);
    if (!parsed.success) throw new Error('fixture runnerが異常終了しました');
    exitCode = parsed.data.code;
  }
  return { root, file, exitCode };
};

const readReport = async (file: string) => {
  const content = await readFile(file, 'utf8');
  expect(content).not.toContain('PRIVATE_');
  expect(content).not.toContain(
    Buffer.from('PRIVATE_ATTACHMENT').toString('base64'),
  );
  return verificationReportSchema.parse(JSON.parse(content));
};

describe('Playwright共通結果の標準Reporter', () => {
  it('repeat2・同位置loop・同名別suite・setupを列挙時のID/原TS位置で全保存する', async () => {
    const { root, file, exitCode } = await run('passed');
    expect(exitCode).toBe(0);
    const report = await readReport(file);
    expect(report).toMatchObject({
      context,
      profile: 'fixture',
      runner: 'playwright',
      version: '1.57.0',
      status: 'passed',
      reporterCompleted: true,
      reporterErrorCount: 0,
      errorCount: 0,
    });
    const discovery = await discover({
      root,
      profile: 'fixture',
      config: 'playwright.config.ts',
      setupProjects: ['setup'],
    });
    expect(discovery.errors).toEqual([]);
    expect(report.tests).toHaveLength(9);
    expect(report.tests).toHaveLength(discovery.tests.length);
    for (const expected of discovery.tests) {
      const matches = report.tests.filter(
        (row) =>
          row.testId === expected.testId &&
          row.repeatEachIndex === expected.repeatEachIndex &&
          row.project === expected.project,
      );
      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject({
        file: expected.file,
        line: expected.line,
        column: expected.column,
        titlePath: expected.titlePath,
        expectedStatus: 'passed',
        annotations: expected.annotations,
        outcome: 'expected',
        results: [
          {
            retry: 0,
            status: 'passed',
            errorCount: 0,
            annotations: expected.annotations,
          },
        ],
      });
    }
    expect(
      discovery.tests.filter(({ tags }) => tags.includes('@binding:main')),
    ).toHaveLength(2);
    expect(
      discovery.tests.filter(({ tags }) => tags.includes('@binding:secondary')),
    ).toHaveLength(2);
    // 生の添付は別の公式JSONにのみ残し、共通reportからは排除する。
    expect(await readFile(join(root, 'private.json'), 'utf8')).toContain(
      Buffer.from('PRIVATE_ATTACHMENT').toString('base64'),
    );
  }, 45_000);

  it('repeat片側failとskip/xfail/retry成功を標準status/annotations/全attemptで区別する', async () => {
    const { file, exitCode } = await run('outcomes');
    expect(exitCode).toBe(1);
    const report = await readReport(file);
    expect(report.status).toBe('failed');
    const one = report.tests.filter(
      ({ titlePath }) => titlePath.at(-1) === 'one',
    );
    expect(
      one.map(({ repeatEachIndex, outcome }) => ({ repeatEachIndex, outcome })),
    ).toEqual([
      { repeatEachIndex: 0, outcome: 'expected' },
      { repeatEachIndex: 1, outcome: 'unexpected' },
    ]);
    const skips = report.tests.filter(
      ({ titlePath }) => titlePath.at(-1) === 'skip',
    );
    expect(skips).toHaveLength(2);
    for (const row of skips) {
      expect(row.expectedStatus).toBe('skipped');
      expect(row.outcome).toBe('skipped');
      expect(row.results[0]?.status).toBe('skipped');
      expect(row.annotations.map(({ type }) => type)).toContain('skip');
    }
    const xfails = report.tests.filter(
      ({ titlePath }) => titlePath.at(-1) === 'xfail',
    );
    expect(xfails).toHaveLength(2);
    for (const row of xfails) {
      expect(row.expectedStatus).toBe('failed');
      expect(row.outcome).toBe('expected');
      expect(row.results[0]?.errorCount).toBeGreaterThan(0);
      expect(row.results[0]?.annotations.map(({ type }) => type)).toContain(
        'fail',
      );
    }
    const retries = report.tests.filter(
      ({ titlePath }) => titlePath.at(-1) === 'eventually passes',
    );
    expect(retries).toHaveLength(2);
    for (const row of retries) {
      expect(row.outcome).toBe('flaky');
      expect(
        row.results.map(({ retry, status }) => ({ retry, status })),
      ).toEqual([
        { retry: 0, status: 'failed' },
        { retry: 1, status: 'passed' },
      ]);
    }
  }, 45_000);

  it('早期打切りでも未完了repeatを結果集合から消さない', async () => {
    const { file, exitCode } = await run('stop');
    expect(exitCode).toBe(1);
    const report = await readReport(file);
    expect(report.status).toBe('failed');
    expect(report.tests).toHaveLength(9);
    expect(
      report.tests.some(
        ({ results }) =>
          results.length === 0 ||
          results.some(({ status }) => status === 'skipped'),
      ),
    ).toBe(true);
  }, 45_000);

  it('runner全体onErrorを本文なしで計数する', async () => {
    const { file, exitCode } = await run('on-error');
    expect(exitCode).toBe(1);
    const report = await readReport(file);
    expect(report.status).toBe('failed');
    expect(report.errorCount).toBeGreaterThan(0);
  }, 45_000);

  it('古いreportと出力不能を成功にせず、既存の証拠を上書きしない', async () => {
    for (const output of ['existing', 'missing'] as const) {
      const result = await run('passed', output);
      expect(result.exitCode).toBe(1);
      if (output === 'existing')
        expect(await readFile(result.file, 'utf8')).toBe('OLD_REPORT');
      else {
        const error = await readFile(result.file, 'utf8').catch(
          (reason: unknown) => reason,
        );
        expect(isNil(error)).toBe(false);
        expect(error).toBeInstanceOf(Error);
      }
    }
  }, 60_000);
});
