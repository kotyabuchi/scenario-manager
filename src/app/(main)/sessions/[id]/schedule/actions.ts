'use server';

import { revalidatePath } from 'next/cache';
import { isNil } from 'ramda';

import { getCurrentUserId } from '../../adapter';
import { isSessionManager } from '../../participantAdapter';
import {
  confirmSchedule,
  createScheduleCandidates,
  submitScheduleResponse,
} from './adapter';
import { scheduleCandidatesFormSchema, scheduleResponseSchema } from './schema';

import { ParticipantStatuses } from '@/db/enum';
import { getAppLogger } from '@/lib/logger';
import { createDbClient } from '@/lib/supabase/server';
import { err, ok, type Result } from '@/types/result';

import type {
  ScheduleCandidatesFormValues,
  ScheduleResponseValues,
} from './schema';

const logger = getAppLogger(['app', 'sessions']);

/**
 * 日程候補を一括登録する（GM専用）
 */
export const createCandidatesAction = async (
  sessionId: string,
  data: ScheduleCandidatesFormValues,
): Promise<Result<void>> => {
  try {
    // 認可チェック
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const hasPermission = await isSessionManager(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('この操作を行う権限がありません'));
    }

    // Zodバリデーション
    const parsed = scheduleCandidatesFormSchema.safeParse(data);
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    // 日程候補登録
    const result = await createScheduleCandidates(
      sessionId,
      userId,
      parsed.data.candidates,
    );
    if (!result.success) {
      logger.error`日程候補登録エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 日程回答を送信する（セッション参加者専用）
 */
export const submitResponseAction = async (
  sessionId: string,
  data: ScheduleResponseValues,
): Promise<Result<void>> => {
  try {
    // 認可チェック
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    // 承認済み参加者のみ日程回答可能（PENDING/WITHDRAWNは除外）
    const dbClient = await createDbClient();
    const { data: participant } = await dbClient
      .from('session_participants')
      .select('user_id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('participant_status', ParticipantStatuses.CONFIRMED.value)
      .maybeSingle();

    if (isNil(participant)) {
      return err(new Error('承認済みの参加者のみ日程回答が可能です'));
    }

    // Zodバリデーション
    const parsed = scheduleResponseSchema.safeParse(data);
    if (!parsed.success) {
      return err(
        new Error(parsed.error.issues[0]?.message ?? 'バリデーションエラー'),
      );
    }

    // candidateIdが対象セッションに属するか検証
    if (parsed.data.responses.length > 0) {
      const candidateIds = parsed.data.responses.map((r) => r.candidateId);
      const { data: validCandidates } = await dbClient
        .from('schedule_candidates')
        .select('candidate_id')
        .eq('session_id', sessionId)
        .in('candidate_id', candidateIds);

      const validIds = new Set(
        (validCandidates ?? []).map((c) => c.candidate_id),
      );
      const invalidIds = candidateIds.filter((id) => !validIds.has(id));
      if (invalidIds.length > 0) {
        return err(new Error('無効な日程候補が含まれています'));
      }
    }

    // 日程回答送信
    const result = await submitScheduleResponse(
      userId,
      parsed.data.responses,
      parsed.data.comment,
    );
    if (!result.success) {
      logger.error`日程回答送信エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 日程を確定する（GM専用）
 */
export const confirmScheduleAction = async (
  sessionId: string,
  candidateId: string,
): Promise<Result<void>> => {
  try {
    // 認可チェック
    const userId = await getCurrentUserId();
    if (isNil(userId)) {
      return err(new Error('ログインが必要です'));
    }

    const hasPermission = await isSessionManager(sessionId, userId);
    if (!hasPermission) {
      return err(new Error('この操作を行う権限がありません'));
    }

    // candidateId がこのセッションに属するか検証（IDOR防止）
    const dbClient = await createDbClient();
    const { data: candidate } = await dbClient
      .from('schedule_candidates')
      .select('candidate_id')
      .eq('candidate_id', candidateId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (isNil(candidate)) {
      return err(new Error('指定された日程候補が見つかりません'));
    }

    // 日程確定
    const result = await confirmSchedule(sessionId, candidateId);
    if (!result.success) {
      logger.error`日程確定エラー: ${result.error}`;
      return err(result.error);
    }

    revalidatePath(`/sessions/${sessionId}`);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
