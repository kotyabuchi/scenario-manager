import { CheckCircleIcon, ClockIcon, User } from '@phosphor-icons/react/ssr';
import Image from 'next/image';

import * as styles from '../../../styles';
import { CharacterSheetEdit } from './CharacterSheetEdit';

import type { ReactNode } from 'react';
import type { ParticipantWithUser } from '../../../../interface';

type ParticipantCardProps = {
  sessionId: string;
  participant: ParticipantWithUser;
  isCurrentUser: boolean;
  isSessionCreator: boolean;
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
  participantType,
  isSessionCreator,
}: {
  characterSheetUrl: string | null;
  participantType: string;
  isSessionCreator: boolean;
}) => {
  const labels: ReactNode[] = [];

  if (isSessionCreator) {
    labels.push(
      <span key="creator" className={styles.participants_statusText}>
        主催者
      </span>,
    );
  }

  if (participantType === 'KEEPER') {
    return labels.length > 0 ? (
      <div className={styles.participants_statusGroup}>{labels}</div>
    ) : null;
  }

  if (characterSheetUrl) {
    labels.push(
      <span
        key="cs-submitted"
        className={`${styles.participants_characterSheet} ${styles.participants_csSubmitted}`}
      >
        <CheckCircleIcon size={14} weight="fill" />
        CS提出済
      </span>,
    );
    return <div className={styles.participants_statusGroup}>{labels}</div>;
  }

  if (participantType === 'SPECTATOR') {
    labels.push(
      <span key="no-status" className={styles.participants_statusText}>
        ステータスなし
      </span>,
    );
    return <div className={styles.participants_statusGroup}>{labels}</div>;
  }

  labels.push(
    <span
      key="cs-missing"
      className={`${styles.participants_characterSheet} ${styles.participants_csNone}`}
    >
      <ClockIcon weight="fill" size={14} />
      CS未提出
    </span>,
  );

  return <div className={styles.participants_statusGroup}>{labels}</div>;
};

export const ParticipantCard = ({
  sessionId,
  participant,
  isCurrentUser,
  isSessionCreator,
}: ParticipantCardProps) => {
  const displayName = participant.user.nickname ?? participant.user.userName;
  const handleName = participant.user.userName;
  const roleBadgeInfo = (() => {
    switch (participant.participantType) {
      case 'KEEPER':
        return { role: 'KEEPER' as const, label: 'GM' };
      case 'PLAYER':
        return { role: 'PLAYER' as const, label: 'PL' };
      case 'SPECTATOR':
        return { role: 'SPECTATOR' as const, label: '観' };
      default:
        return {
          role: 'SPECTATOR' as const,
          label: participant.participantType,
        };
    }
  })();
  const roleLabel = getRoleLabel(participant.participantType);
  const isMuted =
    participant.participantType === 'SPECTATOR' &&
    !participant.characterSheetUrl &&
    participant.participantStatus !== 'CONFIRMED';

  return (
    <div className={styles.participants_item({ muted: isMuted })}>
      {/* 左側: アバター + 名前 + 役割 */}
      <div className={styles.participants_left}>
        {/* アバター */}
        <div className={styles.participants_avatarWrap}>
          <div className={styles.participants_avatar}>
            {participant.user.image ? (
              <Image
                src={participant.user.image}
                alt={`${displayName}のアバター`}
                width={40}
                height={40}
                sizes="40px"
                className={styles.participants_avatarImage}
              />
            ) : (
              <div className={styles.participants_avatarInner}>
                <User size={20} />
              </div>
            )}
          </div>
          <span
            className={styles.participants_roleBadge({
              role: roleBadgeInfo.role,
              overlay: true,
            })}
          >
            {roleBadgeInfo.label}
          </span>
        </div>

        {/* 名前 + 役割ラベル */}
        <div>
          <div className={styles.participants_nameRow}>
            <p className={styles.participants_name}>
              {displayName}
              {isCurrentUser && (
                <span className={styles.participants_currentUserLabel}>
                  （あなた）
                </span>
              )}
            </p>
          </div>
          <p className={styles.participants_roleLabel}>
            @{handleName} ・ {roleLabel}
          </p>
        </div>
      </div>

      {/* 右側: キャラシステータス */}
      <div>
        {isCurrentUser && participant.participantType !== 'KEEPER' ? (
          <CharacterSheetEdit
            sessionId={sessionId}
            characterSheetUrl={participant.characterSheetUrl}
            participantType={participant.participantType}
            isSessionCreator={isSessionCreator}
          />
        ) : (
          <CharacterSheetStatus
            characterSheetUrl={participant.characterSheetUrl}
            participantType={participant.participantType}
            isSessionCreator={isSessionCreator}
          />
        )}
      </div>
    </div>
  );
};

export type { ParticipantCardProps };
