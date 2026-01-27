import { describe, expect, it } from 'vitest';

import { searchFormSchema } from '../_components/schema';

/**
 * セッション一覧ページの検索フォームスキーマテスト
 * 要件: requirements-session-list.md セクション3.2, 6.2
 *
 * 対応テストケース:
 * - T-SF-001: 全項目デフォルト値でバリデーション成功
 * - T-SF-002: dateToのみ指定でバリデーション失敗
 * - T-SF-003: dateFrom > dateToでバリデーション失敗
 * - T-SF-004: dateFrom <= dateToでバリデーション成功
 * - T-SF-005: 全項目が有効な値でバリデーション成功
 */
describe('searchFormSchema', () => {
  // T-SF-001: 全項目デフォルト値でバリデーション成功
  it('全項目デフォルト値でバリデーション成功する', () => {
    const result = searchFormSchema.safeParse({
      systems: [],
      phases: [],
      q: '',
    });

    expect(result.success).toBe(true);
  });

  // T-SF-002: dateToのみ指定でバリデーション失敗
  it('dateToのみ指定するとバリデーション失敗する', () => {
    const result = searchFormSchema.safeParse({
      systems: [],
      phases: [],
      q: '',
      dateTo: '2026-12-31',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('dateFrom');
      expect(result.error.issues[0]?.message).toBe(
        '開催日の範囲が正しくありません',
      );
    }
  });

  // T-SF-003: dateFrom > dateToでバリデーション失敗
  it('dateFromがdateToより後の場合バリデーション失敗する', () => {
    const result = searchFormSchema.safeParse({
      systems: [],
      phases: [],
      q: '',
      dateFrom: '2026-12-31',
      dateTo: '2026-01-01',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('dateFrom');
    }
  });

  // T-SF-004: dateFrom <= dateToでバリデーション成功
  it('dateFromがdateTo以前の場合バリデーション成功する', () => {
    const result = searchFormSchema.safeParse({
      systems: [],
      phases: [],
      q: '',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    });

    expect(result.success).toBe(true);
  });

  // dateFromとdateToが同じ日付でも成功する
  it('dateFromとdateToが同じ日付でもバリデーション成功する', () => {
    const result = searchFormSchema.safeParse({
      systems: [],
      phases: [],
      q: '',
      dateFrom: '2026-06-15',
      dateTo: '2026-06-15',
    });

    expect(result.success).toBe(true);
  });

  // T-SF-005: 全項目が有効な値でバリデーション成功
  it('全項目が有効な値でバリデーション成功する', () => {
    const result = searchFormSchema.safeParse({
      systems: ['system-1', 'system-2'],
      phases: ['RECRUITING', 'PREPARATION'],
      q: 'クトゥルフ',
      dateFrom: '2026-01-01',
      dateTo: '2026-06-30',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.systems).toEqual(['system-1', 'system-2']);
      expect(result.data.phases).toEqual(['RECRUITING', 'PREPARATION']);
      expect(result.data.q).toBe('クトゥルフ');
      expect(result.data.dateFrom).toBe('2026-01-01');
      expect(result.data.dateTo).toBe('2026-06-30');
    }
  });

  // dateFromのみ指定は成功する
  it('dateFromのみ指定してもバリデーション成功する', () => {
    const result = searchFormSchema.safeParse({
      systems: [],
      phases: [],
      q: '',
      dateFrom: '2026-01-01',
    });

    expect(result.success).toBe(true);
  });
});
