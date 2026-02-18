import {
  CaretLeft,
  DotsThreeVertical,
  PencilSimple,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import * as styles from '../styles';
import { BasicInfoSection } from './BasicInfoSection';
import { GMNotesSection } from './GMNotesSection';
import { ParticipantsSection } from './ParticipantsSection';
import { SessionActions } from './SessionActions';
import { TimelineSection } from './TimelineSection';
import { ToolsSection } from './ToolsSection';

import type { Database } from '@/db/types';
import type { SessionDetail, TimelineEvent, UserRole } from '../../interface';

type SessionDetailContentProps = {
  session: SessionDetail;
  timeline: TimelineEvent[];
  userRole: UserRole;
  currentUserId: string | null;
  /** 現在のユーザーの参加ステータス */
  participantStatus?:
    | Database['public']['Enums']['participant_status']
    | undefined;
};

export const SessionDetailContent = ({
  session,
  timeline,
  userRole,
  currentUserId,
  participantStatus,
}: SessionDetailContentProps) => {
  return (
    <div className={styles.pageContainer}>
      {/* 戻るリンク */}
      <Link href="/sessions" className={styles.backLink}>
        <CaretLeft size={16} />
        セッション一覧
      </Link>

      {/* ページヘッダー */}
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{session.sessionName}</h1>
        <div className={styles.headerActions}>
          {userRole === 'manager' && (
            <button type="button" className={styles.editButton} disabled>
              <PencilSimple size={16} />
              編集
            </button>
          )}
          {userRole === 'manager' && (
            <button
              type="button"
              className={styles.moreButton}
              aria-label="その他のメニュー"
              disabled
            >
              <DotsThreeVertical size={20} />
            </button>
          )}
        </div>
      </header>

      {/* アクションボタン */}
      <SessionActions
        session={session}
        userRole={userRole}
        currentUserId={currentUserId}
        participantStatus={participantStatus}
      />

      {/* 2カラムグリッド */}
      <div className={styles.pageGrid}>
        {/* メインカラム */}
        <main className={styles.mainColumn}>
          <BasicInfoSection session={session} />
          <ParticipantsSection
            participants={session.participants}
            userRole={userRole}
            currentUserId={currentUserId}
          />
          {userRole === 'manager' && (
            <GMNotesSection memo={session.sessionMemo} />
          )}
        </main>

        {/* サイドバーカラム */}
        <aside className={styles.sidebarColumn}>
          <ToolsSection
            links={session.links}
            userRole={userRole}
            sessionId={session.gameSessionId}
          />
          <TimelineSection events={timeline} />
        </aside>
      </div>
    </div>
  );
};

export type { SessionDetailContentProps };
