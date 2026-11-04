import { isNil } from 'ramda';

import { fixtureResourceKey } from './fixtureSchema';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/db/types';
import type { FixtureCleanup, FixtureResource } from './fixtureSchema';

type Table = keyof Database['public']['Tables'];
type Parent = 'users' | 'scenarios' | 'game_sessions';
type Reference = {
  [Name in Table]: {
    parent: Parent;
    table: Name;
    column: keyof Database['public']['Tables'][Name]['Row'] & string;
  };
}[Table];

// 固定catalogの全incoming FK。CASCADE/SET NULLだけでなくRESTRICTも同じ境界で確認する。
export const FIXTURE_PARENT_REFERENCES = [
  { parent: 'users', table: 'feedback_comments', column: 'user_id' },
  { parent: 'users', table: 'feedback_votes', column: 'user_id' },
  { parent: 'users', table: 'feedbacks', column: 'user_id' },
  { parent: 'users', table: 'game_schedule_time_blocks', column: 'created_by' },
  { parent: 'users', table: 'game_sessions', column: 'created_by_id' },
  { parent: 'users', table: 'game_sessions', column: 'keeper_id' },
  { parent: 'users', table: 'notifications', column: 'user_id' },
  { parent: 'users', table: 'scenarios', column: 'created_by_id' },
  {
    parent: 'users',
    table: 'session_availability_time_blocks',
    column: 'user_id',
  },
  { parent: 'users', table: 'session_participants', column: 'user_id' },
  { parent: 'users', table: 'user_reviews', column: 'user_id' },
  { parent: 'users', table: 'user_scenario_preferences', column: 'user_id' },
  { parent: 'users', table: 'video_links', column: 'created_by_id' },
  { parent: 'scenarios', table: 'game_sessions', column: 'scenario_id' },
  { parent: 'scenarios', table: 'scenario_tags', column: 'scenario_id' },
  { parent: 'scenarios', table: 'user_reviews', column: 'scenario_id' },
  {
    parent: 'scenarios',
    table: 'user_scenario_preferences',
    column: 'scenario_id',
  },
  { parent: 'scenarios', table: 'video_links', column: 'scenario_id' },
  {
    parent: 'game_sessions',
    table: 'game_schedule_time_blocks',
    column: 'session_id',
  },
  {
    parent: 'game_sessions',
    table: 'session_availability_time_blocks',
    column: 'session_id',
  },
  { parent: 'game_sessions', table: 'session_links', column: 'session_id' },
  {
    parent: 'game_sessions',
    table: 'session_participants',
    column: 'session_id',
  },
  { parent: 'game_sessions', table: 'user_reviews', column: 'session_id' },
  {
    parent: 'game_sessions',
    table: 'user_scenario_preferences',
    column: 'session_id',
  },
  { parent: 'game_sessions', table: 'video_links', column: 'session_id' },
] satisfies Reference[];

/** 記録外の子をcascade削除・SET NULL更新しないよう、親IDの参照不在を直前に確認する。 */
export const inspectFixtureReferences = async (
  client: SupabaseClient<Database>,
  resource: FixtureResource,
): Promise<FixtureCleanup['issues']> => {
  if (
    resource.kind !== 'users' &&
    resource.kind !== 'scenarios' &&
    resource.kind !== 'game_sessions'
  )
    return [];
  const observations = await Promise.all(
    FIXTURE_PARENT_REFERENCES.filter(
      (reference) => reference.parent === resource.kind,
    ).map(async (reference): Promise<FixtureCleanup['issues']> => {
      // 診断には固定FK一覧のtable/columnだけを持ち、取得した行やエラー値を含めない。
      const subject = {
        resource: fixtureResourceKey(resource),
        reference: { table: reference.table, column: reference.column },
      };
      try {
        const result = await client
          .from(reference.table)
          .select(reference.column)
          .eq(reference.column, resource.id)
          .limit(1);
        if (!isNil(result.error) || !Array.isArray(result.data))
          return [{ ...subject, code: 'OBSERVATION_FAILED' }];
        return result.data.length === 0
          ? []
          : [{ ...subject, code: 'REFERENCE_REMAINS' }];
      } catch {
        return [{ ...subject, code: 'OBSERVATION_FAILED' }];
      }
    }),
  );
  return observations.flat();
};
