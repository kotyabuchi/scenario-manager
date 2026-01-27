'use client';

import { Calendar, Check, Users, Video } from 'lucide-react';
import Link from 'next/link';
import { isNil } from 'ramda';

import { getSlotWarning } from './slotWarning';

import { SessionPhases } from '@/db/enum';
import { css } from '@/styled-system/css';

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

const formatDateTime = (date: Date | null): string => {
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

const getPhaseColor = (phase: string): { bg: string; color: string } => {
  switch (phase) {
    case 'RECRUITING':
      return { bg: '#DCFCE7', color: '#16A34A' };
    case 'PREPARATION':
      return { bg: '#FEF3C7', color: '#D97706' };
    case 'IN_PROGRESS':
      return { bg: '#DBEAFE', color: '#2563EB' };
    case 'COMPLETED':
      return { bg: '#F3F4F6', color: '#6B7280' };
    case 'CANCELLED':
      return { bg: '#FEE2E2', color: '#DC2626' };
    default:
      return { bg: '#F3F4F6', color: '#6B7280' };
  }
};

const getRoleBadge = (
  role: string,
): { label: string; bg: string; color: string } => {
  switch (role) {
    case 'KEEPER':
      return { label: 'GM', bg: '#FEF3C7', color: '#D97706' };
    case 'PLAYER':
      return { label: 'PL', bg: '#EEF2FF', color: '#4F46E5' };
    case 'SPECTATOR':
      return { label: '観戦', bg: '#F3F4F6', color: '#6B7280' };
    default:
      return { label: role, bg: '#F3F4F6', color: '#6B7280' };
  }
};

// --- スタイル ---

// 公開卓カード
const publicCard = css({
  display: 'flex',
  flexDirection: 'column',
  bg: 'white',
  borderRadius: '12px',
  overflow: 'hidden',
  shadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textDecoration: 'none',
  _hover: {
    shadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)',
  },
});

const publicCard_thumbnail = css({
  position: 'relative',
  h: '100px',
  bg: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
});

const publicCard_systemBadge = css({
  position: 'absolute',
  top: 0,
  left: 0,
  px: '12px',
  py: '6px',
  borderRadius: '0 0 8px 0',
  fontSize: '11px',
  fontWeight: '600',
  color: 'white',
  bg: '#10B981',
});

const publicCard_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  p: '16px',
});

const publicCard_title = css({
  fontSize: '16px',
  fontWeight: '600',
  color: '#1F2937',
  lineClamp: 2,
});

const publicCard_meta = css({
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
});

const publicCard_metaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  color: '#6B7280',
});

const publicCard_metaIcon = css({
  w: '14px',
  h: '14px',
  flexShrink: 0,
});

const publicCard_tags = css({
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
});

const publicCard_tag = css({
  display: 'inline-flex',
  alignItems: 'center',
  h: '24px',
  px: '8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '500',
});

// 参加予定・履歴カード（横並び）
const sessionCard_horizontal = css({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  p: '20px',
  bg: 'white',
  borderRadius: '12px',
  shadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textDecoration: 'none',
  w: '100%',
  _hover: {
    shadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-1px)',
  },
});

const sessionCard_dateArea = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  w: '80px',
  flexShrink: 0,
});

const sessionCard_dateMonth = css({
  fontSize: '13px',
  fontWeight: 'normal',
});

const sessionCard_dateDay = css({
  fontSize: '32px',
  fontWeight: '700',
});

const sessionCard_dateDow = css({
  fontSize: '12px',
  fontWeight: 'normal',
});

const sessionCard_infoArea = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  flex: 1,
  minW: 0,
});

const sessionCard_infoTitle = css({
  fontSize: '16px',
  fontWeight: '600',
  color: '#1F2937',
  lineClamp: 1,
});

const sessionCard_infoMeta = css({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
});

const sessionCard_systemTag = css({
  px: '8px',
  py: '4px',
  borderRadius: '4px',
  bg: '#10B981',
  color: 'white',
  fontSize: '11px',
  fontWeight: '600',
});

const sessionCard_metaText = css({
  fontSize: '13px',
  color: '#6B7280',
});

const sessionCard_roleBadge = css({
  px: '12px',
  py: '6px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '600',
  flexShrink: 0,
});

const sessionCard_badges = css({
  display: 'flex',
  gap: '8px',
  mt: '4px',
});

const sessionCard_badge = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  px: '8px',
  py: '2px',
  fontSize: '12px',
  color: '#6B7280',
  bg: '#F3F4F6',
  borderRadius: '4px',
});

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
  const phaseStyle = getPhaseColor(session.sessionPhase);
  const slotWarning = getSlotWarning({
    participantCount: session.participantCount,
    maxPlayer: session.maxPlayer,
  });

  return (
    <Link href={`/sessions/${session.gameSessionId}`} className={publicCard}>
      <div className={publicCard_thumbnail}>
        <span className={publicCard_systemBadge}>{session.systemName}</span>
      </div>

      <div className={publicCard_content}>
        <h3 className={publicCard_title}>{session.scenarioName}</h3>

        <div className={publicCard_meta}>
          <span className={publicCard_metaItem}>
            <Calendar className={publicCard_metaIcon} />
            {formatDateTime(session.scheduleDate)}
          </span>
          <span className={publicCard_metaItem}>
            <Users className={publicCard_metaIcon} />
            {session.participantCount}/{session.maxPlayer ?? '?'}人
          </span>
        </div>

        <div className={publicCard_tags}>
          <span
            className={publicCard_tag}
            style={{ backgroundColor: phaseStyle.bg, color: phaseStyle.color }}
          >
            {getPhaseLabel(session.sessionPhase)}
          </span>
          {!isNil(slotWarning) ? (
            <span
              className={publicCard_tag}
              style={{
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                fontWeight: 600,
              }}
            >
              {slotWarning.label}
            </span>
          ) : (
            (session.minPlaytime || session.maxPlaytime) && (
              <span
                className={publicCard_tag}
                style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}
              >
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

  const roleBadge = getRoleBadge(session.myRole);
  const systemName = session.scenario?.system?.name ?? '';
  const displayTitle = session.sessionName || session.scenario?.name || '';

  // 時刻
  const timeStr = (() => {
    if (isNil(scheduleDate)) return '日程調整中';
    const d = new Date(scheduleDate);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}〜`;
  })();

  // 履歴カードの日付色は薄め
  const dateMonthColor = isHistory ? '#9CA3AF' : '#6B7280';
  const dateDayColor = isHistory ? '#6B7280' : '#1F2937';
  const dateDowColor = isHistory ? '#9CA3AF' : '#6B7280';

  return (
    <Link
      href={`/sessions/${session.gameSessionId}`}
      className={sessionCard_horizontal}
    >
      {/* 日付エリア */}
      <div className={sessionCard_dateArea}>
        {dateInfo ? (
          <>
            <span
              className={sessionCard_dateMonth}
              style={{ color: dateMonthColor }}
            >
              {dateInfo.month}
            </span>
            <span
              className={sessionCard_dateDay}
              style={{ color: dateDayColor }}
            >
              {dateInfo.day}
            </span>
            <span
              className={sessionCard_dateDow}
              style={{ color: dateDowColor }}
            >
              {dateInfo.weekday}
            </span>
          </>
        ) : (
          <span className={sessionCard_metaText}>日程未定</span>
        )}
      </div>

      {/* 情報エリア */}
      <div className={sessionCard_infoArea}>
        <h3 className={sessionCard_infoTitle}>{displayTitle}</h3>
        <div className={sessionCard_infoMeta}>
          {systemName && (
            <span className={sessionCard_systemTag}>{systemName}</span>
          )}
          <span className={sessionCard_metaText}>{timeStr}</span>
          <span className={sessionCard_metaText}>
            参加者: {session.participants.length}人
          </span>
        </div>

        {showMeta && (session.isReviewed || session.hasVideo) && (
          <div className={sessionCard_badges}>
            {session.isReviewed && (
              <span className={sessionCard_badge}>
                <Check size={12} />
                レビュー済み
              </span>
            )}
            {session.hasVideo && (
              <span className={sessionCard_badge}>
                <Video size={12} />
                動画あり
              </span>
            )}
          </div>
        )}
      </div>

      {/* 役割バッジ */}
      <span
        className={sessionCard_roleBadge}
        style={{ backgroundColor: roleBadge.bg, color: roleBadge.color }}
      >
        {roleBadge.label}
      </span>
    </Link>
  );
};
