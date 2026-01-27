import { describe, expect, it } from 'vitest';

import { toPublicSearchParams } from '../searchParams';

/**
 * セッション一覧ページのURL検索パラメータ変換テスト
 * 要件: requirements-session-list.md セクション3.1
 *
 * 対応テストケース:
 * - T-SP-001: 空パラメータで空オブジェクトを返す
 * - T-SP-002: 全パラメータ指定で正しく変換される
 * - T-SP-003: systems指定時にsystemIdsが設定される
 * - T-SP-004: 日付文字列がDateオブジェクトに変換される
 * - T-SP-005: 空文字qではscenarioNameが設定されない
 */
describe('toPublicSearchParams', () => {
  // T-SP-001: 空パラメータで空オブジェクトを返す
  it('空パラメータで空オブジェクトを返す', () => {
    const result = toPublicSearchParams({
      systems: [],
      phases: [],
      dateFrom: null,
      dateTo: null,
      q: '',
    });

    expect(result).toEqual({});
  });

  // T-SP-002: 全パラメータ指定で正しく変換される
  it('全パラメータ指定で正しく変換される', () => {
    const result = toPublicSearchParams({
      systems: ['system-1', 'system-2'],
      phases: ['RECRUITING', 'PREPARATION'],
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      q: 'クトゥルフ',
    });

    expect(result.systemIds).toEqual(['system-1', 'system-2']);
    expect(result.phases).toEqual(['RECRUITING', 'PREPARATION']);
    expect(result.dateFrom).toBeInstanceOf(Date);
    expect(result.dateTo).toBeInstanceOf(Date);
    expect(result.scenarioName).toBe('クトゥルフ');
  });

  // T-SP-003: systems指定時にsystemIdsが設定される
  it('systems指定時にsystemIdsが設定される', () => {
    const result = toPublicSearchParams({
      systems: ['system-1'],
      phases: [],
      dateFrom: null,
      dateTo: null,
      q: '',
    });

    expect(result.systemIds).toEqual(['system-1']);
    expect(result.phases).toBeUndefined();
    expect(result.dateFrom).toBeUndefined();
    expect(result.dateTo).toBeUndefined();
    expect(result.scenarioName).toBeUndefined();
  });

  // T-SP-004: 日付文字列がDateオブジェクトに変換される
  it('日付文字列がDateオブジェクトに変換される', () => {
    const result = toPublicSearchParams({
      systems: [],
      phases: [],
      dateFrom: '2026-06-15',
      dateTo: '2026-06-30',
      q: '',
    });

    expect(result.dateFrom).toBeInstanceOf(Date);
    expect(result.dateTo).toBeInstanceOf(Date);
    expect(result.dateFrom?.toISOString()).toContain('2026-06-15');
    expect(result.dateTo?.toISOString()).toContain('2026-06-30');
  });

  // T-SP-005: 空文字qではscenarioNameが設定されない
  it('空文字qではscenarioNameが設定されない', () => {
    const result = toPublicSearchParams({
      systems: [],
      phases: [],
      dateFrom: null,
      dateTo: null,
      q: '',
    });

    expect(result.scenarioName).toBeUndefined();
  });

  // phases指定時にphasesが設定される
  it('phases指定時にphasesが設定される', () => {
    const result = toPublicSearchParams({
      systems: [],
      phases: ['RECRUITING'],
      dateFrom: null,
      dateTo: null,
      q: '',
    });

    expect(result.phases).toEqual(['RECRUITING']);
  });
});
