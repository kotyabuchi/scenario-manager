import { describe, expect, it } from 'vitest';

import { feedbackFormSchema } from '../schema';

import { FeedbackCategories } from '@/db/enum';

/**
 * フィードバックフォームスキーマのバリデーションテスト
 * 要件: requirements-feedback.md Section 3.2
 *
 * バリデーションルール:
 * - category: BUG / FEATURE / UI_UX / OTHER のいずれか（必須）
 * - title: 1〜100文字（必須）
 * - description: 1〜2000文字（必須）
 */
describe('feedbackFormSchema', () => {
  describe('category', () => {
    // T-FB-001: 有効なカテゴリが受け入れられる
    it('BUGカテゴリが有効', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'テストタイトル',
        description: 'テスト内容',
      });
      expect(result.success).toBe(true);
    });

    it('FEATUREカテゴリが有効', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.FEATURE.value,
        title: 'テストタイトル',
        description: 'テスト内容',
      });
      expect(result.success).toBe(true);
    });

    it('UI_UXカテゴリが有効', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.UI_UX.value,
        title: 'テストタイトル',
        description: 'テスト内容',
      });
      expect(result.success).toBe(true);
    });

    it('OTHERカテゴリが有効', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.OTHER.value,
        title: 'テストタイトル',
        description: 'テスト内容',
      });
      expect(result.success).toBe(true);
    });

    // T-FB-002: 無効なカテゴリでエラー
    it('無効なカテゴリでエラー', () => {
      const result = feedbackFormSchema.safeParse({
        category: 'INVALID',
        title: 'テストタイトル',
        description: 'テスト内容',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'カテゴリを選択してください',
        );
      }
    });

    // T-FB-003: カテゴリ未指定でエラー
    it('カテゴリ未指定でエラー', () => {
      const result = feedbackFormSchema.safeParse({
        title: 'テストタイトル',
        description: 'テスト内容',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('title', () => {
    // T-FB-004: 1〜100文字のタイトルが有効
    it('1文字のタイトルが有効', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'あ',
        description: 'テスト内容',
      });
      expect(result.success).toBe(true);
    });

    it('100文字のタイトルが有効', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'a'.repeat(100),
        description: 'テスト内容',
      });
      expect(result.success).toBe(true);
    });

    // T-FB-005: 空のタイトルでエラー
    it('空のタイトルでエラー', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: '',
        description: 'テスト内容',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'タイトルを入力してください',
        );
      }
    });

    // T-FB-006: 101文字以上のタイトルでエラー
    it('101文字以上のタイトルでエラー', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'a'.repeat(101),
        description: 'テスト内容',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'タイトルは100文字以内で入力してください',
        );
      }
    });

    // T-FB-007: タイトル未指定でエラー
    it('タイトル未指定でエラー', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        description: 'テスト内容',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('description', () => {
    // T-FB-008: 1〜2000文字の詳細が有効
    it('1文字の詳細が有効', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'テストタイトル',
        description: 'あ',
      });
      expect(result.success).toBe(true);
    });

    it('2000文字の詳細が有効', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'テストタイトル',
        description: 'a'.repeat(2000),
      });
      expect(result.success).toBe(true);
    });

    // T-FB-009: 空の詳細でエラー
    it('空の詳細でエラー', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'テストタイトル',
        description: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('内容を入力してください');
      }
    });

    // T-FB-010: 2001文字以上の詳細でエラー
    it('2001文字以上の詳細でエラー', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'テストタイトル',
        description: 'a'.repeat(2001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '内容は2000文字以内で入力してください',
        );
      }
    });

    // T-FB-011: 詳細未指定でエラー
    it('詳細未指定でエラー', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'テストタイトル',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('複合バリデーション', () => {
    // T-FB-012: 全項目が正しく入力されていれば有効
    it('全項目が正しく入力されていれば有効', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.FEATURE.value,
        title: '検索結果の保存機能が欲しい',
        description:
          'よく使う検索条件を保存して、ワンクリックで呼び出せると便利です。',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('FEATURE');
        expect(result.data.title).toBe('検索結果の保存機能が欲しい');
        expect(result.data.description).toBe(
          'よく使う検索条件を保存して、ワンクリックで呼び出せると便利です。',
        );
      }
    });

    // T-FB-013: 空オブジェクトでエラー
    it('空オブジェクトでエラー', () => {
      const result = feedbackFormSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        // 複数のエラーが発生
        expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
