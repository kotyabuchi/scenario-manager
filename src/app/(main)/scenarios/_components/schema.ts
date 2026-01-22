import { z } from 'zod';

// 空文字列をundefinedに変換するプリプロセッサ
const optionalNumber = (min: number, max: number, fieldName: string) =>
  z.preprocess(
    (val) =>
      val === '' || val === undefined || val === null ? undefined : val,
    z.coerce
      .number()
      .min(min, `${fieldName}は${min}以上で入力してください`)
      .max(max, `${fieldName}は${max}以下で入力してください`)
      .optional(),
  );

export const searchFormSchema = z
  .object({
    systemIds: z.array(z.string()).default([]),
    tagIds: z.array(z.string()).default([]),
    minPlayer: optionalNumber(1, 20, '最小プレイ人数'),
    maxPlayer: optionalNumber(1, 20, '最大プレイ人数'),
    minPlaytime: optionalNumber(1, 240, '最小プレイ時間'),
    maxPlaytime: optionalNumber(1, 240, '最大プレイ時間'),
    scenarioName: z.string().default(''),
  })
  .refine(
    (data) => {
      // 両方指定されている場合のみチェック（片方のみはOK）
      if (data.minPlayer !== undefined && data.maxPlayer !== undefined) {
        return data.minPlayer <= data.maxPlayer;
      }
      return true;
    },
    {
      message: '最小プレイ人数は最大プレイ人数以下にしてください',
      path: ['maxPlayer'],
    },
  )
  .refine(
    (data) => {
      // 両方指定されている場合のみチェック（片方のみはOK）
      if (data.minPlaytime !== undefined && data.maxPlaytime !== undefined) {
        return data.minPlaytime <= data.maxPlaytime;
      }
      return true;
    },
    {
      message: '最小プレイ時間は最大プレイ時間以下にしてください',
      path: ['maxPlaytime'],
    },
  );

export type SearchFormValues = z.infer<typeof searchFormSchema>;
