import { isNil } from 'ramda';
import { ulid } from 'ulid';

import { ScheduleAvailabilities } from '@/db/enum';
import { getAppLogger } from '@/lib/logger';
import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type { Database } from '@/db/types';
import type {
  ScheduleCandidateWithResponses,
  ScheduleResponse,
} from '../../interface';

const logger = getAppLogger(['app', 'sessions']);

/**
 * 日程候補を一括登録する
 */
export const createScheduleCandidates = async (
  sessionId: string,
  createdBy: string,
  candidates: { candidateDate: string; endTime?: string | undefined }[],
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    const rows = candidates.map((c) => ({
      candidate_id: ulid(),
      session_id: sessionId,
      candidate_date: c.candidateDate,
      end_time: c.endTime ?? null,
      status: 'PENDING' as const,
      created_by: createdBy,
    }));

    const { error } = await supabase.from('schedule_candidates').insert(rows);

    if (error) {
      logger.error`日程候補登録エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    return ok(undefined);
  } catch (e) {
    logger.error`createScheduleCandidates 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 日程候補一覧を回答付きで取得する
 */
export const getScheduleCandidates = async (
  sessionId: string,
): Promise<Result<ScheduleCandidateWithResponses[]>> => {
  try {
    const supabase = await createDbClient();

    const { data, error } = await supabase
      .from('schedule_candidates')
      .select('*, schedule_responses(*, users(user_id, user_name))')
      .eq('session_id', sessionId);

    if (error) {
      logger.error`日程候補取得エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    const candidates = (data ?? []).map((candidate) => {
      const rawCandidate = candidate as Record<string, unknown>;
      const responses =
        (rawCandidate.schedule_responses as Array<Record<string, unknown>>) ??
        [];

      const okCount = responses.filter(
        (r) => r.availability === ScheduleAvailabilities.OK.value,
      ).length;
      const maybeCount = responses.filter(
        (r) => r.availability === ScheduleAvailabilities.MAYBE.value,
      ).length;
      const ngCount = responses.filter(
        (r) => r.availability === ScheduleAvailabilities.NG.value,
      ).length;

      const convertedCandidate = camelCaseKeys(rawCandidate);
      const convertedResponses = responses.map((r) => {
        const rawUser = r.users as Record<string, unknown> | null;
        const converted = camelCaseKeys(r);
        return {
          ...converted,
          user: isNil(rawUser)
            ? { userId: 'unknown', userName: '退会済みユーザー' }
            : {
                userId: rawUser.user_id as string,
                userName: rawUser.user_name as string,
              },
        };
      });

      return {
        ...convertedCandidate,
        responses: convertedResponses,
        okCount,
        maybeCount,
        ngCount,
      } as ScheduleCandidateWithResponses;
    });

    return ok(candidates);
  } catch (e) {
    logger.error`getScheduleCandidates 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 日程回答を送信する（candidate_id + user_id の組み合わせで upsert）
 */
export const submitScheduleResponse = async (
  userId: string,
  responses: {
    candidateId: string;
    availability: Database['public']['Enums']['schedule_availability'];
  }[],
  comment?: string | undefined,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    const rows = responses.map((r) => ({
      response_id: ulid(),
      candidate_id: r.candidateId,
      user_id: userId,
      availability: r.availability,
      comment: comment ?? null,
    }));

    const { error } = await supabase
      .from('schedule_responses')
      .upsert(rows, { onConflict: 'candidate_id,user_id' });

    if (error) {
      logger.error`日程回答送信エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    return ok(undefined);
  } catch (e) {
    logger.error`submitScheduleResponse 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * セッションの日程回答一覧を取得する
 * schedule_candidates への !inner JOIN で1クエリに統合
 */
export const getScheduleResponses = async (
  sessionId: string,
): Promise<Result<ScheduleResponse[]>> => {
  try {
    const supabase = await createDbClient();

    const { data, error } = await supabase
      .from('schedule_responses')
      .select('*, schedule_candidates!inner(session_id)')
      .eq('schedule_candidates.session_id', sessionId);

    if (error) {
      logger.error`日程回答取得エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    const responses = (data ?? []).map(
      (r) => camelCaseKeys(r as Record<string, unknown>) as ScheduleResponse,
    );

    return ok(responses);
  } catch (e) {
    logger.error`getScheduleResponses 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 日程を確定する
 * RPC関数が候補の確定、他候補のキャンセル、game_schedules の更新をアトミックに実行する
 */
export const confirmSchedule = async (
  sessionId: string,
  candidateId: string,
): Promise<Result<void>> => {
  try {
    const supabase = await createDbClient();

    const { error } = await supabase.rpc('confirm_schedule', {
      p_candidate_id: candidateId,
      p_session_id: sessionId,
    });

    if (error) {
      logger.error`日程確定エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    return ok(undefined);
  } catch (e) {
    logger.error`confirmSchedule 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
