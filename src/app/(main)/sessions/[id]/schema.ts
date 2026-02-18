import { z } from 'zod';

/** セッションメモのバリデーションスキーマ */
export const sessionMemoSchema = z.object({
  memo: z.string().max(2000, 'メモは2000文字以内で入力してください'),
});

/** セッションメモフォームの値型 */
export type SessionMemoValues = z.infer<typeof sessionMemoSchema>;

/** セッションリンクのバリデーションスキーマ */
export const sessionLinkSchema = z.object({
  linkId: z.string().optional(),
  linkType: z.enum(['DISCORD', 'CCFOLIA', 'OTHER']),
  url: z
    .string()
    .url('有効なURLを入力してください')
    .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
      message: 'http:// または https:// で始まるURLを入力してください',
    }),
  label: z
    .string()
    .max(100, 'ラベルは100文字以内で入力してください')
    .optional(),
});

/** セッションリンクフォームの値型 */
export type SessionLinkValues = z.infer<typeof sessionLinkSchema>;

/** キャラクターシートのバリデーションスキーマ */
export const characterSheetSchema = z.object({
  url: z
    .string()
    .url('有効なURLを入力してください')
    .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
      message: 'http:// または https:// で始まるURLを入力してください',
    })
    .or(z.literal('')),
});

/** キャラクターシートフォームの値型 */
export type CharacterSheetValues = z.infer<typeof characterSheetSchema>;

/** 参加申請のバリデーションスキーマ */
export const participationRequestSchema = z.object({
  participantType: z.enum(['PLAYER', 'SPECTATOR']),
  applicationMessage: z
    .string()
    .max(200, '一言メッセージは200文字以内で入力してください')
    .optional(),
});

/** 参加申請フォームの値型 */
export type ParticipationRequestValues = z.infer<
  typeof participationRequestSchema
>;

/** セッションキャンセルのバリデーションスキーマ */
export const cancelSessionSchema = z.object({
  reason: z
    .string()
    .max(500, 'キャンセル理由は500文字以内で入力してください')
    .optional(),
  /** 二重確認用：「キャンセル」と入力する必要がある */
  confirmText: z
    .string()
    .min(1, '確認テキストを入力してください')
    .superRefine((val, ctx) => {
      if (val !== 'キャンセル') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '「キャンセル」と入力してください',
        });
      }
    }),
});

/** セッションキャンセルフォームの値型 */
export type CancelSessionValues = z.infer<typeof cancelSessionSchema>;

/** 辞退のバリデーションスキーマ */
export const withdrawSchema = z.object({
  reason: z
    .string()
    .max(500, '辞退理由は500文字以内で入力してください')
    .optional(),
});

/** 辞退フォームの値型 */
export type WithdrawValues = z.infer<typeof withdrawSchema>;

/** 申請取り消しのバリデーションスキーマ */
export const cancelApplicationSchema = z.object({});

/** 申請取り消しフォームの値型 */
export type CancelApplicationValues = z.infer<typeof cancelApplicationSchema>;

/** セッション完了のバリデーションスキーマ */
export const completeSessionSchema = z.object({
  note: z
    .string()
    .max(1000, '完了メモは1000文字以内で入力してください')
    .optional(),
});

/** セッション完了フォームの値型 */
export type CompleteSessionValues = z.infer<typeof completeSessionSchema>;
