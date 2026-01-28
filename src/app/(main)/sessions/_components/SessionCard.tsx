'use client';

import { Calendar, Check, Users, Video } from 'lucide-react';
import Link from 'next/link';
import { isNil } from 'ramda';

import { getSlotWarning } from './slotWarning';
import * as styles from './styles';

import { SessionPhases } from '@/db/enum';

import type { MySessionWithRole, PublicSession } from '../interface';

type PublicSessionCardProps = {
  session: PublicSession;
  variant: 'public';
};

type MySessionCardProps = {
  session: MySessionWithRole;
  variant: 'my';
  showMeta?: boolean;
};

type SessionCardProps = PublicSessionCardProps | MySessionCardProps;

// --- ヘルパー関数 ---

const formatDateTime = (date: string | null): string => {
  if (isNil(date)) return '日程調整中';
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[d.getDay()];
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} (${weekday}) ${hours}:${minutes}`;
};

const formatPlaytime = (min: number | null, max: number | null): string => {
  if (isNil(min) && isNil(max)) return '';
  if (isNil(min)) return `〜${Math.floor((max ?? 0) / 60)}時間`;
  if (isNil(max)) return `${Math.floor(min / 60)}時間〜`;
  const minHours = Math.floor(min / 60);
  const maxHours = Math.floor(max / 60);
  if (minHours === maxHours) return `約${minHours}時間`;
  return `約${minHours}-${maxHours}時間`;
};

const getPhaseLabel = (phase: string): string => {
  const phaseObj = Object.values(SessionPhases).find((p) => p.value === phase);
  return phaseObj?.label ?? phase;
};

const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'KEEPER':
      return 'GM';
    case 'PLAYER':
      return 'PL';
    case 'SPECTATOR':
      return '観戦';
    default:
      return role;
  }
};

// --- コンポーネント ---

export const SessionCard = (props: SessionCardProps) => {
  if (props.variant === 'public') {
    return <PublicSessionCard session={props.session} />;
  }
  return (
    <MySessionCard session={props.session} showMeta={props.showMeta ?? false} />
  );
};

const PublicSessionCard = ({ session }: { session: PublicSession }) => {
  const slotWarning = getSlotWarning({
    participantCount: session.participantCount,
    maxPlayer: session.maxPlayer,
  });

  return (
    <Link
      href={`/sessions/${session.gameSessionId}`}
      className={styles.publicCard}
    >
      <div className={styles.publicCard_thumbnail}>
        <span className={styles.publicCard_systemBadge}>
          {session.systemName}
        </span>
      </div>

      <div className={styles.publicCard_content}>
        <h3 className={styles.publicCard_title}>{session.scenarioName}</h3>

        <div className={styles.publicCard_meta}>
          <span className={styles.publicCard_metaItem}>
            <Calendar className={styles.publicCard_metaIcon} />
            {formatDateTime(session.scheduleDate)}
          </span>
          <span className={styles.publicCard_metaItem}>
            <Users className={styles.publicCard_metaIcon} />
            {session.participantCount}/{session.maxPlayer ?? '?'}人
          </span>
        </div>

        <div className={styles.publicCard_tags}>
          <span
            className={styles.publicCard_phaseTag({
              phase: session.sessionPhase as
                | 'RECRUITING'
                | 'PREPARATION'
                | 'IN_PROGRESS'
                | 'COMPLETED'
                | 'CANCELLED',
            })}
          >
            {getPhaseLabel(session.sessionPhase)}
          </span>
          {!isNil(slotWarning) ? (
            <span className={styles.publicCard_slotWarning}>
              {slotWarning.label}
            </span>
          ) : (
            (session.minPlaytime || session.maxPlaytime) && (
              <span className={styles.publicCard_tag}>
                {formatPlaytime(session.minPlaytime, session.maxPlaytime)}
              </span>
            )
          )}
        </div>
      </div>
    </Link>
  );
};

const MySessionCard = ({
  session,
  showMeta = false,
}: {
  session: MySessionWithRole;
  showMeta?: boolean;
}) => {
  const scheduleDate = session.schedule?.scheduleDate ?? null;
  const isHistory = showMeta;
  const cardType = isHistory ? 'history' : 'upcoming';

  // 日付パーツ
  const dateInfo = (() => {
    if (isNil(scheduleDate)) return null;
    const d = new Date(scheduleDate);
    const weekdays = [
      '日曜日',
      '月曜日',
      '火曜日',
      '水曜日',
      '木曜日',
      '金曜日',
      '土曜日',
    ];
    return {
      month: `${d.getMonth() + 1}月`,
      day: `${d.getDate()}`,
      weekday: weekdays[d.getDay()] ?? '',
    };
  })();

  const systemName = session.scenario?.system?.name ?? '';
  const displayTitle = session.sessionName || session.scenario?.name || '';

  // 時刻
  const timeStr = (() => {
    if (isNil(scheduleDate)) return '日程調整中';
    const d = new Date(scheduleDate);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}〜`;
  })();

  return (
    <Link
      href={`/sessions/${session.gameSessionId}`}
      className={styles.sessionCard_horizontal}
    >
      {/* 日付エリア */}
      <div className={styles.sessionCard_dateArea}>
        {dateInfo ? (
          <>
            <span className={styles.sessionCard_month({ type: cardType })}>
              {dateInfo.month}
            </span>
            <span className={styles.sessionCard_day({ type: cardType })}>
              {dateInfo.day}
            </span>
            <span className={styles.sessionCard_weekday({ type: cardType })}>
              {dateInfo.weekday}
            </span>
          </>
        ) : (
          <span className={styles.sessionCard_time}>日程未定</span>
        )}
      </div>

      {/* 情報エリア */}
      <div className={styles.sessionCard_infoArea}>
        <h3 className={styles.sessionCard_title}>{displayTitle}</h3>
        <div className={styles.sessionCard_metaRow}>
          {systemName && (
            <span className={styles.sessionCard_systemBadgeInline}>
              {systemName}
            </span>
          )}
          <span className={styles.sessionCard_time}>{timeStr}</span>
          <span className={styles.sessionCard_players}>
            参加者: {session.participants.length}人
          </span>
        </div>

        {showMeta && (session.isReviewed || session.hasVideo) && (
          <div className={styles.sessionCard_badges}>
            {session.isReviewed && (
              <span className={styles.sessionCard_badge}>
                <Check size={12} />
                レビュー済み
              </span>
            )}
            {session.hasVideo && (
              <span className={styles.sessionCard_badge}>
                <Video size={12} />
                動画あり
              </span>
            )}
          </div>
        )}
      </div>

      {/* 役割バッジ */}
      <span className={styles.sessionCard_roleBadge({ role: session.myRole })}>
        {getRoleLabel(session.myRole)}
      </span>
    </Link>
  );
};
