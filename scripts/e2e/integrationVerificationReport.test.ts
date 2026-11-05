import { afterEach, describe, expect, it } from 'vitest';

import { integrationReportSchema } from './integrationSchema';
import { createIntegrationVerificationReport } from './integrationVerificationReport';
import {
  prepareVerificationDirectory,
  prepareVerificationStage,
  verificationEnvironment,
  verificationStagePath,
} from './verificationContext';
import { verificationReportSchema } from './verificationSchema';

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

import type { IntegrationReport } from './integrationSchema';

const CONTEXT = {
  verificationId: 'abcdef012345',
  stageId: 'integration',
  selectionDigest: 'a'.repeat(64),
  inputDigest: 'b'.repeat(64),
};
const fixture = (): IntegrationReport =>
  integrationReportSchema.parse({
    schemaVersion: 1,
    runner: {
      name: 'vitest',
      version: '3.2.4',
      project: 'integration',
      pool: 'forks',
      fileParallelism: false,
      maxWorkers: 1,
      includeTaskLocation: true,
    },
    config: 'vitest.integration.verified.config.ts',
    runId: '012345abcdef',
    tests: [
      {
        testId: 'actual-vitest-test-id',
        file: 'src/schedule.test.ts',
        titlePath: ['suite', 'case'],
        fullName: 'suite > case',
        line: 12,
        column: 3,
        claim: {
          caseId: 'private-claim-not-standard',
          variant: 'creator-only',
          binding: 'main',
        },
        options: {
          mode: 'run',
          fails: false,
          concurrent: false,
          retry: 0,
          repeats: 0,
        },
        state: 'passed',
        errorCount: 0,
        meta: null,
        diagnostic: {
          retryCount: 0,
          repeatCount: 0,
          flaky: false,
          startTime: 1234,
          duration: 50,
        },
      },
    ],
    modules: [
      {
        file: 'src/schedule.test.ts',
        project: 'integration',
        state: 'passed',
        errorCount: 0,
        suiteErrorCount: 0,
      },
    ],
    reason: 'passed',
    unhandledErrorCount: 0,
    reporterErrorCount: 0,
  });
const firstTest = (report: IntegrationReport) => {
  const test = report.tests[0];
  if (!test) throw new Error('fixture testがありません');
  return test;
};
const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0)) {
    if (dirname(resolve(root)) !== resolve('test-results'))
      throw new Error('fixture cleanup pathが不正です');
    await rm(root, { recursive: true, force: true });
  }
});

describe('createIntegrationVerificationReport', () => {
  it('標準identityとdiagnosticを保存し、fixture/claim/lease/run metadataを渡さない', () => {
    const input = fixture();
    const actual = createIntegrationVerificationReport(CONTEXT, input);
    expect(actual).toMatchObject({
      context: CONTEXT,
      profile: 'integration',
      runner: 'vitest',
      version: '3.2.4',
      status: 'passed',
      reporterCompleted: true,
      errorCount: 0,
      reporterErrorCount: 0,
    });
    expect(actual.tests).toEqual([
      {
        testId: 'actual-vitest-test-id',
        file: 'src/schedule.test.ts',
        titlePath: ['suite', 'case'],
        line: 12,
        column: 3,
        project: 'integration',
        repeatEachIndex: 0,
        expectedStatus: 'passed',
        annotations: [],
        outcome: 'expected',
        results: [
          { retry: 0, status: 'passed', errorCount: 0, annotations: [] },
        ],
        vitest: {
          options: firstTest(input).options,
          diagnostic: firstTest(input).diagnostic,
        },
      },
    ]);
    expect(actual.vitest).toEqual({
      modules: input.modules,
      unhandledErrorCount: 0,
    });
    const raw = JSON.stringify(actual);
    for (const excluded of [
      'private-claim-not-standard',
      '012345abcdef',
      'fullName',
      'meta',
      'lease',
      'fixture',
      'config',
    ])
      expect(raw).not.toContain(excluded);
  });

  it.each([
    'failed',
    'interrupted',
  ] as const)('run終了理由%sとmodule/suite/unhandled数を保持する', (reason) => {
    const input = fixture();
    input.reason = reason;
    input.modules = [
      {
        file: 'src/schedule.test.ts',
        project: 'integration',
        state: 'failed',
        errorCount: 2,
        suiteErrorCount: 3,
      },
    ];
    input.unhandledErrorCount = 4;
    input.reporterErrorCount = 5;
    const actual = createIntegrationVerificationReport(CONTEXT, input);
    expect(actual.status).toBe(reason);
    expect(actual.errorCount).toBe(9);
    expect(actual.reporterErrorCount).toBe(5);
    expect(actual.vitest).toEqual({
      modules: input.modules,
      unhandledErrorCount: 4,
    });
  });

  it.each([
    'pending',
    'skipped',
    'failed',
  ] as const)('未成功状態%sをsuccessful attemptへ変換しない', (state) => {
    const input = fixture();
    const test = firstTest(input);
    test.state = state;
    test.errorCount = state === 'failed' ? 2 : 0;
    const result = createIntegrationVerificationReport(CONTEXT, input).tests[0];
    expect(result?.outcome).toBe(state === 'failed' ? 'unexpected' : state);
    expect(result?.results).toEqual(
      state === 'pending'
        ? []
        : [
            {
              retry: 0,
              status: state,
              errorCount: test.errorCount,
              annotations: [],
            },
          ],
    );
  });

  it('retry後passをretry0へ潰さず、repeats/optionsの禁止値もそのまま残す', () => {
    const input = fixture();
    const test = firstTest(input);
    test.options = {
      mode: 'only',
      fails: true,
      concurrent: true,
      retry: 2,
      repeats: 3,
    };
    test.diagnostic = {
      retryCount: 1,
      repeatCount: 2,
      flaky: true,
      startTime: 123,
      duration: 99,
    };
    const result = createIntegrationVerificationReport(CONTEXT, input).tests[0];
    expect(result?.expectedStatus).toBe('failed');
    expect(result?.outcome).toBe('flaky');
    expect(result?.results).toEqual([
      { retry: 1, status: 'passed', errorCount: 0, annotations: [] },
    ]);
    expect(result?.vitest).toEqual({
      options: test.options,
      diagnostic: test.diagnostic,
    });
  });

  it.each([
    'skip',
    'todo',
  ] as const)('mode %sはexpectedStatusにも保持する', (mode) => {
    const input = fixture();
    firstTest(input).options.mode = mode;
    expect(
      createIntegrationVerificationReport(CONTEXT, input).tests[0]
        ?.expectedStatus,
    ).toBe('skipped');
  });

  it('未実行testのdiagnostic nullを作り替えない', () => {
    const input = fixture();
    firstTest(input).diagnostic = null;
    firstTest(input).state = 'pending';
    expect(
      createIntegrationVerificationReport(CONTEXT, input).tests[0]?.vitest
        ?.diagnostic,
    ).toBeNull();
  });
});

describe('integration reporterの共通context接続', () => {
  it.each([
    'normal',
    'retry',
    'hook',
    'collision',
  ] as const)('実Vitest APIでnativeと共通reportを維持する: %s', async (variant) => {
    const parent = resolve('test-results');
    await mkdir(parent, { recursive: true });
    const root = await mkdtemp(join(parent, 'integration-common-reporter-'));
    roots.push(root);
    await writeFile(join(root, 'package.json'), '{"type":"module"}');
    const config = join(root, 'vitest.integration.verified.config.ts');
    await writeFile(
      config,
      `import { defineConfig } from 'vitest/config';
export default defineConfig({ test:{name:'integration',include:['sample.test.ts'],pool:'forks',fileParallelism:false,maxWorkers:1,includeTaskLocation:true,retry:0,
reporters:[${JSON.stringify(resolve('scripts/e2e/reporters/integration.ts'))}],watch:false} });`,
    );
    await writeFile(
      join(root, 'sample.test.ts'),
      `import { describe,test,expect,afterAll } from 'vitest';
let attempts=0;
describe('suite',()=>{
test('case',{retry:${variant === 'retry' ? 1 : 0},meta:{ledger:{caseId:'example',variant:'creator-only',binding:'main'},unsafeSecret:'private-metadata-sentinel'}},()=>{
attempts++; ${variant === 'retry' ? 'if(attempts===1)throw new Error("private-retry-sentinel");' : ''} expect(1).toBe(1); });
afterAll(()=>{${variant === 'hook' ? 'throw new Error("private-hook-sentinel");' : ''}});
});`,
    );
    prepareVerificationDirectory(root, CONTEXT.verificationId);
    prepareVerificationStage(root, CONTEXT);
    const commonPath = verificationStagePath(root, CONTEXT, 'vitest.json');
    if (variant === 'collision')
      await writeFile(commonPath, 'original-evidence');
    const cli = createRequire(join(root, 'package.json')).resolve(
      'vitest/vitest.mjs',
    );
    let didFail = false;
    try {
      await promisify(execFile)(
        process.execPath,
        [cli, 'run', '--config', config],
        {
          cwd: root,
          env: {
            ...process.env,
            SCENARIO_E2E_RUN_ID: '012345abcdef',
            ...verificationEnvironment(CONTEXT),
          },
          windowsHide: true,
          timeout: 30_000,
        },
      );
    } catch {
      didFail = true;
    }
    expect(didFail).toBe(variant === 'hook' || variant === 'collision');
    const native = integrationReportSchema.parse(
      JSON.parse(
        await readFile(
          join(root, 'test-results/integration/012345abcdef/vitest.json'),
          'utf8',
        ),
      ),
    );
    expect(native.tests).toHaveLength(1);
    const raw = await readFile(commonPath, 'utf8');
    if (variant === 'collision') {
      expect(raw).toBe('original-evidence');
      return;
    }
    for (const secret of [
      'private-metadata-sentinel',
      'private-retry-sentinel',
      'private-hook-sentinel',
    ])
      expect(raw).not.toContain(secret);
    const standard = verificationReportSchema.parse(JSON.parse(raw));
    expect(standard).toEqual(
      createIntegrationVerificationReport(CONTEXT, native),
    );
    expect(standard.reporterCompleted).toBe(true);
    if (variant === 'retry') {
      expect(standard.tests[0]?.outcome).toBe('flaky');
      expect(standard.tests[0]?.results[0]?.retry).toBe(1);
      expect(standard.tests[0]?.vitest?.diagnostic?.retryCount).toBe(1);
    }
    if (variant === 'hook') expect(standard.errorCount).toBeGreaterThan(0);
  }, 45_000);
});
