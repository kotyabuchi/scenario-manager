import { Fragment } from 'react';
import { DiceFive } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { isNil } from 'ramda';

import * as styles from './styles';

import { useAuthPrompt } from '@/components/blocks/AuthPrompt';
import { Badge, type BadgeVariant } from '@/components/elements/badge';
import { SessionPhases } from '@/db/enum';

import type { SessionWithKeeper } from '../interface';

type SessionSectionProps = {
  scenarioId: string;
  sessions: SessionWithKeeper[];
  isLoggedIn?: boolean;
};

// セッションフェーズ → バッジ色（募集中=ピンク / 進行系=緑 / 完了=グレー / 中止=赤）
const phaseBadgeVariant: Record<
  SessionWithKeeper['sessionPhase'],
  BadgeVariant
> = {
  RECRUITING: 'recruiting',
  PREPARATION: 'success',
  IN_PROGRESS: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'error',
};

/**
 * 日付をフォーマットする
 */
const formatDate = (date: string | null): string => {
  if (isNil(date)) return '日程未定';
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).format(new Date(date));
};

/**
 * セッション行（バッジ＋卓名＋メタ行。卓名がセッション詳細、GM名がユーザーページへのリンク）
 */
const SessionRow = ({ session }: { session: SessionWithKeeper }) => {
  return (
    <div className={styles.sessionRow}>
      <div className={styles.sessionRow_top}>
        <Badge variant={phaseBadgeVariant[session.sessionPhase]}>
          {SessionPhases[session.sessionPhase].label}
        </Badge>
        <Link
          href={`/sessions/${session.gameSessionId}`}
          className={styles.sessionRow_name}
        >
          {session.sessionName}
        </Link>
      </div>
      <div className={styles.sessionRow_meta}>
        <span className={styles.sessionRow_metaItem}>
          GM：
          {!isNil(session.keeper) ? (
            <Link
              href={`/users/${session.keeper.userId}`}
              className={styles.userLink}
            >
              {session.keeper.nickname}
            </Link>
          ) : (
            '未定'
          )}
        </span>
        <span className={styles.sessionRow_metaItem}>
          参加人数：{session.participantCount}人
        </span>
        <span className={styles.sessionRow_metaItem}>
          プレイ予定：{formatDate(session.scheduleDate)}
        </span>
      </div>
    </div>
  );
};

export const SessionSection = ({
  scenarioId,
  sessions,
  isLoggedIn = false,
}: SessionSectionProps) => {
  const openAuthPrompt = useAuthPrompt();

  return (
    <section className={styles.section}>
      <h2 className={styles.section_title}>
        関連セッション
        <span className={styles.section_count}>（{sessions.length}件）</span>
      </h2>

      {sessions.length === 0 ? (
        <div className={styles.section_empty}>
          <p className={styles.section_emptyText}>
            <DiceFive size={16} />
            このシナリオで初めてのセッションを開催してみませんか？
          </p>
          <Link
            href={`/sessions/new?scenarioId=${scenarioId}` as '/sessions/new'}
            className={styles.section_ctaButton}
            onClick={(event) => {
              if (isLoggedIn) return;
              event.preventDefault();
              openAuthPrompt({
                message: 'セッションを作成するにはログインが必要です。',
                returnTo: `/sessions/new?scenarioId=${scenarioId}`,
              });
            }}
          >
            セッションを作成する
          </Link>
        </div>
      ) : (
        <div className={styles.sessionList}>
          {sessions.map((session, index) => (
            <Fragment key={session.gameSessionId}>
              {index > 0 && <hr className={styles.listDivider} />}
              <SessionRow session={session} />
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
};
