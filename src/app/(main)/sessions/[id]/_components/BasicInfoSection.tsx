import {
  Calendar,
  CheckCircle,
  Clock,
  Link as LinkIcon,
  Megaphone,
  Prohibit,
  Spinner,
  User,
  Wrench,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import * as styles from '../styles';

import type { SessionDetail } from '../../interface';

type BasicInfoSectionProps = {
  session: SessionDetail;
};

/**
 * 日付文字列を日本語フォーマットに変換する
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * フェーズに応じたバッジクラス名とラベルを返す
 */
const getPhaseInfo = (
  phase: string,
): { className: string; label: string; icon: React.ReactNode } => {
  switch (phase) {
    case 'RECRUITING':
      return {
        className: styles.info_phaseRecruiting,
        label: '募集中',
        icon: <Megaphone size={14} weight="fill" />,
      };
    case 'PREPARATION':
      return {
        className: styles.info_phasePreparation,
        label: '準備中',
        icon: <Wrench size={14} weight="fill" />,
      };
    case 'IN_PROGRESS':
      return {
        className: styles.info_phaseInProgress,
        label: '進行中',
        icon: <Spinner size={14} weight="bold" />,
      };
    case 'COMPLETED':
      return {
        className: styles.info_phaseCompleted,
        label: '完了',
        icon: <CheckCircle size={14} weight="fill" />,
      };
    case 'CANCELLED':
      return {
        className: styles.info_phaseCancelled,
        label: 'キャンセル',
        icon: <Prohibit size={14} weight="fill" />,
      };
    default:
      return {
        className: styles.info_phaseCompleted,
        label: phase,
        icon: null,
      };
  }
};

export const BasicInfoSection = ({ session }: BasicInfoSectionProps) => {
  const phaseInfo = getPhaseInfo(session.sessionPhase);

  return (
    <section className={styles.card}>
      {/* システムチップ + フェーズバッジ */}
      <div className={styles.info_tags}>
        {session.scenario?.system && (
          <span className={styles.info_systemChip}>
            {session.scenario.system.name}
          </span>
        )}
        <span className={phaseInfo.className}>
          {phaseInfo.icon} {phaseInfo.label}
        </span>
      </div>

      {/* シナリオ名 */}
      {session.scenario && (
        <div>
          <p className={styles.info_scenarioLabel}>シナリオ</p>
          <Link
            href={`/scenarios/${session.scenario.scenarioId}`}
            className={styles.info_scenarioName}
          >
            {session.scenario.name}
          </Link>
        </div>
      )}

      {/* 詳細情報 */}
      <div className={styles.info_details}>
        {/* 日時 */}
        {session.schedule?.scheduleDate && (
          <div className={styles.info_detailItem}>
            <Calendar size={16} />
            <span>{formatDate(session.schedule.scheduleDate)}</span>
          </div>
        )}

        {/* ツール */}
        {session.links.length > 0 && (
          <div className={styles.info_detailItem}>
            <LinkIcon size={16} />
            <span className={styles.info_detailLabel}>ツール</span>
            <span>{session.links.length}件</span>
          </div>
        )}

        {/* セッション時間の目安（シナリオから取得） */}
        {session.scenario &&
          (session.scenario.minPlaytime ?? session.scenario.maxPlaytime) !==
            null && (
            <div className={styles.info_detailItem}>
              <Clock size={16} />
              <span className={styles.info_detailLabel}>プレイ時間</span>
              <span>
                {session.scenario.minPlaytime !== null &&
                session.scenario.maxPlaytime !== null
                  ? `${session.scenario.minPlaytime}〜${session.scenario.maxPlaytime}分`
                  : session.scenario.minPlaytime !== null
                    ? `${session.scenario.minPlaytime}分〜`
                    : `〜${session.scenario.maxPlaytime}分`}
              </span>
            </div>
          )}
      </div>

      {/* GM情報 */}
      {session.keeper && (
        <div className={styles.info_gm}>
          <div
            className={`${styles.info_gmAvatar} ${styles.info_gmAvatarInner}`}
          >
            <User size={24} />
          </div>
          <div>
            <p className={styles.info_gmLabel}>ゲームマスター</p>
            <p className={styles.info_gmName}>{session.keeper.userName}</p>
          </div>
        </div>
      )}
    </section>
  );
};

export type { BasicInfoSectionProps };
