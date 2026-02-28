import { ulid } from 'ulid';

import { getTestClient } from './testClient';

import { randomUUID } from 'node:crypto';

import type { Database } from '@/db/types';

const TEST_PREFIX = '[TEST]';

// ============================================================
// ビルダー関数
// ============================================================

type UserOverride = Partial<Database['public']['Tables']['users']['Insert']>;

/** テスト用ユーザーを作成 */
export const createTestUser = async (override?: UserOverride) => {
  const client = getTestClient();
  const id = ulid();
  const authUserId = randomUUID();
  const record: Database['public']['Tables']['users']['Insert'] = {
    auth_user_id: authUserId,
    user_id: id,
    discord_account_id: `${TEST_PREFIX}_discord_${id}`,
    user_name: `${TEST_PREFIX}_user_${id}`,
    nickname: `${TEST_PREFIX} User ${id.slice(-4)}`,
    ...override,
  };

  const { data, error } = await client
    .from('users')
    .insert(record)
    .select()
    .single();
  if (error) throw new Error(`createTestUser failed: ${error.message}`);
  return data;
};

type SystemOverride = Partial<
  Database['public']['Tables']['scenario_systems']['Insert']
>;

/** テスト用システムを作成 */
export const createTestSystem = async (
  name?: string,
  override?: SystemOverride,
) => {
  const client = getTestClient();
  const id = ulid();
  const record: Database['public']['Tables']['scenario_systems']['Insert'] = {
    system_id: id,
    name: name ?? `${TEST_PREFIX}_system_${id.slice(-6)}`,
    ...override,
  };
  const { data, error } = await client
    .from('scenario_systems')
    .insert(record)
    .select()
    .single();
  if (error) throw new Error(`createTestSystem failed: ${error.message}`);
  return data;
};

type TagOverride = Partial<Database['public']['Tables']['tags']['Insert']>;

/** テスト用タグを作成 */
export const createTestTag = async (name?: string, override?: TagOverride) => {
  const client = getTestClient();
  const id = ulid();
  const record: Database['public']['Tables']['tags']['Insert'] = {
    tag_id: id,
    name: name ?? `${TEST_PREFIX}_tag_${id.slice(-6)}`,
    ...override,
  };
  const { data, error } = await client
    .from('tags')
    .insert(record)
    .select()
    .single();
  if (error) throw new Error(`createTestTag failed: ${error.message}`);
  return data;
};

type ScenarioOpts = {
  systemId: string;
  createdById?: string | null;
} & Partial<Database['public']['Tables']['scenarios']['Insert']>;

/** テスト用シナリオを作成 */
export const createTestScenario = async (opts: ScenarioOpts) => {
  const client = getTestClient();
  const id = ulid();
  const { systemId, createdById, ...rest } = opts;
  const record: Database['public']['Tables']['scenarios']['Insert'] = {
    scenario_id: id,
    name: `${TEST_PREFIX}_scenario_${id.slice(-6)}`,
    scenario_system_id: systemId,
    created_by_id: createdById ?? null,
    ...rest,
  };
  const { data, error } = await client
    .from('scenarios')
    .insert(record)
    .select()
    .single();
  if (error) throw new Error(`createTestScenario failed: ${error.message}`);
  return data;
};

type SessionOpts = {
  keeperUserId: string;
  phase?: Database['public']['Enums']['session_phase'];
} & Partial<Database['public']['Tables']['game_sessions']['Insert']>;

/** テスト用セッションを作成（KEEPERも自動追加） */
export const createTestSession = async (opts: SessionOpts) => {
  const client = getTestClient();
  const id = ulid();
  const { keeperUserId, phase, ...rest } = opts;
  const sessionRecord: Database['public']['Tables']['game_sessions']['Insert'] =
    {
      game_session_id: id,
      session_name: `${TEST_PREFIX}_session_${id.slice(-6)}`,
      session_description: `${TEST_PREFIX} session description`,
      keeper_id: keeperUserId,
      created_by_id: keeperUserId,
      session_phase: phase ?? 'RECRUITING',
      remaining_seat_count: 10,
      ...rest,
    };
  const { data: session, error: sessionError } = await client
    .from('game_sessions')
    .insert(sessionRecord)
    .select()
    .single();
  if (sessionError)
    throw new Error(`createTestSession failed: ${sessionError.message}`);

  // KEEPER参加者を自動追加
  const { error: participantError } = await client
    .from('session_participants')
    .insert({
      session_id: id,
      user_id: keeperUserId,
      participant_type: 'KEEPER',
      participant_status: 'CONFIRMED',
    });
  if (participantError)
    throw new Error(
      `createTestSession (KEEPER) failed: ${participantError.message}`,
    );

  return session;
};

type ParticipantOpts = {
  sessionId: string;
  userId: string;
  type: Database['public']['Enums']['participant_type'];
  status: Database['public']['Enums']['participant_status'];
} & Partial<Database['public']['Tables']['session_participants']['Insert']>;

/** テスト用参加者を追加 */
export const addParticipant = async (opts: ParticipantOpts) => {
  const client = getTestClient();
  const { sessionId, userId, type, status, ...rest } = opts;
  const record: Database['public']['Tables']['session_participants']['Insert'] =
    {
      session_id: sessionId,
      user_id: userId,
      participant_type: type,
      participant_status: status,
      ...rest,
    };
  const { data, error } = await client
    .from('session_participants')
    .insert(record)
    .select()
    .single();
  if (error) throw new Error(`addParticipant failed: ${error.message}`);
  return data;
};

type LinkOpts = {
  sessionId: string;
} & Partial<Database['public']['Tables']['session_links']['Insert']>;

/** テスト用リンクを作成 */
export const createTestLink = async (opts: LinkOpts) => {
  const client = getTestClient();
  const id = ulid();
  const { sessionId, ...rest } = opts;
  const record: Database['public']['Tables']['session_links']['Insert'] = {
    link_id: id,
    session_id: sessionId,
    url: `https://example.com/${TEST_PREFIX}/${id}`,
    link_type: 'DISCORD',
    ...rest,
  };
  const { data, error } = await client
    .from('session_links')
    .insert(record)
    .select()
    .single();
  if (error) throw new Error(`createTestLink failed: ${error.message}`);
  return data;
};

type ReviewOpts = {
  userId: string;
  scenarioId: string;
  sessionId?: string | null;
} & Partial<Database['public']['Tables']['user_reviews']['Insert']>;

/** テスト用レビューを作成 */
export const createTestReview = async (opts: ReviewOpts) => {
  const client = getTestClient();
  const id = ulid();
  const { userId, scenarioId, sessionId, ...rest } = opts;
  const record: Database['public']['Tables']['user_reviews']['Insert'] = {
    user_review_id: id,
    user_id: userId,
    scenario_id: scenarioId,
    session_id: sessionId ?? null,
    rating: 4,
    ...rest,
  };
  const { data, error } = await client
    .from('user_reviews')
    .insert(record)
    .select()
    .single();
  if (error) throw new Error(`createTestReview failed: ${error.message}`);
  return data;
};

type PreferenceOpts = {
  userId: string;
  scenarioId: string;
} & Partial<
  Database['public']['Tables']['user_scenario_preferences']['Insert']
>;

/** テスト用シナリオ経験情報を作成 */
export const createTestPreference = async (opts: PreferenceOpts) => {
  const client = getTestClient();
  const { userId, scenarioId, ...rest } = opts;
  const record: Database['public']['Tables']['user_scenario_preferences']['Insert'] =
    {
      user_id: userId,
      scenario_id: scenarioId,
      is_like: false,
      is_played: false,
      is_watched: false,
      can_keeper: false,
      had_scenario: false,
      ...rest,
    };
  const { data, error } = await client
    .from('user_scenario_preferences')
    .insert(record)
    .select()
    .single();
  if (error) throw new Error(`createTestPreference failed: ${error.message}`);
  return data;
};

type ScenarioTagOpts = {
  scenarioId: string;
  tagId: string;
};

/** テスト用シナリオタグ紐付けを作成 */
export const createTestScenarioTag = async (opts: ScenarioTagOpts) => {
  const client = getTestClient();
  const { data, error } = await client
    .from('scenario_tags')
    .insert({
      scenario_id: opts.scenarioId,
      tag_id: opts.tagId,
    })
    .select()
    .single();
  if (error) throw new Error(`createTestScenarioTag failed: ${error.message}`);
  return data;
};

// ============================================================
// クリーンアップ関数（CASCADE DELETE を活用）
// ============================================================

/**
 * セッションを削除（CASCADE: participants, links, availability slots など）
 */
export const cleanupSessions = async (ids: string[]) => {
  if (ids.length === 0) return;
  const client = getTestClient();

  await client
    .from('session_availability_time_blocks')
    .delete()
    .in('session_id', ids);
  await client.from('session_links').delete().in('session_id', ids);
  await client.from('game_schedule_time_blocks').delete().in('session_id', ids);
  await client.from('game_schedules').delete().in('session_id', ids);
  await client.from('session_participants').delete().in('session_id', ids);
  await client.from('game_sessions').delete().in('game_session_id', ids);
};

/** レビューを削除 */
export const cleanupReviews = async (ids: string[]) => {
  if (ids.length === 0) return;
  const client = getTestClient();
  await client.from('user_reviews').delete().in('user_review_id', ids);
};

/** シナリオ経験情報を削除 */
export const cleanupPreferences = async (
  pairs: Array<{ userId: string; scenarioId: string }>,
) => {
  if (pairs.length === 0) return;
  const client = getTestClient();
  for (const { userId, scenarioId } of pairs) {
    await client
      .from('user_scenario_preferences')
      .delete()
      .eq('user_id', userId)
      .eq('scenario_id', scenarioId);
  }
};

/** シナリオを削除（タグ紐付けも先に削除） */
export const cleanupScenarios = async (ids: string[]) => {
  if (ids.length === 0) return;
  const client = getTestClient();
  await client.from('scenario_tags').delete().in('scenario_id', ids);
  // user_reviews の scenario_id FK
  await client.from('user_reviews').delete().in('scenario_id', ids);
  // user_scenario_preferences の scenario_id FK
  await client
    .from('user_scenario_preferences')
    .delete()
    .in('scenario_id', ids);
  await client.from('scenarios').delete().in('scenario_id', ids);
};

/** ユーザーを削除 */
export const cleanupUsers = async (ids: string[]) => {
  if (ids.length === 0) return;
  const client = getTestClient();
  await client.from('users').delete().in('user_id', ids);
};

/** システムを削除 */
export const cleanupSystems = async (ids: string[]) => {
  if (ids.length === 0) return;
  const client = getTestClient();
  await client.from('scenario_systems').delete().in('system_id', ids);
};

/** タグを削除 */
export const cleanupTags = async (ids: string[]) => {
  if (ids.length === 0) return;
  const client = getTestClient();
  await client.from('tags').delete().in('tag_id', ids);
};
