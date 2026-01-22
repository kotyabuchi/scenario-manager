import { z } from 'zod';

/**
 * レビュー投稿フォームのバリデーションスキーマ
 * 要件: requirements-review-ui.md
 *
 * - rating: 1〜5の整数（任意）
 * - openComment: 公開コメント・最大2000文字（任意）
 * - spoilerComment: ネタバレコメント・最大2000文字（任意）
 */
export const reviewFormSchema = z.object({
  rating: z
    .number()
    .int('評価は整数で入力してください')
    .min(1, '評価は1以上で入力してください')
    .max(5, '評価は5以下で入力してください')
    .optional()
    .nullable(),
  openComment: z
    .string()
    .max(2000, '公開コメントは2000文字以内で入力してください')
    .optional()
    .nullable(),
  spoilerComment: z
    .string()
    .max(2000, 'ネタバレコメントは2000文字以内で入力してください')
    .optional()
    .nullable(),
});

// スキーマから型を導出
export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

/**
 * レビュー投稿時の入力データ
 * scenarioId, sessionIdは別途受け取る
 */
export type CreateReviewInput = ReviewFormValues & {
  scenarioId: string;
  sessionId?: string;
};

/**
 * レビュー更新時の入力データ
 */
export type UpdateReviewInput = ReviewFormValues;
