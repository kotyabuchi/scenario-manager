import { z } from 'zod';

// 空文字列をundefinedに変換するプリプロセッサ
const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (val) =>
      val === '' || val === undefined || val === null ? undefined : val,
    z.coerce.number().min(min).max(max).optional(),
  );

export const searchFormSchema = z.object({
  systemIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  minPlayer: optionalNumber(1, 20),
  maxPlayer: optionalNumber(1, 20),
  minPlaytime: optionalNumber(1, 24),
  maxPlaytime: optionalNumber(1, 24),
  scenarioName: z.string().default(''),
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;
