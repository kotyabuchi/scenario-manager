'use client';

import * as styles from './styles';

import { ScheduleCalendar } from '@/components/blocks/ScheduleCalendar/ScheduleCalendar';

import type { CalendarDayBadge } from '../interface';

type BaseAvailabilityCalendarProps = {
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  dayBadges?: CalendarDayBadge[];
  disabled?: Date[] | ((date: Date) => boolean);
  title?: string;
  helperText?: string;
};

const markerKeyToLabel = (badge: CalendarDayBadge): string => {
  const parts: string[] = [];
  if (badge.counts?.submissions !== undefined) {
    parts.push(`提出 ${badge.counts.submissions}件`);
  }
  if (badge.counts?.overlapStrong !== undefined) {
    parts.push(`強い重なり ${badge.counts.overlapStrong}件`);
  }

  return parts.length > 0
    ? `${badge.dateKey}: ${parts.join(' / ')}`
    : badge.dateKey;
};

export const BaseAvailabilityCalendar = ({
  selectedDate,
  onSelectDate,
  dayBadges = [],
  disabled,
  title = 'カレンダー',
  helperText,
}: BaseAvailabilityCalendarProps) => {
  const markers = Object.fromEntries(
    dayBadges.map((badge) => [badge.dateKey, { dots: badge.markers }]),
  );

  const legendItems = dayBadges
    .filter((badge) => badge.markers.length > 0 || badge.counts)
    .slice(0, 6);

  return (
    <div className={styles.calendarShell}>
      <div>
        <p className={styles.cardTitle}>{title}</p>
        {helperText ? (
          <p className={styles.timeBlockListItemSub}>{helperText}</p>
        ) : null}
      </div>

      <ScheduleCalendar
        selectedDates={selectedDate ? [selectedDate] : []}
        onSelect={(dates) => onSelectDate(dates[0] ?? null)}
        multiple={false}
        markers={markers}
        {...(disabled ? { disabled } : {})}
      />

      {legendItems.length > 0 ? (
        <ul
          className={styles.calendarLegend}
          aria-label="カレンダーの日別件数サマリー"
        >
          {legendItems.map((badge) => (
            <li key={badge.dateKey} className={styles.legendChip}>
              {badge.markers[0] ? (
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: badge.markers[0] }}
                  aria-hidden="true"
                />
              ) : null}
              <span>{markerKeyToLabel(badge)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
