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
});

describe('日程確定の件数上限', () => {
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
