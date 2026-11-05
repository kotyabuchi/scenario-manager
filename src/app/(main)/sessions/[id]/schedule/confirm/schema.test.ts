import { describe, expect, it } from 'vitest';

import { saveAvailabilityTimeBlocksSchema } from '../availability/schema';
import { confirmScheduleTimeBlocksSchema } from './schema';

describe.each([
  ['日程確定', confirmScheduleTimeBlocksSchema],
  ['スケジュール提出', saveAvailabilityTimeBlocksSchema],
])('%sの日時境界', (_name, schema) => {
  it('DB再取得のoffset付き既存枠と、UI追加のZ形式の枠を混在して保存できる', () => {
    const input = {
      timeBlocks: [
        {
          startAt: '2026-11-15T09:00:00+00:00',
          endAt: '2026-11-15T11:00:00+00:00',
        },
        {
          startAt: '2026-11-16T18:00:00+09:00',
          endAt: '2026-11-16T20:00:00+09:00',
        },
        {
          startAt: '2026-11-17T09:00:00.000Z',
          endAt: '2026-11-17T11:00:00.000Z',
        },
      ],
    };
    expect(schema.parse(input)).toEqual(input);
  });

  it('timezoneのない日時は引き続き開始・終了とも拒否する', () => {
    const result = schema.safeParse({
      timeBlocks: [
        {
          startAt: '2026-11-15T09:00:00',
          endAt: '2026-11-15T11:00:00',
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(({ path }) => path.at(-1))).toEqual([
        'startAt',
        'endAt',
      ]);
    }
  });
  it.each([
    ['同時刻', '2026-11-15T09:00:00Z'],
    ['逆転', '2026-11-15T11:00:00Z'],
  ])('%sの開始・終了を従来のpathで拒否する', (_name, startAt) => {
    const result = schema.safeParse({
      timeBlocks: [{ startAt, endAt: '2026-11-15T09:00:00Z' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual([
        expect.objectContaining({
          path: ['timeBlocks', 0, 'endAt'],
          message: '開始日時は終了日時より前である必要があります',
        }),
      ]);
    }
  });

  it('逆転かつ30分境界外なら、両エラーのpathと実行順を維持する', () => {
    const result = schema.safeParse({
      timeBlocks: [
        {
          startAt: '2026-11-15T11:15:00+00:00',
          endAt: '2026-11-15T09:15:00+00:00',
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.map(({ path, message }) => ({ path, message })),
      ).toEqual([
        {
          path: ['timeBlocks', 0, 'endAt'],
          message: '開始日時は終了日時より前である必要があります',
        },
        {
          path: ['timeBlocks', 0],
          message: '日時は30分単位で指定してください',
        },
      ]);
    }
  });
});

describe('日程確定の件数上限', () => {
  it('offset表記が異なっても同一瞬間の枠の重複を拒否する', () => {
    const result = confirmScheduleTimeBlocksSchema.safeParse({
      timeBlocks: [
        { startAt: '2026-11-15T09:00:00Z', endAt: '2026-11-15T11:00:00Z' },
        {
          startAt: '2026-11-15T18:00:00+09:00',
          endAt: '2026-11-15T20:00:00+09:00',
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual([
        expect.objectContaining({
          path: ['timeBlocks'],
          message: '確定日程同士が重複しています',
        }),
      ]);
    }
  });

  it('再取得した2枠に19枠を追加したとき、日時の誤判定をせず21件上限で拒否する', () => {
    const DAY_MS = 24 * 60 * 60_000;
    const DURATION_MS = 2 * 60 * 60_000;
    const anchor = Date.parse('2026-11-15T09:00:00Z');
    const timeBlocks = Array.from({ length: 21 }, (_, index) => {
      const start = new Date(anchor + index * DAY_MS).toISOString();
      const end = new Date(anchor + index * DAY_MS + DURATION_MS).toISOString();
      return index < 2
        ? {
            startAt: start.replace('Z', '+00:00'),
            endAt: end.replace('Z', '+00:00'),
          }
        : { startAt: start, endAt: end };
    });
    const result = confirmScheduleTimeBlocksSchema.safeParse({ timeBlocks });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual([
        expect.objectContaining({
          path: ['timeBlocks'],
          message: '確定日程は20件以内にしてください',
        }),
      ]);
    }
  });
});
