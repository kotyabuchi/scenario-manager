import { z } from 'zod';

import { discoveryTestSchema } from './discoverySchema';
import { legacyEntrySchema } from './legacy';

const text = z.string().trim().min(1);
const identity = {
  key: z.string().min(1),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
};

/** 既存登録ごとの実行先。未実行理由をlocalの成功へ混ぜない。 */
export const legacyExecutionEntrySchema = z.discriminatedUnion('disposition', [
  z.strictObject({ ...identity, disposition: z.literal('local') }),
  z.strictObject({
    ...identity,
    disposition: z.literal('replacement'),
    reason: text,
    origin: z.strictObject({
      revision: z.string().regex(/^[a-f0-9]{40}$/),
      registration: legacyEntrySchema.strict(),
    }),
    replacement: z.strictObject({ caseId: text, variant: text, binding: text }),
  }),
  z.strictObject({
    ...identity,
    disposition: z.literal('existing-skip'),
    reason: text,
    expectedAnnotation: z.strictObject({
      type: z.literal('skip'),
      description: text,
    }),
  }),
  z.strictObject({
    ...identity,
    disposition: z.literal('existing-fixme'),
    reason: text,
    expectedAnnotation: z.strictObject({
      type: z.literal('fixme'),
      description: text.optional(),
    }),
  }),
  z.strictObject({
    ...identity,
    disposition: z.literal('deferred-live'),
    reason: text,
  }),
]);

export const legacyExecutionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  entries: z.array(legacyExecutionEntrySchema),
});

/** adapterが登録identityを付けた最終結果。retryの生行を重複投入しない。 */
export const legacyExecutionResultSchema = z.strictObject({
  ...identity,
  originFingerprint: identity.fingerprint.optional(),
  status: discoveryTestSchema.shape.expectedStatus,
  expectedStatus: discoveryTestSchema.shape.expectedStatus,
  annotations: discoveryTestSchema.shape.annotations,
});

export const legacyExecutionResultsSchema = z.array(
  legacyExecutionResultSchema,
);

type LegacyExecution = z.infer<typeof legacyExecutionSchema>;
type LegacyExecutionEntry = z.infer<typeof legacyExecutionEntrySchema>;
type LegacyExecutionResult = z.infer<typeof legacyExecutionResultSchema>;
export type { LegacyExecution, LegacyExecutionEntry, LegacyExecutionResult };
