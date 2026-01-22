import { describe, expect, it } from 'vitest';

import { searchFormSchema } from '../_components/schema';

/**
 * 検索フォームバリデーションのユニットテスト
 *
 * 対応: 要件定義書 Section 5.3 検索条件一覧
 */
describe('searchFormSchema', () => {
  describe('T-VAL-1: プレイ人数バリデーション', () => {
    it('1〜20の範囲は有効', () => {
      const validCases = [
        { minPlayer: 1, maxPlayer: 20 },
        { minPlayer: 3, maxPlayer: 5 },
        { minPlayer: 1, maxPlayer: 1 },
        { minPlayer: 20, maxPlayer: 20 },
      ];

      for (const testCase of validCases) {
        const result = searchFormSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      }
    });

    it('0以下は無効', () => {
      const result = searchFormSchema.safeParse({ minPlayer: 0 });
      expect(result.success).toBe(false);
    });

    it('21以上は無効', () => {
      const result = searchFormSchema.safeParse({ maxPlayer: 21 });
      expect(result.success).toBe(false);
    });

    it('負の数は無効', () => {
      const result = searchFormSchema.safeParse({ minPlayer: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe('T-VAL-2: プレイ時間バリデーション', () => {
    it('1〜240時間の範囲は有効', () => {
      const validCases = [
        { minPlaytime: 1, maxPlaytime: 240 },
        { minPlaytime: 3, maxPlaytime: 6 },
        { minPlaytime: 1, maxPlaytime: 1 },
        { minPlaytime: 240, maxPlaytime: 240 },
        { minPlaytime: 48, maxPlaytime: 72 }, // 複数日のセッション
      ];

      for (const testCase of validCases) {
        const result = searchFormSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      }
    });

    it('0以下は無効', () => {
      const result = searchFormSchema.safeParse({ minPlaytime: 0 });
      expect(result.success).toBe(false);
    });

    it('241以上は無効', () => {
      const result = searchFormSchema.safeParse({ maxPlaytime: 241 });
      expect(result.success).toBe(false);
    });
  });

  describe('T-VAL-3: 空文字列の変換', () => {
    it('空文字列はundefinedに変換される', () => {
      const result = searchFormSchema.safeParse({
        minPlayer: '',
        maxPlayer: '',
        minPlaytime: '',
        maxPlaytime: '',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPlayer).toBeUndefined();
        expect(result.data.maxPlayer).toBeUndefined();
        expect(result.data.minPlaytime).toBeUndefined();
        expect(result.data.maxPlaytime).toBeUndefined();
      }
    });

    it('nullはundefinedに変換される', () => {
      const result = searchFormSchema.safeParse({
        minPlayer: null,
        maxPlayer: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPlayer).toBeUndefined();
        expect(result.data.maxPlayer).toBeUndefined();
      }
    });

    it('undefinedはそのままundefined', () => {
      const result = searchFormSchema.safeParse({
        minPlayer: undefined,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPlayer).toBeUndefined();
      }
    });
  });

  describe('デフォルト値', () => {
    it('systemIdsはデフォルトで空配列', () => {
      const result = searchFormSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.systemIds).toEqual([]);
      }
    });

    it('tagIdsはデフォルトで空配列', () => {
      const result = searchFormSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tagIds).toEqual([]);
      }
    });

    it('scenarioNameはデフォルトで空文字列', () => {
      const result = searchFormSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scenarioName).toBe('');
      }
    });
  });

  describe('配列バリデーション', () => {
    it('systemIdsは文字列の配列を受け入れる', () => {
      const result = searchFormSchema.safeParse({
        systemIds: ['id1', 'id2', 'id3'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.systemIds).toEqual(['id1', 'id2', 'id3']);
      }
    });

    it('tagIdsは文字列の配列を受け入れる', () => {
      const result = searchFormSchema.safeParse({
        tagIds: ['tag1', 'tag2'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tagIds).toEqual(['tag1', 'tag2']);
      }
    });
  });
});
