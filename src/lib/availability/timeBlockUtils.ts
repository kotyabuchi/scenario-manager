const THIRTY_MINUTES_MS = 30 * 60 * 1000;

type TimeBlockLike = {
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

export const isSameTimeBlock = (a: TimeBlockLike, b: TimeBlockLike): boolean =>
  a.startAt === b.startAt && a.endAt === b.endAt;

export const isOverlappingTimeBlock = (
  a: TimeBlockLike,
  b: TimeBlockLike,
): boolean => {
  const aStart = parseTime(a.startAt);
  const aEnd = parseTime(a.endAt);
  const bStart = parseTime(b.startAt);
  const bEnd = parseTime(b.endAt);

  return aStart < bEnd && bStart < aEnd;
};

export const calcTimeBlockMinutes = (timeBlock: TimeBlockLike): number =>
  Math.max(
    0,
    (parseTime(timeBlock.endAt) - parseTime(timeBlock.startAt)) / (60 * 1000),
  );

export const calcTotalTimeBlockMinutes = (
  timeBlocks: TimeBlockLike[],
): number =>
  timeBlocks.reduce(
    (total, timeBlock) => total + calcTimeBlockMinutes(timeBlock),
    0,
  );

export const toggleExactTimeBlock = <T extends TimeBlockLike>(
  list: T[],
  timeBlock: T,
): T[] => {
  const found = list.some((item) => isSameTimeBlock(item, timeBlock));
  if (found) {
    return list.filter((item) => !isSameTimeBlock(item, timeBlock));
  }
  return [...list, timeBlock];
};

export const getUtcDateKey = (value: string): string => {
  const time = parseTime(value);
  if (!Number.isFinite(time)) {
    throw new Error('Invalid datetime');
  }
  return new Date(time).toISOString().slice(0, 10);
};

export const calcGapMinutes = (a: TimeBlockLike, b: TimeBlockLike): number => {
  const aEnd = parseTime(a.endAt);
  const bStart = parseTime(b.startAt);
  return Math.max(0, (bStart - aEnd) / (60 * 1000));
};

export const sortTimeBlocksByStart = <T extends TimeBlockLike>(
  timeBlocks: T[],
): T[] =>
  [...timeBlocks].sort(
    (a, b) =>
      parseTime(a.startAt) - parseTime(b.startAt) ||
      parseTime(a.endAt) - parseTime(b.endAt),
  );
