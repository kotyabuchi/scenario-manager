import { Calendar, ChevronRight, Users } from 'lucide-react';
import Link from 'next/link';

import * as styles from '../styles';

import type { UpcomingSessionsProps } from '../interface';

export const UpcomingSessions = ({ sessions }: UpcomingSessionsProps) => {
  if (sessions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Calendar className={styles.emptyStateIcon} />
        <p className={styles.emptyStateText}>
          参加予定のセッションはまだありません
          <br />
          公開卓を探してみませんか？
        </p>
        <Link href="/sessions?tab=public">
          <ChevronRight size={16} />
          公開卓を探す
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.sessionsList}>
      {sessions.map((session) => (
        <Link
          key={session.gameSessionId}
          href={`/sessions/${session.gameSessionId}`}
        >
          <div className={styles.sessionCard}>
            <div className={styles.sessionHeader}>
              <h3 className={styles.sessionTitle}>{session.sessionName}</h3>
              <span
                className={styles.sessionPhase}
                style={{
                  background:
                    session.sessionPhase === 'RECRUITING'
                      ? 'var(--colors-chip-default)'
                      : session.sessionPhase === 'PREPARATION'
                        ? 'var(--colors-primary-subtle)'
                        : 'var(--colors-success-subtle)',
                  color:
                    session.sessionPhase === 'RECRUITING'
                      ? 'var(--colors-text-secondary)'
                      : session.sessionPhase === 'PREPARATION'
                        ? 'var(--colors-primary-foreground-dark)'
                        : 'var(--colors-success-foreground-dark)',
                }}
              >
                {session.sessionPhase === 'RECRUITING'
                  ? '募集中'
                  : session.sessionPhase === 'PREPARATION'
                    ? '準備中'
                    : '進行中'}
              </span>
            </div>
            <div className={styles.sessionMeta}>
              {session.scenario && (
                <span className={styles.sessionMetaItem}>
                  {session.scenario.system.name}
                </span>
              )}
              <span className={styles.sessionMetaItem}>
                <Users size={14} />
                {session.participants.length}人
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
