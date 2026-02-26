import { z } from 'zod';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

const isThirtyMinuteBoundary = (iso: string): boolean => {
  const time = new Date(iso).getTime();
  return Number.isFinite(time) && time % THIRTY_MINUTES_MS === 0;
};

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
  )
  .refine(
    (slot) =>
      isThirtyMinuteBoundary(slot.startAt) &&
      isThirtyMinuteBoundary(slot.endAt),
    { message: '日時は30分単位で指定してください' },
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
