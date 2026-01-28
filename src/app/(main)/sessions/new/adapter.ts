import { isNil } from 'ramda';
import { ulid } from 'ulid';

import {
  ParticipantStatuses,
  ParticipantTypes,
  SessionPhases,
} from '@/db/enum';
import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type { CreateSessionInput } from './schema';

/**
 * セッション作成結果の型
 */
export type CreateSessionResult = {
  gameSessionId: string;
  sessionName: string;
  sessionPhase: string;
  scenarioId: string | null;
  scheduledAt: string | null;
  recruitedPlayerCount: number | null;
  tools: string | null;
  isBeginnerFriendly: boolean;
  visibility: string;
};

/**
 * セッション詳細の型（参加者・シナリオ情報含む）
 */
export type SessionWithRelations = {
  gameSessionId: string;
  sessionName: string;
  sessionDescription: string;
  sessionPhase: string;
  scenarioId: string | null;
  scheduledAt: string | null;
  recruitedPlayerCount: number | null;
  tools: string | null;
  isBeginnerFriendly: boolean;
  visibility: string;
  scenario: {
    scenarioId: string;
    scenarioName: string;
  } | null;
  participants: Array<{
    userId: string;
    participantType: string;
    participantStatus: string;
    applicationMessage: string | null;
  }>;
};

/**
 * エラーメッセージ定数
 */
const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'ユーザーが見つかりません',
  SESSION_NOT_FOUND: 'セッションが見つかりません',
  CREATE_FAILED: 'セッションの作成に失敗しました',
  NO_PERMISSION: 'この操作を行う権限がありません',
} as const;

/**
 * セッションを作成する
 */
export const createSession = async (
  input: CreateSessionInput,
  userId: string,
): Promise<Result<CreateSessionResult>> => {
  try {
    const supabase = await createDbClient();

    // ユーザーの存在確認
    const { data: user } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (isNil(user)) {
      return err(new Error(ERROR_MESSAGES.USER_NOT_FOUND));
    }

    const gameSessionId = ulid();

    // セッションを作成
    const { data: createdSession, error: insertError } = await supabase
      .from('game_sessions')
      .insert({
        game_session_id: gameSessionId,
        session_name: input.sessionName,
        session_description: input.sessionDescription,
        scenario_id: input.scenarioId ?? null,
        keeper_id: userId,
        session_phase: SessionPhases.RECRUITING.value,
        scheduled_at: input.scheduledAt
          ? new Date(input.scheduledAt).toISOString()
          : null,
        recruited_player_count: input.recruitedPlayerCount ?? null,
        tools: input.tools ?? null,
        is_beginner_friendly: input.isBeginnerFriendly,
        visibility: input.visibility,
      })
      .select()
      .single();

    if (insertError || isNil(createdSession)) {
      return err(new Error(ERROR_MESSAGES.CREATE_FAILED));
    }

    // 作成者をKEEPERとして参加者に追加（確定済み状態）
    await supabase.from('session_participants').insert({
      session_id: gameSessionId,
      user_id: userId,
      participant_type: ParticipantTypes.KEEPER.value,
      participant_status: ParticipantStatuses.CONFIRMED.value,
      applied_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
    });

    const session = camelCaseKeys(
      createdSession as Record<string, unknown>,
    ) as Record<string, unknown>;

    return ok({
      gameSessionId: session.gameSessionId as string,
      sessionName: session.sessionName as string,
      sessionPhase: session.sessionPhase as string,
      scenarioId: session.scenarioId as string | null,
      scheduledAt: session.scheduledAt as string | null,
      recruitedPlayerCount: session.recruitedPlayerCount as number | null,
      tools: session.tools as string | null,
      isBeginnerFriendly: session.isBeginnerFriendly as boolean,
      visibility: session.visibility as string,
    });
  } catch (e) {
    return err(
      e instanceof Error ? e : new Error(ERROR_MESSAGES.CREATE_FAILED),
    );
  }
};

/**
 * セッションをIDで取得する
 */
export const getSessionById = async (
  sessionId: string,
): Promise<Result<SessionWithRelations | null>> => {
  try {
    const supabase = await createDbClient();

    const { data: session, error } = await supabase
      .from('game_sessions')
      .select(`
        *,
        scenario:scenarios(scenario_id, name),
        participants:session_participants(
          user_id,
          participant_type,
          participant_status,
          application_message
        )
      `)
      .eq('game_session_id', sessionId)
      .maybeSingle();

    if (error) {
      return err(new Error(error.message));
    }

    if (isNil(session)) {
      return ok(null);
    }

    const s = camelCaseKeys(session as Record<string, unknown>) as Record<
      string,
      unknown
    >;

    return ok({
      gameSessionId: s.gameSessionId as string,
      sessionName: s.sessionName as string,
      sessionDescription: s.sessionDescription as string,
      sessionPhase: s.sessionPhase as string,
      scenarioId: s.scenarioId as string | null,
      scheduledAt: s.scheduledAt as string | null,
      recruitedPlayerCount: s.recruitedPlayerCount as number | null,
      tools: s.tools as string | null,
      isBeginnerFriendly: s.isBeginnerFriendly as boolean,
      visibility: s.visibility as string,
      scenario: s.scenario
        ? {
            scenarioId: (s.scenario as Record<string, unknown>)
              .scenarioId as string,
            scenarioName: (s.scenario as Record<string, unknown>)
              .name as string,
          }
        : null,
      participants: (s.participants as Array<Record<string, unknown>>).map(
        (p) => ({
          userId: p.userId as string,
          participantType: p.participantType as string,
          participantStatus: p.participantStatus as string,
          applicationMessage: p.applicationMessage as string | null,
        }),
      ),
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
