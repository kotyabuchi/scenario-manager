import { describe, expect, it } from 'vitest';

import { scenarioFormSchema } from '../_components/schema';

/**
 * シナリオ登録フォームのZodスキーマバリデーションテスト
 */
describe('scenarioFormSchema', () => {
  // 有効なデータのベースライン
  const validInput = {
    name: 'テストシナリオ',
    scenarioSystemId: '01HY5K3XABCDEFGHIJKLMNOPQR',
    handoutType: 'NONE' as const,
  };

  describe('必須フィールド', () => {
    it('有効なデータでバリデーションが通る', () => {
      const result = scenarioFormSchema.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it('シナリオ名が空の場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        name: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('シナリオ名は必須です');
      }
    });

    it('シナリオ名が100文字を超える場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        name: 'あ'.repeat(101),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'シナリオ名は100文字以内で入力してください',
        );
      }
    });

    it('システムIDが空の場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        scenarioSystemId: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'システムを選択してください',
        );
      }
    });
  });

  describe('プレイ人数のバリデーション', () => {
    it('最小人数と最大人数が範囲内の場合は通る', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        minPlayer: 2,
        maxPlayer: 5,
      });

      expect(result.success).toBe(true);
    });

    it('最小人数が最大人数を超える場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        minPlayer: 5,
        maxPlayer: 3,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '最小プレイ人数は最大プレイ人数以下にしてください',
        );
      }
    });

    it('空文字列はundefinedに変換される', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        minPlayer: '',
        maxPlayer: '',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPlayer).toBeUndefined();
        expect(result.data.maxPlayer).toBeUndefined();
      }
    });
  });

  describe('プレイ時間のバリデーション', () => {
    it('最小時間が最大時間を超える場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        minPlaytime: 300,
        maxPlaytime: 120,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '最小プレイ時間は最大プレイ時間以下にしてください',
        );
      }
    });
  });

  describe('任意フィールドのtransform', () => {
    it('空の作者名はundefinedに変換される', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        author: '',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.author).toBeUndefined();
      }
    });

    it('tagIdsのデフォルト値は空配列', () => {
      const result = scenarioFormSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tagIds).toEqual([]);
      }
    });
  });
});
