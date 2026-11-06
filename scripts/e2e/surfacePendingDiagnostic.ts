import { isNil } from 'ramda';

import type { SurfacePendingItem } from './surfaceMigrationSchema';
import type { SurfaceAnalysis } from './surfaceSchema';

const SUMMARY_LIMIT = 10;
const IDENTIFIER_LIMIT = 160;
// surfaceRoots、surfaces、surfaceSites、callbackResultsの既知コードだけを公開する。
const PUBLIC_DIAGNOSTIC_CODES = [
  'SURFACE_CALLBACK_ACTION_AMBIGUOUS',
  'SURFACE_CALLBACK_CALL_UNKNOWN',
  'SURFACE_CALLBACK_NAVIGATION_UNKNOWN',
  'SURFACE_CALLBACK_TRUNCATED',
  'SURFACE_CALLBACK_UNKNOWN',
  'SURFACE_COMPONENT_RECURSION',
  'SURFACE_RENDER_CYCLE',
  'SURFACE_RENDER_LIMIT',
  'SURFACE_SITE_AMBIGUOUS',
  'SURFACE_UNRESOLVED_BUTTON_SLOT',
  'SURFACE_UNRESOLVED_CHILDREN',
  'SURFACE_UNRESOLVED_COMPONENT',
  'SURFACE_UNRESOLVED_PRODUCT_ROOT',
  'SURFACE_UNRESOLVED_RENDER_VALUE',
  'SURFACE_UNRESOLVED_STORY_META',
  'SURFACE_UNRESOLVED_STORY_RENDER',
  'SURFACE_UNSUPPORTED_EVENT',
] as const;

/** 比較元にない正規化済み項目を、公開用メッセージとは別に保持する。 */
export class SurfacePendingSubsetError extends Error {
  readonly #items: readonly SurfacePendingItem[];

  constructor(items: readonly SurfacePendingItem[]) {
    super('比較元に存在しないUI不足は追加できません。');
    this.name = 'SurfacePendingSubsetError';
    this.#items = items;
  }

  get items() {
    return this.#items;
  }
}

const safeIdentifier = (value: string | undefined) => {
  if (isNil(value)) return null;
  const bounded =
    value.length > IDENTIFIER_LIMIT
      ? `${value.slice(0, IDENTIFIER_LIMIT - 1)}…`
      : value;
  return bounded.replace(/[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/gu, '�');
};

/** 診断には固定コードと識別子だけを採用し、任意の例外文やソースを含めない。 */
export const buildSurfacePendingDiagnostic = (
  error: SurfacePendingSubsetError,
  bindings: SurfaceAnalysis['bindings'] = [],
) => {
  const byId = new Map(bindings.map((binding) => [binding.id, binding]));
  const details = error.items.map((item) => {
    if (item.category === 'deficiency') {
      const { target, aspect } = item.deficiency;
      const binding = byId.get(target);
      return {
        entry: safeIdentifier(binding?.entry.id),
        site: safeIdentifier(binding?.siteId),
        code: 'UI_SURFACE_DEFICIENCY' as const,
        target: safeIdentifier(target),
        aspect,
      };
    }
    const diagnosticCode = PUBLIC_DIAGNOSTIC_CODES.find(
      (code) => code === item.code,
    );
    const cause = isNil(diagnosticCode) ? {} : { diagnosticCode };
    if (item.category === 'unresolved-binding') {
      const binding = byId.get(item.surfaceId);
      return {
        entry: safeIdentifier(binding?.entry.id ?? item.entry.id),
        site: safeIdentifier(binding?.siteId),
        code: 'UI_SURFACE_UNRESOLVED_BINDING' as const,
        ...cause,
      };
    }
    return {
      entry: safeIdentifier(item.entry.id),
      site: safeIdentifier(item.siteId),
      code: 'UI_SURFACE_RENDER_DIAGNOSTIC' as const,
      ...cause,
    };
  });
  const items = details.slice(0, SUMMARY_LIMIT);
  return {
    details,
    summary: {
      total: details.length,
      omitted: details.length - items.length,
      items,
    },
  };
};
