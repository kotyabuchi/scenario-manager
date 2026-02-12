import { Calendar, CaretRight } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { isNil } from 'ramda';

import * as styles from '../styles';

import type { UpcomingSession, UpcomingSessionsProps } from '../interface';

const phaseStyles: Record<string, { label: string; style: string }> = {
  RECRUITING: {
    label: '募集中',
    style: styles.sessions_badgeRecruiting,
  },
  PREPARATION: {
    label: '準備中',
    style: styles.sessions_badgePreparation,
  },
  IN_PROGRESS: {
    label: '進行中',
    style: styles.sessions_badgeInProgress,
  },
  COMPLETED: {
    label: '終了',
    style: styles.sessions_badgeCompleted,
  },
};

const formatSessionDate = (session: UpcomingSession): string | null => {
  const date = session.schedule?.scheduleDate;
  if (isNil(date)) return null;
  const d = new Date(date);
  return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`;
};

const formatSessionTime = (session: UpcomingSession): string | null => {
  const scheduledAt = session.scheduledAt;
  if (isNil(scheduledAt)) return null;
  const t = new Date(scheduledAt);
  const hours = String(t.getHours()).padStart(2, '0');
  const minutes = String(t.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}〜`;
};

export const UpcomingSessions = ({ sessions }: UpcomingSessionsProps) => {
  return (
    <section>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionAccentBar} />
          予定されているセッション
        </h2>
        {sessions.length > 0 && (
          <Link href="/sessions?tab=upcoming" className={styles.sectionLink}>
            すべて見る
            <CaretRight size={16} />
          </Link>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar className={styles.emptyStateIcon} />
          <p className={styles.emptyStateText}>
            参加予定のセッションはまだありません
            <br />
            公開卓を探してみませんか？
          </p>
          <Link href="/sessions?tab=public" className={styles.sectionLink}>
            公開卓を探す
            <CaretRight size={16} />
          </Link>
        </div>
      ) : (
        <div className={styles.sessions_list}>
          {sessions.map((session) => {
            const isCompleted = session.sessionPhase === 'COMPLETED';
            const phase = phaseStyles[session.sessionPhase];
            const dateStr = formatSessionDate(session);
            const timeStr = formatSessionTime(session);
            const participants = session.participants ?? [];
            const visibleParticipants = participants.slice(0, 3);
            const overflowCount = participants.length - 3;

            return (
              <Link
                key={session.gameSessionId}
                href={`/sessions/${session.gameSessionId}`}
              >
                <div
                  className={`${styles.sessions_card} ${isCompleted ? styles.sessions_cardCompleted : ''}`}
                >
                  {/* 左ブロック: サムネ + 情報 */}
                  <div className={styles.sessions_leftBlock}>
                    {session.scenario?.scenarioImageUrl ? (
                      <Image
                        src={session.scenario.scenarioImageUrl}
                        alt={session.scenario.name ?? ''}
                        width={56}
                        height={56}
                        className={`${styles.sessions_thumbnail} ${isCompleted ? styles.sessions_thumbnailCompleted : ''}`}
                      />
                    ) : (
                      <div className={styles.sessions_thumbnail} />
                    )}

                    <div>
                      <div className={styles.sessions_topRow}>
                        {phase && (
                          <span className={phase.style}>{phase.label}</span>
                        )}
                        {session.scenario?.system && (
                          <span className={styles.sessions_systemLabel}>
                            {session.scenario.system.name}
                          </span>
                        )}
                      </div>
                      <h3
                        className={`${styles.sessions_name} ${isCompleted ? styles.sessions_nameCompleted : ''}`}
                      >
                        {session.sessionName}
                      </h3>
                    </div>
                  </div>

                  {/* 右ブロック: アバター + 日時 */}
                  <div className={styles.sessions_rightBlock}>
                    {visibleParticipants.length > 0 && (
                      <div className={styles.sessions_avatarGroup}>
                        {visibleParticipants.map((p) => (
                          <Image
                            key={p.userId}
                            src={p.user.image ?? '/default-avatar.png'}
                            alt={p.user.nickname}
                            width={32}
                            height={32}
                            className={styles.sessions_avatar}
                          />
                        ))}
                        {overflowCount > 0 && (
                          <span className={styles.sessions_avatarOverflow}>
                            +{overflowCount}
                          </span>
                        )}
                      </div>
                    )}

                    {dateStr && (
                      <div className={styles.sessions_dateBlock}>
                        <span className={styles.sessions_dateText}>
                          {dateStr}
                        </span>
                        {timeStr && !isCompleted && (
                          <span className={styles.sessions_timeText}>
                            {timeStr}
                          </span>
                        )}
                        {isCompleted && (
                          <span className={styles.sessions_timeText}>済</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};
