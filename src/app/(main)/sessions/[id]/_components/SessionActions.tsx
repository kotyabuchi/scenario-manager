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
import { Menu } from '@/components/elements/menu/menu';
import { useSystemMessageActions } from '@/hooks/useSystemMessage';

import type { Route } from 'next';
import type { SessionDetail, UserRole } from '../../interface';
import type { SessionActionDescriptor } from './sessionActionsModel';

const ACTION_MENU_ICON_SIZE = 18;

type SessionActionsProps = {
  session: SessionDetail;
  userRole: UserRole;
  currentUserId: string | null;
  /** 参加者の申請ステータス（guest以外で取得可能な場合） */
  participantStatus?: string | undefined;
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
}: SessionActionsProps) => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [isPhaseUpdatePending, startPhaseUpdateTransition] = useTransition();
  const router = useRouter();
  const { addMessage } = useSystemMessageActions();

  const actions = getAvailableSessionActions(
    session.sessionPhase,
    session.schedule?.schedulePhase ?? null,
    userRole,
    participantStatus,
    session.gameSessionId,
  );

  if (actions.length === 0) return null;

  const {
    primaryAction,
    desktopSecondaryActions,
    desktopMenuActions,
    mobileMenuActions,
  } = getResponsiveSessionActionsLayout(actions);

  const handleActionSelect = (action: SessionActionDescriptor) => {
    if (action.type === 'link' && action.href) {
      router.push(action.href as Route);
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
                  className={styles.cx(
                    styles.sessionActions_menuItem,
                    action.variant === 'danger' &&
                      styles.sessionActions_menuItemDanger,
                  )}
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
      <div className={styles.sessionActions_inline}>
        {primaryAction && renderActionButton(primaryAction)}

        {desktopSecondaryActions.length > 0 && (
          <div className={styles.sessionActions_headerSecondaryGroup}>
            {desktopSecondaryActions.map((action) =>
              renderActionButton(action),
            )}
          </div>
        )}

        {renderMenu('desktop', 'その他の操作', desktopMenuActions)}
        {renderMenu('mobile', 'その他の操作', mobileMenuActions)}
      </div>

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
