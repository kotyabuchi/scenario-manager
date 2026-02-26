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

const datetimeLocalPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const iso8601Pattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?$/;
const isValidDateTime = (val: string) =>
  datetimeLocalPattern.test(val) || iso8601Pattern.test(val);

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
  // datetime-local入力（YYYY-MM-DDTHH:mm）やISO形式に対応
  scheduledAt: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        return isValidDateTime(val);
      },
      { message: '日時の形式が正しくありません' },
    )
    .nullish(),

  // 日程候補（確定）- 作成時に確定日時として複数登録可能（終了時刻は行ごとに任意）
  scheduleCandidates: z
    .array(
      z
        .object({
          from: z.string(),
          to: z.string().optional(),
        })
        .refine(
          (val) => {
            const from = val.from.trim();
            const to = val.to?.trim() ?? '';
            if (from === '' && to === '') return true;
            if (!isValidDateTime(from)) return false;
            if (to === '') return true;
            return isValidDateTime(to);
          },
          { message: '日時の形式が正しくありません' },
        ),
    )
    .default([]),

  // 募集人数（任意）- 未定の場合はnull/undefined。0人 = 募集未開始
  recruitedPlayerCount: z
    .number()
    .int('募集人数は整数で入力してください')
    .min(0, '募集人数は0人以上で入力してください')
    .max(10, '募集人数は10人以下で入力してください')
    .nullish(),

  // 使用ツール（任意）
  tools: z
    .string()
    .max(200, '使用ツールは200文字以内で入力してください')
    .nullish(),

  // 初心者歓迎
  isBeginnerFriendly: z.boolean().default(false),

  // 公開範囲
  visibility: z
    .enum(['PUBLIC', 'FOLLOWERS_ONLY'], {
      message: '公開範囲を選択してください',
    })
    .default('PUBLIC'),

  // 作成者の参加種別（作成時に必ず参加者として追加）
  creatorParticipantType: z
    .enum(['PLAYER', 'SPECTATOR', 'KEEPER'])
    .default('KEEPER'),

  // 招待メンバー（任意）- フォーム上で追加されたメンバー一覧
  invitedMembers: z
    .array(
      z.object({
        userId: z
          .string()
          .regex(ulidPattern, 'ユーザーIDの形式が正しくありません'),
        participantType: z.enum(['PLAYER', 'SPECTATOR', 'KEEPER']),
      }),
    )
    .default([]),

  // 日程選択方式（UIのみ。「後で調整」選択時は scheduledAt を null にする）
  scheduleType: z.enum(['later', 'specify']).default('later'),
});

// フォーム入力型（defaultValues用）- .default()適用前の型
export type SessionFormInput = z.input<typeof sessionFormSchema>;

// フォーム出力型（パース後）- .default()適用後の型
export type SessionFormValues = z.infer<typeof sessionFormSchema>;

// 作成用の入力型（サーバーアクション用）
export type CreateSessionInput = SessionFormValues;
