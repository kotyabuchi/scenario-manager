import { z } from 'zod';

/**
 * プロフィール編集フォームのバリデーションスキーマ
 */
export const profileFormSchema = z.object({
  nickname: z
    .string()
    .min(1, '表示名を入力してください')
    .max(50, '表示名は50文字以内で入力してください'),
  bio: z.string().max(500, '自己紹介は500文字以内で入力してください'),
});

// スキーマから型を導出（フォーム入力用）
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

// サーバー送信時の型（bioを空文字からundefinedに変換）
export type ProfileSubmitValues = {
  nickname: string;
  bio: string | undefined;
};
