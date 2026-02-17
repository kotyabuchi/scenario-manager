import { describe, expect, it } from 'vitest';

import { feedbackFormSchema } from '../schema';

import { FeedbackCategories } from '@/db/enum';

/**
 * フィードバックフォームスキーマのバリデーションテスト
 *
 * Server Action（createFeedbackAction / updateFeedbackAction）は
 * 認証・DB接続が必要な統合テストのためスキップし、
 * Zodスキーマのバリデーションロジックを単体テストする。
 */
describe('feedbackFormSchema', () => {
  describe('有効な入力', () => {
    it('すべてのフィールドが正しい場合にパースが成功する', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'テストタイトル',
        description: 'テスト内容です',
      });
      expect(result.success).toBe(true);
    });

    it.each(
      Object.values(FeedbackCategories),
    )('カテゴリ "$label" ($value) が有効', (category) => {
      const result = feedbackFormSchema.safeParse({
        category: category.value,
        title: '有効なタイトル',
        description: '有効な内容',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('カテゴリのバリデーション', () => {
    it('無効なカテゴリでバリデーションエラーを返す', () => {
      const result = feedbackFormSchema.safeParse({
        category: 'INVALID_CATEGORY',
        title: 'テスト',
        description: 'テスト',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'カテゴリを選択してください',
        );
      }
    });

    it('空文字列のカテゴリでバリデーションエラーを返す', () => {
      const result = feedbackFormSchema.safeParse({
        category: '',
        title: 'テスト',
        description: 'テスト',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('タイトルのバリデーション', () => {
    it('空のタイトルでバリデーションエラーを返す', () => {
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

    it('100文字のタイトルは有効', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'あ'.repeat(100),
        description: 'テスト内容',
      });
      expect(result.success).toBe(true);
    });

    it('101文字のタイトルでバリデーションエラーを返す', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'あ'.repeat(101),
        description: 'テスト内容',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'タイトルは100文字以内で入力してください',
        );
      }
    });
  });

  describe('説明のバリデーション', () => {
    it('空の説明でバリデーションエラーを返す', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.FEATURE.value,
        title: 'テストタイトル',
        description: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('内容を入力してください');
      }
    });

    it('2000文字の説明は有効', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.FEATURE.value,
        title: 'テスト',
        description: 'あ'.repeat(2000),
      });
      expect(result.success).toBe(true);
    });

    it('2001文字の説明でバリデーションエラーを返す', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.FEATURE.value,
        title: 'テスト',
        description: 'あ'.repeat(2001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '内容は2000文字以内で入力してください',
        );
      }
    });
  });

  describe('追加フィールド', () => {
    it('スキーマ外のフィールドはパース結果に含まれない', () => {
      const result = feedbackFormSchema.safeParse({
        category: FeedbackCategories.BUG.value,
        title: 'テスト',
        description: 'テスト内容',
        pageUrl: 'https://example.com',
        browserInfo: 'Chrome 120',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('pageUrl');
        expect(result.data).not.toHaveProperty('browserInfo');
      }
    });
  });
});

/**
 * Server Action統合テスト（認証・DB接続が必要なためスキップ）
 */
describe('createFeedbackAction（統合テスト）', () => {
  it.skip('有効な入力でフィードバックが作成される', () => {});
  it.skip('未認証ユーザーでエラーを返す', () => {});
  it.skip('DBにユーザーが存在しない場合エラーを返す', () => {});
});

describe('updateFeedbackAction（統合テスト）', () => {
  it.skip('有効な入力でフィードバックが更新される', () => {});
  it.skip('未認証ユーザーでエラーを返す', () => {});
  it.skip('他ユーザーのフィードバックは更新できない', () => {});
  it.skip('ステータスがNEW/TRIAGED以外は更新できない', () => {});
});
