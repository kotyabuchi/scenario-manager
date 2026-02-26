import { z } from 'zod';

const availabilitySlotInputSchema = z
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

export const saveAvailabilitySlotsSchema = z.object({
  slots: z
    .array(availabilitySlotInputSchema)
    .max(100, '提出枠は100件以内にしてください'),
});

export type SaveAvailabilitySlotsValues = z.infer<
  typeof saveAvailabilitySlotsSchema
>;

export { availabilitySlotInputSchema };
