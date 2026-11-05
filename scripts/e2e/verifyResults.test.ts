import { describe, expect, it } from 'vitest';

import { verificationFixture } from './fixtures/verification';
import { verificationTestKey } from './verificationPlan';
import { digestVerificationPlan } from './verificationPlanDigest';
import { verificationReportSchema } from './verificationSchema';
import { verifyResults } from './verifyResults';

type Fixture = ReturnType<typeof verificationFixture>;
const first = (value: Fixture) => {
  const result = value.report.tests.find(({ testId }) => testId === 'first-0');
  if (result === undefined) throw new Error('fixture不足');
  return result;
};
const synchronize = (value: Fixture) => {
  value.stage.report = value.report;
  value.input.stages = [value.stage];
};

describe('標準runner結果と境界判定のAND', () => {
  it('全binding/repeat/setupと明示skipを照合し入力を変更しない', () => {
    const value = verificationFixture();
    synchronize(value);
    const before = structuredClone(value.input);
    expect(verifyResults(value.input)).toEqual({
      issues: [],
      counts: {
        business: 4,
        support: 1,
        extras: 2,
        required: 5,
        passed: 5,
        stages: 1,
      },
    });
    expect(value.input).toEqual(before);
  });
  const faults: [string, string, (value: Fixture) => void][] = [
    [
      'missing',
      'RESULT_MISSING',
      (v) => {
        v.report.tests = v.report.tests.filter(
          ({ testId }) => testId !== 'first-1',
        );
      },
    ],
    [
      'binding missing',
      'RESULT_MISSING',
      (v) => {
        v.report.tests = v.report.tests.filter(
          ({ titlePath }) => titlePath.at(-1) !== 'second',
        );
      },
    ],
    [
      'duplicate',
      'DUPLICATE_RESULT',
      (v) => {
        v.report.tests.push(structuredClone(first(v)));
      },
    ],
    [
      'unknown',
      'UNKNOWN_RESULT',
      (v) => {
        first(v).testId = 'unknown';
      },
    ],
    [
      'wrong file',
      'RESULT_IDENTITY_MISMATCH',
      (v) => {
        first(v).file = 'e2e/other.spec.ts';
      },
    ],
    [
      'skip',
      'REQUIRED_NOT_CLEAN_PASS',
      (v) => {
        first(v).expectedStatus = 'skipped';
      },
    ],
    [
      'xfail',
      'REQUIRED_NOT_CLEAN_PASS',
      (v) => {
        first(v).annotations.push({ type: 'fail' });
      },
    ],
    [
      'interrupted',
      'REQUIRED_NOT_CLEAN_PASS',
      (v) => {
        const attempt = first(v).results[0];
        if (attempt) attempt.status = 'interrupted';
      },
    ],
    [
      'retry success',
      'REQUIRED_NOT_CLEAN_PASS',
      (v) => {
        const result = first(v);
        result.outcome = 'flaky';
        const attempt = result.results[0];
        if (attempt) result.results.push({ ...attempt, retry: 1 });
      },
    ],
    [
      'empty attempt',
      'REQUIRED_NOT_CLEAN_PASS',
      (v) => {
        first(v).results = [];
      },
    ],
    [
      'setup failed',
      'REQUIRED_NOT_CLEAN_PASS',
      (v) => {
        const result = v.report.tests.find(
          ({ testId }) => testId === 'authenticate',
        );
        if (result) result.outcome = 'unexpected';
      },
    ],
    [
      'report missing',
      'REPORT_INVALID',
      (v) => {
        v.stage.report = null;
      },
    ],
    [
      'old report',
      'REPORT_CONTEXT_MISMATCH',
      (v) => {
        v.report.context.verificationId = 'abcdef012345';
      },
    ],
    [
      'wrong stage',
      'REPORT_CONTEXT_MISMATCH',
      (v) => {
        v.report.context.stageId = 'other';
      },
    ],
    [
      'old proof',
      'CONTEXT_MISMATCH',
      (v) => {
        v.stage.evidence.context.inputDigest = 'd'.repeat(64);
      },
    ],
    [
      'changed input',
      'INPUT_CHANGED',
      (v) => {
        v.input.inputDigestAfter = 'd'.repeat(64);
      },
    ],
    [
      'reporter incomplete',
      'RUN_NOT_CLEAN_PASS',
      (v) => {
        v.report.reporterCompleted = false;
      },
    ],
    [
      'global error',
      'RUN_NOT_CLEAN_PASS',
      (v) => {
        v.report.errorCount = 1;
      },
    ],
    [
      'exit failure',
      'RUNNER_EXIT_FAILED',
      (v) => {
        v.stage.exitCode = 1;
      },
    ],
    [
      'signal',
      'RUNNER_EXIT_FAILED',
      (v) => {
        v.stage.signal = 'SIGTERM';
      },
    ],
    [
      'process alive',
      'RUNNER_EXIT_FAILED',
      (v) => {
        v.stage.processCleanup.exited = false;
      },
    ],
    [
      'cleanup failed',
      'CLEANUP_INCOMPLETE',
      (v) => {
        if (v.stage.cleanup) v.stage.cleanup.status = 'incomplete';
      },
    ],
    [
      'cleanup missing',
      'CLEANUP_INCOMPLETE',
      (v) => {
        v.stage.cleanup = null;
      },
    ],
    [
      'fixture failure',
      'BOUNDARY_EVIDENCE_FAILED',
      (v) => {
        v.stage.evidence.result.issues.push({ code: 'ACTOR_MISMATCH' });
      },
    ],
    [
      'unchecked legacy',
      'BOUNDARY_EVIDENCE_FAILED',
      (v) => {
        v.stage.evidence.result.resultsChecked = false;
      },
    ],
    [
      'partial proof',
      'BOUNDARY_EVIDENCE_FAILED',
      (v) => {
        v.stage.evidence.checkedKeys.pop();
      },
    ],
    [
      'unassigned',
      'STAGE_MISSING',
      (v) => {
        v.stage.requiredKeys.pop();
      },
    ],
    [
      'stage duplicate',
      'DUPLICATE_STAGE',
      (v) => {
        v.input.stages.push(structuredClone(v.stage));
      },
    ],
  ];
  it.each(faults)('%sを拒否する', (_name, code, mutate) => {
    const value = verificationFixture();
    synchronize(value);
    mutate(value);
    if (_name !== 'report missing') value.stage.report = value.report;
    expect(verifyResults(value.input).issues.map(({ code }) => code)).toContain(
      code,
    );
  });
  it('縮小planと元のdigest/contextを組み合わせた取り違えを拒否する', () => {
    const value = verificationFixture();
    synchronize(value);
    expect(verifyResults(value.input).issues).toEqual([]);
    const removed = value.plan.requirements.find(
      ({ kind }) => kind === 'business',
    );
    if (removed === undefined) throw new Error('fixture不足');
    value.plan.requirements = value.plan.requirements.filter(
      ({ key }) => key !== removed.key,
    );
    value.stage.requiredKeys = value.stage.requiredKeys.filter(
      (key) => key !== removed.key,
    );
    value.stage.evidence.checkedKeys = value.stage.evidence.checkedKeys.filter(
      (key) => key !== removed.key,
    );
    value.report.tests = value.report.tests.filter(
      ({ testId }) => testId !== removed.test.testId,
    );
    expect(digestVerificationPlan(value.plan)).not.toBe(
      value.input.selectionDigest,
    );
    expect(verifyResults(value.input).issues).toContainEqual({
      code: 'PLAN_DIGEST_MISMATCH',
      subject: 'plan',
    });
  });

  it('空planをdocs-onlyとして成功にしない', () => {
    const value = verificationFixture();
    value.input.plan = {
      schemaVersion: 1,
      requirements: [],
      allowedExtraTests: [],
    };
    value.input.stages = [];
    expect(verifyResults(value.input).issues).toContainEqual({
      code: 'PLAN_INVALID',
      subject: 'plan',
    });
  });
  it('Vitestの標準module/options/diagnosticを自己metaとは別に要求する', () => {
    const base = verificationFixture();
    const original = base.plan.requirements.find(
      (entry) => entry.kind === 'business' && entry.test.repeatEachIndex === 0,
    );
    if (original === undefined || original.execution === null)
      throw new Error('fixture不足');
    const requirement = structuredClone(original);
    requirement.profile = 'integration';
    requirement.runtime = 'vitest-node';
    requirement.test.project = 'integration';
    requirement.dependencies = [];
    requirement.execution = {
      ...original.execution,
      profile: 'integration',
      project: 'integration',
      runtime: 'vitest-node',
    };
    requirement.key = verificationTestKey('integration', requirement.test);
    const test = structuredClone(first(base));
    test.project = 'integration';
    test.vitest = {
      options: {
        mode: 'run',
        fails: false,
        concurrent: false,
        retry: 0,
        repeats: 0,
      },
      diagnostic: {
        retryCount: 0,
        repeatCount: 0,
        flaky: false,
        startTime: 1,
        duration: 1,
      },
    };
    const report = verificationReportSchema.parse({
      ...base.report,
      profile: 'integration',
      runner: 'vitest',
      version: '3.2.4',
      tests: [test],
      vitest: {
        unhandledErrorCount: 0,
        modules: [
          {
            file: test.file,
            project: 'integration',
            state: 'passed',
            errorCount: 0,
            suiteErrorCount: 0,
          },
        ],
      },
    });
    const input = {
      ...base.input,
      plan: {
        schemaVersion: 1 as const,
        requirements: [requirement],
        allowedExtraTests: [],
      },
      stages: [
        {
          ...base.stage,
          requiredKeys: [requirement.key],
          extraKeys: [],
          report,
          evidence: {
            ...base.stage.evidence,
            kind: 'integration' as const,
            checkedKeys: [requirement.key],
            result: {
              issues: [],
              counts: { expected: 1, tests: 1, passed: 1, journals: 1 },
            },
          },
        },
      ],
    };
    const selectionDigest = digestVerificationPlan(input.plan);
    input.selectionDigest = selectionDigest;
    for (const stage of input.stages) {
      stage.context.selectionDigest = selectionDigest;
      stage.evidence.context.selectionDigest = selectionDigest;
      stage.report.context.selectionDigest = selectionDigest;
    }
    expect(verifyResults(input).issues).toEqual([]);
    for (const fault of [
      'missing',
      'fails',
      'retry',
      'repeat',
      'module',
      'unhandled',
    ]) {
      const current = structuredClone(input);
      const native = current.stages[0]?.report.tests[0]?.vitest;
      if (native === undefined || native.diagnostic === null)
        throw new Error('fixture不足');
      if (fault === 'missing')
        Reflect.deleteProperty(
          current.stages[0]?.report.tests[0] ?? {},
          'vitest',
        );
      if (fault === 'fails') native.options.fails = true;
      if (fault === 'retry') native.diagnostic.retryCount = 1;
      if (fault === 'repeat') native.options.repeats = 1;
      if (fault === 'module') {
        const module = current.stages[0]?.report.vitest?.modules[0];
        if (module) module.suiteErrorCount = 1;
      }
      if (fault === 'unhandled') {
        const module = current.stages[0]?.report.vitest;
        if (module) module.unhandledErrorCount = 1;
      }
      expect(verifyResults(current).issues.map(({ code }) => code)).toContain(
        fault === 'module' || fault === 'unhandled'
          ? 'VITEST_MODULE_FAILED'
          : 'VITEST_NOT_CLEAN_PASS',
      );
    }
  });

  it('boolだけの境界証明では成功にしない', () => {
    const value = verificationFixture();
    Reflect.set(value.stage.evidence, 'result', true);
    expect(verifyResults(value.input).issues).toContainEqual({
      code: 'STAGE_INVALID',
      subject: 'stage:0',
    });
  });
});
