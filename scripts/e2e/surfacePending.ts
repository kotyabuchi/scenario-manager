import { pendingKey } from './baseline';
import { deriveRequirements } from './requirements';
import { assertOldSurfaceLedger, surfacePendingKey } from './surfaceMigration';
import { surfacePendingSchema } from './surfaceMigrationSchema';
import { withSurfaceNodes } from './surfaceProjection';

import { createHash } from 'node:crypto';

import type { Deficiency, Ledger } from '../../e2e/ledger/schema';
import type { PendingBaseline, PendingItem } from './baseline';
import type { Inventory } from './inventorySchema';
import type {
  SurfacePending,
  SurfacePendingItem,
} from './surfaceMigrationSchema';

/** 移行digestでは表示座標を除くが、site/context/構文/束縛の意味を残す。 */
export const surfaceObservationDigest = (inventory: Inventory) => {
  const canonical = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(canonical);
    if (input && typeof input === 'object')
      return Object.fromEntries(
        Object.entries(input)
          .filter(([key]) => key !== 'source')
          .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
          .map(([key, nested]) => [key, canonical(nested)]),
      );
    return input;
  };
  const value = Object.fromEntries(
    Object.entries(inventory.surfaceAnalysis).map(([key, items]) => [
      key,
      items
        .map(canonical)
        .sort((a, b) =>
          JSON.stringify(a) < JSON.stringify(b)
            ? -1
            : JSON.stringify(a) > JSON.stringify(b)
              ? 1
              : 0,
        ),
    ]),
  );
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
};

/** 実登録で判定済みの不足とUI専用の診断をcore不足から分離する。 */
export const buildSurfacePending = (
  inventory: Inventory,
  deficiencies: Deficiency[],
) => {
  const items: SurfacePendingItem[] = deficiencies
    .filter(({ target }) => target.startsWith('surface:'))
    .map((deficiency) => ({ category: 'deficiency', deficiency }));
  const consumed = new Set<string>();
  const diagnosticKey = (
    entry: unknown,
    siteId: string | undefined,
    mountSiteIds: string[],
    diagnostic: { code: string; anchor: unknown },
  ) =>
    JSON.stringify([
      entry,
      siteId ?? null,
      mountSiteIds,
      diagnostic.code,
      diagnostic.anchor,
    ]);
  for (const binding of inventory.surfaceAnalysis.bindings) {
    if (binding.entry.kind !== 'product') continue;
    for (const branch of binding.branches) {
      if (branch.resolution.kind !== 'unresolved') continue;
      for (const diagnostic of branch.resolution.diagnostics) {
        consumed.add(
          diagnosticKey(
            binding.entry,
            binding.siteId,
            binding.mountSiteIds,
            diagnostic,
          ),
        );
        items.push({
          category: 'unresolved-binding',
          surfaceId: binding.id,
          entry: binding.entry,
          mountSiteIds: binding.mountSiteIds,
          code: diagnostic.code,
          anchor: diagnostic.anchor,
          bindingDigest: binding.bindingDigest,
        });
      }
    }
  }
  for (const diagnostic of inventory.surfaceAnalysis.diagnostics) {
    if (
      diagnostic.entry.kind !== 'product' ||
      consumed.has(
        diagnosticKey(
          diagnostic.entry,
          diagnostic.siteId,
          diagnostic.mountSiteIds,
          diagnostic,
        ),
      )
    )
      continue;
    items.push({
      category: 'render-diagnostic',
      entry: diagnostic.entry,
      mountSiteIds: diagnostic.mountSiteIds,
      code: diagnostic.code,
      anchor: diagnostic.anchor,
      ...(diagnostic.siteId ? { siteId: diagnostic.siteId } : {}),
    });
  }
  return surfacePendingSchema.parse({
    schemaVersion: 1,
    items: [
      ...new Map(items.map((item) => [surfacePendingKey(item), item])).values(),
    ],
  });
};

/** v1はUI契約を持たないことを証明したときだけ、登録を借用せず旧不足を作る。 */
export const buildOldSurfacePending = (
  inventory: Inventory,
  ledger: Ledger,
) => {
  assertOldSurfaceLedger(ledger);
  if (inventory.nodes.some(({ kind }) => kind === 'surface'))
    throw new Error('旧v1台帳にUI surfaceの契約・claim・例外があります');
  const derived = deriveRequirements(withSurfaceNodes(inventory), ledger);
  if (derived.issues.length) throw new Error('旧台帳の要件を再現できません');
  return buildSurfacePending(inventory, derived.deficiencies);
};

/** 選択時だけUI不足も和集合にし、未整備領域を部分成功で網羅済みにしない。 */
export const surfaceSelectionBaseline = (
  core: PendingBaseline,
  surface: SurfacePending,
): PendingBaseline => {
  const items: PendingItem[] = surface.items.map((item) =>
    item.category === 'deficiency'
      ? item
      : {
          category: 'source-diagnostic',
          code: item.code,
          anchor: {
            ...item.anchor,
            ownerId:
              item.category === 'unresolved-binding'
                ? item.surfaceId
                : item.entry.id,
          },
        },
  );
  return {
    schemaVersion: 1,
    items: [
      ...new Map(
        [...core.items, ...items].map((item) => [pendingKey(item), item]),
      ).values(),
    ],
  };
};
