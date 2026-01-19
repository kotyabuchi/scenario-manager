'use client';

import { SessionCard } from './SessionCard';
import * as styles from './styles';

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

export const SessionList = (props: SessionListProps) => {
  if (props.sessions.length === 0) {
    return null;
  }

  return (
    <div className={styles.sessionListContainer}>
      {props.variant === 'public'
        ? props.sessions.map((session) => (
            <SessionCard
              key={session.gameSessionId}
              session={session}
              variant="public"
            />
          ))
        : props.sessions.map((session) => (
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
