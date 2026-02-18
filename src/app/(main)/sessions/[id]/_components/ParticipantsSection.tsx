import { Users } from '@phosphor-icons/react/ssr';

import * as styles from '../styles';
import { ParticipantCard } from './ParticipantCard';

import type { ParticipantWithUser, UserRole } from '../../interface';

type ParticipantsSectionProps = {
  participants: ParticipantWithUser[];
  userRole: UserRole;
  currentUserId: string | null;
};

export const ParticipantsSection = ({
  participants,
  userRole: _userRole,
  currentUserId,
}: ParticipantsSectionProps) => {
  return (
    <section className={styles.card}>
      {/* ヘッダー */}
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <span className={styles.accentBar} />
          <Users size={18} />
          <h2>参加者</h2>
          <span className={styles.participants_count}>
            {participants.length}人
          </span>
        </div>
      </div>

      {/* 参加者リスト */}
      {participants.length > 0 ? (
        <ul className={styles.participants_list}>
          {participants.map((participant) => (
            <li key={participant.userId}>
              <ParticipantCard
                participant={participant}
                isCurrentUser={participant.userId === currentUserId}
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
