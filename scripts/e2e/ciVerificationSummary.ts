import { z } from 'zod';

import { verificationReportSchema } from './verificationSchema';

import { createHash } from 'node:crypto';

import type { runVerification } from './verificationRun';
import type { VerificationPlan } from './verificationSchema';

const MAX_COUNT = 1_000_000;
const MAX_CASES = 12;

const stageIdSchema = z.enum([
  'integration',
  'storybook',
  'isolated',
  'app-chromium',
  'app-chromium-auth',
  'app-mobile-chrome',
  'app-mobile-chrome-auth',
]);

const issueCodeSchema = z.enum([
  'PLAN_DIGEST_MISMATCH',
  'PLAN_INVALID',
  'INPUT_CHANGED',
  'STAGE_INVALID',
  'DUPLICATE_STAGE',
  'CONTEXT_MISMATCH',
  'STAGE_SELECTION_INVALID',
  'UNKNOWN_REQUIRED_KEY',
  'UNKNOWN_EXTRA_KEY',
  'DUPLICATE_ASSIGNMENT',
  'RUNNER_EXIT_FAILED',
  'BOUNDARY_EVIDENCE_FAILED',
  'REPORT_INVALID',
  'REPORT_CONTEXT_MISMATCH',
  'RUN_NOT_CLEAN_PASS',
  'BOUNDARY_COUNT_MISMATCH',
  'CLEANUP_KIND_MISMATCH',
  'CLEANUP_INCOMPLETE',
  'VITEST_MODULE_FAILED',
  'RUNNER_METADATA_MISMATCH',
  'DUPLICATE_RESULT',
  'UNKNOWN_RESULT',
  'VITEST_NOT_CLEAN_PASS',
  'RESULT_IDENTITY_MISMATCH',
  'REQUIRED_NOT_CLEAN_PASS',
  'LEGACY_EXTRA_RESULT_FAILED',
  'RESULT_MISSING',
  'STAGE_MISSING',
  'DEPENDENCY_MISSING',
]);

const countSchema = z.number().int().min(0).max(MAX_COUNT);
const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u);

export const ciVerificationSummarySchema = z.strictObject({
  schemaVersion: z.literal(1),
  verificationState: z.enum(['available', 'unavailable']),
  issueCount: countSchema,
  issueCounts: z
    .array(z.strictObject({ code: issueCodeSchema, count: countSchema }))
    .max(issueCodeSchema.options.length),
  unknownIssueCount: countSchema,
  stages: z
    .array(
      z.strictObject({
        id: stageIdSchema,
        runner: z.enum(['not-run', 'passed', 'failed', 'unknown']),
        report: z.union([
          verificationReportSchema.shape.status,
          z.enum(['missing', 'invalid']),
        ]),
        cleanup: z.enum(['missing', 'not-required', 'complete', 'incomplete']),
        processExited: z.boolean(),
        processErrorCount: countSchema,
        exitCode: z.enum(['missing', 'zero', 'nonzero']),
        signaled: z.boolean(),
        plannedCount: countSchema,
        observedCount: countSchema,
      }),
    )
    .max(stageIdSchema.options.length),
  caseIssues: z
    .array(
      z.strictObject({
        code: issueCodeSchema,
        keySha256: digestSchema,
      }),
    )
    .max(MAX_CASES),
  omittedCaseIssueCount: countSchema,
});

const bounded = (value: number) => Math.min(MAX_COUNT, Math.max(0, value));

/** CI公開用に固定語彙と登録済みキーのハッシュだけを抽出する。 */
export const createCiVerificationSummary = (
  plan: VerificationPlan,
  run: Awaited<ReturnType<typeof runVerification>>,
) => {
  const issues = run.verification?.issues ?? [];
  const counts = new Map<z.infer<typeof issueCodeSchema>, number>();
  let unknownIssueCount = 0;
  const trustedKeys = new Set(
    [...plan.requirements, ...plan.allowedExtraTests].map(({ key }) => key),
  );
  const nonMissingCases: {
    code: z.infer<typeof issueCodeSchema>;
    keySha256: string;
  }[] = [];
  const missingCases: typeof nonMissingCases = [];
  const seenCases = new Set<string>();

  for (const issue of issues) {
    const code = issueCodeSchema.safeParse(issue.code);
    if (!code.success) {
      unknownIssueCount++;
      continue;
    }
    counts.set(code.data, (counts.get(code.data) ?? 0) + 1);
    if (!trustedKeys.has(issue.subject)) continue;
    const keySha256 = createHash('sha256').update(issue.subject).digest('hex');
    const identity = `${code.data}:${keySha256}`;
    if (seenCases.has(identity)) continue;
    seenCases.add(identity);
    const target =
      code.data === 'RESULT_MISSING' ? missingCases : nonMissingCases;
    target.push({ code: code.data, keySha256 });
  }
  const orderedCases = [...nonMissingCases, ...missingCases];
  const caseIssues = orderedCases.slice(0, MAX_CASES);
  const omittedCaseIssueCount = bounded(
    orderedCases.length - caseIssues.length,
  );

  const seenStages = new Set<z.infer<typeof stageIdSchema>>();
  const stages = (run.execution?.stages ?? []).flatMap((stage) => {
    const id = stageIdSchema.safeParse(stage.context.stageId);
    if (!id.success || seenStages.has(id.data)) return [];
    seenStages.add(id.data);
    const owner = run.execution?.runs.find(
      ({ stageId }) => stageId === id.data,
    );
    const report = verificationReportSchema.safeParse(stage.report);
    const hasExecutionEvidence =
      stage.report !== null ||
      stage.exitCode !== null ||
      stage.signal !== null ||
      stage.processCleanup.exited ||
      stage.processCleanup.errorCount > 0 ||
      stage.cleanup !== null;
    const cleanupComplete =
      stage.cleanup?.status === 'complete' &&
      stage.cleanup.issues.length === 0 &&
      Object.values(stage.cleanup.remaining).every(
        (resources) => resources.length === 0,
      );
    return [
      {
        id: id.data,
        runner:
          owner?.status === 'passed' || owner?.status === 'failed'
            ? owner.status
            : owner || hasExecutionEvidence
              ? ('unknown' as const)
              : ('not-run' as const),
        report:
          stage.report === null
            ? ('missing' as const)
            : report.success
              ? report.data.status
              : ('invalid' as const),
        cleanup:
          stage.evidence.kind === 'storybook'
            ? stage.cleanup === null
              ? hasExecutionEvidence
                ? ('not-required' as const)
                : ('missing' as const)
              : ('incomplete' as const)
            : stage.cleanup === null
              ? ('missing' as const)
              : cleanupComplete
                ? ('complete' as const)
                : ('incomplete' as const),
        processExited: stage.processCleanup.exited,
        processErrorCount: bounded(stage.processCleanup.errorCount),
        exitCode:
          stage.exitCode === null
            ? ('missing' as const)
            : stage.exitCode === 0
              ? ('zero' as const)
              : ('nonzero' as const),
        signaled: stage.signal !== null,
        plannedCount: bounded(
          stage.requiredKeys.length + stage.extraKeys.length,
        ),
        observedCount: report.success ? bounded(report.data.tests.length) : 0,
      },
    ];
  });

  return ciVerificationSummarySchema.parse({
    schemaVersion: 1,
    verificationState: run.verification === null ? 'unavailable' : 'available',
    issueCount: bounded(issues.length),
    issueCounts: issueCodeSchema.options.flatMap((code) => {
      const count = counts.get(code);
      return count === undefined ? [] : [{ code, count: bounded(count) }];
    }),
    unknownIssueCount: bounded(unknownIssueCount),
    stages,
    caseIssues,
    omittedCaseIssueCount: bounded(omittedCaseIssueCount),
  });
};
