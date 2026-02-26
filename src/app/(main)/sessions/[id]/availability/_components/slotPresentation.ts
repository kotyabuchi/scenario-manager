import { format } from 'date-fns';

import { calcTotalMinutes } from '@/lib/availability/slotUtils';

import type { AvailabilitySlotInput } from '../interface';

const toDate = (value: string): Date => new Date(value);

export const formatMinutesLabel = (minutes: number): string => {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;

  if (hours > 0 && rest > 0) {
    return `${hours}時間${rest}分`;
  }
  if (hours > 0) {
    return `${hours}時間`;
  }
  return `${rest}分`;
};

export const calcSelectedSlotsTotalMinutes = (
  slots: AvailabilitySlotInput[],
): number => calcTotalMinutes(slots);

export const getProgressStatus = (
  totalMinutes: number,
  minPlaytimeMinutes: number | null,
): 'neutral' | 'success' | 'warning' => {
  if (minPlaytimeMinutes === null) {
    return 'neutral';
  }
  return totalMinutes >= minPlaytimeMinutes ? 'success' : 'warning';
};

export const formatSlotDateTimeRange = (
  slot: AvailabilitySlotInput,
): {
  primary: string;
  secondary: string;
} => {
  const start = toDate(slot.startAt);
  const end = toDate(slot.endAt);
  const sameDay = format(start, 'yyyy/MM/dd') === format(end, 'yyyy/MM/dd');

  const primary = sameDay
    ? `${format(start, 'M/d (E)')} ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
    : `${format(start, 'M/d (E) HH:mm')} - ${format(end, 'M/d (E) HH:mm')}`;

  const secondary = sameDay
    ? formatMinutesLabel(calcTotalMinutes([slot]))
    : `日跨ぎ / ${formatMinutesLabel(calcTotalMinutes([slot]))}`;

  return { primary, secondary };
};
