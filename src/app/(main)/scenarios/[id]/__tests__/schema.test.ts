import { describe, expect, it } from 'vitest';

import { reviewFormSchema } from '../schema';

/**
 * レビューフォームスキーマのバリデーションテスト
 * 要件: requirements-review-ui.md
 *
 * バリデーションルール:
 * - rating: 1〜5の整数（任意）
 * - openComment: 最大2000文字（任意）
 * - spoilerComment: 最大2000文字（任意）
 */
describe('reviewFormSchema', () => {
  describe('rating', () => {
    // T-RF-001: ratingが1〜5の範囲内で有効
    it('1〜5の整数が有効', () => {
      expect(reviewFormSchema.safeParse({ rating: 1 }).success).toBe(true);
      expect(reviewFormSchema.safeParse({ rating: 3 }).success).toBe(true);
      expect(reviewFormSchema.safeParse({ rating: 5 }).success).toBe(true);
    });

    // T-RF-002: ratingが0以下で無効
    it('0以下は無効', () => {
      const result = reviewFormSchema.safeParse({ rating: 0 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '評価は1以上で入力してください',
        );
      }
    });

    // T-RF-003: ratingが6以上で無効
    it('6以上は無効', () => {
      const result = reviewFormSchema.safeParse({ rating: 6 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '評価は5以下で入力してください',
        );
      }
    });

    // T-RF-004: ratingが小数で無効
    it('小数は無効', () => {
      const result = reviewFormSchema.safeParse({ rating: 3.5 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '評価は整数で入力してください',
        );
      }
    });

    // T-RF-005: ratingがnullで有効（任意）
    it('nullは有効', () => {
      expect(reviewFormSchema.safeParse({ rating: null }).success).toBe(true);
    });

    // T-RF-006: ratingがundefinedで有効（任意）
    it('undefinedは有効', () => {
      expect(reviewFormSchema.safeParse({ rating: undefined }).success).toBe(
        true,
      );
      expect(reviewFormSchema.safeParse({}).success).toBe(true);
    });
  });

  describe('openComment', () => {
    // T-RF-007: openCommentが2000文字以内で有効
    it('2000文字以内は有効', () => {
      expect(
        reviewFormSchema.safeParse({ openComment: 'テストコメント' }).success,
      ).toBe(true);
      expect(
        reviewFormSchema.safeParse({ openComment: 'a'.repeat(2000) }).success,
      ).toBe(true);
    });

    // T-RF-008: openCommentが2001文字以上で無効
    it('2001文字以上は無効', () => {
      const result = reviewFormSchema.safeParse({
        openComment: 'a'.repeat(2001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          '公開コメントは2000文字以内で入力してください',
        );
      }
    });

    // T-RF-009: openCommentが空文字で有効
    it('空文字は有効', () => {
      expect(reviewFormSchema.safeParse({ openComment: '' }).success).toBe(
        true,
      );
    });

    // T-RF-010: openCommentがnullで有効
    it('nullは有効', () => {
      expect(reviewFormSchema.safeParse({ openComment: null }).success).toBe(
        true,
      );
    });
  });

  describe('spoilerComment', () => {
    // T-RF-011: spoilerCommentが2000文字以内で有効
    it('2000文字以内は有効', () => {
      expect(
        reviewFormSchema.safeParse({ spoilerComment: 'ネタバレコメント' })
          .success,
      ).toBe(true);
      expect(
        reviewFormSchema.safeParse({ spoilerComment: 'a'.repeat(2000) })
          .success,
      ).toBe(true);
    });

    // T-RF-012: spoilerCommentが2001文字以上で無効
    it('2001文字以上は無効', () => {
      const result = reviewFormSchema.safeParse({
        spoilerComment: 'a'.repeat(2001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'ネタバレコメントは2000文字以内で入力してください',
        );
      }
    });

    // T-RF-013: spoilerCommentが空文字で有効
    it('空文字は有効', () => {
      expect(reviewFormSchema.safeParse({ spoilerComment: '' }).success).toBe(
        true,
      );
    });

    // T-RF-014: spoilerCommentがnullで有効
    it('nullは有効', () => {
      expect(reviewFormSchema.safeParse({ spoilerComment: null }).success).toBe(
        true,
      );
    });
  });

  describe('複合バリデーション', () => {
    // T-RF-015: すべての項目を指定して有効
    it('すべての項目を指定して有効', () => {
      const result = reviewFormSchema.safeParse({
        rating: 4,
        openComment: 'とても面白かったです',
        spoilerComment: '犯人は○○でした',
      });
      expect(result.success).toBe(true);
    });

    // T-RF-016: すべての項目が未指定で有効
    it('すべての項目が未指定で有効', () => {
      const result = reviewFormSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    // T-RF-017: ratingのみ指定で有効
    it('ratingのみ指定で有効', () => {
      const result = reviewFormSchema.safeParse({ rating: 5 });
      expect(result.success).toBe(true);
    });

    // T-RF-018: openCommentのみ指定で有効
    it('openCommentのみ指定で有効', () => {
      const result = reviewFormSchema.safeParse({
        openComment: '面白かったです',
      });
      expect(result.success).toBe(true);
    });

    // T-RF-019: spoilerCommentのみ指定で有効
    it('spoilerCommentのみ指定で有効', () => {
      const result = reviewFormSchema.safeParse({
        spoilerComment: 'ネタバレです',
      });
      expect(result.success).toBe(true);
    });
  });
});
