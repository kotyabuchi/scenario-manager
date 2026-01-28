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
export type SessionParticipantRow = CamelCaseKeys<
  Tables['session_participants']['Row']
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
export type ScheduleResponseRow = CamelCaseKeys<
  Tables['schedule_responses']['Row']
>;
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
