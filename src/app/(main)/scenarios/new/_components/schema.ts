import { z } from 'zod';

import { HandoutTypes } from '@/db/enum';

// 空文字列をundefinedに変換して数値としてバリデーション
const optionalNumberString = (min: number, max: number, fieldName: string) =>
  z
    .union([z.string(), z.number(), z.undefined()])
    .transform((val) => {
      if (val === '' || val === undefined || val === null) return undefined;
      const num =
        typeof val === 'number' ? val : Number.parseInt(String(val), 10);
      return Number.isNaN(num) ? undefined : num;
    })
    .pipe(
      z
        .number()
        .min(min, `${fieldName}は${min}以上で入力してください`)
        .max(max, `${fieldName}は${max}以下で入力してください`)
        .optional(),
    );

export const scenarioFormSchema = z
  .object({
    // 必須フィールド
    name: z
      .string()
      .min(1, 'シナリオ名は必須です')
      .max(100, 'シナリオ名は100文字以内で入力してください'),
    scenarioSystemId: z.string().min(1, 'システムを選択してください'),
    handoutType: z.enum(
      [
        HandoutTypes.NONE.value,
        HandoutTypes.PUBLIC.value,
        HandoutTypes.SECRET.value,
      ],
      {
        message: 'ハンドアウト形式を選択してください',
      },
    ),

    // 任意フィールド（文字列は空文字をtransformでundefinedに変換）
    author: z
      .string()
      .max(100, '作者名は100文字以内で入力してください')
      .optional()
      .transform((val) => (val === '' ? undefined : val)),
    description: z
      .string()
      .max(2000, '概要は2000文字以内で入力してください')
      .optional()
      .transform((val) => (val === '' ? undefined : val)),
    scenarioImageUrl: z
      .string()
      .url('サムネイルURLは有効なURL形式で入力してください')
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val)),
    distributeUrl: z
      .string()
      .url('配布URLは有効なURL形式で入力してください')
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val)),

    // 数値フィールド
    minPlayer: optionalNumberString(1, 20, '最小プレイ人数'),
    maxPlayer: optionalNumberString(1, 20, '最大プレイ人数'),
    minPlaytime: optionalNumberString(1, 14400, '最小プレイ時間'),
    maxPlaytime: optionalNumberString(1, 14400, '最大プレイ時間'),

    // 配列
    tagIds: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      // minPlayer と maxPlayer が両方指定されている場合のみチェック
      if (data.minPlayer !== undefined && data.maxPlayer !== undefined) {
        return data.minPlayer <= data.maxPlayer;
      }
      return true;
    },
    {
      message: '最小プレイ人数は最大プレイ人数以下にしてください',
      path: ['minPlayer'],
    },
  )
  .refine(
    (data) => {
      // minPlaytime と maxPlaytime が両方指定されている場合のみチェック
      if (data.minPlaytime !== undefined && data.maxPlaytime !== undefined) {
        return data.minPlaytime <= data.maxPlaytime;
      }
      return true;
    },
    {
      message: '最小プレイ時間は最大プレイ時間以下にしてください',
      path: ['minPlaytime'],
    },
  );

// 入力型（フォームで使用）
export type ScenarioFormInput = z.input<typeof scenarioFormSchema>;

// 出力型（バリデーション後、Server Actionで使用）
export type ScenarioFormValues = z.output<typeof scenarioFormSchema>;
