import { z } from 'zod';

export const signupFormSchema = z.object({
  userName: z
    .string()
    .min(1, 'ユーザーIDを入力してください')
    .min(3, 'ユーザーIDは3文字以上で入力してください')
    .max(20, 'ユーザーIDは20文字以内で入力してください')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'ユーザーIDは英数字とアンダースコアのみ使用できます',
    ),
  nickname: z
    .string()
    .min(1, '表示名を入力してください')
    .max(50, '表示名は50文字以内で入力してください'),
});

export const signupStep2Schema = z.object({
  bio: z
    .string()
    .max(500, '自己紹介は500文字以内で入力してください')
    .optional()
    .default(''),
  favoriteSystems: z.array(z.string()).optional().default([]),
  favoriteScenarios: z
    .string()
    .max(500, '500文字以内で入力してください')
    .optional()
    .default(''),
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type SignupStep2Values = z.infer<typeof signupStep2Schema>;
