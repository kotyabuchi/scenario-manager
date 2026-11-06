import { isNil } from 'ramda';

import { verificationTestKey } from './verificationPlan';
import { digestVerificationPlan } from './verificationPlanDigest';
import {
  verificationContextSchema,
  verificationPlanSchema,
  verificationReportSchema,
  verificationStageResultSchema,
} from './verificationSchema';

import { isDeepStrictEqual } from 'node:util';

import type {
  VerificationContext,
  VerificationPlan,
  VerificationStageResult,
  VerificationTestResult,
} from './verificationSchema';

const sameKeys = (left: string[], right: string[]) =>
  left.length === right.length &&
  new Set(left).size === left.length &&
  isDeepStrictEqual([...left].sort(), [...right].sort());
const control = (annotations: VerificationTestResult['annotations']) =>
  annotations.some(({ type }) =>
    ['skip', 'fixme', 'fail', 'only', 'todo'].includes(type),
  );
const cleanPass = (result: VerificationTestResult) =>
  result.expectedStatus === 'passed' &&
  result.outcome === 'expected' &&
  !control(result.annotations) &&
  result.results.length === 1 &&
  result.results.every(
    (attempt) =>
      attempt.retry === 0 &&
      attempt.status === 'passed' &&
      attempt.errorCount === 0 &&
      !control(attempt.annotations),
  );

/** 標準runner結果と既存fixture/legacy adapterの実判定をANDする。本文の意味・証拠の改ざん不能性は主張しない。 */
export const verifyResults = (input: {
  plan: VerificationPlan;
  verificationId: VerificationContext['verificationId'];
  selectionDigest: VerificationContext['selectionDigest'];
  inputDigestBefore: string;
  inputDigestAfter: string;
  stages: unknown[];
}) => {
  const issues: { code: string; subject: string }[] = [];
  const add = (code: string, subject: string) => {
    issues.push({ code, subject });
  };
  const plan = verificationPlanSchema.parse(input.plan);
  if (digestVerificationPlan(plan) !== input.selectionDigest)
    add('PLAN_DIGEST_MISMATCH', 'plan');
  const expected = new Map(
    plan.requirements.map((entry) => [entry.key, entry]),
  );
  const extras = new Map(
    plan.allowedExtraTests.map((entry) => [entry.key, entry]),
  );
  if (
    expected.size !== plan.requirements.length ||
    extras.size !== plan.allowedExtraTests.length ||
    !plan.requirements.some(({ kind }) => kind === 'business') ||
    plan.requirements.some(
      (entry) => entry.key !== verificationTestKey(entry.profile, entry.test),
    ) ||
    plan.allowedExtraTests.some(
      (entry) =>
        entry.key !== verificationTestKey(entry.profile, entry.test) ||
        expected.has(entry.key),
    )
  )
    add('PLAN_INVALID', 'plan');
  if (input.inputDigestBefore !== input.inputDigestAfter)
    add('INPUT_CHANGED', 'verification');
  const assigned = new Set<string>();
  const seen = new Set<string>();
  const stageIds = new Set<string>();
  let passed = 0;
  for (const [index, raw] of input.stages.entries()) {
    const parsed = verificationStageResultSchema.safeParse(raw);
    if (!parsed.success) {
      add('STAGE_INVALID', `stage:${index}`);
      continue;
    }
    const stage = parsed.data;
    const subject = stage.context.stageId;
    if (stageIds.has(subject)) add('DUPLICATE_STAGE', subject);
    stageIds.add(subject);
    const context: VerificationContext = {
      verificationId: input.verificationId,
      stageId: subject,
      selectionDigest: input.selectionDigest,
      inputDigest: input.inputDigestBefore,
    };
    if (
      !verificationContextSchema.safeParse(context).success ||
      !isDeepStrictEqual(stage.context, context) ||
      !isDeepStrictEqual(stage.evidence.context, context)
    )
      add('CONTEXT_MISMATCH', subject);
    const keys = [...stage.requiredKeys, ...stage.extraKeys];
    if (keys.length === 0 || new Set(keys).size !== keys.length)
      add('STAGE_SELECTION_INVALID', subject);
    for (const key of stage.requiredKeys)
      if (!expected.has(key)) add('UNKNOWN_REQUIRED_KEY', key);
    for (const key of stage.extraKeys)
      if (!extras.has(key)) add('UNKNOWN_EXTRA_KEY', key);
    for (const key of keys) {
      if (assigned.has(key)) add('DUPLICATE_ASSIGNMENT', key);
      assigned.add(key);
    }
    if (
      stage.exitCode !== 0 ||
      !isNil(stage.signal) ||
      !stage.processCleanup.exited ||
      stage.processCleanup.errorCount !== 0
    )
      add('RUNNER_EXIT_FAILED', subject);
    if (
      !sameKeys(keys, stage.evidence.checkedKeys) ||
      stage.evidence.result.issues.length !== 0
    )
      add('BOUNDARY_EVIDENCE_FAILED', subject);
    const reportResult = verificationReportSchema.safeParse(stage.report);
    if (!reportResult.success) {
      add('REPORT_INVALID', subject);
      continue;
    }
    const report = reportResult.data;
    if (!isDeepStrictEqual(report.context, context))
      add('REPORT_CONTEXT_MISMATCH', subject);
    if (
      report.status !== 'passed' ||
      report.errorCount !== 0 ||
      report.reporterErrorCount !== 0 ||
      !report.reporterCompleted ||
      report.version !==
        (report.runner === 'playwright' ? '1.57.0' : '3.2.4') ||
      (report.profile === 'integration') !== (report.runner === 'vitest')
    )
      add('RUN_NOT_CLEAN_PASS', subject);
    const kind =
      report.profile === 'app'
        ? 'legacy'
        : report.profile === 'isolated'
          ? 'schedule'
          : report.profile === 'integration'
            ? 'integration'
            : report.profile === 'storybook'
              ? 'storybook'
              : null;
    if (
      stage.evidence.kind !== kind ||
      (kind === 'legacy' &&
        (stage.evidence.result.resultsChecked !== true ||
          (stage.evidence.result.counts.total ?? 0) < keys.length))
    )
      add('BOUNDARY_EVIDENCE_FAILED', subject);
    if (kind === 'schedule' || kind === 'integration' || kind === 'storybook') {
      const counts = stage.evidence.result.counts;
      if (
        (counts.expected ?? counts.tests) !== keys.length ||
        counts.tests !== keys.length ||
        counts.passed !== keys.length
      )
        add('BOUNDARY_COUNT_MISMATCH', subject);
    }
    if (report.profile === 'storybook') {
      if (!isNil(stage.cleanup)) add('CLEANUP_KIND_MISMATCH', subject);
    } else if (
      isNil(stage.cleanup) ||
      stage.cleanup.status !== 'complete' ||
      stage.cleanup.issues.length > 0 ||
      Object.values(stage.cleanup.remaining).some(
        (entries) => entries.length > 0,
      )
    )
      add('CLEANUP_INCOMPLETE', subject);
    if (report.runner === 'vitest') {
      const native = report.vitest;
      const moduleFiles = keys.flatMap((key) => {
        const entry = expected.get(key) ?? extras.get(key);
        return isNil(entry) ? [] : [entry.test.file];
      });
      if (
        isNil(native) ||
        native.unhandledErrorCount !== 0 ||
        !sameKeys(
          [...new Set(moduleFiles)],
          native.modules.map(({ file }) => file),
        ) ||
        native.modules.some(
          (module) =>
            module.project !== 'integration' ||
            module.state !== 'passed' ||
            module.errorCount !== 0 ||
            module.suiteErrorCount !== 0,
        )
      )
        add('VITEST_MODULE_FAILED', subject);
    } else if (!isNil(report.vitest)) add('RUNNER_METADATA_MISMATCH', subject);
    const stageSeen = new Set<string>();
    for (const result of report.tests) {
      const resultIssueStart = issues.length;
      const key = verificationTestKey(report.profile, result);
      if (stageSeen.has(key) || seen.has(key)) add('DUPLICATE_RESULT', key);
      stageSeen.add(key);
      seen.add(key);
      const requirement = expected.get(key);
      const extra = extras.get(key);
      const selection = !isNil(requirement)
        ? stage.requiredKeys
        : stage.extraKeys;
      const declared = requirement ?? extra;
      if (isNil(declared) || !selection.includes(key)) {
        add('UNKNOWN_RESULT', key);
        continue;
      }
      if (report.runner === 'vitest') {
        const native = result.vitest;
        if (
          isNil(native) ||
          result.repeatEachIndex !== 0 ||
          native.options.mode !== 'run' ||
          native.options.fails ||
          native.options.concurrent ||
          native.options.retry !== 0 ||
          native.options.repeats !== 0 ||
          isNil(native.diagnostic) ||
          native.diagnostic.retryCount !== 0 ||
          native.diagnostic.repeatCount !== 0 ||
          native.diagnostic.flaky
        )
          add('VITEST_NOT_CLEAN_PASS', key);
      } else if (!isNil(result.vitest)) add('RUNNER_METADATA_MISMATCH', key);
      const source = declared.test;
      if (
        declared.profile !== report.profile ||
        result.testId !== source.testId ||
        result.file !== source.file ||
        !isDeepStrictEqual(result.titlePath, source.titlePath) ||
        result.line !== source.line ||
        result.column !== source.column ||
        result.project !== source.project ||
        result.repeatEachIndex !== source.repeatEachIndex
      )
        add('RESULT_IDENTITY_MISMATCH', key);
      if (!isNil(requirement)) {
        if (
          !cleanPass(result) ||
          source.expectedStatus !== 'passed' ||
          control(source.annotations)
        )
          add('REQUIRED_NOT_CLEAN_PASS', key);
        else if (issues.length === resultIssueStart) passed++;
      } else if (!isNil(extra)) {
        if (
          extra.legacy.disposition === 'deferred-live' ||
          extra.legacy.disposition === 'replacement' ||
          result.results.length !== 1 ||
          result.results.some(
            (attempt) => attempt.retry !== 0 || attempt.errorCount !== 0,
          ) ||
          (extra.legacy.disposition === 'local'
            ? !cleanPass(result)
            : result.outcome !== 'skipped' ||
              result.expectedStatus !== 'skipped' ||
              result.results.some(({ status }) => status !== 'skipped'))
        )
          add('LEGACY_EXTRA_RESULT_FAILED', key);
      }
    }
    for (const key of keys) if (!stageSeen.has(key)) add('RESULT_MISSING', key);
  }
  for (const key of [...expected.keys(), ...extras.keys()]) {
    if (!assigned.has(key)) add('STAGE_MISSING', key);
    if (!seen.has(key)) add('RESULT_MISSING', key);
  }
  for (const entry of expected.values())
    for (const key of entry.dependencies)
      if (!expected.has(key) || !seen.has(key)) add('DEPENDENCY_MISSING', key);
  return {
    issues,
    counts: {
      business: plan.requirements.filter(({ kind }) => kind === 'business')
        .length,
      support: plan.requirements.filter(({ kind }) => kind !== 'business')
        .length,
      extras: extras.size,
      required: expected.size,
      passed,
      stages: input.stages.length,
    },
  };
};

type VerifyResultsInput = Parameters<typeof verifyResults>[0];
export type { VerificationStageResult, VerifyResultsInput };
