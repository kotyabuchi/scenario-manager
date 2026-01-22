import { z } from 'zod';

/**
 * セッション募集フォームのバリデーションスキーマ
 * 要件: requirements-session-flow.md Section 3.2
 *
 * 設計思想: 「柔軟な募集」を最優先
 * - シナリオ・日程・人数すべてオプション
 * - 「この日に遊びたい」「このシナリオで遊びたい」どちらもOK
 */

// ULID形式（26文字の大文字英数字）
const ulidPattern = /^[0-9A-Z]{26}$/;

export const sessionFormSchema = z.object({
  // セッション名（必須）
  sessionName: z
    .string()
    .min(1, 'セッション名を入力してください')
    .max(100, 'セッション名は100文字以内で入力してください'),

  // 募集文（必須）- 唯一の「必須」項目として設計上重要
  sessionDescription: z
    .string()
    .min(1, '募集文を入力してください')
    .max(500, '募集文は500文字以内で入力してください'),

  // シナリオID（任意）- 未定の場合はnull/undefined
  scenarioId: z
    .string()
    .regex(ulidPattern, 'シナリオIDの形式が正しくありません')
    .nullish(),

  // 日時（任意）- 後で調整の場合はnull/undefined
  scheduledAt: z.string().datetime({ offset: true }).nullish(),

  // 募集人数（任意）- 未定の場合はnull/undefined
  recruitedPlayerCount: z
    .number()
    .int('募集人数は整数で入力してください')
    .min(1, '募集人数は1人以上で入力してください')
    .max(10, '募集人数は10人以下で入力してください')
    .nullish(),

  // 使用ツール（任意）
  tools: z
    .string()
    .max(200, '使用ツールは200文字以内で入力してください')
    .nullish(),

  // 初心者歓迎（デフォルト: false）
  isBeginnerFriendly: z.boolean().default(false),

  // 公開範囲（デフォルト: PUBLIC）
  visibility: z
    .enum(['PUBLIC', 'FOLLOWERS_ONLY'], {
      message: '公開範囲を選択してください',
    })
    .default('PUBLIC'),
});

export type SessionFormValues = z.infer<typeof sessionFormSchema>;

// 作成用の入力型（サーバーアクション用）
export type CreateSessionInput = SessionFormValues;
