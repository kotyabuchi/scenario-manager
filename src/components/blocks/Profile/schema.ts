import { z } from 'zod';

/**
 * ユーザーID（userName）のバリデーション
 * - 3〜30文字
 * - 英数字とアンダースコアのみ
 */
const userNameSchema = z
  .string()
  .min(3, 'ユーザーIDは3文字以上で入力してください')
  .max(30, 'ユーザーIDは30文字以内で入力してください')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'ユーザーIDは英数字とアンダースコアのみ使用できます',
  );

/**
 * プロフィール編集フォームのバリデーションスキーマ
 */
export const profileFormSchema = z.object({
  userName: userNameSchema,
  nickname: z
    .string()
    .min(1, '表示名を入力してください')
    .max(50, '表示名は50文字以内で入力してください'),
  bio: z.string().max(500, '自己紹介は500文字以内で入力してください'),
});

// スキーマから型を導出（フォーム入力用）
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
