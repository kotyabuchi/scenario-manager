import { describe, expect, it } from 'vitest';

import {
  calcSelectedSlotsTotalMinutes,
  formatMinutesLabel,
  formatSlotDateTimeRange,
  getProgressStatus,
} from '../slotPresentation';

describe('formatMinutesLabel', () => {
  it('分のみの場合は「N分」と表示する', () => {
    expect(formatMinutesLabel(30)).toBe('30分');
  });

  it('時間のみの場合は「N時間」と表示する', () => {
    expect(formatMinutesLabel(120)).toBe('2時間');
  });

  it('時間と分がある場合は「N時間M分」と表示する', () => {
    expect(formatMinutesLabel(90)).toBe('1時間30分');
  });

  it('0分の場合は「0分」と表示する', () => {
    expect(formatMinutesLabel(0)).toBe('0分');
  });

  it('負の値は0分として扱う', () => {
    expect(formatMinutesLabel(-10)).toBe('0分');
  });

  it('小数は切り捨てる', () => {
    expect(formatMinutesLabel(90.7)).toBe('1時間30分');
  });
});

describe('getProgressStatus', () => {
  it('最低プレイ時間がnullの場合はneutralを返す', () => {
    expect(getProgressStatus(120, null)).toBe('neutral');
  });

  it('合計が最低時間以上の場合はsuccessを返す', () => {
    expect(getProgressStatus(120, 120)).toBe('success');
    expect(getProgressStatus(150, 120)).toBe('success');
  });

  it('合計が最低時間未満の場合はwarningを返す', () => {
    expect(getProgressStatus(60, 120)).toBe('warning');
  });
});

describe('calcSelectedSlotsTotalMinutes', () => {
  it('空配列の場合は0を返す', () => {
    expect(calcSelectedSlotsTotalMinutes([])).toBe(0);
  });

  it('複数スロットの合計分数を返す', () => {
    const slots = [
      {
        startAt: '2025-03-15T10:00:00+09:00',
        endAt: '2025-03-15T12:00:00+09:00',
      },
      {
        startAt: '2025-03-16T14:00:00+09:00',
        endAt: '2025-03-16T15:30:00+09:00',
      },
    ];
    expect(calcSelectedSlotsTotalMinutes(slots)).toBe(210);
  });
});

describe('formatSlotDateTimeRange', () => {
  it('同一日のスロットは「M/d (E) HH:mm - HH:mm」形式で表示する', () => {
    // 2時間差のスロット（どのタイムゾーンでも同一日になる）
    const result = formatSlotDateTimeRange({
      startAt: '2025-03-15T10:00:00+09:00',
      endAt: '2025-03-15T12:00:00+09:00',
    });

    expect(result.primary).toMatch(
      /\d{1,2}\/\d{1,2} \(\w+\) \d{2}:\d{2} - \d{2}:\d{2}/,
    );
    expect(result.secondary).toBe('2時間');
  });

  it('日跨ぎスロットは開始・終了それぞれに日付を表示する', () => {
    // 24時間差のスロット（どのタイムゾーンでも日跨ぎになる）
    const result = formatSlotDateTimeRange({
      startAt: '2025-03-15T00:00:00.000Z',
      endAt: '2025-03-16T00:00:00.000Z',
    });

    // 開始と終了それぞれに「日付 (曜日) 時刻」が含まれる
    expect(result.primary).toMatch(
      /\d{1,2}\/\d{1,2} \(\w+\) \d{2}:\d{2} - \d{1,2}\/\d{1,2} \(\w+\) \d{2}:\d{2}/,
    );
  });

  it('日跨ぎスロットのsecondaryに「日跨ぎ」ラベルが含まれる', () => {
    const result = formatSlotDateTimeRange({
      startAt: '2025-03-15T00:00:00.000Z',
      endAt: '2025-03-16T00:00:00.000Z',
    });

    expect(result.secondary).toContain('日跨ぎ');
    expect(result.secondary).toMatch(/日跨ぎ \/ \d+時間/);
  });
});
