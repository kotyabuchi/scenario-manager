import { z } from 'zod';

import { changesSchema } from './fingerprint';
import {
  verificationContextSchema,
  verificationStageResultSchema,
} from './verificationSchema';

const digest = verificationContextSchema.shape.inputDigest;
const text = z.string().min(1);
const count = z.number().int().nonnegative();
export const verificationSummarySchema = z.strictObject({
  issues: z.array(z.strictObject({ code: text, subject: text })),
  counts: z.strictObject({
    business: count,
    support: count,
    extras: count,
    required: count,
    passed: count,
    stages: count,
  }),
});

/** 実行途中・失敗も保存する共通形式。成功の判定はartifactの再照合で行う。 */
export const verificationReceiptSchema = z.strictObject({
  schemaVersion: z.literal(1),
  verificationId: verificationContextSchema.shape.verificationId,
  mode: z.enum(['full-required', 'partial']),
  selection: z
    .strictObject({
      snapshotDigest: digest,
      fullPlanDigest: digest,
      decisionDigest: digest,
    })
    .nullable(),
  status: z.enum(['running', 'passed', 'failed']),
  phase: text,
  selectionDigest: digest.nullable(),
  inputDigestBefore: digest.nullable(),
  inputDigestAfter: digest.nullable(),
  checkpoints: z.array(
    z.strictObject({ phase: text, digest, changes: changesSchema }),
  ),
  execution: z
    .strictObject({
      stages: z.array(verificationStageResultSchema),
      runs: z.array(
        z.strictObject({
          stageId: verificationContextSchema.shape.stageId,
          runId: verificationContextSchema.shape.verificationId.nullable(),
          status: text,
        }),
      ),
    })
    .nullable(),
  verification: verificationSummarySchema.nullable(),
  failure: text.nullable(),
  legacyLocalRequested: z.boolean(),
  integrationLegacyExecuted: z.literal(false),
});

type VerificationReceipt = z.infer<typeof verificationReceiptSchema>;
export type { VerificationReceipt };
