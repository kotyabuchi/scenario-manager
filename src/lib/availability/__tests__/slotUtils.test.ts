import { describe, expect, it } from 'vitest';

import {
  calcTotalMinutes,
  hasThirtyMinuteBoundary,
  isOverlappingSlot,
  isSameSlot,
  normalizeToThirtyMinutes,
  toggleExactSlot,
} from '../slotUtils';

describe('slotUtils', () => {
  it('30分境界を判定できる', () => {
    expect(hasThirtyMinuteBoundary('2026-03-01T12:00:00.000Z')).toBe(true);
    expect(hasThirtyMinuteBoundary('2026-03-01T12:30:00.000Z')).toBe(true);
    expect(hasThirtyMinuteBoundary('2026-03-01T12:15:00.000Z')).toBe(false);
  });

  it('30分単位に正規化できる', () => {
    expect(normalizeToThirtyMinutes('2026-03-01T12:14:00.000Z', 'floor')).toBe(
      '2026-03-01T12:00:00.000Z',
    );
    expect(normalizeToThirtyMinutes('2026-03-01T12:14:00.000Z', 'ceil')).toBe(
      '2026-03-01T12:30:00.000Z',
    );
  });

  it('枠の完全一致・重複判定ができる', () => {
    const a = {
      startAt: '2026-03-01T12:00:00.000Z',
      endAt: '2026-03-01T14:00:00.000Z',
    };
    const b = {
      startAt: '2026-03-01T12:00:00.000Z',
      endAt: '2026-03-01T14:00:00.000Z',
    };
    const c = {
      startAt: '2026-03-01T13:00:00.000Z',
      endAt: '2026-03-01T15:00:00.000Z',
    };
    const d = {
      startAt: '2026-03-01T14:00:00.000Z',
      endAt: '2026-03-01T15:00:00.000Z',
    };

    expect(isSameSlot(a, b)).toBe(true);
    expect(isOverlappingSlot(a, c)).toBe(true);
    expect(isOverlappingSlot(a, d)).toBe(false);
  });

  it('完全一致でトグルし、合計時間を計算できる', () => {
    const slot1 = {
      startAt: '2026-03-01T12:00:00.000Z',
      endAt: '2026-03-01T14:00:00.000Z',
    };
    const slot2 = {
      startAt: '2026-03-01T18:00:00.000Z',
      endAt: '2026-03-01T21:00:00.000Z',
    };

    const added = toggleExactSlot([slot1], slot2);
    expect(added).toHaveLength(2);
    expect(calcTotalMinutes(added)).toBe(300);

    const removed = toggleExactSlot(added, slot1);
    expect(removed).toEqual([slot2]);
    expect(calcTotalMinutes(removed)).toBe(180);
  });
});
