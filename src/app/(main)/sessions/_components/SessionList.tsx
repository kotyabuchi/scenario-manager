'use client';

import { SessionCard } from './SessionCard';
import * as styles from './styles';

import { css } from '@/styled-system/css';

import type { MySessionWithRole, PublicSession } from '../interface';

type PublicSessionListProps = {
  sessions: PublicSession[];
  variant: 'public';
};

type MySessionListProps = {
  sessions: MySessionWithRole[];
  variant: 'my';
  showMeta?: boolean;
};

type SessionListProps = PublicSessionListProps | MySessionListProps;

const mySessionListContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const SessionList = (props: SessionListProps) => {
  if (props.sessions.length === 0) {
    return null;
  }

  if (props.variant === 'public') {
    return (
      <div className={styles.publicCardsGrid}>
        {props.sessions.map((session) => (
          <SessionCard
            key={session.gameSessionId}
            session={session}
            variant="public"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={mySessionListContainer}>
      {props.sessions.map((session) => (
        <SessionCard
          key={session.gameSessionId}
          session={session}
          variant="my"
          showMeta={props.showMeta ?? false}
        />
      ))}
    </div>
  );
};
