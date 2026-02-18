import { CheckCircle, Clock, User } from '@phosphor-icons/react/ssr';

import * as styles from '../styles';

import type { ParticipantWithUser } from '../../interface';

type ParticipantCardProps = {
  participant: ParticipantWithUser;
  isCurrentUser: boolean;
};

/**
 * 参加タイプに応じたロールバッジ情報を返す
 */
const getRoleBadgeInfo = (
  participantType: string,
): { className: string; label: string } => {
  switch (participantType) {
    case 'KEEPER':
      return { className: styles.participants_roleKeeper, label: 'GM' };
    case 'PLAYER':
      return { className: styles.participants_rolePlayer, label: 'PL' };
    case 'SPECTATOR':
      return { className: styles.participants_roleSpectator, label: '観' };
    default:
      return {
        className: styles.participants_roleSpectator,
        label: participantType,
      };
  }
};

/**
 * 参加タイプの日本語ラベルを返す
 */
const getRoleLabel = (participantType: string): string => {
  switch (participantType) {
    case 'KEEPER':
      return 'キーパー';
    case 'PLAYER':
      return 'プレイヤー';
    case 'SPECTATOR':
      return '観戦者';
    default:
      return participantType;
  }
};

/**
 * キャラクターシートのステータスバッジ
 */
const CharacterSheetStatus = ({
  characterSheetUrl,
  participantStatus,
  participantType,
}: {
  characterSheetUrl: string | null;
  participantStatus: string;
  participantType: string;
}) => {
  if (characterSheetUrl) {
    if (participantStatus === 'CONFIRMED') {
      return (
        <span className={styles.participants_csSubmittedBadge}>
          <CheckCircle size={12} weight="fill" />
          提出済
        </span>
      );
    }
    if (participantStatus === 'PENDING') {
      return (
        <span className={styles.participants_csReviewingBadge}>
          <CheckCircle size={12} />
          確認中
        </span>
      );
    }
  }

  // 観戦者以外はキャラシなし表示
  if (participantType !== 'SPECTATOR') {
    return (
      <span className={styles.participants_csNoneLabel}>
        <Clock size={12} />
        未提出
      </span>
    );
  }

  return null;
};

export const ParticipantCard = ({
  participant,
  isCurrentUser,
}: ParticipantCardProps) => {
  const roleBadgeInfo = getRoleBadgeInfo(participant.participantType);
  const roleLabel = getRoleLabel(participant.participantType);

  return (
    <div className={styles.participants_item}>
      {/* 左側: アバター + 名前 + 役割 */}
      <div className={styles.participants_left}>
        {/* アバター */}
        <div
          className={`${styles.participants_avatar} ${styles.participants_avatarInner}`}
        >
          <User size={20} />
        </div>

        {/* 名前 + 役割ラベル */}
        <div>
          <div className={styles.participants_nameRow}>
            <p className={styles.participants_name}>
              {participant.user.userName}
              {isCurrentUser && (
                <span className={styles.participants_currentUserLabel}>
                  （あなた）
                </span>
              )}
            </p>
            {/* 役割バッジ */}
            <span className={roleBadgeInfo.className}>
              {roleBadgeInfo.label}
            </span>
          </div>
          <p className={styles.participants_roleLabel}>{roleLabel}</p>
        </div>
      </div>

      {/* 右側: キャラシステータス */}
      <div>
        <CharacterSheetStatus
          characterSheetUrl={participant.characterSheetUrl}
          participantStatus={participant.participantStatus}
          participantType={participant.participantType}
        />
      </div>
    </div>
  );
};

export type { ParticipantCardProps };
