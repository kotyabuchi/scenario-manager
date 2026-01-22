import { describe, expect, it } from 'vitest';

import { toSearchParams } from '../searchParams';

/**
 * URL検索パラメータ変換のユニットテスト
 *
 * 対応ユーザーストーリー:
 * - US-206: 検索条件をURLで共有できる
 */
describe('toSearchParams', () => {
  describe('US-206: URL同期', () => {
    it('T-206-2: URLパラメータから検索条件を復元できる', () => {
      const parsed = {
        systems: ['system1', 'system2'],
        tags: ['tag1'],
        minPlayer: 3,
        maxPlayer: 5,
        minPlaytime: 2,
        maxPlaytime: 4,
        q: '狂気山脈',
        sort: 'newest' as const,
      };

      const result = toSearchParams(parsed);

      expect(result.systemIds).toEqual(['system1', 'system2']);
      expect(result.tagIds).toEqual(['tag1']);
      expect(result.playerCount).toEqual({ min: 3, max: 5 });
      expect(result.playtime).toEqual({ min: 2, max: 4 });
      expect(result.scenarioName).toBe('狂気山脈');
    });

    it('空のパラメータは変換されない', () => {
      const parsed = {
        systems: [],
        tags: [],
        minPlayer: null,
        maxPlayer: null,
        minPlaytime: null,
        maxPlaytime: null,
        q: '',
        sort: 'newest' as const,
      };

      const result = toSearchParams(parsed);

      expect(result.systemIds).toBeUndefined();
      expect(result.tagIds).toBeUndefined();
      expect(result.playerCount).toBeUndefined();
      expect(result.playtime).toBeUndefined();
      expect(result.scenarioName).toBeUndefined();
    });

    it('minPlayerのみ指定時はデフォルトmaxを使用', () => {
      const parsed = {
        systems: [],
        tags: [],
        minPlayer: 4,
        maxPlayer: null,
        minPlaytime: null,
        maxPlaytime: null,
        q: '',
        sort: 'newest' as const,
      };

      const result = toSearchParams(parsed);

      expect(result.playerCount).toEqual({ min: 4, max: 20 });
    });

    it('maxPlayerのみ指定時はデフォルトminを使用', () => {
      const parsed = {
        systems: [],
        tags: [],
        minPlayer: null,
        maxPlayer: 6,
        minPlaytime: null,
        maxPlaytime: null,
        q: '',
        sort: 'newest' as const,
      };

      const result = toSearchParams(parsed);

      expect(result.playerCount).toEqual({ min: 1, max: 6 });
    });

    it('minPlaytimeのみ指定時はデフォルトmaxを使用', () => {
      const parsed = {
        systems: [],
        tags: [],
        minPlayer: null,
        maxPlayer: null,
        minPlaytime: 3,
        maxPlaytime: null,
        q: '',
        sort: 'newest' as const,
      };

      const result = toSearchParams(parsed);

      expect(result.playtime).toEqual({ min: 3, max: 240 });
    });

    it('maxPlaytimeのみ指定時はデフォルトminを使用', () => {
      const parsed = {
        systems: [],
        tags: [],
        minPlayer: null,
        maxPlayer: null,
        minPlaytime: null,
        maxPlaytime: 6,
        q: '',
        sort: 'newest' as const,
      };

      const result = toSearchParams(parsed);

      expect(result.playtime).toEqual({ min: 1, max: 6 });
    });

    it('複数日セッション（48時間以上）もデフォルトmax(240)を使用', () => {
      const parsed = {
        systems: [],
        tags: [],
        minPlayer: null,
        maxPlayer: null,
        minPlaytime: 48,
        maxPlaytime: null,
        q: '',
        sort: 'newest' as const,
      };

      const result = toSearchParams(parsed);

      expect(result.playtime).toEqual({ min: 48, max: 240 });
    });
  });

  describe('部分的なパラメータ', () => {
    it('systemsのみ指定', () => {
      const parsed = {
        systems: ['coc7'],
        tags: [],
        minPlayer: null,
        maxPlayer: null,
        minPlaytime: null,
        maxPlaytime: null,
        q: '',
        sort: 'newest' as const,
      };

      const result = toSearchParams(parsed);

      expect(result.systemIds).toEqual(['coc7']);
      expect(result.tagIds).toBeUndefined();
      expect(result.playerCount).toBeUndefined();
      expect(result.playtime).toBeUndefined();
      expect(result.scenarioName).toBeUndefined();
    });

    it('qのみ指定', () => {
      const parsed = {
        systems: [],
        tags: [],
        minPlayer: null,
        maxPlayer: null,
        minPlaytime: null,
        maxPlaytime: null,
        q: 'クトゥルフ',
        sort: 'newest' as const,
      };

      const result = toSearchParams(parsed);

      expect(result.scenarioName).toBe('クトゥルフ');
      expect(result.systemIds).toBeUndefined();
    });
  });

  describe('複数選択のURL反映', () => {
    it('複数システムが正しく変換される', () => {
      const parsed = {
        systems: ['coc6', 'coc7', 'sw25'],
        tags: [],
        minPlayer: null,
        maxPlayer: null,
        minPlaytime: null,
        maxPlaytime: null,
        q: '',
        sort: 'newest' as const,
      };

      const result = toSearchParams(parsed);

      expect(result.systemIds).toEqual(['coc6', 'coc7', 'sw25']);
      expect(result.systemIds).toHaveLength(3);
    });

    it('複数タグが正しく変換される', () => {
      const parsed = {
        systems: [],
        tags: ['horror', 'mystery', 'battle'],
        minPlayer: null,
        maxPlayer: null,
        minPlaytime: null,
        maxPlaytime: null,
        q: '',
        sort: 'newest' as const,
      };

      const result = toSearchParams(parsed);

      expect(result.tagIds).toEqual(['horror', 'mystery', 'battle']);
      expect(result.tagIds).toHaveLength(3);
    });

    it('複数システムと複数タグを同時に指定できる', () => {
      const parsed = {
        systems: ['coc6', 'coc7'],
        tags: ['horror', 'mystery'],
        minPlayer: 3,
        maxPlayer: 5,
        minPlaytime: null,
        maxPlaytime: null,
        q: '',
        sort: 'newest' as const,
      };

      const result = toSearchParams(parsed);

      expect(result.systemIds).toEqual(['coc6', 'coc7']);
      expect(result.tagIds).toEqual(['horror', 'mystery']);
      expect(result.playerCount).toEqual({ min: 3, max: 5 });
    });
  });
});
