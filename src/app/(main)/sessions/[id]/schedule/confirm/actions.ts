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
  replaceConfirmedScheduleTimeBlocks,
} from './adapter';
import { confirmScheduleTimeBlocksSchema } from './schema';

import { err, ok, type Result } from '@/types/result';

import type {
  ConfirmedScheduleTimeBlockRow,
  RecommendationGroup,
} from '../../availability/interface';
import type { ConfirmScheduleTimeBlocksValues } from './schema';

export const confirmScheduleTimeBlocksAction = async (
  sessionId: string,
  data: ConfirmScheduleTimeBlocksValues,
): Promise<Result<ConfirmedScheduleTimeBlockRow[]>> => {
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

    const parsed = confirmScheduleTimeBlocksSchema.safeParse(data);
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    const result = await replaceConfirmedScheduleTimeBlocks(
      sessionId,
      userId,
      parsed.data.timeBlocks,
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
