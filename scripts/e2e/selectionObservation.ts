import { isNil } from 'ramda';

import { shadowObservationSchema } from './selectionShadow';
import { verificationTestKey } from './verificationPlan';
import { digestVerificationPlan } from './verificationPlanDigest';
import { verificationReportSchema } from './verificationSchema';
import { verifyResults } from './verifyResults';

import { isDeepStrictEqual } from 'node:util';

import type { ShadowObservation } from './selectionShadow';
import type { runVerification } from './verificationRun';
import type {
  VerificationPlan,
  VerificationStageResult,
  VerificationTestResult,
} from './verificationSchema';

type ShadowProvenance = Pick<
  ShadowObservation,
  | 'snapshotDigest'
  | 'inputDigest'
  | 'collectionDigest'
  | 'rulesDigest'
  | 'fullPlanDigest'
>;
type ObservedRun = Pick<
  Awaited<ReturnType<typeof runVerification>>,
  | 'verificationId'
  | 'status'
  | 'phase'
  | 'selectionDigest'
  | 'inputDigestBefore'
  | 'inputDigestAfter'
  | 'checkpoints'
  | 'execution'
  | 'verification'
  | 'failure'
>;

const control = (annotations: VerificationTestResult['annotations']) =>
  annotations.some(({ type }) =>
    ['skip', 'fixme', 'fail', 'only', 'todo'].includes(type),
  );

const confirmedAssertion = (test: VerificationTestResult) => {
  const attempt = test.results[0];
  return (
    test.expectedStatus === 'passed' &&
    test.outcome === 'unexpected' &&
    !control(test.annotations) &&
    test.results.length === 1 &&
    !isNil(attempt) &&
    attempt.status === 'failed' &&
    attempt.retry === 0 &&
    attempt.errorCount === 1 &&
    attempt.failureKind === 'assertion' &&
    !control(attempt.annotations)
  );
};

const storybookAssertionKeys = (stage: VerificationStageResult) => {
  const report = verificationReportSchema.safeParse(stage.report);
  const { counts, issues } = stage.evidence.result;
  const { requiredKeys, extraKeys } = stage;
  if (
    !report.success ||
    report.data.profile !== 'storybook' ||
    report.data.runner !== 'playwright' ||
    report.data.status !== 'failed' ||
    report.data.errorCount !== 0 ||
    report.data.reporterErrorCount !== 0 ||
    !report.data.reporterCompleted ||
    report.data.version !== '1.57.0' ||
    stage.evidence.kind !== 'storybook' ||
    stage.exitCode !== 1 ||
    !isNil(stage.signal) ||
    !stage.processCleanup.exited ||
    stage.processCleanup.errorCount !== 0 ||
    !isNil(stage.cleanup) ||
    extraKeys.length !== 0 ||
    !isDeepStrictEqual(
      [...stage.evidence.checkedKeys].sort(),
      [...requiredKeys].sort(),
    ) ||
    issues.length !== 1 ||
    issues[0]?.code !== 'STORYBOOK_FAILED' ||
    counts.expected !== requiredKeys.length ||
    counts.tests !== requiredKeys.length
  )
    return [];

  const failed = report.data.tests
    .filter(confirmedAssertion)
    .map((test) => verificationTestKey(report.data.profile, test));
  if (
    failed.length === 0 ||
    failed.some((key) => !requiredKeys.includes(key)) ||
    counts.passed !== requiredKeys.length - failed.length
  )
    return [];
  return failed;
};

/** shadow用に、独立runの安全に特定できる失敗だけを必須identityへ対応させる。 */
export const observeSelectionRun = (input: {
  run: ObservedRun;
  plan: VerificationPlan;
  provenance: ShadowProvenance;
}): ShadowObservation => {
  const { run, plan, provenance } = input;
  const { execution } = run;
  const checkpoints = new Set(run.checkpoints.map(({ phase }) => phase));
  const selectionDigest = digestVerificationPlan(plan);
  const finish = (
    status: ShadowObservation['status'],
    failedRequiredKeys: string[] = [],
  ) =>
    shadowObservationSchema.parse({
      ...provenance,
      verificationId: run.verificationId,
      selectionDigest,
      requiredKeys: plan.requirements.map(({ key }) => key).sort(),
      failedRequiredKeys: failedRequiredKeys.sort(),
      status,
    });

  if (
    isNil(execution) ||
    isNil(run.verification) ||
    !isNil(run.failure) ||
    run.selectionDigest !== selectionDigest ||
    run.inputDigestBefore !== provenance.inputDigest ||
    run.inputDigestAfter !== provenance.inputDigest ||
    !checkpoints.has('before-stages') ||
    run.checkpoints.some(
      ({ digest, changes }) =>
        digest !== provenance.inputDigest ||
        Object.values(changes).some((paths) => paths.length > 0),
    ) ||
    execution.runs.some(
      ({ status }) => status !== 'passed' && status !== 'failed',
    ) ||
    execution.stages.length !== execution.runs.length ||
    execution.stages.some(
      ({ context }) =>
        execution.runs.filter(({ stageId }) => stageId === context.stageId)
          .length !== 1,
    )
  )
    return finish('inconclusive');

  const verified = verifyResults({
    plan,
    verificationId: run.verificationId,
    selectionDigest,
    inputDigestBefore: provenance.inputDigest,
    inputDigestAfter: provenance.inputDigest,
    stages: execution.stages,
  });
  if (!isDeepStrictEqual(run.verification, verified))
    return finish('inconclusive');
  if (verified.issues.length === 0) {
    return finish(
      run.status === 'passed' &&
        run.phase === 'complete' &&
        execution.runs.every(({ status }) => status === 'passed')
        ? 'complete'
        : 'inconclusive',
    );
  }
  if (run.status !== 'failed' || run.phase !== 'verification')
    return finish('inconclusive');

  const failed = new Set<string>();
  const assertionStages = new Set<string>();
  for (const stage of execution.stages) {
    const stageId = stage.context.stageId;
    if (
      execution.runs.find((entry) => entry.stageId === stageId)?.status !==
      'failed'
    )
      continue;
    if (
      !checkpoints.has(`${stageId}:after-tests`) ||
      !checkpoints.has(`${stageId}:after-cleanup`)
    )
      return finish('inconclusive');
    // 失敗したnative DB/legacy検査は、失敗attemptのfixture証拠をまだ保証できない。
    const keys = storybookAssertionKeys(stage);
    if (keys.length === 0) return finish('inconclusive');
    assertionStages.add(stageId);
    for (const key of keys) failed.add(key);
  }
  if (
    failed.size === 0 ||
    verified.issues.some(({ code, subject }) =>
      code === 'REQUIRED_NOT_CLEAN_PASS'
        ? !failed.has(subject)
        : !assertionStages.has(subject) ||
          ![
            'RUNNER_EXIT_FAILED',
            'RUN_NOT_CLEAN_PASS',
            'BOUNDARY_EVIDENCE_FAILED',
            'BOUNDARY_COUNT_MISMATCH',
          ].includes(code),
    )
  )
    return finish('inconclusive');
  return finish('complete', [...failed]);
};
