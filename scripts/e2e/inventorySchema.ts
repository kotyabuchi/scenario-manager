import { z } from 'zod';

import {
  diagnosticAnchorSchema,
  sourceLocationSchema,
} from './inventoryPrimitives';
import { validateSurfaceReferences } from './surfaceReferences';
import { surfaceAnalysisSchema } from './surfaceSchema';

export {
  diagnosticAnchorSchema,
  sourceLocationSchema,
} from './inventoryPrimitives';

export const inventoryNodeSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum([
      'page',
      'layout',
      'route',
      'default',
      'loading',
      'error',
      'template',
      'not-found',
      'global-error',
      'action',
      'api',
      'module',
      'function',
      'table',
      'rpc',
      'surface',
    ]),
    source: sourceLocationSchema,
    symbol: z.string().optional(),
    url: z.string().startsWith('/').optional(),
    slots: z.array(z.string()).default([]),
    navigation: z.enum(['direct', 'intercepted']).optional(),
    method: z
      .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
      .optional(),
  })
  .strict();

export const inventoryEdgeSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
    kind: z.enum([
      'imports',
      'exports',
      'contains',
      'calls',
      'renders',
      'uses',
      'unresolved',
    ]),
    source: sourceLocationSchema,
  })
  .strict();

export const inventoryDiagnosticSchema = z
  .object({
    code: z.string().min(1),
    message: z.string().min(1),
    severity: z.enum(['error', 'warning']),
    source: sourceLocationSchema.optional(),
    anchor: diagnosticAnchorSchema.optional(),
  })
  .strict();

export const sourceManifestSchema = z
  .object({
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    files: z.array(
      z
        .object({
          path: z.string().min(1),
          hash: z.string().regex(/^[a-f0-9]{64}$/),
        })
        .strict(),
    ),
  })
  .strict();

export const inventoryV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    extractorVersion: z.literal('1'),
    source: sourceManifestSchema,
    nodes: z.array(inventoryNodeSchema),
    edges: z.array(inventoryEdgeSchema),
    diagnostics: z.array(inventoryDiagnosticSchema),
  })
  .strict()
  .superRefine((inventory, context) => {
    const ids = new Set<string>();
    inventory.nodes.forEach((node, index) => {
      if (ids.has(node.id))
        context.addIssue({
          code: 'custom',
          path: ['nodes', index, 'id'],
          message: `node IDが重複しています: ${node.id}`,
        });
      ids.add(node.id);
    });
    inventory.edges.forEach((edge, index) => {
      for (const endpoint of ['from', 'to'] as const) {
        if (!ids.has(edge[endpoint]))
          context.addIssue({
            code: 'custom',
            path: ['edges', index, endpoint],
            message: `edgeの参照先が存在しません: ${edge[endpoint]}`,
          });
      }
    });
  });

/** v1の正本は履歴照合用に保持し、空の観測を補って移行済みにしない。 */
export const inventorySchema = z
  .object({
    schemaVersion: z.literal(2),
    extractorVersion: z.literal('2'),
    source: sourceManifestSchema,
    nodes: z.array(inventoryNodeSchema),
    edges: z.array(inventoryEdgeSchema),
    diagnostics: z.array(inventoryDiagnosticSchema),
    surfaceAnalysis: surfaceAnalysisSchema,
  })
  .strict()
  .superRefine((inventory, context) => {
    const result = inventoryV1Schema.safeParse({
      schemaVersion: 1,
      extractorVersion: '1',
      source: inventory.source,
      nodes: inventory.nodes,
      edges: inventory.edges,
      diagnostics: inventory.diagnostics,
    });
    if (!result.success)
      for (const issue of result.error.issues)
        context.addIssue({
          code: 'custom',
          path: issue.path,
          message: issue.message,
        });
    for (const issue of validateSurfaceReferences(inventory))
      context.addIssue({ code: 'custom', ...issue });
  });

export type InventoryV1 = z.infer<typeof inventoryV1Schema>;
export type SourceLocation = z.infer<typeof sourceLocationSchema>;
export type InventoryNode = z.infer<typeof inventoryNodeSchema>;
export type InventoryEdge = z.infer<typeof inventoryEdgeSchema>;
export type DiagnosticAnchor = z.infer<typeof diagnosticAnchorSchema>;
export type InventoryDiagnostic = z.infer<typeof inventoryDiagnosticSchema>;
export type SourceManifest = z.infer<typeof sourceManifestSchema>;
export type Inventory = z.infer<typeof inventorySchema>;
