'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import { getCurrentUserId } from '../../adapter';
import { isSessionManager } from '../../participantAdapter';
import {
  canSubmitAvailabilityInCurrentPhase,
  getSchedulingPhases,
} from '../scheduleFlowGuards';
import { replaceAvailabilitySlots } from './adapter';
import { saveAvailabilitySlotsSchema } from './schema';

import { ParticipantStatuses } from '@/db/enum';
import { getAppLogger } from '@/lib/logger';
import { createDbClient } from '@/lib/supabase/server';
import { err, ok, type Result } from '@/types/result';

import type { AvailabilitySlotRow } from './interface';
import type { SaveAvailabilitySlotsValues } from './schema';

const logger = getAppLogger(['app', 'sessions', 'availability']);

/**
 * 承認済み参加者（見学含む）またはセッション管理者のみ可用枠を提出可能
 */
const canSubmitAvailability = async (
  sessionId: string,
  userId: string,
): Promise<boolean> => {
  const dbClient = await createDbClient();

  const [{ data: participant }, isManager] = await Promise.all([
    dbClient
      .from('session_participants')
      .select('user_id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('participant_status', ParticipantStatuses.CONFIRMED.value)
      .maybeSingle(),
    isSessionManager(sessionId, userId),
  ]);

  return !isNil(participant) || isManager;
};

export const saveAvailabilitySlotsAction = async (
  sessionId: string,
  data: SaveAvailabilitySlotsValues,
): Promise<Result<AvailabilitySlotRow[]>> => {
  try {
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const hasPermission = await canSubmitAvailability(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('承認済み参加者または主催者のみ提出可能です'));
    }

    const phasesResult = await getSchedulingPhases(sessionId);
    if (!phasesResult.success) {
      return err(phasesResult.error);
    }
    if (
      !canSubmitAvailabilityInCurrentPhase(
        phasesResult.data.sessionPhase,
        phasesResult.data.schedulePhase,
      )
    ) {
      return err(new Error('現在のフェーズでは参加可能時間を提出できません'));
    }

    const parsed = saveAvailabilitySlotsSchema.safeParse(data);
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    const result = await replaceAvailabilitySlots(
      sessionId,
      userId,
      parsed.data.slots,
    );
    if (!result.success) {
      logger.error`可用枠保存エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/sessions/${sessionId}/availability`);
    revalidatePath(`/sessions/${sessionId}/schedule/confirm`);

    return ok(result.data);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
