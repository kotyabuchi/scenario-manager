import { describe, expect, it } from 'vitest';

import {
  baselineSchema,
  buildPendingItems,
  checkBaseline,
  pendingKey,
  serializeBaseline,
} from './baseline';

import type { Deficiency } from '../../e2e/ledger/schema';
import type { PendingBaseline, PendingItem } from './baseline';
import type { InventoryDiagnostic } from './inventorySchema';

const deficiency = (overrides: Partial<Deficiency> = {}): Deficiency => ({
  target: 'action:src/app/schedule/actions.ts#confirm',
  aspect: 'persist',
  layer: 'browser',
  caseId: 'schedule-save',
  variant: 'creator-only',
  actorBindings: [{ role: 'operator', actor: 'creator' }],
  profile: 'app',
  project: 'chromium',
  runtime: 'next-production',
  ...overrides,
});
const diagnostic = (
  overrides: Partial<InventoryDiagnostic> = {},
): InventoryDiagnostic => ({
  code: 'UNRESOLVED_CALL',
  severity: 'warning',
  message: '呼出先を解決できません。',
  source: { file: 'src/app/schedule/actions.ts', line: 10, column: 3 },
  anchor: {
    ownerId: 'function:src/app/schedule/actions.ts#confirm',
    syntaxHash: 'a'.repeat(64),
    occurrence: 0,
  },
  ...overrides,
});
const baseline = (items: PendingItem[]): PendingBaseline => ({
  schemaVersion: 1,
  items,
});
const codes = (result: ReturnType<typeof checkBaseline>) =>
  result.map((issue) => issue.code);

describe('不足baselineの純粋比較', () => {
  it('順序を正規化し、入力やactor配列を変更しない', () => {
    const original = [
      deficiency({
        actorBindings: [
          { role: 'observer', actor: 'outsider' },
          { role: 'operator', actor: 'creator' },
        ],
      }),
      deficiency({ project: 'mobile-chrome' }),
    ];
    const snapshot = structuredClone(original);
    const items = buildPendingItems(original, [diagnostic()]);
    const reversed = buildPendingItems(
      [...original].reverse().map((entry) => ({
        ...entry,
        actorBindings: entry.actorBindings?.toReversed() ?? null,
      })),
      [diagnostic()],
    );
    expect(serializeBaseline(baseline(items))).toBe(
      serializeBaseline(baseline(reversed)),
    );
    expect(original).toEqual(snapshot);
    const input = {
      base: baseline(items),
      head: baseline(reversed),
      current: items,
    };
    const before = structuredClone(input);
    expect(checkBaseline(input)).toEqual([]);
    expect(input).toEqual(before);
  });

  it.each([
    { target: 'action:src/app/schedule/actions.ts#cancel' },
    { aspect: 'authorization' as const },
    { layer: 'integration' as const },
    { caseId: 'schedule-other' },
    { variant: 'keeper-only' },
    { actorBindings: [{ role: 'operator', actor: 'keeper' }] },
    { profile: 'other-app' },
    { project: 'mobile-chrome' },
    { runtime: 'cloudflare-workers' as const },
  ])('同数でも不足の各次元の変更を検出する: %j', (overrides) => {
    const old = buildPendingItems([deficiency()], []);
    const current = buildPendingItems([deficiency(overrides)], []);
    expect(
      codes(
        checkBaseline({
          base: baseline(old),
          head: baseline(current),
          current,
        }),
      ),
    ).toEqual(['NEW_PENDING_ITEM']);
  });

  it('未知actorと既知の匿名actorを混同しない', () => {
    const unknown = buildPendingItems(
      [deficiency({ actorBindings: null })],
      [],
    );
    const anonymous = buildPendingItems(
      [deficiency({ actorBindings: [] })],
      [],
    );
    expect(unknown.map(pendingKey)).not.toEqual(anonymous.map(pendingKey));
  });

  it('解消した不足だけをbaselineから削除できる', () => {
    const items = buildPendingItems(
      [deficiency(), deficiency({ project: 'mobile-chrome' })],
      [],
    );
    const current = items.slice(0, 1);
    expect(
      checkBaseline({
        base: baseline(items),
        head: baseline(current),
        current,
      }),
    ).toEqual([]);
    expect(
      codes(
        checkBaseline({
          base: baseline(items),
          head: baseline(items),
          current,
        }),
      ),
    ).toEqual(['STALE_BASELINE_ITEM']);
  });

  it('手動でbaselineから項目を消しても現在の不足を隠せない', () => {
    const items = buildPendingItems([deficiency()], []);
    expect(
      codes(
        checkBaseline({
          base: baseline(items),
          head: baseline([]),
          current: items,
        }),
      ),
    ).toEqual(['MISSING_BASELINE_ITEM']);
  });

  it('新規不足をheadへ追加してもbaseとの比較で拒否する', () => {
    const items = buildPendingItems([deficiency()], []);
    expect(
      codes(
        checkBaseline({
          base: baseline([]),
          head: baseline(items),
          current: items,
        }),
      ),
    ).toEqual(['NEW_PENDING_ITEM']);
  });

  it.each([
    'base',
    'head',
    'current',
  ] as const)('%s内の重複を拒否する', (field) => {
    const items = buildPendingItems([deficiency()], []);
    const doubled = [...items, ...items];
    const input = {
      base: baseline(items),
      head: baseline(items),
      current: items,
    };
    if (field === 'current') input.current = doubled;
    else input[field] = baseline(doubled);
    expect(codes(checkBaseline(input))).toEqual(['DUPLICATE_BASELINE_ITEM']);
    expect(() => serializeBaseline(baseline(doubled))).toThrow('重複');
  });

  it('診断の位置と表示文を変更しても同じanchorなら不足identityは不変', () => {
    const old = buildPendingItems([], [diagnostic()]);
    const current = buildPendingItems(
      [],
      [
        diagnostic({
          message: '新しい説明文',
          source: { file: 'src/app/schedule/actions.ts', line: 100, column: 8 },
        }),
      ],
    );
    expect(current).toEqual(old);
    expect(
      checkBaseline({ base: baseline(old), head: baseline(current), current }),
    ).toEqual([]);
  });

  it.each([
    {
      ownerId: 'function:src/app/schedule/actions.ts#cancel',
      syntaxHash: 'a'.repeat(64),
      occurrence: 0,
    },
    {
      ownerId: 'function:src/app/schedule/actions.ts#confirm',
      syntaxHash: 'b'.repeat(64),
      occurrence: 0,
    },
    {
      ownerId: 'function:src/app/schedule/actions.ts#confirm',
      syntaxHash: 'a'.repeat(64),
      occurrence: 1,
    },
  ])('診断のowner/構文/同一call追加を区別する: %j', (anchor) => {
    const old = buildPendingItems([], [diagnostic()]);
    const current = buildPendingItems([], [diagnostic({ anchor })]);
    expect(
      codes(
        checkBaseline({
          base: baseline(old),
          head: baseline(current),
          current,
        }),
      ),
    ).toEqual(['NEW_PENDING_ITEM']);
  });

  it('同じanchorでも診断codeが変われば新規扱いにする', () => {
    const old = buildPendingItems([], [diagnostic()]);
    const current = buildPendingItems(
      [],
      [diagnostic({ code: 'UNRESOLVED_DB_TARGET' })],
    );
    expect(
      codes(
        checkBaseline({
          base: baseline(old),
          head: baseline(current),
          current,
        }),
      ),
    ).toEqual(['NEW_PENDING_ITEM']);
  });

  it.each([
    'error',
    'warning',
  ] as const)('%s診断をbaselineへ登録せず、拒否理由にsourceのfile・line・columnを保持する', (severity) => {
    const rejected = diagnostic({
      severity,
      code: severity === 'error' ? 'SOURCE_PARSE_ERROR' : 'UNRESOLVED_CALL',
      source: { file: 'src/app/feature/actions.ts', line: 42, column: 9 },
    });
    if (severity === 'warning') delete rejected.anchor;
    expect(() => buildPendingItems([], [rejected])).toThrow(
      `src/app/feature/actions.ts:42:9: baselineへ登録できない診断です: ${rejected.code} (${rejected.message})`,
    );
  });

  it('sourceのない診断も位置を捏造せずcodeと理由を保持して拒否する', () => {
    const rejected = diagnostic({ severity: 'error' });
    delete rejected.source;
    expect(() => buildPendingItems([], [rejected])).toThrow(
      'baselineへ登録できない診断です: UNRESOLVED_CALL (呼出先を解決できません。)',
    );
  });

  it('schema欠落、未知version、未知categoryや余分なfieldを受理しない', () => {
    for (const input of [
      {},
      { schemaVersion: 2, items: [] },
      { schemaVersion: 1, items: [{ category: 'approved' }] },
      { schemaVersion: 1, items: [], approved: true },
    ])
      expect(baselineSchema.safeParse(input).success).toBe(false);
    const items = buildPendingItems([deficiency()], []);
    expect(() =>
      checkBaseline({
        base: baselineSchema.parse({}),
        head: baseline(items),
        current: items,
      }),
    ).toThrow();
  });
});
