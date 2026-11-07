import { describe, expect, it } from 'vitest';

import {
  ciVerificationSummarySchema,
  createCiVerificationSummary,
} from './ciVerificationSummary';
import { verificationFixture } from './fixtures/verification';

import { createHash } from 'node:crypto';

import type { runVerification } from './verificationRun';

type Run = Awaited<ReturnType<typeof runVerification>>;
type Issue = NonNullable<Run['verification']>['issues'][number];

const makeRun = (
  issues: Issue[],
): { plan: ReturnType<typeof verificationFixture>['plan']; run: Run } => {
  const fixture = verificationFixture();
  const chromium = {
    ...fixture.stage,
    context: { ...fixture.stage.context, stageId: 'app-chromium' },
    evidence: {
      ...fixture.stage.evidence,
      context: { ...fixture.stage.evidence.context, stageId: 'app-chromium' },
      result: {
        ...fixture.stage.evidence.result,
        issues: [{ code: 'LEGACY_FAILED' }],
        resultsChecked: false,
      },
    },
    report: { ...fixture.report, status: 'failed' as const },
    processCleanup: { exited: true, errorCount: 1 },
  };
  const auth = {
    ...fixture.stage,
    context: { ...fixture.stage.context, stageId: 'app-chromium-auth' },
    evidence: {
      ...fixture.stage.evidence,
      context: {
        ...fixture.stage.evidence.context,
        stageId: 'app-chromium-auth',
      },
      result: { issues: [{ code: 'STAGE_NOT_RUN' }], counts: {} },
    },
    report: null,
    exitCode: null,
    cleanup: null,
    processCleanup: { exited: false, errorCount: 0 },
  };
  const run: Run = {
    schemaVersion: 1,
    verificationId: fixture.stage.context.verificationId,
    mode: 'partial',
    selection: null,
    status: 'failed',
    phase: 'verification',
    selectionDigest: fixture.stage.context.selectionDigest,
    inputDigestBefore: fixture.stage.context.inputDigest,
    inputDigestAfter: fixture.stage.context.inputDigest,
    checkpoints: [],
    execution: {
      stages: [chromium, auth],
      runs: [
        { stageId: 'app-chromium', runId: '012345abcdef', status: 'failed' },
      ],
    },
    verification: {
      issues,
      counts: {
        business: 1,
        support: 0,
        extras: 2,
        required: 1,
        passed: 0,
        stages: 2,
      },
    },
    failure: null,
    legacyLocalRequested: true,
    integrationLegacyExecuted: false,
  };
  return { plan: fixture.plan, run };
};

describe('CI verification safe summary', () => {
  it('失敗stageと未起動stageを固定語彙で記録し、登録済みcaseのみ識別する', () => {
    const fixture = verificationFixture();
    const key = fixture.plan.requirements[0]?.key;
    if (key === undefined) throw new Error('fixture不足');
    const { plan, run } = makeRun([
      { code: 'RUNNER_EXIT_FAILED', subject: 'app-chromium' },
      { code: 'REQUIRED_NOT_CLEAN_PASS', subject: key },
    ]);
    const result = createCiVerificationSummary(plan, run);
    expect(result.issueCounts).toEqual([
      { code: 'RUNNER_EXIT_FAILED', count: 1 },
      { code: 'REQUIRED_NOT_CLEAN_PASS', count: 1 },
    ]);
    expect(result.caseIssues).toEqual([
      {
        code: 'REQUIRED_NOT_CLEAN_PASS',
        keySha256: createHash('sha256').update(key).digest('hex'),
      },
    ]);
    expect(
      result.stages.map(({ id, runner, report, cleanup }) => ({
        id,
        runner,
        report,
        cleanup,
      })),
    ).toEqual([
      {
        id: 'app-chromium',
        runner: 'failed',
        report: 'failed',
        cleanup: 'complete',
      },
      {
        id: 'app-chromium-auth',
        runner: 'not-run',
        report: 'missing',
        cleanup: 'missing',
      },
    ]);
    expect(ciVerificationSummarySchema.parse(result)).toEqual(result);
  });

  it('大量の未観測結果が失敗caseを押し出さず、未知codeと秘密文字列を公開しない', () => {
    const marker = 'SECRET_CREDENTIAL_MARKER';
    const fixture = verificationFixture();
    const key = fixture.plan.requirements[0]?.key;
    if (key === undefined) throw new Error('fixture不足');
    const { plan, run } = makeRun([
      ...Array.from({ length: 108 }, () => ({
        code: 'RESULT_MISSING',
        subject: key,
      })),
      { code: `PRIVATE_${marker}`, subject: marker },
      { code: 'REQUIRED_NOT_CLEAN_PASS', subject: key },
      { code: 'REPORT_INVALID', subject: marker },
    ]);
    const browserStage = run.execution?.stages[0];
    if (browserStage === undefined) throw new Error('fixture不足');
    browserStage.report = {
      ...fixture.report,
      version: marker,
      tests: fixture.report.tests.map((test) => ({
        ...test,
        titlePath: [marker],
        annotations: [{ type: 'skip', description: marker }],
      })),
    };
    const summary = createCiVerificationSummary(plan, run);
    expect(summary.issueCount).toBe(111);
    expect(summary.unknownIssueCount).toBe(1);
    expect(summary.issueCounts).toContainEqual({
      code: 'RESULT_MISSING',
      count: 108,
    });
    expect(summary.verificationState).toBe('available');
    expect(summary.caseIssues.map(({ code }) => code)).toEqual([
      'REQUIRED_NOT_CLEAN_PASS',
      'RESULT_MISSING',
    ]);
    expect(JSON.stringify(summary)).not.toContain(marker);
    expect(JSON.stringify(summary)).not.toContain(key);
  });

  it('owner行がない実行済みstageを未起動にせず、Storybookのcleanup不要を表す', () => {
    const { plan, run } = makeRun([]);
    const stage = run.execution?.stages[0];
    if (stage === undefined || run.execution === null)
      throw new Error('fixture不足');
    stage.context.stageId = 'storybook';
    stage.evidence.kind = 'storybook';
    stage.cleanup = null;
    stage.processCleanup = { exited: true, errorCount: 0 };
    stage.exitCode = 0;
    stage.report = {
      ...verificationFixture().report,
      context: stage.context,
      profile: 'storybook',
    };
    run.execution.stages = [stage];
    run.execution.runs = [];
    const withoutOwner = createCiVerificationSummary(plan, run).stages[0];
    expect(withoutOwner?.runner).toBe('unknown');
    expect(withoutOwner?.report).toBe('passed');
    expect(withoutOwner?.cleanup).toBe('not-required');
    run.execution.runs = [
      { stageId: 'storybook', runId: null, status: 'passed' },
    ];
    expect(createCiVerificationSummary(plan, run).stages[0]?.runner).toBe(
      'passed',
    );
  });

  it('cleanupタグがcompleteでも問題や残存資源があればincompleteとする', () => {
    const { plan, run } = makeRun([]);
    const stage = run.execution?.stages[0];
    if (stage === undefined || stage.cleanup === null)
      throw new Error('fixture不足');
    stage.cleanup.issues.push({
      code: 'SECRET_MARKER',
      subject: 'SECRET_MARKER',
      message: 'SECRET_MARKER',
    });
    expect(createCiVerificationSummary(plan, run).stages[0]?.cleanup).toBe(
      'incomplete',
    );
    stage.cleanup.issues = [];
    stage.cleanup.remaining.volumes.push({
      name: 'SECRET_MARKER',
      projectLabel: null,
      createdAt: '2026-11-05T00:00:00Z',
    });
    const result = createCiVerificationSummary(plan, run);
    expect(result.stages[0]?.cleanup).toBe('incomplete');
    expect(JSON.stringify(result)).not.toContain('SECRET_MARKER');
  });

  it('全件未観測でも登録済みcaseを識別し、通常の空issuesはavailableとする', () => {
    const { plan, run } = makeRun([]);
    const keys = [...plan.requirements, ...plan.allowedExtraTests].map(
      ({ key }) => key,
    );
    if (keys.length === 0) throw new Error('fixture不足');
    if (run.verification === null) throw new Error('fixture不足');
    expect(createCiVerificationSummary(plan, run).verificationState).toBe(
      'available',
    );
    run.verification.issues = keys.map((subject) => ({
      code: 'RESULT_MISSING',
      subject,
    }));
    const summary = createCiVerificationSummary(plan, run);
    expect(summary.caseIssues).toHaveLength(keys.length);
    expect(
      summary.caseIssues.every(({ code }) => code === 'RESULT_MISSING'),
    ).toBe(true);
    expect(summary.omittedCaseIssueCount).toBe(0);
    expect(JSON.stringify(summary)).not.toContain(keys[0]);
  });

  it.each([
    'timedOut',
    'interrupted',
  ] as const)('reportの%sを失敗へ潰さず保持する', (status) => {
    const { plan, run } = makeRun([]);
    const stage = run.execution?.stages[0];
    if (stage === undefined) throw new Error('fixture不足');
    stage.report = { ...verificationFixture().report, status };
    expect(createCiVerificationSummary(plan, run).stages[0]?.report).toBe(
      status,
    );
  });

  it('case列挙を制限し、execution/verificationがない失敗も安全に表す', () => {
    const fixture = verificationFixture();
    const key = fixture.plan.requirements[0]?.key;
    if (key === undefined) throw new Error('fixture不足');
    const codes = [
      'REQUIRED_NOT_CLEAN_PASS',
      'RESULT_IDENTITY_MISMATCH',
      'UNKNOWN_RESULT',
      'DUPLICATE_RESULT',
      'VITEST_NOT_CLEAN_PASS',
      'LEGACY_EXTRA_RESULT_FAILED',
      'STAGE_MISSING',
      'DEPENDENCY_MISSING',
      'UNKNOWN_REQUIRED_KEY',
      'UNKNOWN_EXTRA_KEY',
      'DUPLICATE_ASSIGNMENT',
      'RESULT_MISSING',
      'RUNNER_EXIT_FAILED',
      'REPORT_INVALID',
    ];
    const { plan, run } = makeRun(
      codes.map((code) => ({ code, subject: key })),
    );
    const summary = createCiVerificationSummary(plan, run);
    expect(summary.caseIssues).toHaveLength(12);
    expect(summary.omittedCaseIssueCount).toBe(2);
    const firstStage = run.execution?.stages[0];
    if (firstStage === undefined || run.execution === null)
      throw new Error('fixture不足');
    run.execution.stages.push(
      {
        ...firstStage,
        context: { ...firstStage.context, stageId: 'UNTRUSTED_STAGE' },
      },
      firstStage,
    );
    expect(createCiVerificationSummary(plan, run).stages).toHaveLength(2);
    expect(
      createCiVerificationSummary(plan, {
        ...run,
        execution: null,
        verification: null,
      }),
    ).toEqual({
      schemaVersion: 1,
      verificationState: 'unavailable',
      issueCount: 0,
      issueCounts: [],
      unknownIssueCount: 0,
      stages: [],
      caseIssues: [],
      omittedCaseIssueCount: 0,
    });
    expect(
      ciVerificationSummarySchema.safeParse({ ...summary, leaked: 'secret' })
        .success,
    ).toBe(false);
    expect(
      ciVerificationSummarySchema.safeParse({
        ...summary,
        issueCount: 1_000_001,
      }).success,
    ).toBe(false);
    expect(
      ciVerificationSummarySchema.safeParse({
        ...summary,
        caseIssues: Array(13).fill(summary.caseIssues[0]),
      }).success,
    ).toBe(false);
  });
});
