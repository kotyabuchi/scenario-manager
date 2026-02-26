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
export type GameScheduleSlotRow = CamelCaseKeys<
  Tables['game_schedule_slots']['Row']
>;
export type SessionParticipantRow = CamelCaseKeys<
  Tables['session_participants']['Row']
>;
export type SessionAvailabilitySlotRow = CamelCaseKeys<
  Tables['session_availability_slots']['Row']
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
export type GameScheduleSlotInsert = CamelCaseKeys<
  Tables['game_schedule_slots']['Insert']
>;
export type SessionAvailabilitySlotInsert = CamelCaseKeys<
  Tables['session_availability_slots']['Insert']
>;

type DbClientLike = Pick<SupabaseClient<Database>, 'from'>;

/**
 * Supabase Auth UID からアプリ内部 user_id（ULID）を解決する。
 * 段階移行中の互換のため、auth_user_id を優先し、見つからない場合は legacy の discord_id も参照する。
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

  // 互換経路: 旧 discord_id（実態が auth uid）を参照
  const byLegacyDiscordId = await supabase
    .from('users')
    .select('user_id')
    .eq('discord_id', authUserId)
    .maybeSingle();

  if (byLegacyDiscordId.error) {
    return err(new Error(byLegacyDiscordId.error.message));
  }

  if (byLegacyDiscordId.data?.user_id) {
    return ok(byLegacyDiscordId.data.user_id);
  }

  return err(new Error('User not found'));
};
