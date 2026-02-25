import { Info, PencilSimple } from '@phosphor-icons/react/ssr';

import * as styles from '../styles';
import { SessionActions } from './SessionActions';
import { SessionPhaseStepper } from './SessionPhaseStepper';
import { BasicInfoSection } from './sections/basic-info/BasicInfoSection';
import { GMNotesSection } from './sections/gm-notes/GMNotesSection';
import { ParticipantsSection } from './sections/participants/ParticipantsSection';
import { TimelineSection } from './sections/timeline/TimelineSection';
import { ToolsSection } from './sections/tools/ToolsSection';

import { PageHeader } from '@/components/blocks/PageHeader';

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
      <PageHeader
        backHref="/sessions"
        title={session.sessionName}
        actions={
          <div className={styles.headerActions}>
            {userRole === 'manager' && (
              <button type="button" className={styles.editButton} disabled>
                <PencilSimple size={16} />
                編集
              </button>
            )}
            <SessionActions
              session={session}
              userRole={userRole}
              currentUserId={currentUserId}
              participantStatus={participantStatus}
            />
          </div>
        }
      />

      <div className={styles.mainContent}>
        <SessionPhaseStepper phase={session.sessionPhase} />

        {/* 2カラムグリッド */}
        <div className={styles.pageGrid}>
          {/* メインカラム */}
          <main className={styles.mainColumn}>
            <BasicInfoSection session={session} />
            <ParticipantsSection
              participants={session.participants}
              userRole={userRole}
              currentUserId={currentUserId}
              maxPlayer={session.maxParticipantCount ?? null}
              creatorUserId={session.creator.userId}
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
            <div className={styles.helpInfo}>
              <div className={styles.helpInfo_row}>
                <div className={styles.helpInfo_iconBox}>
                  <Info size={22} weight="fill" />
                </div>
                <div className={styles.helpInfo_content}>
                  <p className={styles.helpInfo_title}>お困りですか？</p>
                  <p className={styles.helpInfo_message}>
                    参加者の変更やスケジュールの再調整は「編集」または関連アクションから行えます。
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export type { SessionDetailContentProps };
