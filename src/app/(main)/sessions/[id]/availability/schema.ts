import { z } from 'zod';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

const isThirtyMinuteBoundary = (iso: string): boolean => {
  const time = new Date(iso).getTime();
  return Number.isFinite(time) && time % THIRTY_MINUTES_MS === 0;
};

const availabilityTimeBlockInputSchema = z
  .object({
    startAt: z.string().datetime({ message: '開始日時が不正です' }),
    endAt: z.string().datetime({ message: '終了日時が不正です' }),
  })
  .refine(
    (timeBlock) =>
      new Date(timeBlock.startAt).getTime() <
      new Date(timeBlock.endAt).getTime(),
    {
      message: '開始日時は終了日時より前である必要があります',
      path: ['endAt'],
    },
  )
  .refine(
    (timeBlock) =>
      isThirtyMinuteBoundary(timeBlock.startAt) &&
      isThirtyMinuteBoundary(timeBlock.endAt),
    { message: '日時は30分単位で指定してください' },
  );

export const saveAvailabilityTimeBlocksSchema = z.object({
  timeBlocks: z
    .array(availabilityTimeBlockInputSchema)
    .max(100, 'スケジュールは100件以内にしてください'),
});

export type SaveAvailabilityTimeBlocksValues = z.infer<
  typeof saveAvailabilityTimeBlocksSchema
>;

export { availabilityTimeBlockInputSchema };
