import { z } from 'zod';

import { gitPathSchema } from './gitSnapshotSchema';

const text = z.string().trim().min(1);
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);

export const impactPathSchema = z.strictObject({
  kind: z.enum(['file', 'directory']),
  path: gitPathSchema,
});

const rule = z.strictObject({
  id,
  reason: text,
  paths: z.array(impactPathSchema).min(1),
});

const feature = rule.extend({
  targets: z.array(text),
  caseIds: z.array(id),
  legacyPaths: z.array(impactPathSchema).default([]),
});

export const impactRulesSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    features: z.array(feature),
    alwaysFull: z.array(rule),
    databaseWide: z.array(rule),
    docsOnly: z.array(
      rule.extend({
        paths: z
          .array(
            impactPathSchema.extend({
              kind: z.literal('file'),
              path: gitPathSchema.refine((path) => path.endsWith('.md')),
            }),
          )
          .min(1),
      }),
    ),
  })
  .superRefine((rules, context) => {
    const ids = new Set<string>();
    for (const rule of [
      ...rules.features,
      ...rules.alwaysFull,
      ...rules.databaseWide,
      ...rules.docsOnly,
    ]) {
      if (ids.has(rule.id))
        context.addIssue({
          code: 'custom',
          message: `規則IDが重複しています: ${rule.id}`,
        });
      ids.add(rule.id);
    }
    for (const rule of rules.features) {
      if (rule.targets.length + rule.caseIds.length === 0)
        context.addIssue({
          code: 'custom',
          message: `機能の対象がありません: ${rule.id}`,
        });
    }
  });

type ImpactPath = z.infer<typeof impactPathSchema>;
type ImpactRules = z.infer<typeof impactRulesSchema>;

export type { ImpactPath, ImpactRules };
