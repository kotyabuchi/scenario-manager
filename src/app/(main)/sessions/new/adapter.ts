import { isNil } from 'ramda';
import { ulid } from 'ulid';

import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type { Database, Json } from '@/db/types';
import type { CreateSessionInput } from './schema';

/**
 * 組み込み Omit は K extends keyof any のため存在しないキーでもエラーにならない。
 * StrictOmit は K extends keyof T に制約し、型再生成でキー名が変わった場合に
 * コンパイルエラーとして検知できるようにする。
 */
type StrictOmit<T, K extends keyof T> = Omit<T, K>;

/** Supabase gen types の RPC Args 型（NULL 非許容で生成される） */
type GeneratedArgs =
  Database['public']['Functions']['create_session_transaction']['Args'];

/** NULL を受け付けるパラメータのキー */
type NullableParamKeys =
  | 'p_scenario_id'
  | 'p_scheduled_at'
  | 'p_recruited_player_count'
  | 'p_tools';

/**
 * Supabase gen types は RPC パラメータの NULL 許容を生成しないため、
 * DB関数で実際に NULL を受け付けるパラメータを明示的にオーバーライドする。
 *
 * StrictOmit により、型再生成でパラメータ名が変更された場合は
 * NullableParamKeys の該当キーでコンパイルエラーが発生する。
 */
type CreateSessionRpcArgs = StrictOmit<GeneratedArgs, NullableParamKeys> & {
  p_scenario_id: string | null;
  p_scheduled_at: string | null;
  p_recruited_player_count: number | null;
  p_tools: string | null;
};

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

    // ユーザー存在確認（ユーザーフレンドリーなエラーメッセージ提供）
    // DB関数側では auth.uid() との所有権照合を行うが、
    // service_role クライアントではスキップされるため、
    // アプリ層での存在確認も併用する
    const { data: user } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (isNil(user)) {
      return err(new Error(ERROR_MESSAGES.USER_NOT_FOUND));
    }

    const gameSessionId = ulid();

    const confirmedCandidates = (input.scheduleCandidates ?? []).filter(
      (candidate) => candidate.from.trim() !== '',
    );
    const representativeScheduledAt =
      confirmedCandidates.length > 0
        ? confirmedCandidates
            .map((candidate) => candidate.from)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]
        : (input.scheduledAt ?? null);

    const initialAvailabilityTimeBlockPayload = confirmedCandidates.map(
      (candidate) => {
        const startAt = new Date(candidate.from);
        const endAt =
          candidate.to && candidate.to.trim() !== ''
            ? new Date(candidate.to)
            : new Date(startAt.getTime() + 30 * 60 * 1000);

        return {
          availabilityTimeBlockId: ulid(),
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        };
      },
    );

    const rpcArgs: CreateSessionRpcArgs = {
      p_game_session_id: gameSessionId,
      p_user_id: userId,
      p_session_name: input.sessionName,
      p_session_description: input.sessionDescription,
      p_scenario_id: input.scenarioId ?? null,
      p_scheduled_at: representativeScheduledAt
        ? new Date(representativeScheduledAt).toISOString()
        : null,
      p_recruited_player_count: input.recruitedPlayerCount ?? null,
      p_tools: input.tools ?? null,
      p_is_beginner_friendly: input.isBeginnerFriendly,
      p_visibility: input.visibility,
      p_creator_participant_type: input.creatorParticipantType,
      // JSONB パラメータは Supabase 生成型の Json と構造的に互換だが
      // TypeScript の index signature 推論が通らないため型アサーション
      p_initial_availability_time_blocks:
        initialAvailabilityTimeBlockPayload as unknown as Json,
      p_invited_members: (input.invitedMembers ?? []) as unknown as Json,
    };

    const { data: createdSessions, error: createError } = await supabase.rpc(
      'create_session_transaction',
      rpcArgs as Database['public']['Functions']['create_session_transaction']['Args'],
    );

    if (createError || !createdSessions || createdSessions.length === 0) {
      return err(
        new Error(createError?.message ?? ERROR_MESSAGES.CREATE_FAILED),
      );
    }

    const firstSession = createdSessions[0];
    if (isNil(firstSession)) {
      return err(new Error(ERROR_MESSAGES.CREATE_FAILED));
    }

    const session = camelCaseKeys(firstSession);

    return ok({
      gameSessionId: session.gameSessionId,
      sessionName: session.sessionName,
      sessionPhase: session.sessionPhase,
      // DB関数の RETURNS TABLE は non-null で宣言されるが、
      // 実データはカラムの nullable に従うためワイドニング
      scenarioId: session.scenarioId as string | null,
      scheduledAt: session.scheduledAt as string | null,
      recruitedPlayerCount: session.recruitedPlayerCount as number | null,
      tools: session.tools as string | null,
      isBeginnerFriendly: session.isBeginnerFriendly,
      visibility: session.visibility,
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
