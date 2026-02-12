import { Calendar, Clock } from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import * as styles from '../styles';

import type { HeroSectionProps } from '../interface';

const calcDaysUntil = (dateStr: string): number => {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const formatScheduleDateTime = (
  dateStr: string,
  timeStr: string | null,
): string => {
  const d = new Date(dateStr);
  const datePart = `${d.getMonth() + 1}月${d.getDate()}日`;
  if (isNil(timeStr)) return datePart;
  const t = new Date(timeStr);
  const hours = String(t.getHours()).padStart(2, '0');
  const minutes = String(t.getMinutes()).padStart(2, '0');
  return `${datePart} ${hours}:${minutes}〜`;
};

export const HeroSection = ({ userName, nextSession }: HeroSectionProps) => {
  const schedule = nextSession?.schedule;
  const scheduleDate = schedule?.scheduleDate;
  const scheduledAt = nextSession?.scheduledAt ?? null;
  const daysUntil = !isNil(scheduleDate) ? calcDaysUntil(scheduleDate) : null;

  return (
    <div className={styles.hero_container}>
      <div className={styles.hero_textArea}>
        <h1 className={styles.hero_title}>ようこそ、{userName}さん</h1>
        <p className={styles.hero_subtitle}>
          {!isNil(nextSession)
            ? '次のセッションの準備はできていますか？'
            : '今日も素晴らしい冒険を始めましょう。'}
        </p>
      </div>

      {!isNil(nextSession) && !isNil(scheduleDate) && (
        <div className={styles.hero_countdownCard}>
          <div className={styles.hero_countdownContent}>
            <div className={styles.hero_countdownLabel}>
              <Calendar size={12} />
              次のセッション
            </div>
            <div className={styles.hero_countdownSessionName}>
              {nextSession.sessionName}
            </div>
            <div className={styles.hero_countdownDate}>
              <Clock size={12} />
              {formatScheduleDateTime(scheduleDate, scheduledAt)}
            </div>
          </div>

          {!isNil(daysUntil) && daysUntil >= 0 && (
            <div className={styles.hero_countdownDays}>
              {daysUntil === 0 ? (
                <>
                  <span className={styles.hero_countdownNumber}>!</span>
                  <span className={styles.hero_countdownUnit}>今日</span>
                </>
              ) : (
                <>
                  <span className={styles.hero_countdownPrefix}>あと</span>
                  <span className={styles.hero_countdownNumber}>
                    {daysUntil}
                    <span className={styles.hero_countdownUnit}>日</span>
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
