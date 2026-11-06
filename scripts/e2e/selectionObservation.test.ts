import { describe, expect, it } from 'vitest';

import { observeSelectionRun } from './selectionObservation';
import { compareSelectionShadow } from './selectionShadow';
import { verificationTestKey } from './verificationPlan';
import { digestVerificationPlan } from './verificationPlanDigest';
import { verifyResults } from './verifyResults';

import type {
  VerificationPlan,
  VerificationReport,
  VerificationRequirement,
  VerificationStageResult,
} from './verificationSchema';

type ObservationInput = Parameters<typeof observeSelectionRun>[0];
const digest = (letter: string) => letter.repeat(64);
const story = (name: string): VerificationRequirement => {
  const test = {
    testId: name,
    file: '.storybook/tests/example.spec.ts',
    line: 1,
    column: 1,
    titlePath: [name],
    project: '',
    repeatEachIndex: 0,
    tags: [],
    annotations: [],
    expectedStatus: 'passed' as const,
    isSetup: false,
  };
  return {
    key: verificationTestKey('storybook', test),
    profile: 'storybook',
    runtime: 'storybook',
    kind: 'business',
    test,
    claim: { caseId: name, variant: 'default', binding: 'main' },
    execution: null,
    checks: [],
    dependencies: [],
  };
};
const first = story('first');
const second = story('second');
const fullPlan: VerificationPlan = {
  schemaVersion: 1,
  requirements: [first, second],
  allowedExtraTests: [],
};
const partialPlan: VerificationPlan = { ...fullPlan, requirements: [first] };
const provenance = {
  snapshotDigest: digest('a'),
  inputDigest: digest('b'),
  collectionDigest: digest('c'),
  rulesDigest: digest('d'),
  fullPlanDigest: digestVerificationPlan(fullPlan),
};

const fixture = (plan = fullPlan, failed = true) => {
  const verificationId = failed ? '123456abcdef' : 'fedcba654321';
  const selectionDigest = digestVerificationPlan(plan);
  const context = {
    verificationId,
    selectionDigest,
    inputDigest: provenance.inputDigest,
    stageId: 'storybook',
  };
  const status = failed ? 'failed' : 'passed';
  const report: VerificationReport = {
    schemaVersion: 1,
    context,
    profile: 'storybook',
    runner: 'playwright',
    version: '1.57.0',
    status,
    errorCount: 0,
    reporterErrorCount: 0,
    reporterCompleted: true,
    tests: plan.requirements.map(
      ({ test: { tags: _tags, isSetup: _isSetup, ...test } }) => {
        const isFailure = failed && test.testId === 'second';
        return {
          ...test,
          outcome: isFailure ? 'unexpected' : 'expected',
          results: [
            {
              status: isFailure ? 'failed' : 'passed',
              retry: 0,
              errorCount: isFailure ? 1 : 0,
              annotations: [],
              ...(isFailure ? { failureKind: 'assertion' } : {}),
            },
          ],
        };
      },
    ),
  };
  const requiredKeys = plan.requirements.map(({ key }) => key);
  const stage: VerificationStageResult = {
    context,
    requiredKeys,
    extraKeys: [],
    report,
    exitCode: failed ? 1 : 0,
    signal: null,
    cleanup: null,
    processCleanup: { exited: true, errorCount: 0 },
    evidence: {
      kind: 'storybook',
      context,
      checkedKeys: [...requiredKeys],
      result: {
        issues: failed ? [{ code: 'STORYBOOK_FAILED' }] : [],
        counts: {
          expected: requiredKeys.length,
          tests: requiredKeys.length,
          passed: requiredKeys.length - Number(failed),
        },
      },
    },
  };
  const run: ObservationInput['run'] = {
    verificationId,
    selectionDigest,
    status,
    phase: failed ? 'verification' : 'complete',
    inputDigestBefore: provenance.inputDigest,
    inputDigestAfter: provenance.inputDigest,
    checkpoints: [
      'before-stages',
      'storybook:before-tests',
      'storybook:after-tests',
      'storybook:after-cleanup',
    ].map((phase) => ({
      phase,
      digest: provenance.inputDigest,
      changes: { added: [], removed: [], changed: [] },
    })),
    execution: {
      stages: [stage],
      runs: [{ stageId: 'storybook', status, runId: null }],
    },
    verification: null,
    failure: null,
  };
  const refresh = () => {
    run.verification = verifyResults({
      plan,
      verificationId,
      selectionDigest,
      inputDigestBefore: provenance.inputDigest,
      inputDigestAfter: provenance.inputDigest,
      stages: [stage],
    });
  };
  refresh();
  return { report, stage, run, plan, provenance, refresh };
};

describe('実run receiptからshadow失敗を正規化', () => {
  it('検証済みassertionだけをcompleteの失敗にし、partialで欠けた実キーを検出する', () => {
    const full = observeSelectionRun(fixture());
    const partial = observeSelectionRun(fixture(partialPlan, false));
    expect(full).toMatchObject({
      status: 'complete',
      failedRequiredKeys: [second.key],
    });
    expect(partial).toMatchObject({
      status: 'complete',
      failedRequiredKeys: [],
    });
    expect(compareSelectionShadow({ fullPlan, full, partial })).toMatchObject({
      status: 'missed-required-failure',
      missedRequiredKeys: [second.key],
    });
  });

  it.each<[string, (value: ReturnType<typeof fixture>) => void]>([
    [
      'assertion未確認',
      ({ report }) => {
        for (const test of report.tests)
          for (const attempt of test.results) delete attempt.failureKind;
      },
    ],
    [
      'reporter失敗',
      ({ report }) => {
        report.reporterErrorCount = 1;
      },
    ],
    [
      'runner全体エラー',
      ({ report }) => {
        report.errorCount = 1;
      },
    ],
    [
      '異なる登録',
      ({ report }) => {
        const test = report.tests.at(-1);
        if (test) test.line++;
      },
    ],
    [
      '結果欠落',
      ({ report }) => {
        report.tests.pop();
      },
    ],
    [
      '終了signal',
      ({ stage }) => {
        stage.signal = 'SIGTERM';
      },
    ],
    [
      'checkpoint/cleanup失敗',
      ({ stage }) => {
        stage.processCleanup.errorCount = 1;
      },
    ],
    [
      'native集合不一致',
      ({ stage }) => {
        stage.evidence.checkedKeys.pop();
      },
    ],
    [
      'native不明障害',
      ({ stage }) => {
        stage.evidence.result.issues.push({ code: 'CLEANUP_FAILED' });
      },
    ],
    [
      '別のnative runner',
      ({ stage }) => {
        stage.evidence.kind = 'schedule';
      },
    ],
    [
      '途中編集',
      ({ run }) => {
        run.checkpoints[0]?.changes.changed.push('src/example.ts');
      },
    ],
    [
      'run未完了',
      ({ run }) => {
        run.execution?.runs.pop();
      },
    ],
    [
      'cleanup checkpoint欠落',
      ({ run }) => {
        run.checkpoints.pop();
      },
    ],
    [
      '実行後入力不一致',
      ({ run }) => {
        run.inputDigestAfter = digest('e');
      },
    ],
  ])('%s は失敗キーを確定しない', (_label, mutate) => {
    const value = fixture();
    mutate(value);
    value.refresh();
    expect(observeSelectionRun(value)).toMatchObject({
      status: 'inconclusive',
      failedRequiredKeys: [],
    });
  });
});
