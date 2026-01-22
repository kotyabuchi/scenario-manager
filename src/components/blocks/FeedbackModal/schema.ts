import { z } from 'zod';

import { FeedbackCategories } from '@/db/enum';

export const feedbackFormSchema = z.object({
  category: z.enum(
    [
      FeedbackCategories.BUG.value,
      FeedbackCategories.FEATURE.value,
      FeedbackCategories.UI_UX.value,
      FeedbackCategories.OTHER.value,
    ],
    {
      message: 'カテゴリを選択してください',
    },
  ),
  title: z
    .string()
    .min(1, 'タイトルを入力してください')
    .max(100, 'タイトルは100文字以内で入力してください'),
  description: z
    .string()
    .min(1, '内容を入力してください')
    .max(2000, '内容は2000文字以内で入力してください'),
});

export type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;
