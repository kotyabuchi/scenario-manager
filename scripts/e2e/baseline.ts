import { isNil } from 'ramda';
import { z } from 'zod';

import { deficiencySchema } from '../../e2e/ledger/schema';
import {
  diagnosticAnchorSchema,
  inventoryDiagnosticSchema,
} from './inventorySchema';
import { deficiencyKey, orderedBindings } from './ledgerIdentity';

import type { Deficiency, LedgerIssue } from '../../e2e/ledger/schema';
import type { InventoryDiagnostic } from './inventorySchema';

export const pendingItemSchema = z.discriminatedUnion('category', [
  z.strictObject({
    category: z.literal('deficiency'),
    deficiency: deficiencySchema,
  }),
  z.strictObject({
    category: z.literal('source-diagnostic'),
    code: z.string().trim().min(1),
    anchor: diagnosticAnchorSchema,
  }),
]);

export const baselineSchema = z.strictObject({
  schemaVersion: z.literal(1),
  items: z.array(pendingItemSchema),
});

const compare = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

/** 表示位置や理由を除き、不足の全次元またはAST anchorを識別する。 */
export const pendingKey = (input: PendingItem): string => {
  const item = pendingItemSchema.parse(input);
  return item.category === 'deficiency'
    ? JSON.stringify([item.category, deficiencyKey(item.deficiency)])
    : JSON.stringify([
        item.category,
        item.code,
        item.anchor.ownerId,
        item.anchor.syntaxHash,
        item.anchor.occurrence,
      ]);
};

const normalizedItems = (items: PendingItem[]): PendingItem[] =>
  items
    .map((input) => {
      const item = pendingItemSchema.parse(input);
      if (item.category === 'deficiency') {
        const bindings = item.deficiency.actorBindings;
        item.deficiency.actorBindings = isNil(bindings)
          ? null
          : orderedBindings(bindings);
      }
      return item;
    })
    .sort((left, right) => compare(pendingKey(left), pendingKey(right)));

/** エラーや安定anchorのない警告を既存負債へ隠さず、比較用項目を作る。 */
export const buildPendingItems = (
  deficiencies: Deficiency[],
  diagnostics: InventoryDiagnostic[],
): PendingItem[] =>
  normalizedItems([
    ...deficiencies.map((deficiency) => ({
      category: 'deficiency' as const,
      deficiency,
    })),
    ...diagnostics.map((input) => {
      const diagnostic = inventoryDiagnosticSchema.parse(input);
      if (diagnostic.severity === 'error' || isNil(diagnostic.anchor)) {
        const source = diagnostic.source;
        const location = isNil(source)
          ? ''
          : `${source.file}:${source.line}:${source.column}: `;
        throw new Error(
          `${location}baselineへ登録できない診断です: ${diagnostic.code} (${diagnostic.message})`,
        );
      }
      return {
        category: 'source-diagnostic' as const,
        code: diagnostic.code,
        anchor: diagnostic.anchor,
      };
    }),
  ]);

/** 呼出元が明示的に保存するためのJSONを返す。自動更新やファイル操作はしない。 */
export const serializeBaseline = (input: PendingBaseline): string => {
  const baseline = baselineSchema.parse(input);
  baseline.items = normalizedItems(baseline.items);
  const keys = baseline.items.map(pendingKey);
  if (new Set(keys).size !== keys.length)
    throw new Error('baselineの項目が重複しています。');
  return `${JSON.stringify(baseline, null, 2)}\n`;
};

/** headの正確性とtrusted baseからの負債増加を別々に検査する。 */
export const checkBaseline = ({
  base,
  head,
  current,
}: {
  base: PendingBaseline;
  head: PendingBaseline;
  current: PendingItem[];
}): LedgerIssue[] => {
  const issues: LedgerIssue[] = [];
  const index = (name: string, items: PendingItem[]) => {
    const keys = new Set<string>();
    for (const item of items) {
      const key = pendingKey(item);
      if (keys.has(key))
        issues.push({
          code: 'DUPLICATE_BASELINE_ITEM',
          subject: `${name}:${key}`,
          message: '同じ不足項目が重複しています。',
        });
      keys.add(key);
    }
    return keys;
  };
  const baseKeys = index('base', baselineSchema.parse(base).items);
  const headKeys = index('head', baselineSchema.parse(head).items);
  const currentKeys = index('current', current);
  for (const key of currentKeys) {
    if (!headKeys.has(key))
      issues.push({
        code: 'MISSING_BASELINE_ITEM',
        subject: key,
        message: '現在の不足がhead baselineに記録されていません。',
      });
    if (!baseKeys.has(key))
      issues.push({
        code: 'NEW_PENDING_ITEM',
        subject: key,
        message: '信頼したbaseに存在しない不足は追加できません。',
      });
  }
  for (const key of headKeys) {
    if (!currentKeys.has(key))
      issues.push({
        code: 'STALE_BASELINE_ITEM',
        subject: key,
        message: '解消済みまたは現在の抽出結果にない不足が残っています。',
      });
  }
  return issues.sort((left, right) =>
    compare(`${left.code}:${left.subject}`, `${right.code}:${right.subject}`),
  );
};

type PendingItem = z.infer<typeof pendingItemSchema>;
type PendingBaseline = z.infer<typeof baselineSchema>;
export type { PendingItem, PendingBaseline };
