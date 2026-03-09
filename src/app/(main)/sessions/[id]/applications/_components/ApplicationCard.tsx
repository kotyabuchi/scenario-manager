'use client';

import { useState, useTransition } from 'react';
import { Check, Quotes } from '@phosphor-icons/react/ssr';

import { approveApplicationAction, rejectApplicationAction } from '../actions';
import * as styles from '../styles';

import { Avatar } from '@/components/elements/avatar';

import type { ApplicationWithUser } from '../adapter';

/**
 * 参加タイプに応じたバッジクラスとラベルのマップ
 */
const PARTICIPANT_TYPE_MAP: Record<
  string,
  { badgeClass: string; label: string }
> = {
  PLAYER: { badgeClass: styles.card_typePlayer, label: 'プレイヤー' },
  SPECTATOR: { badgeClass: styles.card_typeSpectator, label: '見学者' },
  KEEPER: { badgeClass: styles.card_typeKeeper, label: 'キーパー' },
};

type ApplicationCardProps = {
  application: ApplicationWithUser;
  sessionId: string;
  /** 楽観的更新後のステータス（undefined の場合は実際のステータスを使用） */
  optimisticStatus?: string | undefined;
  onStatusChange?: (
    userId: string,
    newStatus: 'CONFIRMED' | 'REJECTED',
  ) => void;
};

/**
 * 申請カードコンポーネント
 * PENDING: 承認/拒否ボタンを表示
 * CONFIRMED: 承認済みバッジを表示
 */
export const ApplicationCard = ({
  application,
  sessionId,
  optimisticStatus,
  onStatusChange,
}: ApplicationCardProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentStatus = optimisticStatus ?? application.participantStatus;

  const getTypeInfo = (type: string) =>
    PARTICIPANT_TYPE_MAP[type] ?? {
      badgeClass: styles.card_typePlayer,
      label: type,
    };

  /**
   * 申請日時をフォーマットする
   */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * 承認ボタンのクリックハンドラ
   */
  const handleApprove = () => {
    setError(null);
    onStatusChange?.(application.userId, 'CONFIRMED');
    startTransition(async () => {
      const result = await approveApplicationAction(
        sessionId,
        application.userId,
      );
      if (!result.success) {
        setError(result.error.message);
      }
    });
  };

  /**
   * 拒否ボタンのクリックハンドラ
   */
  const handleReject = () => {
    setError(null);
    onStatusChange?.(application.userId, 'REJECTED');
    startTransition(async () => {
      const result = await rejectApplicationAction(
        sessionId,
        application.userId,
      );
      if (!result.success) {
        setError(result.error.message);
      }
    });
  };

  const displayName = application.user.nickname ?? application.user.userName;

  return (
    <article className={styles.card_root}>
      {/* ユーザー情報とタイプバッジ */}
      <div className={styles.card_header}>
        <div className={styles.card_userRow}>
          <Avatar
            {...(application.user.image ? { src: application.user.image } : {})}
            alt={displayName}
            size="md"
          />
          <div className={styles.card_userInfo}>
            <span className={styles.card_userName}>{displayName}</span>
            {application.user.nickname && (
              <span className={styles.card_userNickname}>
                @{application.user.userName}
              </span>
            )}
          </div>
        </div>

        {/* 参加タイプバッジ */}
        <span className={getTypeInfo(application.participantType).badgeClass}>
          {getTypeInfo(application.participantType).label}
        </span>
      </div>

      {/* 申請日時 */}
      {application.appliedAt && (
        <p className={styles.card_appliedAt}>
          申請日時: {formatDate(application.appliedAt)}
        </p>
      )}

      {/* ユーザー統計 */}
      <hr className={styles.card_divider} />
      <div className={styles.card_statsRow}>
        <span className={styles.card_statItem} title="今後対応予定">
          セッション参加: <strong>-</strong>
        </span>
        <span className={styles.card_statItem} title="今後対応予定">
          GM経験: <strong>-</strong>
        </span>
      </div>

      {/* 申請メッセージ（引用ブロック風） */}
      {application.applicationMessage && (
        <div className={styles.card_quoteMessage}>
          <Quotes
            size={16}
            weight="fill"
            aria-hidden="true"
            className={styles.card_quoteIcon}
          />
          <p>{application.applicationMessage}</p>
        </div>
      )}

      {/* アクション */}
      {currentStatus === 'PENDING' ? (
        <div className={styles.card_actions}>
          <button
            type="button"
            className={styles.card_rejectButton}
            onClick={handleReject}
            disabled={isPending}
            aria-label={`${displayName}の申請を拒否する`}
          >
            拒否する
          </button>
          <button
            type="button"
            className={styles.card_approveButton}
            onClick={handleApprove}
            disabled={isPending}
            aria-label={`${displayName}の申請を承認する`}
          >
            <Check size={16} aria-hidden="true" />
            承認する
          </button>
        </div>
      ) : currentStatus === 'CONFIRMED' ? (
        <div className={styles.card_confirmedBadge}>
          <Check size={16} aria-hidden="true" />
          承認済み
        </div>
      ) : null}

      {/* エラーメッセージ */}
      {error && <p className={styles.card_errorMessage}>{error}</p>}
    </article>
  );
};
