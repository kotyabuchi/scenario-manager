import { SchedulePhases, SessionPhases } from '@/db/enum';

import type { UserRole } from '../../interface';

type SessionActionPlacement = 'primary' | 'secondary' | 'menu';
type SessionActionType = 'button' | 'link' | 'phase';
type SessionActionIcon =
  | 'calendar'
  | 'check-circle'
  | 'prohibit'
  | 'sign-out'
  | 'user-plus'
  | 'users'
  | 'x-circle';

type SessionActionDescriptor = {
  id: string;
  placement: SessionActionPlacement;
  type: SessionActionType;
  label: string;
  icon: SessionActionIcon;
  variant: 'primary' | 'danger' | 'secondary';
  dialog?:
    | 'participate'
    | 'withdraw'
    | 'cancelApplication'
    | 'cancelSession'
    | 'complete';
  href?: string;
  nextPhase?: 'PREPARATION';
};

type ResponsiveSessionActionsLayout = {
  primaryAction: SessionActionDescriptor | undefined;
  desktopSecondaryActions: SessionActionDescriptor[];
  desktopMenuActions: SessionActionDescriptor[];
  mobileMenuActions: SessionActionDescriptor[];
};

const getManagerActions = (
  phase: string,
  schedulePhase: string,
  sessionId: string,
  hasAvailabilitySubmission: boolean,
): SessionActionDescriptor[] => {
  const actions: SessionActionDescriptor[] = [];
  const availabilityActionLabel = hasAvailabilitySubmission
    ? 'スケジュールを更新'
    : 'スケジュールを提出';

  if (phase === SessionPhases.RECRUITING.value) {
    actions.push({
      id: 'close-recruiting',
      placement: 'primary',
      type: 'phase',
      label: '募集を締める',
      icon: 'check-circle',
      variant: 'primary',
      nextPhase: 'PREPARATION',
    });
    actions.push({
      id: 'manage-applications',
      placement: 'secondary',
      type: 'link',
      label: '申請管理',
      icon: 'users',
      variant: 'secondary',
      href: `/sessions/${sessionId}/applications`,
    });
    actions.push({
      id: 'schedule',
      placement: 'secondary',
      type: 'link',
      label: availabilityActionLabel,
      icon: 'calendar',
      variant: 'secondary',
      href: `/sessions/${sessionId}/schedule/availability`,
    });
  }

  if (phase === SessionPhases.PREPARATION.value) {
    if (schedulePhase === SchedulePhases.ADJUSTING.value) {
      actions.push({
        id: 'schedule-summary',
        placement: 'primary',
        type: 'link',
        label: '日程を確定する',
        icon: 'calendar',
        variant: 'primary',
        href: `/sessions/${sessionId}/schedule/confirm`,
      });
    } else {
      actions.push({
        id: 'schedule',
        placement: 'primary',
        type: 'link',
        label: '確定日程を編集',
        icon: 'calendar',
        variant: 'primary',
        href: `/sessions/${sessionId}/schedule/confirm`,
      });
    }

    actions.push({
      id: 'manage-applications',
      placement: 'secondary',
      type: 'link',
      label: '申請管理',
      icon: 'users',
      variant: 'secondary',
      href: `/sessions/${sessionId}/applications`,
    });

    if (schedulePhase === SchedulePhases.ADJUSTING.value) {
      actions.push({
        id: 'schedule',
        placement: 'secondary',
        type: 'link',
        label: availabilityActionLabel,
        icon: 'calendar',
        variant: 'secondary',
        href: `/sessions/${sessionId}/schedule/availability`,
      });
    }
  }

  if (phase === SessionPhases.IN_PROGRESS.value) {
    actions.push({
      id: 'complete',
      placement: 'primary',
      type: 'button',
      label: 'セッションを完了にする',
      icon: 'check-circle',
      variant: 'primary',
      dialog: 'complete',
    });
  }

  actions.push({
    id: 'cancel-session',
    placement: 'menu',
    type: 'button',
    label: 'キャンセル',
    icon: 'prohibit',
    variant: 'danger',
    dialog: 'cancelSession',
  });

  return actions;
};

const getParticipantActions = (
  phase: string,
  schedulePhase: string,
  participantStatus: string | undefined,
  sessionId: string,
  hasAvailabilitySubmission: boolean,
): SessionActionDescriptor[] => {
  const actions: SessionActionDescriptor[] = [];
  const availabilityActionLabel = hasAvailabilitySubmission
    ? 'スケジュールを更新'
    : 'スケジュールを提出';

  if (participantStatus === 'PENDING') {
    actions.push({
      id: 'cancel-application',
      placement: 'menu',
      type: 'button',
      label: '申請取り消し',
      icon: 'x-circle',
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
        placement: 'primary',
        type: 'link',
        label: availabilityActionLabel,
        icon: 'calendar',
        variant: 'primary',
        href: `/sessions/${sessionId}/schedule/availability`,
      });
    }

    if (
      phase === SessionPhases.RECRUITING.value ||
      schedulePhase === SchedulePhases.ADJUSTING.value ||
      phase === SessionPhases.PREPARATION.value
    ) {
      actions.push({
        id: 'withdraw',
        placement: 'menu',
        type: 'button',
        label: '辞退する',
        icon: 'sign-out',
        variant: 'danger',
        dialog: 'withdraw',
      });
    }
  }

  return actions;
};

const getGuestActions = (phase: string): SessionActionDescriptor[] => {
  if (phase === SessionPhases.RECRUITING.value) {
    return [
      {
        id: 'participate',
        placement: 'primary',
        type: 'button',
        label: '参加申請',
        icon: 'user-plus',
        variant: 'primary',
        dialog: 'participate',
      },
    ];
  }

  return [];
};

const getAvailableSessionActions = (
  phase: string,
  schedulePhase: string,
  role: UserRole,
  participantStatus?: string,
  sessionId?: string,
  hasAvailabilitySubmission = false,
): SessionActionDescriptor[] => {
  if (
    phase === SessionPhases.COMPLETED.value ||
    phase === SessionPhases.CANCELLED.value
  ) {
    return [];
  }

  switch (role) {
    case 'manager':
      return getManagerActions(
        phase,
        schedulePhase,
        sessionId ?? '',
        hasAvailabilitySubmission,
      );
    case 'participant':
      return getParticipantActions(
        phase,
        schedulePhase,
        participantStatus,
        sessionId ?? '',
        hasAvailabilitySubmission,
      );
    case 'guest':
      return getGuestActions(phase);
    default:
      return [];
  }
};

const getResponsiveSessionActionsLayout = (
  actions: SessionActionDescriptor[],
): ResponsiveSessionActionsLayout => {
  const primaryAction = actions.find(
    (action) => action.placement === 'primary',
  );
  const secondaryActions = actions.filter(
    (action) => action.placement === 'secondary',
  );
  const menuActions = actions.filter((action) => action.placement === 'menu');

  return {
    primaryAction,
    desktopSecondaryActions: secondaryActions,
    desktopMenuActions: menuActions,
    mobileMenuActions: [...secondaryActions, ...menuActions],
  };
};

export { getAvailableSessionActions, getResponsiveSessionActionsLayout };
export type { SessionActionDescriptor, ResponsiveSessionActionsLayout };
