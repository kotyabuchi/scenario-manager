import { Info } from '@phosphor-icons/react/ssr';

import * as styles from '../styles';
import { BasicInfoSection } from './BasicInfoSection';
import { GMNotesSection } from './GMNotesSection';
import { ParticipantsSection } from './ParticipantsSection';
import { SessionActions } from './SessionActions';
import { SessionPhaseStepper } from './SessionPhaseStepper';
import { TimelineSection } from './TimelineSection';
import { ToolsSection } from './ToolsSection';

import { PageHeader } from '@/components/blocks/PageHeader';

import type { Database } from '@/db/types';
import type {
  ScenarioSystem,
  SessionDetail,
  TimelineEvent,
  UserRole,
} from '../../interface';

type SessionDetailContentProps = {
  session: SessionDetail;
  timeline: TimelineEvent[];
  userRole: UserRole;
  currentUserId: string | null;
  /** 現在のユーザーの参加ステータス */
  participantStatus?:
    | Database['public']['Enums']['participant_status']
    | undefined;
  hasAvailabilitySubmission?: boolean;
  /** システム一覧（シナリオ検索モーダル用） */
  systems?: ScenarioSystem[];
};

export const SessionDetailContent = ({
  session,
  timeline,
  userRole,
  currentUserId,
  participantStatus,
  hasAvailabilitySubmission = false,
  systems = [],
}: SessionDetailContentProps) => {
  return (
    <div className={styles.pageContainer}>
      <PageHeader
        backHref="/sessions"
        title={session.sessionName}
        actions={
          <div className={styles.headerActions}>
            <SessionActions
              session={session}
              userRole={userRole}
              currentUserId={currentUserId}
              participantStatus={participantStatus}
              hasAvailabilitySubmission={hasAvailabilitySubmission}
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
            <BasicInfoSection
              session={session}
              showEditButton={userRole === 'manager'}
              systems={systems}
            />
            <ParticipantsSection
              participants={session.participants}
              userRole={userRole}
              currentUserId={currentUserId}
              maxPlayer={session.maxParticipantCount ?? null}
              creatorUserId={session.creator.userId}
              sessionId={session.gameSessionId}
              sessionPhase={session.sessionPhase}
            />
            {userRole === 'manager' && (
              <GMNotesSection
                memo={session.sessionMemo}
                sessionId={session.gameSessionId}
                showEditButton
              />
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
                    参加者管理や日程調整は画面上部のアクション、内容の編集は各セクションの操作ボタンから行えます。
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
