'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import { getCurrentUserId } from '../../../adapter';
import { isSessionManager } from '../../../participantAdapter';
import {
  canConfirmScheduleInCurrentPhase,
  getSchedulingPhases,
} from '../../scheduleFlowGuards';
import {
  getScheduleRecommendations,
  replaceConfirmedScheduleSlots,
} from './adapter';
import { confirmScheduleSlotsSchema } from './schema';

import { err, ok, type Result } from '@/types/result';

import type {
  ConfirmedScheduleSlotRow,
  RecommendationGroup,
} from '../../availability/interface';
import type { ConfirmScheduleSlotsValues } from './schema';

export const confirmScheduleSlotsAction = async (
  sessionId: string,
  data: ConfirmScheduleSlotsValues,
): Promise<Result<ConfirmedScheduleSlotRow[]>> => {
  try {
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const hasPermission = await isSessionManager(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('この操作を行う権限がありません'));
    }

    const phasesResult = await getSchedulingPhases(sessionId);
    if (!phasesResult.success) {
      return err(phasesResult.error);
    }
    if (!canConfirmScheduleInCurrentPhase(phasesResult.data.sessionPhase)) {
      return err(new Error('準備中フェーズでのみ日程を確定できます'));
    }

    const parsed = confirmScheduleSlotsSchema.safeParse(data);
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    const result = await replaceConfirmedScheduleSlots(
      sessionId,
      userId,
      parsed.data.slots,
    );
    if (!result.success) {
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/sessions/${sessionId}/schedule/confirm`);

    return ok(result.data);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

export const getScheduleRecommendationsAction = async (
  sessionId: string,
): Promise<Result<RecommendationGroup[]>> => {
  try {
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const hasPermission = await isSessionManager(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('この操作を行う権限がありません'));
    }

    const phasesResult = await getSchedulingPhases(sessionId);
    if (!phasesResult.success) {
      return err(phasesResult.error);
    }
    if (!canConfirmScheduleInCurrentPhase(phasesResult.data.sessionPhase)) {
      return err(new Error('準備中フェーズでのみ日程を確定できます'));
    }

    return getScheduleRecommendations(sessionId);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
