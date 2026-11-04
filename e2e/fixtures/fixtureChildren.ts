import { isNil } from 'ramda';
import { z } from 'zod';

import { fixtureResourceKey, fixtureResourceSchema } from './fixtureSchema';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/db/types';
import type { FixtureCleanup, FixtureResource } from './fixtureSchema';

const row = z.record(z.string(), z.unknown());

/** UI/RPCの生成行は所有親の直下だけで観測する。所有userの確認とjournal保存は呼出元で行う。 */
export const collectFixtureChildren = async (
  client: SupabaseClient<Database>,
  parent: FixtureResource,
): Promise<{
  children: FixtureResource[];
  issues: FixtureCleanup['issues'];
}> => {
  const children: FixtureResource[] = [];
  const issues: FixtureCleanup['issues'] = [];
  const tables =
    parent.kind === 'game_sessions'
      ? ([
          'game_schedule_time_blocks',
          'session_availability_time_blocks',
        ] as const)
      : parent.kind === 'feedbacks'
        ? (['feedback_comments', 'feedback_votes'] as const)
        : [];
  if (parent.kind !== 'game_sessions' && parent.kind !== 'feedbacks')
    return { children, issues };
  const column = parent.kind === 'feedbacks' ? 'feedback_id' : 'session_id';
  for (const table of tables) {
    try {
      const result = await client.from(table).select('*').eq(column, parent.id);
      if (!isNil(result.error) || !Array.isArray(result.data)) {
        issues.push({
          code: 'OBSERVATION_FAILED',
          resource: fixtureResourceKey(parent),
          reference: { table, column },
        });
        continue;
      }
      for (const raw of result.data) {
        const data = row.parse(raw);
        const parsed = fixtureResourceSchema.safeParse(
          table === 'game_schedule_time_blocks'
            ? {
                kind: table,
                id: data.game_schedule_time_block_id,
                sessionId: data.session_id,
                createdBy: data.created_by,
              }
            : table === 'session_availability_time_blocks'
              ? {
                  kind: table,
                  id: data.availability_time_block_id,
                  sessionId: data.session_id,
                  userId: data.user_id,
                }
              : table === 'feedback_comments'
                ? {
                    kind: table,
                    id: data.comment_id,
                    feedbackId: data.feedback_id,
                    userId: data.user_id,
                  }
                : {
                    kind: table,
                    feedbackId: data.feedback_id,
                    userId: data.user_id,
                  },
        );
        const matchesParent =
          parsed.success &&
          ('feedbackId' in parsed.data
            ? parsed.data.feedbackId
            : 'sessionId' in parsed.data
              ? parsed.data.sessionId
              : undefined) === parent.id;
        if (!parsed.success || !matchesParent) {
          issues.push({
            code: 'OWNERSHIP_MISMATCH',
            resource: fixtureResourceKey(parent),
            reference: { table, column },
          });
          continue;
        }
        children.push(parsed.data);
      }
    } catch {
      issues.push({
        code: 'OBSERVATION_FAILED',
        resource: fixtureResourceKey(parent),
        reference: { table, column },
      });
    }
  }
  return { children, issues };
};
