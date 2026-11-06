import { z } from 'zod';

import { gitPathSchema } from './gitSnapshotSchema';

export const selectionDigestSchema = z.string().regex(/^[a-f0-9]{64}$/u);
const text = z.string().min(1);
const strings = z.array(text);

export const selectionReasonSchema = z.strictObject({
  code: z.enum([
    'FORCED_FULL',
    'RUNNER_SELECTION_UNREPRESENTABLE',
    'MISSING_BASE_RULES',
    'RULES_CHANGED',
    'UNVERSIONED_RUNTIME_INPUT',
    'DEPENDENCY_INPUT_CHANGED',
    'GRAPH_INCOMPLETE',
    'GRAPH_UNAVAILABLE',
    'UNKNOWN_DEPENDENCY',
    'UNKNOWN_CHANGE',
    'BROAD_CHANGE',
    'DATABASE_WIDE',
    'FEATURE_RULE',
    'GRAPH_TARGET',
    'TEST_FILE',
    'UNREGISTERED_TEST',
    'LEGACY_SERIAL_SUITE',
    'RETIRED_RULE_REFERENCE',
    'PLANNED_CASE',
    'LEGACY_UNMIGRATED',
    'BASELINE_RELATED',
    'LEGACY_DATABASE_UNVERIFIED',
    'DOCS_ALLOWLIST',
    'NO_CHANGES',
    'NO_REQUIRED_CASE',
    'EXECUTION_GROUP',
    'RUNNER_DEPENDENCY',
    'VITEST_FILE_CLOSURE',
    'LEGACY_REGRESSION_EXECUTION',
    'CI_FIXED_SMOKE',
  ]),
  changedPaths: z.array(gitPathSchema),
  viaNodes: strings,
  ruleIds: strings,
  caseIds: strings,
});

export const selectionDecisionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  mode: z.enum(['partial', 'full-required', 'docs-only']),
  snapshotDigest: selectionDigestSchema,
  base: z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u),
  head: z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u),
  rulesDigest: selectionDigestSchema,
  graphDigest: selectionDigestSchema,
  fullPlanDigest: selectionDigestSchema,
  caseIds: strings,
  targetIds: strings,
  requestedRequiredKeys: strings,
  reasons: z.array(selectionReasonSchema).min(1),
  coverageGaps: z.array(selectionReasonSchema),
  coverageStatus: z.enum(['no-known-gaps', 'insufficient']),
  legacyPolicy: z.enum(['omit', 'legacy-local']),
});

type SelectionReason = z.infer<typeof selectionReasonSchema>;
type SelectionDecision = z.infer<typeof selectionDecisionSchema>;

export const selectionReason = (
  code: SelectionReason['code'],
  fields: Partial<Omit<SelectionReason, 'code'>> = {},
): SelectionReason => ({
  code,
  changedPaths: [...new Set(fields.changedPaths)].sort(),
  viaNodes: [...new Set(fields.viaNodes)].sort(),
  ruleIds: [...new Set(fields.ruleIds)].sort(),
  caseIds: [...new Set(fields.caseIds)].sort(),
});

export type { SelectionDecision, SelectionReason };
