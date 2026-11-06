import { isNil } from 'ramda';

import { deficiencyKey, orderedBindings } from './ledgerIdentity';
import {
  surfaceMigrationSchema,
  surfacePendingItemSchema,
  surfacePendingSchema,
} from './surfaceMigrationSchema';
import { SurfacePendingSubsetError } from './surfacePendingDiagnostic';

import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import type { Ledger } from '../../e2e/ledger/schema';
import type {
  SurfaceMigration,
  SurfacePending,
  SurfacePendingItem,
} from './surfaceMigrationSchema';

const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');

/** 表示位置や台帳の記述順に依存しない不足キーを作る。 */
export const surfacePendingKey = (input: SurfacePendingItem) => {
  const item = surfacePendingItemSchema.parse(input);
  return item.category === 'deficiency'
    ? JSON.stringify([item.category, deficiencyKey(item.deficiency)])
    : JSON.stringify([
        item.category,
        item.entry.kind,
        item.entry.id,
        item.mountSiteIds,
        item.category === 'unresolved-binding'
          ? item.surfaceId
          : (item.siteId ?? null),
        item.code,
        item.anchor.ownerId,
        item.anchor.syntaxHash,
        item.anchor.occurrence,
        item.bindingDigest ?? null,
      ]);
};

const normalizePending = (input: SurfacePending) => {
  const { items, schemaVersion } = surfacePendingSchema.parse(input);
  const keys = new Set<string>();
  const entries = items.map((item) => {
    const key = surfacePendingKey(item);
    if (keys.has(key)) throw new Error('UI不足のキーが重複しています。');
    keys.add(key);
    if (item.category === 'deficiency' && !isNil(item.deficiency.actorBindings))
      item.deficiency.actorBindings = orderedBindings(
        item.deficiency.actorBindings,
      );
    return { key, item };
  });
  entries.sort((left, right) =>
    left.key < right.key ? -1 : left.key > right.key ? 1 : 0,
  );
  return { schemaVersion, items: entries.map(({ item }) => item) };
};

/** UI不足の保存形式を正規化する。 */
export const serializeSurfacePending = (input: SurfacePending) =>
  `${JSON.stringify(normalizePending(input), null, 2)}\n`;

export const surfacePendingDigest = (input: SurfacePending) =>
  digest(serializeSurfacePending(input));

export const surfaceMigrationDigest = (input: SurfaceMigration) =>
  digest(`${JSON.stringify(surfaceMigrationSchema.parse(input))}\n`);

/** v1側には新しいsurface契約・claim・例外を持ち込まない。 */
export const assertOldSurfaceLedger = (ledger: Ledger) => {
  const targets = [
    ...ledger.contracts.map(({ target }) => target),
    ...ledger.scenarios.flatMap(({ cases }) =>
      cases.flatMap(({ checks }) => checks.map(({ target }) => target)),
    ),
    ...ledger.exceptions.map(({ deficiency }) => deficiency.target),
  ];
  if (targets.some((target) => target.startsWith('surface:')))
    throw new Error('旧v1台帳にsurface契約・claim・例外があります。');
};

type SurfaceObservation = {
  observationDigest: string;
  pending: SurfacePending;
};

type SurfaceMigrationInput = {
  observationBaseSha: string;
  ruleDigest: string;
  old: SurfaceObservation;
  current: SurfaceObservation;
};

const assertPendingSubset = (base: SurfacePending, current: SurfacePending) => {
  const baseKeys = normalizePending(base).items.map(surfacePendingKey);
  const allowed = new Set(baseKeys);
  const currentKeys = new Set<string>();
  const added: SurfacePendingItem[] = [];
  for (const item of normalizePending(current).items) {
    const key = surfacePendingKey(item);
    currentKeys.add(key);
    if (!allowed.has(key)) added.push(item);
  }
  if (added.length) throw new SurfacePendingSubsetError(added);
  return baseKeys.filter((key) => !currentKeys.has(key));
};

/** 旧観測に実在する不足だけを許す初期移行記録を作る。 */
export const buildSurfaceMigrationRecord = (input: SurfaceMigrationInput) => {
  const retiredKeys = assertPendingSubset(
    input.old.pending,
    input.current.pending,
  );
  return surfaceMigrationSchema.parse({
    schemaVersion: 1,
    fromVersion: 1,
    toVersion: 2,
    extractorVersion: '2',
    observationBaseSha: input.observationBaseSha,
    newKinds: ['surface'],
    ruleDigest: input.ruleDigest,
    oldObservationDigest: input.old.observationDigest,
    newObservationDigest: input.current.observationDigest,
    oldPendingDigest: surfacePendingDigest(input.old.pending),
    newPendingDigest: surfacePendingDigest(input.current.pending),
    retiredKeys,
  });
};

type SavedSurfaceState = {
  pending: SurfacePending;
  migration: SurfaceMigration;
};

const assertSavedPending = (head: SurfacePending, current: SurfacePending) => {
  if (!isDeepStrictEqual(normalizePending(head), normalizePending(current)))
    throw new Error('保存UI不足が現在の観測と一致しません。');
};

/** 固定した旧現の観測、現行不足と保存物を独立に比較する。 */
export const checkSurfaceMigration = (
  input: SurfaceMigrationInput & { saved: SavedSurfaceState },
) => {
  const expected = buildSurfaceMigrationRecord(input);
  if (
    !isDeepStrictEqual(
      surfaceMigrationSchema.parse(input.saved.migration),
      expected,
    )
  )
    throw new Error('UI初期移行記録が旧現の観測と一致しません。');
  assertSavedPending(input.saved.pending, input.current.pending);
  return expected;
};

/** 移行済みのbaseから不足の増加・解消後の再追加・移行履歴の変更を拒否する。 */
export const checkSurfacePending = ({
  base,
  head,
  current,
}: {
  base: SavedSurfaceState;
  head: SavedSurfaceState;
  current: SurfacePending;
}) => {
  if (
    !isDeepStrictEqual(
      surfaceMigrationSchema.parse(base.migration),
      surfaceMigrationSchema.parse(head.migration),
    )
  )
    throw new Error('既存のUI初期移行記録は変更できません。');
  assertPendingSubset(base.pending, current);
  assertSavedPending(head.pending, current);
};

export type { SavedSurfaceState, SurfaceMigrationInput, SurfaceObservation };
