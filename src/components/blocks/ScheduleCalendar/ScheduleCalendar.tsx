'use client';

import { useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import { CaretLeft, CaretRight } from '@phosphor-icons/react/ssr';
import { ja } from 'date-fns/locale';

import * as styles from './styles';

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
   * TODO: カレンダー上に○△×の回答数バッジを表示する機能で使用予定
   */
  markers?: Record<string, { ok: number; maybe: number; ng: number }>;
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

/** ナビゲーションボタン（DayPicker の components prop に渡す内部ヘルパー） */
const PreviousMonthButton = ({
  onClick,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={styles.calendar_navButton}
    aria-label="前の月"
    {...props}
  >
    <CaretLeft size={16} weight="bold" />
  </button>
);

const NextMonthButton = ({
  onClick,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={styles.calendar_navButton}
    aria-label="次の月"
    {...props}
  >
    <CaretRight size={16} weight="bold" />
  </button>
);

const sharedComponents = {
  PreviousMonthButton,
  NextMonthButton,
} as const;

export const ScheduleCalendar = ({
  selectedDates,
  onSelect,
  multiple = true,
  disabled,
  markers: _markers,
  className,
}: ScheduleCalendarProps) => {
  // 過去日は常に無効
  const defaultDisabled = useCallback((date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }, []);

  const resolvedDisabled = disabled ?? defaultDisabled;

  return (
    <section aria-label="日程候補カレンダー" className={className}>
      {multiple ? (
        <DayPicker
          mode="multiple"
          selected={selectedDates}
          onSelect={(dates) => onSelect(dates ?? [])}
          locale={ja}
          disabled={resolvedDisabled}
          showOutsideDays={false}
          components={sharedComponents}
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
          disabled={resolvedDisabled}
          showOutsideDays={false}
          components={sharedComponents}
          classNames={{
            root: styles.calendar_root,
            ...sharedClassNames,
          }}
        />
      )}
    </section>
  );
};
