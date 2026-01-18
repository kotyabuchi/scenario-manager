import { Dices } from 'lucide-react';
import Link from 'next/link';
import { isNil } from 'ramda';

import * as styles from './styles';

import type { SessionWithKeeper } from '../interface';

type SessionSectionProps = {
  scenarioId: string;
  sessions: SessionWithKeeper[];
};

/**
 * 日付をフォーマットする
 */
const formatDate = (date: Date | null): string => {
  if (isNil(date)) return '日程未定';
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

/**
 * セッションカード
 * TODO: セッション詳細ページ実装後にLink化する
 */
const SessionCard = ({ session }: { session: SessionWithKeeper }) => {
  return (
    <div className={styles.sessionCard}>
      <div className={styles.sessionCard_info}>
        <div className={styles.sessionCard_date}>
          {formatDate(session.scheduleDate)}
        </div>
        {!isNil(session.keeper) && (
          <div className={styles.sessionCard_keeper}>
            GM: {session.keeper.nickname}
          </div>
        )}
        <div className={styles.sessionCard_participants}>
          参加者: {session.participantCount}人
        </div>
      </div>
    </div>
  );
};

export const SessionSection = ({
  scenarioId,
  sessions,
}: SessionSectionProps) => {
  return (
    <section className={styles.section}>
      <div className={styles.section_header}>
        <h2 className={styles.section_title}>
          関連セッション
          <span className={styles.section_count}>({sessions.length}件)</span>
        </h2>
      </div>
      {sessions.length === 0 ? (
        <div className={styles.section_empty}>
          <p>
            <Dices size={16} />
            このシナリオで初めてのセッションを開催してみませんか？
          </p>
          <Link
            href={`/sessions/new?scenarioId=${scenarioId}` as '/sessions/new'}
            className={styles.section_ctaButton}
          >
            セッションを作成する
          </Link>
        </div>
      ) : (
        <div className={styles.sessionList}>
          {sessions.map((session) => (
            <SessionCard key={session.gameSessionId} session={session} />
          ))}
        </div>
      )}
    </section>
  );
};
