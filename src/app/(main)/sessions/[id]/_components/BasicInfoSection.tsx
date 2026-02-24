import { CalendarDotsIcon, Clock, User } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
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
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const BasicInfoSection = ({ session }: BasicInfoSectionProps) => {
  const gmUser = session.keeper ?? session.creator;
  const gmParticipant = session.participants.find(
    (p) => p.userId === gmUser?.userId,
  );
  const gmDisplayName = gmParticipant?.user.nickname ?? gmUser?.userName;
  const gmHandleName = gmParticipant?.user.userName ?? gmUser?.userName;

  return (
    <section className={styles.card}>
      <div className={styles.info_cardDecor} />
      <div className={styles.info_cardInner}>
        {/* シナリオ名 */}
        <div>
          <p className={styles.info_scenarioLabel}>シナリオ</p>
          {session.scenario ? (
            <Link
              href={`/scenarios/${session.scenario.scenarioId}`}
              className={styles.info_scenarioName}
            >
              {session.scenario.name}
            </Link>
          ) : (
            <p className={styles.info_valueText}>シナリオ未設定</p>
          )}
          {session.scenario?.system && (
            <p className={styles.info_scenarioSystemText}>
              {session.scenario.system.name}
            </p>
          )}
        </div>

        {/* 詳細情報 */}
        <hr className={styles.subtleHr} />
        <div className={styles.info_details}>
          <div className={styles.info_detailItem}>
            <span className={styles.info_detailLabel}>
              <CalendarDotsIcon size={16} />
              日時
            </span>
            <div className={styles.info_valueText}>
              {session.schedule?.scheduleDate
                ? `${formatDate(session.schedule.scheduleDate)}〜`
                : '日程未確定'}
            </div>
          </div>

          {session.scenario &&
            (session.scenario.minPlaytime ?? session.scenario.maxPlaytime) !==
              null && (
              <div className={styles.info_detailItem}>
                <span className={styles.info_detailLabel}>
                  <Clock size={16} />
                  プレイ時間目安
                </span>
                <span className={styles.info_valueText}>
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

        {/* GM/作成者情報 */}
        {gmUser && (
          <>
            <hr className={styles.subtleHr} />
            <div className={styles.info_gmBlock}>
              <p className={styles.info_gmLabel}>ゲームマスター（GM）</p>
              <div className={styles.info_gm}>
                <div className={styles.info_gmAvatar}>
                  {gmParticipant?.user.image ? (
                    <Image
                      src={gmParticipant.user.image}
                      alt={`${gmDisplayName ?? 'GM'}のアバター`}
                      width={40}
                      height={40}
                      sizes="40px"
                      className={styles.participants_avatarImage}
                    />
                  ) : (
                    <div className={styles.info_gmAvatarInner}>
                      <User size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <p className={styles.info_gmName}>{gmDisplayName}</p>
                  {gmHandleName && (
                    <p className={styles.info_gmSubtext}>@{gmHandleName}</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export type { BasicInfoSectionProps };
