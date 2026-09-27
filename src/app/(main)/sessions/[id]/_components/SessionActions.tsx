'use client';

import { useState, useTransition } from 'react';
import {
  Calendar,
  CheckCircle,
  DotsThree,
  Prohibit,
  SignOut,
  UserPlus,
  Users,
  XCircle,
} from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import { isNil } from 'ramda';

import { updateSessionPhaseAction } from '../actions';
import * as styles from '../styles';
import { CancelApplicationDialog } from './CancelApplicationDialog';
import { CancelSessionDialog } from './CancelSessionDialog';
import { CompleteSessionDialog } from './CompleteSessionDialog';
import { ParticipationRequestDialog } from './ParticipationRequestDialog';
import {
  getAvailableSessionActions,
  getResponsiveSessionActionsLayout,
} from './sessionActionsModel';
import { WithdrawDialog } from './WithdrawDialog';

import { Button } from '@/components/elements/button/button';
import { IconButton } from '@/components/elements/icon-button/icon-button';
import { LinkButton } from '@/components/elements/link-button';
import { Menu } from '@/components/elements/menu/menu';
import { ParticipantStatuses, SchedulePhases } from '@/db/enum';
import { useSystemMessageActions } from '@/hooks/useSystemMessage';

import type { SessionDetail, UserRole } from '../../interface';
import type { SessionActionDescriptor } from './sessionActionsModel';

const ACTION_MENU_ICON_SIZE = 18;

/** セッションの日程ラベルを導出する */
const getScheduleLabel = (session: SessionDetail): string => {
  if (!isNil(session.scheduleDate)) {
    return new Date(session.scheduleDate).toLocaleDateString('ja-JP');
  }
  if (session.schedulePhase === SchedulePhases.ADJUSTING.value) {
    return '日程調整中';
  }
  return 'メンバー決定後に調整';
};

type SessionActionsProps = {
  session: SessionDetail;
  userRole: UserRole;
  currentUserId: string | null;
  /** 参加者の申請ステータス（guest以外で取得可能な場合） */
  participantStatus?: string | undefined;
  hasAvailabilitySubmission?: boolean;
};

const renderActionIcon = (action: SessionActionDescriptor) => {
  switch (action.icon) {
    case 'calendar':
      return <Calendar size={ACTION_MENU_ICON_SIZE} />;
    case 'check-circle':
      return <CheckCircle size={ACTION_MENU_ICON_SIZE} weight="fill" />;
    case 'prohibit':
      return <Prohibit size={ACTION_MENU_ICON_SIZE} />;
    case 'sign-out':
      return <SignOut size={ACTION_MENU_ICON_SIZE} />;
    case 'user-plus':
      return <UserPlus size={ACTION_MENU_ICON_SIZE} />;
    case 'users':
      return <Users size={ACTION_MENU_ICON_SIZE} />;
    case 'x-circle':
      return <XCircle size={ACTION_MENU_ICON_SIZE} />;
    default:
      return null;
  }
};

export const SessionActions = ({
  session,
  userRole,
  currentUserId: _currentUserId,
  participantStatus,
  hasAvailabilitySubmission = false,
}: SessionActionsProps) => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [isPhaseUpdatePending, startPhaseUpdateTransition] = useTransition();
  const router = useRouter();
  const { addMessage } = useSystemMessageActions();

  const actions = getAvailableSessionActions(
    session.sessionPhase,
    session.schedulePhase,
    userRole,
    participantStatus,
    session.gameSessionId,
    hasAvailabilitySubmission,
  );

  if (actions.length === 0 && openDialog === null) return null;

  const layout =
    actions.length > 0 ? getResponsiveSessionActionsLayout(actions) : null;

  const handleActionSelect = (action: SessionActionDescriptor) => {
    if (action.type === 'link' && action.href) {
      router.push(action.href);
      return;
    }

    if (action.type === 'phase' && action.nextPhase) {
      const nextPhase = action.nextPhase;

      startPhaseUpdateTransition(async () => {
        const result = await updateSessionPhaseAction(
          session.gameSessionId,
          nextPhase,
          session.updatedAt,
        );

        if (!result.success) {
          addMessage(
            'danger',
            result.error?.message ?? 'フェーズ更新に失敗しました',
          );
          return;
        }

        addMessage('success', '募集を締めました。準備フェーズに移行しました');
        router.refresh();
      });
      return;
    }

    if (action.dialog) {
      setOpenDialog(action.dialog);
    }
  };

  const renderActionButton = (action: SessionActionDescriptor) => {
    if (action.type === 'link' && action.href) {
      return (
        <LinkButton
          key={action.id}
          href={action.href}
          size="sm"
          variant={action.variant === 'primary' ? 'solid' : 'outline'}
          status={action.variant === 'danger' ? 'danger' : 'primary'}
          aria-disabled={isPhaseUpdatePending || undefined}
          tabIndex={isPhaseUpdatePending ? -1 : undefined}
          onClick={
            isPhaseUpdatePending
              ? (e: React.MouseEvent) => e.preventDefault()
              : undefined
          }
          css={
            isPhaseUpdatePending
              ? { pointerEvents: 'none', opacity: 0.5, cursor: 'not-allowed' }
              : undefined
          }
        >
          {renderActionIcon(action)}
          {action.label}
        </LinkButton>
      );
    }

    const isPhaseAction = action.type === 'phase';

    return (
      <Button
        key={action.id}
        type="button"
        size="sm"
        variant={action.variant === 'primary' ? 'solid' : 'outline'}
        status={action.variant === 'danger' ? 'danger' : 'primary'}
        prefix={renderActionIcon(action)}
        onClick={() => handleActionSelect(action)}
        loading={isPhaseAction && isPhaseUpdatePending}
        disabled={!isPhaseAction && isPhaseUpdatePending}
        {...(isPhaseAction ? { loadingText: '更新中...' } : {})}
      >
        {action.label}
      </Button>
    );
  };

  const renderMenu = (
    menuId: 'desktop' | 'mobile',
    menuLabel: string,
    menuItems: SessionActionDescriptor[],
  ) => {
    if (menuItems.length === 0) return null;

    return (
      <div
        className={
          menuId === 'desktop'
            ? styles.sessionActions_desktopMenuWrap
            : styles.sessionActions_mobileMenuWrap
        }
      >
        <Menu.Root positioning={{ placement: 'bottom-end' }} size="sm">
          <Menu.Trigger asChild>
            <IconButton
              type="button"
              size="sm"
              variant="outline"
              status="primary"
              className={styles.moreButton}
              aria-label={menuLabel}
              disabled={isPhaseUpdatePending}
            >
              <DotsThree size={22} weight="bold" />
            </IconButton>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content className={styles.sessionActions_menuContent}>
              {menuItems.map((action) => (
                <Menu.Item
                  key={`${menuId}-${action.id}`}
                  value={`${menuId}-${action.id}`}
                  onClick={() => handleActionSelect(action)}
                  className={styles.sessionActions_menuItem({
                    danger: action.variant === 'danger',
                  })}
                >
                  {renderActionIcon(action)}
                  <Menu.ItemText>{action.label}</Menu.ItemText>
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </div>
    );
  };

  return (
    <>
      {layout && (
        <div className={styles.sessionActions_inline}>
          {layout.primaryAction && renderActionButton(layout.primaryAction)}

          {layout.desktopSecondaryActions.length > 0 && (
            <div className={styles.sessionActions_headerSecondaryGroup}>
              {layout.desktopSecondaryActions.map((action) =>
                renderActionButton(action),
              )}
            </div>
          )}

          {renderMenu('desktop', 'その他の操作', layout.desktopMenuActions)}
          {renderMenu('mobile', 'その他の操作', layout.mobileMenuActions)}
        </div>
      )}

      <ParticipationRequestDialog
        sessionId={session.gameSessionId}
        sessionName={session.sessionName}
        scenarioName={session.scenario?.name}
        hasKeeper={!isNil(session.keeper)}
        participantCount={
          session.participants.filter(
            (p) => p.participantStatus === ParticipantStatuses.CONFIRMED.value,
          ).length
        }
        maxParticipantCount={session.maxParticipantCount}
        scheduleLabel={getScheduleLabel(session)}
        open={openDialog === 'participate'}
        onOpenChange={({ open }) => !open && setOpenDialog(null)}
      />
      <WithdrawDialog
        sessionId={session.gameSessionId}
        open={openDialog === 'withdraw'}
        onOpenChange={({ open }) => !open && setOpenDialog(null)}
      />
      <CancelApplicationDialog
        sessionId={session.gameSessionId}
        open={openDialog === 'cancelApplication'}
        onOpenChange={({ open }) => !open && setOpenDialog(null)}
      />
      <CancelSessionDialog
        sessionId={session.gameSessionId}
        sessionName={session.sessionName}
        open={openDialog === 'cancelSession'}
        onOpenChange={({ open }) => !open && setOpenDialog(null)}
      />
      <CompleteSessionDialog
        sessionId={session.gameSessionId}
        expectedUpdatedAt={session.updatedAt}
        scenarioName={session.scenario?.name ?? '不明なシナリオ'}
        systemName={session.scenario?.system?.name ?? ''}
        scheduleLabel={
          !isNil(session.scheduleDate)
            ? new Date(session.scheduleDate).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '日程未定'
        }
        open={openDialog === 'complete'}
        onOpenChange={({ open }) => !open && setOpenDialog(null)}
      />
    </>
  );
};

export type { SessionActionsProps };
