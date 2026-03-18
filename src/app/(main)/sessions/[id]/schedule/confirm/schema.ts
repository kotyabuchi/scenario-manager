import { z } from 'zod';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

const isThirtyMinuteBoundary = (iso: string): boolean => {
  const time = new Date(iso).getTime();
  return Number.isFinite(time) && time % THIRTY_MINUTES_MS === 0;
};

const confirmTimeBlockSchema = z
  .object({
    startAt: z.string().datetime({ message: '開始日時が不正です' }),
    endAt: z.string().datetime({ message: '終了日時が不正です' }),
  })
  .refine(
    (block) =>
      new Date(block.startAt).getTime() < new Date(block.endAt).getTime(),
    {
      message: '開始日時は終了日時より前である必要があります',
      path: ['endAt'],
    },
  )
  .refine(
    (block) =>
      isThirtyMinuteBoundary(block.startAt) &&
      isThirtyMinuteBoundary(block.endAt),
    { message: '日時は30分単位で指定してください' },
  );

const hasNoOverlap = (
  timeBlocks: { startAt: string; endAt: string }[],
): boolean => {
  const sorted = [...timeBlocks].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const current = sorted[i];
    if (!prev || !current) continue;
    if (new Date(prev.endAt).getTime() > new Date(current.startAt).getTime()) {
      return false;
    }
  }
  return true;
};

export const confirmScheduleTimeBlocksSchema = z.object({
  timeBlocks: z
    .array(confirmTimeBlockSchema)
    .min(1, '最低1つの日程を選択してください')
    .max(20, '確定日程は20件以内にしてください')
    .refine(hasNoOverlap, { message: '確定日程同士が重複しています' }),
});

export type ConfirmScheduleTimeBlocksValues = z.infer<
  typeof confirmScheduleTimeBlocksSchema
>;
