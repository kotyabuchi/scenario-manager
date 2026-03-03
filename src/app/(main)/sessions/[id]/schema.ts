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
  participantType: z.enum(['KEEPER', 'PLAYER', 'SPECTATOR']),
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
});

/** セッションキャンセルフォームの値型 */
export type CancelSessionValues = z.infer<typeof cancelSessionSchema>;

/** 辞退のバリデーションスキーマ */
export const withdrawSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, '辞退理由を入力してください')
    .max(200, '辞退理由は200文字以内で入力してください'),
});

/** 辞退フォームの値型 */
export type WithdrawValues = z.infer<typeof withdrawSchema>;

/** 申請取り消しのバリデーションスキーマ */
export const cancelApplicationSchema = z.object({});

/** 申請取り消しフォームの値型 */
export type CancelApplicationValues = z.infer<typeof cancelApplicationSchema>;

/** セッション基本情報のバリデーションスキーマ */
export const sessionBasicInfoSchema = z.object({
  sessionName: z
    .string()
    .min(1, 'セッション名を入力してください')
    .max(100, 'セッション名は100文字以内で入力してください'),
  sessionDescription: z
    .string()
    .min(1, '募集文を入力してください')
    .max(500, '募集文は500文字以内で入力してください'),
  maxParticipantCount: z
    .number()
    .int('参加上限数は整数で入力してください')
    .min(0, '参加上限数は0以上で入力してください')
    .max(20, '参加上限数は20以下で入力してください'),
  isBeginnerFriendly: z.boolean(),
});

/** セッション基本情報フォームの値型 */
export type SessionBasicInfoValues = z.infer<typeof sessionBasicInfoSchema>;

/** セッション完了のバリデーションスキーマ */
export const completeSessionSchema = z.object({
  note: z
    .string()
    .max(1000, '完了メモは1000文字以内で入力してください')
    .optional(),
});

/** セッション完了フォームの値型 */
export type CompleteSessionValues = z.infer<typeof completeSessionSchema>;
