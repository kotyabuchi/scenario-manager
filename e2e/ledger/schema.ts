import { z } from 'zod';

const text = z.string().trim().min(1);
const id = text.regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/);
export const layerSchema = z.enum(['browser', 'storybook', 'integration']);
export const aspectSchema = z.enum([
  'render',
  'response',
  'persist',
  'authorization',
  'validation',
  'rls',
  'atomicity',
  'error-feedback',
]);
export const runtimeSchema = z.enum([
  'next-production',
  'storybook',
  'vitest-node',
  'cloudflare-workers',
]);
export const actorBindingSchema = z.strictObject({ role: id, actor: id });
export const executionSchema = z.strictObject({
  profile: id,
  project: z.string(),
  runtime: runtimeSchema,
  variant: id,
  actorBindings: z.array(actorBindingSchema),
});
export const profileSchema = z.strictObject({
  id,
  layer: layerSchema,
  executions: z
    .array(
      z.strictObject({
        project: z.string(),
        runtime: runtimeSchema,
      }),
    )
    .min(1),
});
export const fixtureSchema = z.strictObject({ id, actors: z.array(id) });
export const requirementSchema = z.strictObject({
  aspect: aspectSchema,
  layers: z.array(layerSchema).min(1),
  expectation: text,
  basis: z.array(text).min(1),
  executions: z.array(executionSchema).min(1),
});
export const contractSchema = z.strictObject({
  target: text,
  classification: z.enum(['read', 'write', 'support']),
  requirements: z.array(requirementSchema).min(1),
  notApplicable: z.array(
    z.strictObject({
      aspect: aspectSchema,
      reason: text,
      reference: text,
    }),
  ),
});
export const checkSchema = z.strictObject({
  target: text,
  aspect: aspectSchema,
  layer: layerSchema,
});
export const caseSchema = z.strictObject({
  caseId: id,
  title: text,
  status: z.enum(['planned', 'implemented']),
  layer: layerSchema,
  fixture: id,
  roles: z.array(id),
  checks: z.array(checkSchema).min(1),
  executions: z.array(executionSchema).min(1),
  testBindings: z.array(id).min(1),
  executionGroup: id.optional(),
});
export const scenarioSchema = z.strictObject({
  scenarioId: id,
  title: text,
  cases: z.array(caseSchema).min(1),
});
export const executionGroupSchema = z.strictObject({
  id,
  caseIds: z.array(id).min(1),
  dependsOn: z.array(id),
});
// 未知の次元はnullで明示し、位置・理由・statusを不足identityに含めない。
export const deficiencySchema = z.strictObject({
  target: text,
  aspect: z.union([aspectSchema, z.literal('contract')]),
  layer: layerSchema.nullable(),
  caseId: id.nullable(),
  variant: id.nullable(),
  actorBindings: z.array(actorBindingSchema).nullable(),
  profile: id.nullable(),
  project: z.string().nullable(),
  runtime: runtimeSchema.nullable(),
});
export const exceptionSchema = z.strictObject({
  id,
  deficiency: deficiencySchema,
  reason: text,
  tracker: text,
  reviewCondition: text,
});
export const ledgerSchema = z.strictObject({
  schemaVersion: z.literal(1),
  profiles: z.array(profileSchema),
  fixtures: z.array(fixtureSchema),
  contracts: z.array(contractSchema),
  scenarios: z.array(scenarioSchema),
  executionGroups: z.array(executionGroupSchema),
  exceptions: z.array(exceptionSchema),
});
// Batch 5のrunner登録をこの境界へ変換する。fixtureの成功証拠ではない。
export const registrationSchema = z.strictObject({
  testId: text,
  caseId: id,
  binding: id,
  layer: layerSchema,
  execution: executionSchema,
  repeatEachIndex: z.number().int().nonnegative().default(0),
  repeatEach: z.number().int().positive().default(1),
});
export const ledgerIssueSchema = z.strictObject({
  code: text,
  subject: text,
  message: text,
});

type Ledger = z.infer<typeof ledgerSchema>;
type LedgerCase = z.infer<typeof caseSchema>;
type Contract = z.infer<typeof contractSchema>;
type Requirement = z.infer<typeof requirementSchema>;
type Execution = z.infer<typeof executionSchema>;
type Deficiency = z.infer<typeof deficiencySchema>;
type Registration = z.infer<typeof registrationSchema>;
type LedgerIssue = z.infer<typeof ledgerIssueSchema>;
type Aspect = z.infer<typeof aspectSchema>;
type Layer = z.infer<typeof layerSchema>;
export type {
  Ledger,
  LedgerCase,
  Contract,
  Requirement,
  Execution,
  Deficiency,
  Registration,
  LedgerIssue,
  Aspect,
  Layer,
};
