import { describe, expect, it } from 'vitest';

import { scenarioFormSchema } from '../_components/schema';

/**
 * シナリオ登録フォームのZodスキーマバリデーションテスト
 *
 * 要件: requirements-scenario-new.md
 *
 * テストID対応:
 * - SN-10〜23: バリデーション
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

    // SN-10: シナリオ名が空の場合、エラーメッセージが表示される
    it('シナリオ名が空の場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        name: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('シナリオ名は必須です');
      }
    });

    // SN-11: シナリオ名が101文字の場合、エラーメッセージが表示される
    it('シナリオ名が101文字の場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        name: 'あ'.repeat(101),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'シナリオ名は100文字以内で入力してください',
        );
      }
    });

    // SN-12: シナリオ名が100文字の場合、登録できる
    it('シナリオ名が100文字ちょうどの場合は成功', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        name: 'あ'.repeat(100),
      });

      expect(result.success).toBe(true);
    });

    // SN-13: システム未選択の場合、エラーメッセージが表示される
    it('システムIDが空の場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        scenarioSystemId: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'システムを選択してください',
        );
      }
    });
  });

  describe('作者名のバリデーション', () => {
    // SN-14: 作者名が101文字の場合、エラーメッセージが表示される
    it('作者名が101文字の場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        author: 'あ'.repeat(101),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '作者名は100文字以内で入力してください',
        );
      }
    });

    it('作者名が100文字ちょうどの場合は成功', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        author: 'あ'.repeat(100),
      });

      expect(result.success).toBe(true);
    });
  });

  describe('概要のバリデーション', () => {
    // SN-15: 概要が2001文字の場合、エラーメッセージが表示される
    it('概要が2001文字の場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        description: 'あ'.repeat(2001),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '概要は2000文字以内で入力してください',
        );
      }
    });

    // SN-16: 概要が2000文字の場合、登録できる
    it('概要が2000文字ちょうどの場合は成功', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        description: 'あ'.repeat(2000),
      });

      expect(result.success).toBe(true);
    });
  });

  describe('配布URLのバリデーション', () => {
    // SN-17: 不正なURL形式の場合、エラーメッセージが表示される
    it('不正なURL形式の場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        distributeUrl: 'invalid-url',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '配布URLは有効なURL形式で入力してください',
        );
      }
    });

    it('有効なURL形式の場合は成功', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        distributeUrl: 'https://booth.pm/ja/items/123456',
      });

      expect(result.success).toBe(true);
    });

    it('空文字の配布URLはundefinedに変換される', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        distributeUrl: '',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.distributeUrl).toBeUndefined();
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

    // SN-18: minPlayer > maxPlayer の場合、エラーメッセージが表示される
    it('最小人数が最大人数を超える場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        minPlayer: 5,
        maxPlayer: 3,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
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

    // SN-20: プレイ人数が0の場合、エラーメッセージが表示される
    it('プレイ人数が0の場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        minPlayer: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '最小プレイ人数は1以上で入力してください',
        );
      }
    });

    // SN-21: プレイ人数が21の場合、エラーメッセージが表示される
    it('プレイ人数が21の場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        maxPlayer: 21,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '最大プレイ人数は20以下で入力してください',
        );
      }
    });

    it('プレイ人数が1人の場合は成功（下限）', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        minPlayer: 1,
        maxPlayer: 1,
      });

      expect(result.success).toBe(true);
    });

    it('プレイ人数が20人の場合は成功（上限）', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        minPlayer: 20,
        maxPlayer: 20,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('プレイ時間のバリデーション', () => {
    // SN-19: minPlaytime > maxPlaytime の場合、エラーメッセージが表示される
    it('最小時間が最大時間を超える場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        minPlaytime: 300,
        maxPlaytime: 120,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '最小プレイ時間は最大プレイ時間以下にしてください',
        );
      }
    });

    // SN-22: プレイ時間が0分の場合、エラーメッセージが表示される
    it('プレイ時間が0分の場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        minPlaytime: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '最小プレイ時間は1以上で入力してください',
        );
      }
    });

    // SN-23: プレイ時間が上限を超える場合、エラーメッセージが表示される
    it('プレイ時間が14401分の場合エラー', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        maxPlaytime: 14401,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '最大プレイ時間は14400以下で入力してください',
        );
      }
    });

    it('プレイ時間が1分の場合は成功（下限）', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        minPlaytime: 1,
      });

      expect(result.success).toBe(true);
    });

    it('プレイ時間が14400分の場合は成功（上限）', () => {
      const result = scenarioFormSchema.safeParse({
        ...validInput,
        maxPlaytime: 14400,
      });

      expect(result.success).toBe(true);
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
