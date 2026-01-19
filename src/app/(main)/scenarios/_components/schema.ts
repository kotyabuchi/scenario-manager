import { z } from 'zod';

// 空文字列をundefinedに変換するプリプロセッサ
const optionalNumber = (min: number, max: number, fieldName: string) =>
  z.preprocess(
    (val) =>
      val === '' || val === undefined || val === null ? undefined : val,
    z.coerce
      .number({
        invalid_type_error: `${fieldName}は数値で入力してください`,
      })
      .min(min, `${fieldName}は${min}以上で入力してください`)
      .max(max, `${fieldName}は${max}以下で入力してください`)
      .optional(),
  );

export const searchFormSchema = z.object({
  systemIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  minPlayer: optionalNumber(1, 20, '最小プレイ人数'),
  maxPlayer: optionalNumber(1, 20, '最大プレイ人数'),
  minPlaytime: optionalNumber(1, 24, '最小プレイ時間'),
  maxPlaytime: optionalNumber(1, 24, '最大プレイ時間'),
  scenarioName: z.string().default(''),
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;
