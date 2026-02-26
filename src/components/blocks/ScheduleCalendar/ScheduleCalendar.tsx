'use client';

import { useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import { CaretLeft, CaretRight } from '@phosphor-icons/react/ssr';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import * as styles from './styles';

type ScheduleCalendarMarker = {
  dots: string[];
};

export type ScheduleCalendarProps = {
  /** 選択中の日付 */
  selectedDates: Date[];
  /** 日付選択コールバック */
  onSelect: (dates: Date[]) => void;
  /** 複数選択可能か */
  multiple?: boolean;
  /** 無効にする日付（過去日など） */
  disabled?: Date[] | ((date: Date) => boolean);
  /**
   * 参加者の回答マーカー（回答画面用）
   * 日付キー（yyyy-MM-dd）ごとのドットカラー一覧
   */
  markers?: Record<string, ScheduleCalendarMarker>;
  /** className上書き */
  className?: string;
};

const sharedClassNames = {
  months: styles.calendar_months,
  month: styles.calendar_month,
  month_caption: styles.calendar_month_caption,
  caption_label: styles.calendar_caption_label,
  nav: styles.calendar_nav,
  button_previous: styles.calendar_navButton,
  button_next: styles.calendar_navButton,
  weekdays: styles.calendar_weekdays,
  weekday: styles.calendar_weekday,
  weeks: styles.calendar_weeks,
  week: styles.calendar_week,
  month_grid: styles.calendar_month_grid,
  day: styles.calendar_day,
  day_button: styles.calendar_day_button,
  selected: styles.calendar_selected,
  today: styles.calendar_today,
  disabled: styles.calendar_disabled,
  outside: styles.calendar_outside,
  chevron: styles.calendar_chevron,
} as const;

const mergeClassNames = (baseClassName: string, className?: string): string =>
  className ? `${baseClassName} ${className}` : baseClassName;

/** ナビゲーションボタン（DayPicker の components prop に渡す内部ヘルパー） */
const PreviousMonthButton = ({
  onClick,
  disabled,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    {...props}
    className={mergeClassNames(styles.calendar_navButton, className)}
    aria-label="前の月"
  >
    <CaretLeft size={16} weight="bold" />
  </button>
);

const NextMonthButton = ({
  onClick,
  disabled,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    {...props}
    className={mergeClassNames(styles.calendar_navButton, className)}
    aria-label="次の月"
  >
    <CaretRight size={16} weight="bold" />
  </button>
);

const sharedComponents = {
  PreviousMonthButton,
  NextMonthButton,
} as const;

const formatDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

type DayButtonWithMarkerProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    day?: { date: Date };
  };

const createDayButtonWithMarkers = (
  markers?: Record<string, ScheduleCalendarMarker>,
) => {
  const DayButtonWithMarkers = ({
    day,
    children,
    ...props
  }: DayButtonWithMarkerProps) => {
    const date = day?.date;
    const marker = date ? markers?.[formatDateKey(date)] : undefined;
    const visibleDots = marker?.dots.slice(0, 2) ?? [];
    const overflowCount = marker ? Math.max(marker.dots.length - 2, 0) : 0;

    return (
      <button type="button" {...props}>
        <span className={styles.calendar_dayNumber} data-day-number>
          {children}
        </span>
        {marker && marker.dots.length > 0 ? (
          <span className={styles.calendar_markerRow} aria-hidden="true">
            {visibleDots.map((color) => (
              <span
                key={color}
                className={styles.calendar_markerDot}
                style={{ backgroundColor: color }}
              />
            ))}
            {overflowCount > 0 ? (
              <span className={styles.calendar_markerOverflow}>
                +{overflowCount}
              </span>
            ) : null}
          </span>
        ) : (
          <span className={styles.calendar_markerSpacer} aria-hidden="true" />
        )}
      </button>
    );
  };

  return DayButtonWithMarkers;
};

export const ScheduleCalendar = ({
  selectedDates,
  onSelect,
  multiple = true,
  disabled,
  markers,
  className,
}: ScheduleCalendarProps) => {
  // 過去日は常に無効
  const defaultDisabled = useCallback((date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }, []);

  const resolvedDisabled = disabled ?? defaultDisabled;
  const components = {
    ...sharedComponents,
    DayButton: createDayButtonWithMarkers(markers),
  };

  return (
    <section aria-label="日程候補カレンダー" className={className}>
      {multiple ? (
        <DayPicker
          mode="multiple"
          selected={selectedDates}
          onSelect={(dates) => onSelect(dates ?? [])}
          locale={ja}
          navLayout="around"
          disabled={resolvedDisabled}
          showOutsideDays
          components={components}
          classNames={{
            root: styles.calendar_root,
            ...sharedClassNames,
          }}
        />
      ) : (
        <DayPicker
          mode="single"
          selected={selectedDates[0]}
          onSelect={(date) => onSelect(date ? [date] : [])}
          locale={ja}
          navLayout="around"
          disabled={resolvedDisabled}
          showOutsideDays
          components={components}
          classNames={{
            root: styles.calendar_root,
            ...sharedClassNames,
          }}
        />
      )}
    </section>
  );
};
