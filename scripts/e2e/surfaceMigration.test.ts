import { describe, expect, it } from 'vitest';

import {
  buildSurfaceMigrationRecord,
  checkSurfaceMigration,
  checkSurfacePending,
  serializeSurfacePending,
  surfacePendingKey,
} from './surfaceMigration';
import { surfacePendingSchema } from './surfaceMigrationSchema';

import type { SurfacePendingItem } from './surfaceMigrationSchema';

const digest = (character: string) => character.repeat(64);
const renderDiagnostic = {
  category: 'render-diagnostic',
  entry: { kind: 'product', id: 'page:src/app/page.tsx' },
  code: 'UNRESOLVED_SURFACE_RENDER',
  mountSiteIds: ['surface-site:original-render'],
  anchor: {
    ownerId: 'function:render',
    syntaxHash: digest('a'),
    occurrence: 0,
  },
} as const satisfies SurfacePendingItem;
const unresolvedBinding = {
  category: 'unresolved-binding',
  surfaceId: `surface:${digest('a')}`,
  entry: renderDiagnostic.entry,
  code: 'UNRESOLVED_SURFACE_BINDING',
  mountSiteIds: ['surface-site:original-binding'],
  anchor: {
    ownerId: 'function:submit',
    syntaxHash: digest('b'),
    occurrence: 0,
  },
  bindingDigest: digest('c'),
} as const satisfies SurfacePendingItem;
const pending = (...items: SurfacePendingItem[]) =>
  surfacePendingSchema.parse({ schemaVersion: 1, items });
const migrationInput = () => ({
  observationBaseSha: 'a'.repeat(40),
  ruleDigest: digest('d'),
  old: {
    observationDigest: digest('e'),
    pending: pending(unresolvedBinding, renderDiagnostic),
  },
  current: {
    observationDigest: digest('f'),
    pending: pending(renderDiagnostic),
  },
});

describe('UI不足の初期移行', () => {
  it('現在の保存集合に旧不足の解消済みキーを残さない', () => {
    const input = migrationInput();
    const migration = buildSurfaceMigrationRecord(input);
    expect(migration.retiredKeys).toEqual([
      surfacePendingKey(unresolvedBinding),
    ]);
    expect(
      checkSurfaceMigration({
        ...input,
        saved: { migration, pending: input.current.pending },
      }),
    ).toEqual(migration);
    expect(() =>
      checkSurfaceMigration({
        ...input,
        saved: { migration, pending: input.old.pending },
      }),
    ).toThrow('保存UI不足');
  });

  it.each([
    'entry',
    'bindingDigest',
    'anchor',
  ] as const)('%sが異なる未解決を旧不足で代用しない', (field) => {
    const input = migrationInput();
    const changed =
      field === 'entry'
        ? {
            entry: {
              kind: 'storybook' as const,
              id: unresolvedBinding.entry.id,
            },
          }
        : field === 'anchor'
          ? { anchor: { ...unresolvedBinding.anchor, occurrence: 1 } }
          : { bindingDigest: digest('d') };
    input.current.pending = pending({ ...unresolvedBinding, ...changed });
    expect(() => buildSurfaceMigrationRecord(input)).toThrow(
      '存在しないUI不足',
    );
  });

  it('同じentryとanchorでも、新しい描画mountの不足は別キーになる', () => {
    const input = migrationInput();
    const migration = buildSurfaceMigrationRecord(input);
    const next = pending(renderDiagnostic, {
      ...renderDiagnostic,
      mountSiteIds: ['surface-site:other-render'],
    });
    expect(() =>
      buildSurfaceMigrationRecord({
        ...input,
        current: { ...input.current, pending: next },
      }),
    ).toThrow('存在しないUI不足');
    expect(() =>
      checkSurfacePending({
        base: { migration, pending: input.current.pending },
        head: { migration, pending: next },
        current: next,
      }),
    ).toThrow('存在しないUI不足');
  });

  it('記録された旧観測・不足digest・解消キーを再計算する', () => {
    const input = migrationInput();
    const expected = buildSurfaceMigrationRecord(input);
    for (const migration of [
      { ...expected, observationBaseSha: 'b'.repeat(40) },
      { ...expected, oldObservationDigest: digest('0') },
      { ...expected, oldPendingDigest: digest('0') },
      { ...expected, retiredKeys: [] },
    ]) {
      expect(() =>
        checkSurfaceMigration({
          ...input,
          saved: { migration, pending: input.current.pending },
        }),
      ).toThrow('初期移行記録');
    }
  });

  it('canonical順で保存し、同一キーの重複やcore不足の混入を拒否する', () => {
    expect(
      serializeSurfacePending(pending(renderDiagnostic, unresolvedBinding)),
    ).toBe(
      serializeSurfacePending(pending(unresolvedBinding, renderDiagnostic)),
    );
    expect(() =>
      serializeSurfacePending(pending(renderDiagnostic, renderDiagnostic)),
    ).toThrow('重複');
    expect(
      surfacePendingSchema.safeParse({
        schemaVersion: 1,
        items: [
          {
            category: 'deficiency',
            deficiency: {
              target: 'page:src/app/page.tsx',
              aspect: 'contract',
              layer: null,
              caseId: null,
              variant: null,
              actorBindings: null,
              profile: null,
              project: null,
              runtime: null,
            },
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe('移行後のUI不足', () => {
  it('解消を許し、初回の旧集合にあったキーも解消後は再追加できない', () => {
    const input = migrationInput();
    const migration = buildSurfaceMigrationRecord(input);
    const base = { migration, pending: input.current.pending };
    const resolved = { migration, pending: pending() };
    expect(() =>
      checkSurfacePending({ base, head: resolved, current: resolved.pending }),
    ).not.toThrow();
    expect(() =>
      checkSurfacePending({
        base: resolved,
        head: base,
        current: base.pending,
      }),
    ).toThrow('存在しないUI不足');
  });

  it('UI不足を保存から消しても観測に残る場合と移行履歴変更を拒否する', () => {
    const input = migrationInput();
    const migration = buildSurfaceMigrationRecord(input);
    const base = { migration, pending: input.current.pending };
    expect(() =>
      checkSurfacePending({
        base,
        head: { ...base, pending: pending() },
        current: base.pending,
      }),
    ).toThrow('保存UI不足');
    expect(() =>
      checkSurfacePending({
        base,
        head: { ...base, migration: { ...migration, ruleDigest: digest('0') } },
        current: base.pending,
      }),
    ).toThrow('初期移行記録は変更できません');
  });
});
