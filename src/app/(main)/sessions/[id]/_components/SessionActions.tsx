'use client';

import { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Prohibit,
  SignOut,
  UserPlus,
  Users,
  XCircle,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import * as styles from '../styles';
import { CancelApplicationDialog } from './CancelApplicationDialog';
import { CancelSessionDialog } from './CancelSessionDialog';
import { CompleteSessionDialog } from './CompleteSessionDialog';
import { ParticipationRequestDialog } from './ParticipationRequestDialog';
import { WithdrawDialog } from './WithdrawDialog';

import { Button } from '@/components/elements/button/button';
import { SchedulePhases, SessionPhases } from '@/db/enum';

import type { Route } from 'next';
import type { SessionDetail, UserRole } from '../../interface';

type SessionActionsProps = {
  session: SessionDetail;
  userRole: UserRole;
  currentUserId: string | null;
  /** 参加者の申請ステータス（guest以外で取得可能な場合） */
  participantStatus?: string | undefined;
};

type ActionItem = {
  /** 一意のアクション識別子（keyに使用） */
  id: string;
  type: 'button' | 'link';
  label: string;
  icon: React.ReactNode;
  variant: 'primary' | 'danger' | 'secondary';
  /** type === 'button' の場合に開くダイアログ名 */
  dialog?:
    | 'participate'
    | 'withdraw'
    | 'cancelApplication'
    | 'cancelSession'
    | 'complete';
  /** type === 'link' の場合の遷移先 */
  href?: string;
};

/**
 * GM/作成者のアクション一覧を算出する
 * schedulePhase は game_schedules.schedule_phase（ADJUSTING|CONFIRMED）で、
 * session_phase とは別のライフサイクル
 */
const getManagerActions = (
  phase: string,
  schedulePhase: string | null,
  sessionId: string,
): ActionItem[] => {
  const actions: ActionItem[] = [];

  if (phase === SessionPhases.RECRUITING.value) {
    actions.push({
      id: 'manage-applications',
      type: 'link',
      label: '申請管理',
      icon: <Users size={16} />,
      variant: 'secondary',
      href: `/sessions/${sessionId}/applications`,
    });
    actions.push({
      id: 'schedule',
      type: 'link',
      label: '日程調整',
      icon: <Calendar size={16} />,
      variant: 'primary',
      href: `/sessions/${sessionId}/schedule`,
    });
  }

  if (schedulePhase === SchedulePhases.ADJUSTING.value) {
    actions.push({
      id: 'schedule-summary',
      type: 'link',
      label: '日程集計',
      icon: <Calendar size={16} />,
      variant: 'primary',
      href: `/sessions/${sessionId}/schedule/summary`,
    });
  }

  if (
    phase === SessionPhases.PREPARATION.value ||
    phase === SessionPhases.IN_PROGRESS.value
  ) {
    actions.push({
      id: 'complete',
      type: 'button',
      label: '完了にする',
      icon: <CheckCircle size={16} weight="fill" />,
      variant: 'primary',
      dialog: 'complete',
    });
  }

  // キャンセルは全アクティブフェーズで表示
  actions.push({
    id: 'cancel-session',
    type: 'button',
    label: 'キャンセル',
    icon: <Prohibit size={16} />,
    variant: 'danger',
    dialog: 'cancelSession',
  });

  return actions;
};

/**
 * 参加者のアクション一覧を算出する
 */
const getParticipantActions = (
  phase: string,
  schedulePhase: string | null,
  participantStatus: string | undefined,
  sessionId: string,
): ActionItem[] => {
  const actions: ActionItem[] = [];

  if (participantStatus === 'PENDING') {
    actions.push({
      id: 'cancel-application',
      type: 'button',
      label: '申請取り消し',
      icon: <XCircle size={16} />,
      variant: 'secondary',
      dialog: 'cancelApplication',
    });
  } else if (participantStatus === 'CONFIRMED') {
    if (
      schedulePhase === SchedulePhases.ADJUSTING.value &&
      phase !== SessionPhases.IN_PROGRESS.value &&
      phase !== SessionPhases.COMPLETED.value &&
      phase !== SessionPhases.CANCELLED.value
    ) {
      actions.push({
        id: 'schedule-respond',
        type: 'link',
        label: '日程回答',
        icon: <Calendar size={16} />,
        variant: 'primary',
        href: `/sessions/${sessionId}/schedule/respond`,
      });
    }

    if (
      phase === SessionPhases.RECRUITING.value ||
      schedulePhase === SchedulePhases.ADJUSTING.value ||
      phase === SessionPhases.PREPARATION.value
    ) {
      actions.push({
        id: 'withdraw',
        type: 'button',
        label: '辞退する',
        icon: <SignOut size={16} />,
        variant: 'danger',
        dialog: 'withdraw',
      });
    }
  }

  return actions;
};

/**
 * ゲスト（未参加）のアクション一覧を算出する
 */
const getGuestActions = (phase: string): ActionItem[] => {
  if (phase === SessionPhases.RECRUITING.value) {
    return [
      {
        id: 'participate',
        type: 'button',
        label: '参加申請',
        icon: <UserPlus size={16} />,
        variant: 'primary',
        dialog: 'participate',
      },
    ];
  }
  return [];
};

/**
 * フェーズ × ロール × 参加ステータスからアクションボタン一覧を算出する
 */
const getAvailableActions = (
  phase: string,
  schedulePhase: string | null,
  role: UserRole,
  participantStatus?: string,
  sessionId?: string,
): ActionItem[] => {
  // 終了済みフェーズでは操作不可
  if (
    phase === SessionPhases.COMPLETED.value ||
    phase === SessionPhases.CANCELLED.value
  ) {
    return [];
  }

  switch (role) {
    case 'manager':
      return getManagerActions(phase, schedulePhase, sessionId ?? '');
    case 'participant':
      return getParticipantActions(
        phase,
        schedulePhase,
        participantStatus,
        sessionId ?? '',
      );
    case 'guest':
      return getGuestActions(phase);
    default:
      return [];
  }
};

export const SessionActions = ({
  session,
  userRole,
  currentUserId: _currentUserId,
  participantStatus,
}: SessionActionsProps) => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const actions = getAvailableActions(
    session.sessionPhase,
    session.schedule?.schedulePhase ?? null,
    userRole,
    participantStatus,
    session.gameSessionId,
  );

  if (actions.length === 0) return null;

  return (
    <>
      <div className={styles.sessionActions}>
        {actions.map((action) => {
          if (action.type === 'link' && action.href) {
            return (
              <Link key={action.id} href={action.href as Route}>
                <Button
                  variant={action.variant === 'primary' ? 'solid' : 'outline'}
                  status={action.variant === 'danger' ? 'danger' : 'primary'}
                >
                  {action.icon}
                  {action.label}
                </Button>
              </Link>
            );
          }
          return (
            <Button
              key={action.id}
              variant={action.variant === 'primary' ? 'solid' : 'outline'}
              status={action.variant === 'danger' ? 'danger' : 'primary'}
              onClick={() => action.dialog && setOpenDialog(action.dialog)}
            >
              {action.icon}
              {action.label}
            </Button>
          );
        })}
      </div>

      {/* ダイアログ群（開いている時のみマウント） */}
      {openDialog === 'participate' && (
        <ParticipationRequestDialog
          sessionId={session.gameSessionId}
          sessionName={session.sessionName}
          scenarioName={session.scenario?.name}
          open
          onOpenChange={({ open }) => !open && setOpenDialog(null)}
        />
      )}
      {openDialog === 'withdraw' && (
        <WithdrawDialog
          sessionId={session.gameSessionId}
          open
          onOpenChange={({ open }) => !open && setOpenDialog(null)}
        />
      )}
      {openDialog === 'cancelApplication' && (
        <CancelApplicationDialog
          sessionId={session.gameSessionId}
          open
          onOpenChange={({ open }) => !open && setOpenDialog(null)}
        />
      )}
      {openDialog === 'cancelSession' && (
        <CancelSessionDialog
          sessionId={session.gameSessionId}
          open
          onOpenChange={({ open }) => !open && setOpenDialog(null)}
        />
      )}
      {openDialog === 'complete' && (
        <CompleteSessionDialog
          sessionId={session.gameSessionId}
          expectedUpdatedAt={session.updatedAt}
          open
          onOpenChange={({ open }) => !open && setOpenDialog(null)}
        />
      )}
    </>
  );
};

export type { SessionActionsProps };
