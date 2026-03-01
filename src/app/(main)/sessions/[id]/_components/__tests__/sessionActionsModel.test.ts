import { describe, expect, it } from 'vitest';

import {
  getAvailableSessionActions,
  getResponsiveSessionActionsLayout,
} from '../sessionActionsModel';

import { SchedulePhases, SessionPhases } from '@/db/enum';

describe('sessionActionsModel', () => {
  describe('getAvailableSessionActions', () => {
    it('manager + RECRUITING で募集を締めるを主CTAとして返す', () => {
      const actions = getAvailableSessionActions(
        SessionPhases.RECRUITING.value,
        SchedulePhases.ADJUSTING.value,
        'manager',
        undefined,
        'session-1',
      );

      expect(actions.map((action) => action.id)).toEqual([
        'close-recruiting',
        'manage-applications',
        'schedule',
        'cancel-session',
      ]);
      expect(
        actions.find((action) => action.id === 'close-recruiting'),
      ).toMatchObject({
        placement: 'primary',
        type: 'phase',
        nextPhase: 'PREPARATION',
      });
    });

    it('manager + PREPARATION + ADJUSTING で日程確定を主CTAとして返す', () => {
      const actions = getAvailableSessionActions(
        SessionPhases.PREPARATION.value,
        SchedulePhases.ADJUSTING.value,
        'manager',
        undefined,
        'session-1',
      );

      expect(actions.map((action) => action.id)).toEqual([
        'schedule-summary',
        'manage-applications',
        'schedule',
        'cancel-session',
      ]);
      expect(actions[0]?.label).toBe('日程を確定する');
      expect(actions[0]?.href).toBe('/sessions/session-1/schedule/confirm');
      expect(actions[2]?.href).toBe(
        '/sessions/session-1/schedule/availability',
      );
    });

    it('manager + PREPARATION + CONFIRMED で確定日程編集を主CTAとして返し、スケジュール提出導線は表示しない', () => {
      const actions = getAvailableSessionActions(
        SessionPhases.PREPARATION.value,
        SchedulePhases.CONFIRMED.value,
        'manager',
        undefined,
        'session-1',
      );

      expect(actions.map((action) => action.id)).toEqual([
        'schedule',
        'manage-applications',
        'cancel-session',
      ]);
      expect(actions[0]).toMatchObject({
        placement: 'primary',
        label: '確定日程を編集',
        href: '/sessions/session-1/schedule/confirm',
      });
      expect(
        actions.find(
          (action) =>
            action.id === 'schedule' && action.placement === 'secondary',
        ),
      ).toBeUndefined();
    });

    it('participant(CONFIRMED) + ADJUSTING でスケジュール提出と辞退を返す', () => {
      const actions = getAvailableSessionActions(
        SessionPhases.RECRUITING.value,
        SchedulePhases.ADJUSTING.value,
        'participant',
        'CONFIRMED',
        'session-1',
      );

      expect(actions.map((action) => action.id)).toEqual([
        'schedule-respond',
        'withdraw',
      ]);
      expect(actions[0]?.placement).toBe('primary');
      expect(actions[1]?.placement).toBe('menu');
      expect(actions[0]?.label).toBe('スケジュールを提出');
      expect(actions[0]?.href).toBe(
        '/sessions/session-1/schedule/availability',
      );
    });

    it('スケジュール提出済みなら提出導線ラベルを更新にする', () => {
      const managerActions = getAvailableSessionActions(
        SessionPhases.PREPARATION.value,
        SchedulePhases.ADJUSTING.value,
        'manager',
        undefined,
        'session-1',
        true,
      );
      const participantActions = getAvailableSessionActions(
        SessionPhases.RECRUITING.value,
        SchedulePhases.ADJUSTING.value,
        'participant',
        'CONFIRMED',
        'session-1',
        true,
      );

      const managerAvailabilityAction = managerActions.find(
        (action) =>
          action.id === 'schedule' && action.placement === 'secondary',
      );

      expect(managerAvailabilityAction?.label).toBe('スケジュールを更新');
      expect(participantActions[0]?.label).toBe('スケジュールを更新');
    });

    it('COMPLETED/CANCELLED では操作を返さない', () => {
      const completed = getAvailableSessionActions(
        SessionPhases.COMPLETED.value,
        SchedulePhases.CONFIRMED.value,
        'manager',
        undefined,
        'session-1',
      );
      const cancelled = getAvailableSessionActions(
        SessionPhases.CANCELLED.value,
        SchedulePhases.ADJUSTING.value,
        'guest',
        undefined,
        'session-1',
      );

      expect(completed).toEqual([]);
      expect(cancelled).toEqual([]);
    });
  });

  describe('getResponsiveSessionActionsLayout', () => {
    it('モバイル用メニューに補助CTAとその他メニュー項目を集約する', () => {
      const actions = getAvailableSessionActions(
        SessionPhases.RECRUITING.value,
        SchedulePhases.ADJUSTING.value,
        'manager',
        undefined,
        'session-1',
      );

      const layout = getResponsiveSessionActionsLayout(actions);

      expect(layout.primaryAction?.id).toBe('close-recruiting');
      expect(layout.desktopSecondaryActions.map((action) => action.id)).toEqual(
        ['manage-applications', 'schedule'],
      );
      expect(layout.desktopSecondaryActions[1]).toMatchObject({
        label: 'スケジュールを提出',
        href: '/sessions/session-1/schedule/availability',
      });
      expect(layout.desktopMenuActions.map((action) => action.id)).toEqual([
        'cancel-session',
      ]);
      expect(layout.mobileMenuActions.map((action) => action.id)).toEqual([
        'manage-applications',
        'schedule',
        'cancel-session',
      ]);
    });
  });
});
