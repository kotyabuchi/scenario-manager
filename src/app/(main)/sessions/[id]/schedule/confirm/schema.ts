import { z } from 'zod';

const confirmSlotSchema = z
  .object({
    startAt: z.string().datetime({ message: '開始日時が不正です' }),
    endAt: z.string().datetime({ message: '終了日時が不正です' }),
  })
  .refine(
    (slot) => new Date(slot.startAt).getTime() < new Date(slot.endAt).getTime(),
    {
      message: '開始日時は終了日時より前である必要があります',
      path: ['endAt'],
    },
  );

export const confirmScheduleSlotsSchema = z.object({
  slots: z
    .array(confirmSlotSchema)
    .min(1, '最低1つの日程枠を選択してください')
    .max(20, '確定枠は20件以内にしてください'),
});

export type ConfirmScheduleSlotsValues = z.infer<
  typeof confirmScheduleSlotsSchema
>;
