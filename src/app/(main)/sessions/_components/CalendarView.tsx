'use client';

import { useMemo, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import * as styles from './styles';

import type { MySessionWithRole } from '../interface';

type CalendarViewProps = {
  sessions: MySessionWithRole[];
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (year: number, month: number, day: number): string => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const CalendarView = ({ sessions }: CalendarViewProps) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // セッションを日付ごとにグループ化
  const { scheduledSessions, unscheduledSessions } = useMemo(() => {
    const scheduled: Map<string, MySessionWithRole[]> = new Map();
    const unscheduled: MySessionWithRole[] = [];

    for (const session of sessions) {
      const scheduleDate = session.schedule?.scheduleDate;
      if (scheduleDate) {
        const date = new Date(scheduleDate);
        const dateKey = formatDate(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );
        const existing = scheduled.get(dateKey) ?? [];
        existing.push(session);
        scheduled.set(dateKey, existing);
      } else {
        unscheduled.push(session);
      }
    }

    return { scheduledSessions: scheduled, unscheduledSessions: unscheduled };
  }, [sessions]);

  // カレンダーの日付を生成
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: {
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      dateKey: string;
    }[] = [];

    // 前月の日付を埋める
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        dateKey: formatDate(prevYear, prevMonth, day),
      });
    }

    // 当月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({
        day,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        dateKey: formatDate(currentYear, currentMonth, day),
      });
    }

    // 次月の日付を埋める（6行 × 7日 = 42日分になるまで）
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    let nextDay = 1;
    while (days.length < 42) {
      days.push({
        day: nextDay,
        isCurrentMonth: false,
        isToday: false,
        dateKey: formatDate(nextYear, nextMonth, nextDay),
      });
      nextDay++;
    }

    return days;
  }, [currentYear, currentMonth, today]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  // 選択された日付のセッション
  const selectedSessions = selectedDate
    ? (scheduledSessions.get(selectedDate) ?? [])
    : [];

  return (
    <div>
      <div className={styles.calendarContainer}>
        <div className={styles.calendarHeader}>
          <button
            type="button"
            className={styles.calendarNavButton}
            onClick={handlePrevMonth}
            aria-label="前月"
          >
            <CaretLeft size={20} />
          </button>
          <h2 className={styles.calendarTitle}>
            {currentYear}年{currentMonth + 1}月
          </h2>
          <button
            type="button"
            className={styles.calendarNavButton}
            onClick={handleNextMonth}
            aria-label="次月"
          >
            <CaretRight size={20} />
          </button>
        </div>

        <div className={styles.calendarGrid}>
          <div className={styles.calendarWeekHeader}>
            {weekdays.map((day) => (
              <div key={day} className={styles.calendarWeekDay}>
                {day}
              </div>
            ))}
          </div>

          {calendarDays.map((dayInfo, index) => {
            const daySessions = scheduledSessions.get(dayInfo.dateKey) ?? [];
            const isSelected = selectedDate === dayInfo.dateKey;

            return (
              <button
                key={`${dayInfo.dateKey}-${index}`}
                type="button"
                className={styles.calendarDay({
                  isCurrentMonth: dayInfo.isCurrentMonth,
                  isToday: dayInfo.isToday,
                })}
                onClick={() =>
                  setSelectedDate(isSelected ? null : dayInfo.dateKey)
                }
                style={{
                  outline: isSelected
                    ? '2px solid var(--colors-primary-500)'
                    : 'none',
                }}
              >
                <span
                  className={styles.calendarDayNumber({
                    isCurrentMonth: dayInfo.isCurrentMonth,
                    isToday: dayInfo.isToday,
                  })}
                >
                  {dayInfo.day}
                </span>
                {daySessions.length > 0 && (
                  <div className={styles.calendar_sessionDots}>
                    {daySessions.slice(0, 2).map((session) => (
                      <span
                        key={session.gameSessionId}
                        className={styles.calendarSessionDot}
                      >
                        {session.sessionName.slice(0, 4)}
                      </span>
                    ))}
                    {daySessions.length > 2 && (
                      <span className={styles.calendarSessionDot}>
                        +{daySessions.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 選択した日付のセッション一覧 */}
        {selectedDate && selectedSessions.length > 0 && (
          <div className={styles.calendarUnscheduledSection}>
            <h3 className={styles.calendarUnscheduledTitle}>
              {selectedDate.replace(/-/g, '/')}のセッション
            </h3>
            <div className={styles.calendarUnscheduledList}>
              {selectedSessions.map((session) => (
                <Link
                  key={session.gameSessionId}
                  href={`/sessions/${session.gameSessionId}`}
                  className={styles.calendarSessionDot}
                >
                  {session.sessionName}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 日程未確定セッション */}
        {unscheduledSessions.length > 0 && (
          <div className={styles.calendarUnscheduledSection}>
            <h3 className={styles.calendarUnscheduledTitle}>
              日程未確定のセッション: {unscheduledSessions.length}件
            </h3>
            <div className={styles.calendarUnscheduledList}>
              {unscheduledSessions.map((session) => (
                <Link
                  key={session.gameSessionId}
                  href={`/sessions/${session.gameSessionId}`}
                  className={styles.calendarUnscheduledItem}
                >
                  {session.sessionName}（
                  {session.sessionPhase === 'RECRUITING' ? '募集中' : '準備中'}
                  ）
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
