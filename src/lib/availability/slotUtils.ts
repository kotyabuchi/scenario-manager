const THIRTY_MINUTES_MS = 30 * 60 * 1000;

type SlotLike = {
  startAt: string;
  endAt: string;
};

type NormalizeMode = 'floor' | 'ceil' | 'round';

const parseTime = (value: string): number => new Date(value).getTime();

export const THIRTY_MINUTES_MINUTES = 30;

export const hasThirtyMinuteBoundary = (value: string): boolean => {
  const time = parseTime(value);
  return Number.isFinite(time) && time % THIRTY_MINUTES_MS === 0;
};

export const normalizeToThirtyMinutes = (
  value: string,
  mode: NormalizeMode = 'round',
): string => {
  const time = parseTime(value);
  if (!Number.isFinite(time)) {
    throw new Error('Invalid datetime');
  }

  const divided = time / THIRTY_MINUTES_MS;
  const rounded =
    mode === 'floor'
      ? Math.floor(divided)
      : mode === 'ceil'
        ? Math.ceil(divided)
        : Math.round(divided);

  return new Date(rounded * THIRTY_MINUTES_MS).toISOString();
};

export const isSameSlot = (a: SlotLike, b: SlotLike): boolean =>
  a.startAt === b.startAt && a.endAt === b.endAt;

export const isOverlappingSlot = (a: SlotLike, b: SlotLike): boolean => {
  const aStart = parseTime(a.startAt);
  const aEnd = parseTime(a.endAt);
  const bStart = parseTime(b.startAt);
  const bEnd = parseTime(b.endAt);

  return aStart < bEnd && bStart < aEnd;
};

export const calcSlotMinutes = (slot: SlotLike): number =>
  Math.max(0, (parseTime(slot.endAt) - parseTime(slot.startAt)) / (60 * 1000));

export const calcTotalMinutes = (slots: SlotLike[]): number =>
  slots.reduce((total, slot) => total + calcSlotMinutes(slot), 0);

export const toggleExactSlot = <T extends SlotLike>(
  list: T[],
  slot: T,
): T[] => {
  const found = list.some((item) => isSameSlot(item, slot));
  if (found) {
    return list.filter((item) => !isSameSlot(item, slot));
  }
  return [...list, slot];
};

export const getUtcDateKey = (value: string): string => {
  const time = parseTime(value);
  if (!Number.isFinite(time)) {
    throw new Error('Invalid datetime');
  }
  return new Date(time).toISOString().slice(0, 10);
};

export const calcGapMinutes = (a: SlotLike, b: SlotLike): number => {
  const aEnd = parseTime(a.endAt);
  const bStart = parseTime(b.startAt);
  return Math.max(0, (bStart - aEnd) / (60 * 1000));
};

export const sortSlotsByStart = <T extends SlotLike>(slots: T[]): T[] =>
  [...slots].sort(
    (a, b) =>
      parseTime(a.startAt) - parseTime(b.startAt) ||
      parseTime(a.endAt) - parseTime(b.endAt),
  );
