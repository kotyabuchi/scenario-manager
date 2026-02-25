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
    });

    it('manager + PREPARATION + CONFIRMED で日程調整を主CTAとして返し、補助CTA重複を出さない', () => {
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
      expect(
        actions.filter(
          (action) =>
            action.id === 'schedule' && action.placement === 'secondary',
        ),
      ).toHaveLength(0);
    });

    it('participant(CONFIRMED) + ADJUSTING で日程回答と辞退を返す', () => {
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
        null,
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
