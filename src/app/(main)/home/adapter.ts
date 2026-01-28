import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type { NewScenario, UpcomingSession } from './interface';

/**
 * 参加予定のセッションを取得（最大3件）
 */
export const getUpcomingSessions = async (
  userId: string,
): Promise<Result<UpcomingSession[]>> => {
  try {
    const supabase = await createDbClient();

    // ユーザーが参加しているセッションIDを取得
    const { data: participantSessions, error: partError } = await supabase
      .from('session_participants')
      .select('session_id')
      .eq('user_id', userId);

    if (partError) {
      return err(new Error(partError.message));
    }

    if (!participantSessions || participantSessions.length === 0) {
      return ok([]);
    }

    const sessionIds = participantSessions.map(
      (p: { session_id: string }) => p.session_id,
    );

    // セッション情報を取得（RECRUITING/PREPARATION/IN_PROGRESS）
    const { data: sessions, error: sessError } = await supabase
      .from('game_sessions')
      .select(`
        *,
        scenario:scenarios(
          *,
          system:scenario_systems(*)
        ),
        participants:session_participants(
          *,
          user:users(*)
        )
      `)
      .or(
        `game_session_id.in.(${sessionIds.join(',')}),session_phase.eq.RECRUITING,session_phase.eq.PREPARATION,session_phase.eq.IN_PROGRESS`,
      )
      .order('created_at', { ascending: false })
      .limit(3);

    if (sessError) {
      return err(new Error(sessError.message));
    }

    return ok(
      (sessions ?? []).map(
        (s) => camelCaseKeys(s as Record<string, unknown>) as UpcomingSession,
      ),
    );
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 新着シナリオを取得（最大3件）
 */
export const getNewScenarios = async (): Promise<Result<NewScenario[]>> => {
  try {
    const supabase = await createDbClient();
    const { data, error } = await supabase
      .from('scenarios')
      .select(`
        *,
        system:scenario_systems(*),
        scenarioTags:scenario_tags(
          tag:tags(*)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      return err(new Error(error.message));
    }

    return ok(
      (data ?? []).map(
        (s) => camelCaseKeys(s as Record<string, unknown>) as NewScenario,
      ),
    );
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
