import { z } from 'zod';

import {
  checkSchema,
  executionSchema,
  runtimeSchema,
} from '../../e2e/ledger/schema';
import { discoveryTestSchema } from './discoverySchema';
import { environmentCleanupSchema } from './environmentSchema';
import {
  integrationClaimSchema,
  integrationDiagnosticSchema,
  integrationModuleResultSchema,
  integrationOptionsSchema,
} from './integrationSchema';
import { legacyExecutionEntrySchema } from './legacyExecutionSchema';

const text = z.string().min(1);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const verificationContextSchema = z.strictObject({
  verificationId: z.string().regex(/^[a-f0-9]{12}$/),
  stageId: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
  selectionDigest: digest,
  inputDigest: digest,
});
export const verificationAttemptSchema = z.strictObject({
  retry: z.number().int().nonnegative(),
  status: discoveryTestSchema.shape.expectedStatus,
  errorCount: z.number().int().nonnegative(),
  annotations: discoveryTestSchema.shape.annotations,
  failureKind: z.literal('assertion').optional(),
});
export const verificationTestResultSchema = discoveryTestSchema
  .pick({
    testId: true,
    file: true,
    titlePath: true,
    line: true,
    column: true,
    project: true,
    repeatEachIndex: true,
    expectedStatus: true,
    annotations: true,
  })
  .extend({
    outcome: z.enum(['expected', 'unexpected', 'flaky', 'skipped', 'pending']),
    results: z.array(verificationAttemptSchema),
    vitest: z
      .strictObject({
        options: integrationOptionsSchema,
        diagnostic: integrationDiagnosticSchema.nullable(),
      })
      .optional(),
  });
export const verificationReportSchema = z.strictObject({
  schemaVersion: z.literal(1),
  context: verificationContextSchema,
  profile: text,
  runner: z.enum(['playwright', 'vitest']),
  version: text,
  status: z.enum(['passed', 'failed', 'timedOut', 'interrupted']),
  errorCount: z.number().int().nonnegative(),
  reporterErrorCount: z.number().int().nonnegative(),
  reporterCompleted: z.boolean(),
  vitest: z
    .strictObject({
      unhandledErrorCount: z.number().int().nonnegative(),
      modules: z.array(integrationModuleResultSchema),
    })
    .optional(),
  tests: z.array(verificationTestResultSchema),
});
export const verificationRequirementSchema = z.strictObject({
  key: text,
  profile: text,
  runtime: runtimeSchema,
  kind: z.enum(['business', 'setup', 'dependency']),
  test: discoveryTestSchema,
  claim: integrationClaimSchema.nullable(),
  execution: executionSchema.nullable(),
  checks: z.array(checkSchema),
  dependencies: z.array(text),
});
export const verificationExtraTestSchema = z.strictObject({
  key: text,
  profile: text,
  runtime: runtimeSchema,
  test: discoveryTestSchema,
  legacy: legacyExecutionEntrySchema,
});
export const verificationPlanSchema = z.strictObject({
  schemaVersion: z.literal(1),
  requirements: z.array(verificationRequirementSchema),
  allowedExtraTests: z.array(verificationExtraTestSchema),
});

export const verificationStageResultSchema = z.strictObject({
  context: verificationContextSchema,
  requiredKeys: z.array(text),
  extraKeys: z.array(text),
  report: z.unknown(),
  exitCode: z.number().int().nullable(),
  signal: z.string().nullable(),
  evidence: z.strictObject({
    kind: z.enum(['legacy', 'schedule', 'integration', 'storybook']),
    context: verificationContextSchema,
    checkedKeys: z.array(text),
    result: z.object({
      issues: z.array(z.object({ code: text })),
      counts: z.record(z.string(), z.number().nonnegative()),
      resultsChecked: z.boolean().optional(),
    }),
  }),
  cleanup: environmentCleanupSchema.nullable(),
  processCleanup: z.strictObject({
    exited: z.boolean(),
    errorCount: z.number().int().nonnegative(),
  }),
});
type VerificationStageResult = z.infer<typeof verificationStageResultSchema>;
type VerificationContext = z.infer<typeof verificationContextSchema>;
type VerificationAttempt = z.infer<typeof verificationAttemptSchema>;
type VerificationTestResult = z.infer<typeof verificationTestResultSchema>;
type VerificationReport = z.infer<typeof verificationReportSchema>;
type VerificationRequirement = z.infer<typeof verificationRequirementSchema>;
type VerificationExtraTest = z.infer<typeof verificationExtraTestSchema>;
type VerificationPlan = z.infer<typeof verificationPlanSchema>;
export type {
  VerificationContext,
  VerificationStageResult,
  VerificationAttempt,
  VerificationTestResult,
  VerificationReport,
  VerificationRequirement,
  VerificationPlan,
  VerificationExtraTest,
};
