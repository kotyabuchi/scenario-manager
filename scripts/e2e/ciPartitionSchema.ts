import { z } from 'zod';

import { githubEventPolicySchema } from './githubEventSchema';
import { gitShaSchema } from './gitObjects';
import {
  selectionDecisionSchema,
  selectionDigestSchema,
  selectionReasonSchema,
} from './selectionSchema';
import {
  verificationContextSchema,
  verificationPlanSchema,
} from './verificationSchema';

import type { LegacyProject } from '../../e2e/fixtures/legacySchema';

export const ciShardIdSchema = z.enum([
  'required',
  'legacy-desktop',
  'legacy-mobile',
]);

/** 各legacy workerが担当するprojectと実行順を固定する。 */
export const CI_LEGACY_PROJECTS = {
  'legacy-desktop': ['chromium', 'chromium-auth'],
  'legacy-mobile': ['mobile-chrome', 'mobile-chrome-auth'],
} as const satisfies Record<CiLegacyShardId, readonly LegacyProject[]>;

export const ciWorkflowSchema = z.strictObject({
  runId: z.string().regex(/^[1-9][0-9]*$/u),
  attempt: z.number().int().positive(),
});

const keys = z.array(z.string().min(1));
const shard = z.strictObject({
  id: ciShardIdSchema,
  planDigest: selectionDigestSchema,
  requiredKeys: keys.min(1),
  extraKeys: keys,
});

export const ciPartitionManifestSchema = z.strictObject({
  schemaVersion: z.literal(2),
  workflow: ciWorkflowSchema,
  eventPolicy: githubEventPolicySchema,
  snapshotDigest: selectionDigestSchema,
  inputsDigest: selectionDigestSchema,
  surfaceMigrationHistoryDigest: selectionDigestSchema.optional(),
  fullCollectionDigest: selectionDigestSchema,
  fullPlanDigest: selectionDigestSchema,
  effectivePlanDigest: selectionDigestSchema,
  fullPlan: verificationPlanSchema,
  changeDecision: selectionDecisionSchema.nullable(),
  decisionDigest: selectionDigestSchema,
  fixedSmoke: z.strictObject({ requiredCaseIds: keys, legacyKeys: keys }),
  smokeReference: z
    .strictObject({
      kind: z.enum(['static-base', 'approved-bootstrap-origin']),
      revision: gitShaSchema,
      isBootstrap: z.boolean(),
      keyDigest: selectionDigestSchema,
    })
    .nullable(),
  runnerSelectionFallback: z.literal(true).optional(),
  projectionReasons: z.array(selectionReasonSchema),
  shards: z.tuple([
    shard.extend({ id: z.literal('required') }),
    shard.extend({ id: z.literal('legacy-desktop') }),
    shard.extend({ id: z.literal('legacy-mobile') }),
  ]),
});

export const ciShardEnvelopeSchema = z.strictObject({
  schemaVersion: z.literal(2),
  shard: ciShardIdSchema,
  workflow: ciWorkflowSchema,
  manifestDigest: selectionDigestSchema,
  fullCollectionDigest: selectionDigestSchema,
  fullPlanDigest: selectionDigestSchema,
  verificationId: verificationContextSchema.shape.verificationId,
});

type CiShardId = z.infer<typeof ciShardIdSchema>;
type CiLegacyShardId = Exclude<CiShardId, 'required'>;
type CiWorkflow = z.infer<typeof ciWorkflowSchema>;
type CiPartitionManifest = z.infer<typeof ciPartitionManifestSchema>;
type CiShardEnvelope = z.infer<typeof ciShardEnvelopeSchema>;

export type {
  CiLegacyShardId,
  CiPartitionManifest,
  CiShardEnvelope,
  CiShardId,
  CiWorkflow,
};
