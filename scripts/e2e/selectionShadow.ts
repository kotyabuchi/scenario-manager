import { isNil } from 'ramda';
import { z } from 'zod';

import { selectionDigestSchema } from './selectionSchema';
import { digestVerificationPlan } from './verificationPlanDigest';

import type { Ledger } from '../../e2e/ledger/schema';
import type { VerificationPlan } from './verificationSchema';

export const shadowObservationSchema = z.strictObject({
  verificationId: z.string().min(1),
  snapshotDigest: selectionDigestSchema,
  inputDigest: selectionDigestSchema,
  collectionDigest: selectionDigestSchema,
  rulesDigest: selectionDigestSchema,
  fullPlanDigest: selectionDigestSchema,
  selectionDigest: selectionDigestSchema,
  requiredKeys: z.array(z.string().min(1)),
  failedRequiredKeys: z.array(z.string().min(1)),
  status: z.enum(['complete', 'inconclusive']),
});

type ShadowObservation = z.infer<typeof shadowObservationSchema>;
type ShadowResult = {
  status:
    | 'matched'
    | 'missed-required-failure'
    | 'inconclusive'
    | 'nondeterministic'
    | 'invalid';
  missedRequiredKeys: string[];
  divergentRequiredKeys: string[];
  reasons: string[];
};

const hasExecutionGroupClosure = (
  groups: Ledger['executionGroups'],
  selectedCases: ReadonlySet<string>,
) => {
  const byId = new Map(groups.map((group) => [group.id, group]));
  if (byId.size !== groups.length) return false;
  const visiting = new Set<string>();
  const validated = new Set<string>();
  const validate = (id: string): boolean => {
    if (validated.has(id)) return true;
    const group = byId.get(id);
    if (isNil(group) || group.caseIds.length === 0 || visiting.has(id))
      return false;
    visiting.add(id);
    if (!group.dependsOn.every(validate)) return false;
    visiting.delete(id);
    validated.add(id);
    return true;
  };
  if (groups.some(({ id }) => !validate(id))) return false;

  const required = new Set(
    groups
      .filter(({ caseIds }) => caseIds.some((id) => selectedCases.has(id)))
      .map(({ id }) => id),
  );
  // Setの末尾へ追加した依存groupも訪問する。
  for (const id of required) {
    const group = byId.get(id);
    if (
      isNil(group) ||
      group.caseIds.some((caseId) => !selectedCases.has(caseId))
    )
      return false;
    for (const dependency of group.dependsOn) required.add(dependency);
  }
  return true;
};

/** 両runの独立した証拠を照合し、除外された必須登録の実失敗を検出する。 */
export const compareSelectionShadow = (input: {
  fullPlan: VerificationPlan;
  executionGroups?: Ledger['executionGroups'];
  partial: ShadowObservation;
  full: ShadowObservation;
}): ShadowResult => {
  const outcome = (
    status: ShadowResult['status'],
    reasons: string[],
    missedRequiredKeys: string[] = [],
    divergentRequiredKeys: string[] = [],
  ): ShadowResult => ({
    status,
    missedRequiredKeys,
    divergentRequiredKeys,
    reasons,
  });
  const parsedPartial = shadowObservationSchema.safeParse(input.partial);
  const parsedFull = shadowObservationSchema.safeParse(input.full);
  if (!parsedPartial.success || !parsedFull.success)
    return outcome('invalid', ['OBSERVATION_INVALID']);
  const partial = parsedPartial.data;
  const full = parsedFull.data;
  const plan = input.fullPlan;
  const fullDigest = digestVerificationPlan(plan);
  const shared = [
    'snapshotDigest',
    'inputDigest',
    'collectionDigest',
    'rulesDigest',
    'fullPlanDigest',
  ] as const;
  if (
    shared.some((key) => partial[key] !== full[key]) ||
    full.fullPlanDigest !== fullDigest
  )
    return outcome('invalid', ['SNAPSHOT_CONTEXT_MISMATCH']);
  if (partial.verificationId === full.verificationId)
    return outcome('invalid', ['RUN_CONTEXT_REUSED']);

  const fullKeys = new Set(full.requiredKeys);
  const partialKeys = new Set(partial.requiredKeys);
  const expected = new Set(plan.requirements.map(({ key }) => key));
  const partialRows = plan.requirements.filter(({ key }) =>
    partialKeys.has(key),
  );
  const partialRunsApp = partialRows.some(({ profile }) => profile === 'app');
  const selectedCases = new Set(
    partialRows.flatMap(({ claim }) => (isNil(claim) ? [] : [claim.caseId])),
  );
  const vitestFiles = new Set(
    partialRows
      .filter(({ profile }) => profile === 'integration')
      .map(({ test }) => test.file),
  );
  const incompleteUnit = plan.requirements.some(
    ({ key, claim, profile, test }) =>
      !partialKeys.has(key) &&
      ((!isNil(claim) && selectedCases.has(claim.caseId)) ||
        (profile === 'integration' && vitestFiles.has(test.file))),
  );
  const projected = {
    schemaVersion: 1 as const,
    requirements: partialRows,
    allowedExtraTests: partialRunsApp ? plan.allowedExtraTests : [],
  };
  if (
    fullKeys.size !== full.requiredKeys.length ||
    partialKeys.size !== partial.requiredKeys.length ||
    expected.size !== plan.requirements.length ||
    fullKeys.size !== expected.size ||
    [...fullKeys].some((key) => !expected.has(key)) ||
    partialRows.length !== partialKeys.size ||
    incompleteUnit ||
    partialRows.some(({ dependencies }) =>
      dependencies.some((key) => !partialKeys.has(key)),
    ) ||
    (partialRunsApp &&
      plan.requirements.some(
        ({ key, profile }) => profile === 'app' && !partialKeys.has(key),
      )) ||
    full.selectionDigest !== fullDigest ||
    partial.selectionDigest !== digestVerificationPlan(projected)
  )
    return outcome('invalid', ['REQUIRED_SELECTION_MISMATCH']);

  if (!hasExecutionGroupClosure(input.executionGroups ?? [], selectedCases))
    return outcome('invalid', ['EXECUTION_GROUP_SELECTION_MISMATCH']);

  const fullFailed = new Set(full.failedRequiredKeys);
  const partialFailed = new Set(partial.failedRequiredKeys);
  if (
    fullFailed.size !== full.failedRequiredKeys.length ||
    partialFailed.size !== partial.failedRequiredKeys.length ||
    [...fullFailed].some((key) => !fullKeys.has(key)) ||
    [...partialFailed].some((key) => !partialKeys.has(key))
  )
    return outcome('invalid', ['UNKNOWN_FAILURE_IDENTITY']);
  if (full.status !== 'complete' || partial.status !== 'complete')
    return outcome('inconclusive', ['RUN_EVIDENCE_INCOMPLETE']);

  const missed = [...fullFailed].filter((key) => !partialKeys.has(key)).sort();
  const divergent = [...partialKeys]
    .filter((key) => partialFailed.has(key) !== fullFailed.has(key))
    .sort();
  if (missed.length > 0)
    return outcome(
      'missed-required-failure',
      ['MISSED_REQUIRED_FAILURE'],
      missed,
      divergent,
    );
  if (divergent.length > 0)
    return outcome(
      'nondeterministic',
      ['DIVERGENT_REQUIRED_RESULT'],
      [],
      divergent,
    );
  return outcome('matched', []);
};

export type { ShadowObservation, ShadowResult };
