import { Dices, Users } from 'lucide-react';
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
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).format(new Date(date));
};

/**
 * セッションカード
 * TODO: セッション詳細ページ実装後にLink化する
 */
const SessionCard = ({ session }: { session: SessionWithKeeper }) => {
  // セッション名はKMの卓名またはデフォルト
  const sessionName = !isNil(session.keeper)
    ? `${session.keeper.nickname}の卓`
    : 'セッション';

  return (
    <div className={styles.sessionCard}>
      <div className={styles.sessionCard_date}>
        {formatDate(session.scheduleDate)}
      </div>
      <div className={styles.sessionCard_name}>{sessionName}</div>
      <div className={styles.sessionCard_meta}>
        <Users size={14} />
        <span>{session.participantCount}人参加</span>
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
      <h2 className={styles.section_title}>関連セッション</h2>

      {sessions.length === 0 ? (
        <div className={styles.section_empty}>
          <p className={styles.section_emptyText}>
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
