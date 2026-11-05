import { z } from 'zod';

import {
  diagnosticAnchorSchema,
  sourceLocationSchema,
} from './inventoryPrimitives';

const id = z.string().min(1);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const surfaceEntrySchema = z
  .object({ kind: z.enum(['product', 'storybook']), id })
  .strict();

export const surfaceEventSchema = z.enum([
  'click',
  'submit',
  'form-action',
  'change',
  'open-change',
  'select',
  'navigate',
]);

const siteFields = {
  id: z.string().startsWith('surface-site:'),
  ownerId: id,
  tag: id,
  source: sourceLocationSchema,
  locator: z.array(z.string().min(1)).min(1),
};
export const surfaceSiteSchema = z.discriminatedUnion('kind', [
  z.object({ ...siteFields, kind: z.literal('mount') }).strict(),
  z
    .object({
      ...siteFields,
      kind: z.literal('interaction'),
      event: surfaceEventSchema,
    })
    .strict(),
]);

export const surfaceEndpointSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('node'), nodeId: id }).strict(),
  z.object({ kind: z.literal('site'), siteId: id }).strict(),
  z.object({ kind: z.literal('prop'), ownerId: id, name: id }).strict(),
  z.object({ kind: z.literal('handler'), siteId: id }).strict(),
]);
export const surfaceFlowStepSchema = z
  .object({
    kind: z.enum([
      'render',
      'pass-prop',
      'invoke-prop',
      'invoke-handler',
      'navigate-to',
    ]),
    source: sourceLocationSchema,
    from: surfaceEndpointSchema,
    to: surfaceEndpointSchema,
  })
  .strict();

const diagnosticReferenceSchema = z
  .object({ code: id, anchor: diagnosticAnchorSchema })
  .strict();
export const surfaceResolutionSchema = z.discriminatedUnion('kind', [
  z
    .object({ kind: z.literal('resolved'), targetIds: z.array(id).min(1) })
    .strict(),
  z.object({ kind: z.literal('local') }).strict(),
  z.object({ kind: z.literal('optional-absent') }).strict(),
  z.object({ kind: z.literal('external-navigation') }).strict(),
  z
    .object({
      kind: z.literal('unresolved'),
      targetIds: z.array(id),
      diagnostics: z.array(diagnosticReferenceSchema).min(1),
    })
    .strict(),
]);
export const surfaceBranchSchema = z
  .object({
    role: z.enum(['handler', 'valid', 'invalid']),
    flow: z.array(surfaceFlowStepSchema),
    resolution: surfaceResolutionSchema,
  })
  .strict();
export const surfaceBindingSchema = z
  .object({
    id: z.string().startsWith('surface:'),
    siteId: id,
    entry: surfaceEntrySchema,
    mountSiteIds: z.array(id),
    branches: z.array(surfaceBranchSchema).min(1),
    bindingDigest: digest,
  })
  .strict();
export const surfaceDiagnosticSchema = z
  .object({
    code: id,
    message: id,
    source: sourceLocationSchema,
    anchor: diagnosticAnchorSchema,
    entry: surfaceEntrySchema,
    mountSiteIds: z.array(id),
    siteId: id.optional(),
  })
  .strict();
export const surfaceAnalysisSchema = z
  .object({
    sites: z.array(surfaceSiteSchema),
    bindings: z.array(surfaceBindingSchema),
    diagnostics: z.array(surfaceDiagnosticSchema),
    storyReferences: z.array(
      z
        .object({
          id,
          source: sourceLocationSchema,
          kind: z.enum(['entry', 'symbol']),
        })
        .strict(),
    ),
  })
  .strict();

export type SurfaceEntry = z.infer<typeof surfaceEntrySchema>;
export type SurfaceEvent = z.infer<typeof surfaceEventSchema>;
export type SurfaceSite = z.infer<typeof surfaceSiteSchema>;
export type SurfaceEndpoint = z.infer<typeof surfaceEndpointSchema>;
export type SurfaceFlowStep = z.infer<typeof surfaceFlowStepSchema>;
export type SurfaceResolution = z.infer<typeof surfaceResolutionSchema>;
export type SurfaceBranch = z.infer<typeof surfaceBranchSchema>;
export type SurfaceBinding = z.infer<typeof surfaceBindingSchema>;
export type SurfaceDiagnostic = z.infer<typeof surfaceDiagnosticSchema>;
export type SurfaceAnalysis = z.infer<typeof surfaceAnalysisSchema>;
