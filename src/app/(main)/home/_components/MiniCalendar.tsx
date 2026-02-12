'use client';

import { useMemo, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react/ssr';

import * as styles from '../styles';

import type { MiniCalendarProps } from '../interface';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfWeek = (year: number, month: number) =>
  new Date(year, month, 1).getDay();

export const MiniCalendar = ({ sessionDates }: MiniCalendarProps) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const sessionDateSet = useMemo(
    () => new Set(sessionDates.map((d) => d.scheduleDate)),
    [sessionDates],
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells: Array<{
    day: number;
    isOutside: boolean;
    isToday: boolean;
    hasSession: boolean;
    dateStr: string;
  }> = [];

  // 前月の埋め草
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      day,
      isOutside: true,
      isToday: false,
      hasSession: sessionDateSet.has(dateStr),
      dateStr,
    });
  }

  // 当月
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      day,
      isOutside: false,
      isToday: dateStr === todayStr,
      hasSession: sessionDateSet.has(dateStr),
      dateStr,
    });
  }

  // 翌月の埋め草（42セル = 6行に揃える）
  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day++) {
    const m = month === 11 ? 1 : month + 2;
    const y = month === 11 ? year + 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      day,
      isOutside: true,
      isToday: false,
      hasSession: sessionDateSet.has(dateStr),
      dateStr,
    });
  }

  // セルを週(7日)ごとにグループ化
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <section
      className={styles.calendar_container}
      aria-label="セッションカレンダー"
    >
      <h3 className={styles.calendar_heading}>カレンダー</h3>
      <div className={styles.calendar_inner}>
        <div className={styles.calendar_header}>
          <button
            type="button"
            className={styles.calendar_navButton}
            onClick={goToPrevMonth}
            aria-label="前の月"
          >
            <CaretLeft size={16} />
          </button>
          <span className={styles.calendar_monthLabel}>
            {year}年{month + 1}月
          </span>
          <button
            type="button"
            className={styles.calendar_navButton}
            onClick={goToNextMonth}
            aria-label="次の月"
          >
            <CaretRight size={16} />
          </button>
        </div>

        <table
          className={styles.calendar_table}
          aria-label={`${year}年${month + 1}月`}
        >
          <thead>
            <tr>
              {DAY_LABELS.map((label) => (
                <th
                  key={label}
                  scope="col"
                  className={styles.calendar_dayHeaderCell}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIndex) => (
              <tr key={week[0]?.dateStr ?? weekIndex}>
                {week.map((cell) => (
                  <td
                    key={cell.dateStr}
                    className={`${styles.calendar_dayCell} ${cell.isOutside ? styles.calendar_dayCellOutside : ''} ${cell.isToday ? styles.calendar_dayCellToday : ''}`}
                    title={
                      cell.hasSession
                        ? `${cell.dateStr} セッションあり`
                        : undefined
                    }
                  >
                    {cell.day}
                    {cell.hasSession && (
                      <span className={styles.calendar_sessionDot} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
