import { z } from 'zod';

export const sourceLocationSchema = z
  .object({
    file: z.string().min(1),
    line: z.number().int().positive(),
    column: z.number().int().positive(),
  })
  .strict();

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
    kind: z.enum(['imports', 'calls', 'renders', 'uses']),
    source: sourceLocationSchema,
  })
  .strict();

export const inventoryDiagnosticSchema = z
  .object({
    code: z.string().min(1),
    message: z.string().min(1),
    severity: z.enum(['error', 'warning']),
    source: sourceLocationSchema.optional(),
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

export const inventorySchema = z
  .object({
    schemaVersion: z.literal(1),
    extractorVersion: z.literal('1'),
    source: sourceManifestSchema,
    nodes: z.array(inventoryNodeSchema),
    edges: z.array(inventoryEdgeSchema),
    diagnostics: z.array(inventoryDiagnosticSchema),
  })
  .strict();

export type SourceLocation = z.infer<typeof sourceLocationSchema>;
export type InventoryNode = z.infer<typeof inventoryNodeSchema>;
export type InventoryEdge = z.infer<typeof inventoryEdgeSchema>;
export type InventoryDiagnostic = z.infer<typeof inventoryDiagnosticSchema>;
export type SourceManifest = z.infer<typeof sourceManifestSchema>;
export type Inventory = z.infer<typeof inventorySchema>;
