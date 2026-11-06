import { z } from 'zod';

import { deficiencySchema } from '../../e2e/ledger/schema';
import { gitShaSchema } from './gitObjects';
import { diagnosticAnchorSchema } from './inventoryPrimitives';
import { surfaceBindingSchema, surfaceDiagnosticSchema } from './surfaceSchema';

const digest = z.string().regex(/^[a-f0-9]{64}$/u);
const surfaceId = surfaceBindingSchema.shape.id;
const diagnosticIdentity = {
  entry: surfaceDiagnosticSchema.shape.entry,
  mountSiteIds: surfaceDiagnosticSchema.shape.mountSiteIds,
  code: surfaceDiagnosticSchema.shape.code,
  anchor: diagnosticAnchorSchema,
};

export const surfacePendingItemSchema = z.discriminatedUnion('category', [
  z.strictObject({
    category: z.literal('deficiency'),
    deficiency: deficiencySchema.extend({ target: surfaceId }),
  }),
  z.strictObject({
    category: z.literal('unresolved-binding'),
    surfaceId,
    ...diagnosticIdentity,
    bindingDigest: surfaceBindingSchema.shape.bindingDigest,
  }),
  z.strictObject({
    category: z.literal('render-diagnostic'),
    ...diagnosticIdentity,
    siteId: surfaceDiagnosticSchema.shape.siteId,
    bindingDigest: surfaceBindingSchema.shape.bindingDigest.optional(),
  }),
]);

export const surfacePendingSchema = z.strictObject({
  schemaVersion: z.literal(1),
  items: z.array(surfacePendingItemSchema),
});

export const surfaceMigrationSchema = z.strictObject({
  schemaVersion: z.literal(1),
  fromVersion: z.literal(1),
  toVersion: z.literal(2),
  extractorVersion: z.literal('2'),
  observationBaseSha: gitShaSchema,
  newKinds: z.tuple([z.literal('surface')]),
  ruleDigest: digest,
  oldObservationDigest: digest,
  newObservationDigest: digest,
  oldPendingDigest: digest,
  newPendingDigest: digest,
  retiredKeys: z.array(z.string().min(1)),
});

type SurfacePendingItem = z.infer<typeof surfacePendingItemSchema>;
type SurfacePending = z.infer<typeof surfacePendingSchema>;
type SurfaceMigration = z.infer<typeof surfaceMigrationSchema>;

export type { SurfaceMigration, SurfacePending, SurfacePendingItem };
