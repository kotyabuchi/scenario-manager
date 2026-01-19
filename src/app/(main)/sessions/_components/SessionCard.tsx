'use client';

import { Check, Clock, User, Users, Video } from 'lucide-react';
import Link from 'next/link';
import { isNil } from 'ramda';

import * as styles from './styles';

import { ParticipantTypes, SessionPhases } from '@/db/enum';

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

const formatDateTime = (date: Date | null): string => {
  if (isNil(date)) return '日程調整中';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[d.getDay()];
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${year}/${month}/${day}（${weekday}）${hours}:${minutes}〜`;
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
  const roleObj = Object.values(ParticipantTypes).find((p) => p.value === role);
  return roleObj?.label ?? role;
};

export const SessionCard = (props: SessionCardProps) => {
  if (props.variant === 'public') {
    return <PublicSessionCard session={props.session} />;
  }
  return (
    <MySessionCard session={props.session} showMeta={props.showMeta ?? false} />
  );
};

const PublicSessionCard = ({ session }: { session: PublicSession }) => {
  const slotsRemaining = isNil(session.maxPlayer)
    ? null
    : session.maxPlayer - session.participantCount;

  return (
    <Link
      href={`/sessions/${session.gameSessionId}`}
      className={styles.sessionCard}
    >
      <div className={styles.sessionCard_header}>
        <div className={styles.sessionCard_headerLeft}>
          <span
            className={styles.sessionCard_phaseBadge({
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
          <span className={styles.sessionCard_dateTime}>
            {formatDateTime(session.scheduleDate)}
          </span>
        </div>
      </div>

      <div className={styles.sessionCard_content}>
        <h3 className={styles.sessionCard_title}>{session.scenarioName}</h3>
        <span className={styles.sessionCard_system}>{session.systemName}</span>

        <div className={styles.sessionCard_meta}>
          {session.keeperName && (
            <div className={styles.sessionCard_metaItem}>
              <User className={styles.sessionCard_metaIcon} />
              <span>GM: {session.keeperName}</span>
            </div>
          )}

          <div className={styles.sessionCard_metaItem}>
            <Users className={styles.sessionCard_metaIcon} />
            <span>
              {!isNil(slotsRemaining) && slotsRemaining > 0
                ? `残り${slotsRemaining}枠（${session.participantCount}/${session.maxPlayer}人）`
                : `${session.participantCount}人`}
            </span>
          </div>

          {(session.minPlaytime || session.maxPlaytime) && (
            <div className={styles.sessionCard_metaItem}>
              <Clock className={styles.sessionCard_metaIcon} />
              <span>
                {formatPlaytime(session.minPlaytime, session.maxPlaytime)}
              </span>
            </div>
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

  return (
    <Link
      href={`/sessions/${session.gameSessionId}`}
      className={styles.sessionCard}
    >
      <div className={styles.sessionCard_header}>
        <div className={styles.sessionCard_headerLeft}>
          <span
            className={styles.sessionCard_phaseBadge({
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
          <span className={styles.sessionCard_dateTime}>
            {formatDateTime(scheduleDate)}
          </span>
        </div>
        <span
          className={styles.sessionCard_roleBadge({
            role: session.myRole,
          })}
        >
          {getRoleLabel(session.myRole)}
        </span>
      </div>

      <div className={styles.sessionCard_content}>
        <h3 className={styles.sessionCard_title}>{session.scenario.name}</h3>
        <span className={styles.sessionCard_system}>
          {session.scenario.system.name}
        </span>

        <div className={styles.sessionCard_meta}>
          <div className={styles.sessionCard_metaItem}>
            <Users className={styles.sessionCard_metaIcon} />
            <span>参加者: {session.participants.length}人</span>
          </div>
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
    </Link>
  );
};
