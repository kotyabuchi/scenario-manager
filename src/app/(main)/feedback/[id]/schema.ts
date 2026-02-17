import { z } from 'zod';

export const commentFormSchema = z.object({
  content: z
    .string()
    .min(1, 'コメントを入力してください')
    .max(1000, 'コメントは1000文字以内です'),
});

export type CommentFormValues = z.infer<typeof commentFormSchema>;

export const adminSectionSchema = z.object({
  status: z.string().min(1, 'ステータスを選択してください'),
  priority: z.string().optional(),
  adminNote: z.string().max(2000, '運営メモは2000文字以内です').optional(),
});

export type AdminSectionFormValues = z.infer<typeof adminSectionSchema>;
