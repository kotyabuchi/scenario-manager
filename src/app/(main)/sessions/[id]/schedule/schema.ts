import { z } from 'zod';

/** 日程候補1件のスキーマ */
export const scheduleCandidateSchema = z.object({
  candidateDate: z
    .string()
    .datetime({ message: '有効な日時を入力してください' }),
  endTime: z
    .string()
    .datetime({ message: '有効な終了日時を入力してください' })
    .optional(),
});

export type ScheduleCandidateValues = z.infer<typeof scheduleCandidateSchema>;

/** 日程候補フォーム全体のスキーマ */
export const scheduleCandidatesFormSchema = z.object({
  candidates: z
    .array(scheduleCandidateSchema)
    .min(1, '最低1つの候補日時を登録してください')
    .max(30, '候補日時は30件以内にしてください'),
});

export type ScheduleCandidatesFormValues = z.infer<
  typeof scheduleCandidatesFormSchema
>;

/** 日程回答のスキーマ */
export const scheduleResponseSchema = z.object({
  responses: z
    .array(
      z.object({
        candidateId: z
          .string()
          .length(26, 'candidateIdはULID形式（26文字）で入力してください'),
        availability: z.enum(['OK', 'MAYBE', 'NG']),
      }),
    )
    .min(1, '少なくとも1つの候補に回答してください'),
  comment: z
    .string()
    .max(200, 'コメントは200文字以内で入力してください')
    .optional(),
});

export type ScheduleResponseValues = z.infer<typeof scheduleResponseSchema>;
