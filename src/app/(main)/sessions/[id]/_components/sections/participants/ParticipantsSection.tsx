import { UsersThreeIcon } from '@phosphor-icons/react/ssr';

import * as styles from '../../../styles';
import { ParticipantCard } from './ParticipantCard';

import { LinkButton } from '@/components/elements/link-button';
import { SessionPhases } from '@/db/enum';

import type { ParticipantWithUser, UserRole } from '../../../../interface';

type ParticipantsSectionProps = {
  participants: ParticipantWithUser[];
  userRole: UserRole;
  currentUserId: string | null;
  maxPlayer: number | null;
  creatorUserId: string;
  sessionId: string;
  sessionPhase: string;
};

export const ParticipantsSection = ({
  participants,
  userRole,
  currentUserId,
  maxPlayer,
  creatorUserId,
  sessionId,
  sessionPhase,
}: ParticipantsSectionProps) => {
  const confirmedParticipants = participants.filter(
    (participant) => participant.participantStatus === 'CONFIRMED',
  );
  const confirmedSpectatorCount = confirmedParticipants.filter(
    (participant) => participant.participantType === 'SPECTATOR',
  ).length;
  const confirmedNonSpectatorCount =
    confirmedParticipants.length - confirmedSpectatorCount;
  const countLabel =
    maxPlayer !== null
      ? `${confirmedNonSpectatorCount} / ${maxPlayer}`
      : `${confirmedNonSpectatorCount}人`;
  const participantOrder = { KEEPER: 0, PLAYER: 1, SPECTATOR: 2 } as const;
  const sortedParticipants = [...confirmedParticipants].sort((a, b) => {
    const aOrder =
      participantOrder[a.participantType as keyof typeof participantOrder] ??
      99;
    const bOrder =
      participantOrder[b.participantType as keyof typeof participantOrder] ??
      99;
    return aOrder - bOrder;
  });

  return (
    <section className={styles.card}>
      {/* ヘッダー */}
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <UsersThreeIcon
            size={20}
            weight="fill"
            className={styles.sectionHeaderIconPrimary}
          />
          <h2>参加者</h2>
        </div>
        <div className={styles.sessionActions_secondaryGroup}>
          {userRole === 'manager' &&
            (sessionPhase === SessionPhases.RECRUITING.value ||
              sessionPhase === SessionPhases.PREPARATION.value) && (
              <LinkButton
                href={`/sessions/${sessionId}/applications`}
                variant="outline"
                status="primary"
                size="sm"
              >
                申請管理
              </LinkButton>
            )}
          <span className={styles.participants_count}>{countLabel}</span>
        </div>
      </div>

      {/* 参加者リスト */}
      {sortedParticipants.length > 0 ? (
        <ul className={styles.participants_list}>
          {sortedParticipants.map((participant) => (
            <li key={participant.userId}>
              <ParticipantCard
                sessionId={sessionId}
                participant={participant}
                isCurrentUser={participant.userId === currentUserId}
                isSessionCreator={participant.userId === creatorUserId}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.participants_empty}>まだ参加者はいません</p>
      )}
    </section>
  );
};

export type { ParticipantsSectionProps };
