import { z } from 'zod';

import {
  fixtureActorSchema,
  fixtureOwnerSchema,
} from '../../e2e/fixtures/fixtureSchema';
import { checkSchema, executionSchema } from '../../e2e/ledger/schema';
import { discoverySchema, discoveryTestSchema } from './discoverySchema';
import { environmentLeaseSchema } from './environmentSchema';

const text = z.string().min(1);
export const integrationPathSchema = text.refine(
  (value) =>
    !value.startsWith('/') &&
    !/[\\:\0\r\n]/.test(value) &&
    value
      .split('/')
      .every((part) => part !== '' && part !== '.' && part !== '..'),
  'root相対POSIX pathが必要です',
);
export const integrationClaimSchema = z.strictObject({
  caseId: text,
  variant: text,
  binding: text,
});
export const integrationOptionsSchema = z.strictObject({
  mode: z.enum(['run', 'only', 'skip', 'todo']),
  fails: z.boolean(),
  concurrent: z.boolean(),
  retry: z.number().int().nonnegative(),
  repeats: z.number().int().nonnegative(),
});
export const integrationRunnerSchema = z.strictObject({
  name: z.literal('vitest'),
  version: z.literal('3.2.4'),
  project: z.literal('integration'),
  pool: z.enum([
    'forks',
    'threads',
    'vmForks',
    'vmThreads',
    'typescript',
    'browser',
  ]),
  fileParallelism: z.boolean(),
  maxWorkers: z.number().int().positive(),
  includeTaskLocation: z.boolean(),
});
export const integrationRegistrationSchema = z.strictObject({
  testId: text,
  file: integrationPathSchema,
  titlePath: z.array(text).min(1),
  fullName: text,
  line: z.number().int().positive(),
  column: z.number().int().nonnegative(),
  claim: integrationClaimSchema,
  options: integrationOptionsSchema,
});
export const integrationCollectionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  runner: integrationRunnerSchema,
  config: integrationPathSchema,
  discovery: discoverySchema,
  registrations: z.array(integrationRegistrationSchema),
});
export const integrationCompletedCheckSchema = checkSchema.extend({
  layer: z.literal('integration'),
});

/** meta.ledgerは登録claim、meta.integrationは実行時のfixture/check証跡。秘密のclient/tokenは入れない。 */
export const integrationAttemptMetaSchema = z.strictObject({
  claim: integrationClaimSchema,
  runId: environmentLeaseSchema.shape.runId,
  lease: environmentLeaseSchema,
  owner: fixtureOwnerSchema,
  ownerTag: z.string().regex(/^[a-f0-9]{64}$/),
  journalPath: integrationPathSchema,
  actors: z.array(fixtureActorSchema),
  actorBindings: z.array(
    z.strictObject({ role: text, actor: fixtureActorSchema }),
  ),
  clientKind: z.enum(['user-jwt', 'anonymous', 'service-role']),
  identityVerified: z.boolean(),
  completedChecks: z.array(integrationCompletedCheckSchema),
  preflight: z.enum(['pending', 'passed', 'failed']),
  bodyCompleted: z.boolean(),
  cleanup: z.enum(['pending', 'complete', 'failed']),
  assertionCalls: z.number().int().nonnegative(),
  bodyAssertionCalls: z.number().int().nonnegative(),
});
export const integrationDiagnosticSchema = z.strictObject({
  retryCount: z.number().int().nonnegative(),
  repeatCount: z.number().int().nonnegative(),
  flaky: z.boolean(),
  startTime: z.number().nonnegative(),
  duration: z.number().nonnegative(),
});
export const integrationTestResultSchema = integrationRegistrationSchema.extend(
  {
    state: z.enum(['pending', 'passed', 'failed', 'skipped']),
    errorCount: z.number().int().nonnegative(),
    diagnostic: integrationDiagnosticSchema.nullable(),
    meta: integrationAttemptMetaSchema.nullable(),
  },
);
export const integrationModuleResultSchema = z.strictObject({
  file: integrationPathSchema,
  project: text,
  state: z.enum(['queued', 'pending', 'passed', 'failed', 'skipped']),
  errorCount: z.number().int().nonnegative(),
  suiteErrorCount: z.number().int().nonnegative(),
});
export const integrationReportSchema = z.strictObject({
  schemaVersion: z.literal(1),
  runner: integrationRunnerSchema,
  config: integrationPathSchema,
  runId: environmentLeaseSchema.shape.runId,
  tests: z.array(integrationTestResultSchema),
  modules: z.array(integrationModuleResultSchema),
  reason: z.enum(['passed', 'failed', 'interrupted']),
  unhandledErrorCount: z.number().int().nonnegative(),
  reporterErrorCount: z.number().int().nonnegative(),
});
export const integrationExpectationSchema = z.strictObject({
  test: discoveryTestSchema,
  claim: integrationClaimSchema,
  options: integrationOptionsSchema,
  actorBindings: executionSchema.shape.actorBindings,
  fixture: z.literal('schedule'),
  checks: z.array(integrationCompletedCheckSchema).min(1),
});

type IntegrationClaim = z.infer<typeof integrationClaimSchema>;
type IntegrationOptions = z.infer<typeof integrationOptionsSchema>;
type IntegrationRunner = z.infer<typeof integrationRunnerSchema>;
type IntegrationRegistration = z.infer<typeof integrationRegistrationSchema>;
type IntegrationCollection = z.infer<typeof integrationCollectionSchema>;
type IntegrationAttemptMeta = z.infer<typeof integrationAttemptMetaSchema>;
type IntegrationCompletedCheck = z.infer<
  typeof integrationCompletedCheckSchema
>;
type IntegrationTestResult = z.infer<typeof integrationTestResultSchema>;
type IntegrationModuleResult = z.infer<typeof integrationModuleResultSchema>;
type IntegrationReport = z.infer<typeof integrationReportSchema>;
type IntegrationExpectation = z.infer<typeof integrationExpectationSchema>;
// 公開vitestはrunnerの型を再exportするため、実体の宣言元へ追加する。
// Vitest 3.2.4はruntimeでoptions.metaを転送するが、TestOptionsには宣言がない。
declare module '@vitest/runner' {
  interface TestOptions {
    meta?: { ledger: IntegrationClaim };
  }
  interface TaskMeta {
    ledger?: IntegrationClaim;
    integration?: IntegrationAttemptMeta;
  }
}

export type {
  IntegrationClaim,
  IntegrationOptions,
  IntegrationRunner,
  IntegrationRegistration,
  IntegrationCollection,
  IntegrationAttemptMeta,
  IntegrationCompletedCheck,
  IntegrationTestResult,
  IntegrationModuleResult,
  IntegrationReport,
  IntegrationExpectation,
};
