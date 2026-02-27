import { err, ok, type Result } from '@/types/result';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CamelCaseKeys } from '@/lib/supabase/transform';
import type { Database } from './types';

/**
 * Supabase テーブルの Row 型をキャメルケースに変換した型を取得するヘルパー
 */
type Tables = Database['public']['Tables'];

// 各テーブルのRow型（キャメルケース変換済み）
export type UserRow = CamelCaseKeys<Tables['users']['Row']>;
export type ScenarioRow = CamelCaseKeys<Tables['scenarios']['Row']>;
export type ScenarioSystemRow = CamelCaseKeys<
  Tables['scenario_systems']['Row']
>;
export type TagRow = CamelCaseKeys<Tables['tags']['Row']>;
export type ScenarioTagRow = CamelCaseKeys<Tables['scenario_tags']['Row']>;
export type GameSessionRow = CamelCaseKeys<Tables['game_sessions']['Row']>;
export type GameScheduleRow = CamelCaseKeys<Tables['game_schedules']['Row']>;
export type GameScheduleTimeBlockRow = CamelCaseKeys<
  Tables['game_schedule_time_blocks']['Row']
>;
export type SessionParticipantRow = CamelCaseKeys<
  Tables['session_participants']['Row']
>;
export type SessionAvailabilityTimeBlockRow = CamelCaseKeys<
  Tables['session_availability_time_blocks']['Row']
>;
export type UserReviewRow = CamelCaseKeys<Tables['user_reviews']['Row']>;
export type UserScenarioPreferenceRow = CamelCaseKeys<
  Tables['user_scenario_preferences']['Row']
>;
export type VideoLinkRow = CamelCaseKeys<Tables['video_links']['Row']>;
export type FeedbackRow = CamelCaseKeys<Tables['feedbacks']['Row']>;
export type FeedbackVoteRow = CamelCaseKeys<Tables['feedback_votes']['Row']>;
export type FeedbackCommentRow = CamelCaseKeys<
  Tables['feedback_comments']['Row']
>;
export type NotificationRow = CamelCaseKeys<Tables['notifications']['Row']>;
export type SessionLinkRow = CamelCaseKeys<Tables['session_links']['Row']>;

// Insert型（キャメルケース変換済み）
export type UserInsert = CamelCaseKeys<Tables['users']['Insert']>;
export type GameSessionInsert = CamelCaseKeys<
  Tables['game_sessions']['Insert']
>;
export type SessionParticipantInsert = CamelCaseKeys<
  Tables['session_participants']['Insert']
>;
export type FeedbackInsert = CamelCaseKeys<Tables['feedbacks']['Insert']>;
export type ScenarioInsert = CamelCaseKeys<Tables['scenarios']['Insert']>;
export type ScenarioTagInsert = CamelCaseKeys<
  Tables['scenario_tags']['Insert']
>;
export type UserReviewInsert = CamelCaseKeys<Tables['user_reviews']['Insert']>;
export type UserScenarioPreferenceInsert = CamelCaseKeys<
  Tables['user_scenario_preferences']['Insert']
>;
export type GameScheduleTimeBlockInsert = CamelCaseKeys<
  Tables['game_schedule_time_blocks']['Insert']
>;
export type SessionAvailabilityTimeBlockInsert = CamelCaseKeys<
  Tables['session_availability_time_blocks']['Insert']
>;

type DbClientLike = Pick<SupabaseClient<Database>, 'from'>;

/**
 * Supabase Auth UID からアプリ内部 user_id（ULID）を解決する。
 * auth_user_id のみを参照する（後方互換 fallback は持たない）。
 */
export const resolveCurrentAppUserIdByAuthUid = async (
  supabase: DbClientLike,
  authUserId: string,
): Promise<Result<string>> => {
  if (!authUserId) {
    return err(new Error('authUserId is required'));
  }

  const byAuthUserId = await supabase
    .from('users')
    .select('user_id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (byAuthUserId.error) {
    return err(new Error(byAuthUserId.error.message));
  }

  if (byAuthUserId.data?.user_id) {
    return ok(byAuthUserId.data.user_id);
  }

  return err(new Error('User not found'));
};
