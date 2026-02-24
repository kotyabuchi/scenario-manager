import { UsersThreeIcon } from '@phosphor-icons/react/ssr';

import * as styles from '../styles';
import { ParticipantCard } from './ParticipantCard';

import type { ParticipantWithUser, UserRole } from '../../interface';

type ParticipantsSectionProps = {
  participants: ParticipantWithUser[];
  userRole: UserRole;
  currentUserId: string | null;
  maxPlayer: number | null;
  creatorUserId: string;
};

export const ParticipantsSection = ({
  participants,
  userRole: _userRole,
  currentUserId,
  maxPlayer,
  creatorUserId,
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
        <span className={styles.participants_count}>{countLabel}</span>
      </div>

      {/* 参加者リスト */}
      {sortedParticipants.length > 0 ? (
        <ul className={styles.participants_list}>
          {sortedParticipants.map((participant) => (
            <li key={participant.userId}>
              <ParticipantCard
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
