import {
  integrationAttemptMetaSchema,
  integrationClaimSchema,
  integrationCompletedCheckSchema,
} from '../../../scripts/e2e/integrationSchema';

import { relative } from 'node:path';

import type { TestContext } from 'vitest';
import type { FixtureJournal } from '../../../e2e/fixtures/fixtureManifest';
import type {
  IntegrationAttemptMeta,
  IntegrationCompletedCheck,
} from '../../../scripts/e2e/integrationSchema';

/** fixture開始時点は未完了として記録し、秘密値をmetaへ持ち込まない。 */
export const beginIntegrationEvidence = (
  context: TestContext,
  journal: FixtureJournal,
): IntegrationAttemptMeta => {
  const evidence = integrationAttemptMetaSchema.parse({
    claim: integrationClaimSchema.parse(context.task.meta.ledger),
    runId: journal.owner.lease.runId,
    lease: journal.owner.lease,
    owner: journal.owner,
    ownerTag: journal.ownerTag,
    journalPath: relative(process.cwd(), journal.path).replaceAll('\\', '/'),
    actors: [],
    actorBindings: [],
    clientKind: 'user-jwt',
    identityVerified: false,
    completedChecks: [],
    preflight: 'pending',
    bodyCompleted: false,
    cleanup: 'pending',
    assertionCalls: 0,
    bodyAssertionCalls: 0,
  });
  context.task.meta.integration = evidence;
  return evidence;
};

/** 対応するassertionが完了した後だけ、正確なtarget/aspect/layerを追記する。 */
export const completeIntegrationCheck = (
  evidence: IntegrationAttemptMeta,
  target: string,
  aspect: IntegrationCompletedCheck['aspect'],
) => {
  const check = integrationCompletedCheckSchema.parse({
    target,
    aspect,
    layer: 'integration',
  });
  if (
    evidence.completedChecks.some(
      (item) => item.target === target && item.aspect === aspect,
    )
  )
    throw new Error('integration checkの完了記録が重複しています');
  evidence.completedChecks.push(check);
};
