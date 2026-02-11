import { z } from 'zod';

import { HandoutTypes } from '@/db/enum';

/** URL入力ステップのスキーマ */
export const urlInputSchema = z.object({
  url: z
    .string()
    .min(1, 'URLを入力してください')
    .url('有効なURLを入力してください'),
});

export type UrlInputValues = z.infer<typeof urlInputSchema>;

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

// 画像ファイルのバリデーション定数
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_IMAGE_SIZE, {
    message: '画像サイズは5MB以下にしてください',
  })
  .refine(
    (file) =>
      ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      ),
    {
      message: 'JPEG、PNG、WebP、GIF形式の画像のみ対応しています',
    },
  )
  .optional()
  .nullable();

/** インポートフォームのスキーマ（Step 2）*/
export const importFormSchema = z
  .object({
    // パーサーから取得したフィールド
    name: z
      .string()
      .min(1, 'シナリオ名は必須です')
      .max(100, 'シナリオ名は100文字以内で入力してください'),
    author: z
      .string()
      .max(100, '作者名は100文字以内で入力してください')
      .optional()
      .transform((val) => (val === '' ? undefined : val)),

    // 数値フィールド（パーサーからの初期値 or ユーザー入力）
    minPlayer: optionalNumberString(1, 20, '最小プレイ人数'),
    maxPlayer: optionalNumberString(1, 20, '最大プレイ人数'),
    minPlaytime: optionalNumberString(1, 14400, '最小プレイ時間'),
    maxPlaytime: optionalNumberString(1, 14400, '最大プレイ時間'),

    // ユーザー手動入力フィールド
    scenarioSystemId: z.string().min(1, 'システムを選択してください'),
    handoutType: z.enum(
      [
        HandoutTypes.NONE.value,
        HandoutTypes.PUBLIC.value,
        HandoutTypes.SECRET.value,
      ],
      { message: 'ハンドアウト形式を選択してください' },
    ),
    description: z
      .string()
      .max(2000, '概要は2000文字以内で入力してください')
      .optional()
      .transform((val) => (val === '' ? undefined : val)),
    scenarioImage: imageFileSchema,
    scenarioImageUrl: z
      .string()
      .url()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val)),
    tagIds: z.array(z.string()).default([]),

    // ソース情報（hidden）
    distributeUrl: z.string().url('配布URLは有効なURL形式で入力してください'),
    sourceType: z.enum(['booth', 'talto']),
    sourceUrl: z.string().url(),
  })
  .refine(
    (data) => {
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

export type ImportFormInput = z.input<typeof importFormSchema>;
export type ImportFormValues = z.output<typeof importFormSchema>;
