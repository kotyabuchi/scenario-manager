import { z } from 'zod';

export const searchFormSchema = z
  .object({
    systems: z.array(z.string()),
    phases: z.array(z.string()),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    q: z.string(),
  })
  .refine(
    (data) => {
      // 終了日のみが入力されている場合はエラー
      if (!data.dateFrom && data.dateTo) {
        return false;
      }
      // 開始日が終了日より後の場合はエラー
      if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) {
        return false;
      }
      return true;
    },
    {
      message: '開催日の範囲が正しくありません',
      path: ['dateFrom'],
    },
  );

export type SearchFormValues = z.infer<typeof searchFormSchema>;
