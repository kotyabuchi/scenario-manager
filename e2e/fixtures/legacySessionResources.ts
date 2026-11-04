import { z } from 'zod';

import { legacyTimestampSchema } from './legacyTimestamp';

import type { Database } from '../../src/db/types';

const common = {
  session_id: z.ulid(),
  created_at: legacyTimestampSchema,
};
const user = { ...common, user_id: z.ulid() };
type ChildTable = {
  [Name in keyof Database['public']['Tables']]: Database['public']['Tables'][Name]['Row'] extends {
    session_id: string | null;
    created_at: string;
  }
    ? Name
    : never;
}[keyof Database['public']['Tables']];
type Definition = {
  [Name in ChildTable]: {
    primary: readonly (keyof Database['public']['Tables'][Name]['Row'] &
      string)[];
    owner: (keyof Database['public']['Tables'][Name]['Row'] & string) | null;
    schema: z.ZodObject;
  };
};

/** 生成DB型で列名を検査し、本文を含まない所有identityだけを収集する。 */
export const LEGACY_SESSION_CHILDREN = {
  session_links: {
    primary: ['link_id'],
    owner: null,
    schema: z.object({ ...common, link_id: z.ulid() }),
  },
  session_participants: {
    primary: ['session_id', 'user_id'],
    owner: 'user_id',
    schema: z.object(user),
  },
  session_availability_time_blocks: {
    primary: ['availability_time_block_id'],
    owner: 'user_id',
    schema: z.object({ ...user, availability_time_block_id: z.ulid() }),
  },
  game_schedule_time_blocks: {
    primary: ['game_schedule_time_block_id'],
    owner: 'created_by',
    schema: z.object({
      ...common,
      game_schedule_time_block_id: z.ulid(),
      created_by: z.ulid(),
    }),
  },
  video_links: {
    primary: ['video_link_id'],
    owner: 'created_by_id',
    schema: z.object({
      ...common,
      video_link_id: z.ulid(),
      created_by_id: z.ulid(),
    }),
  },
  user_reviews: {
    primary: ['user_review_id'],
    owner: 'user_id',
    schema: z.object({ ...user, user_review_id: z.ulid() }),
  },
  user_scenario_preferences: {
    primary: ['user_id', 'scenario_id'],
    owner: 'user_id',
    schema: z.object({ ...user, scenario_id: z.ulid() }),
  },
} as const satisfies Definition;

type LegacySessionChildTable = keyof typeof LEGACY_SESSION_CHILDREN;
export type { LegacySessionChildTable };
