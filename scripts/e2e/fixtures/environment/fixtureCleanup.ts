import { isNil } from 'ramda';
import { vi } from 'vitest';

import { fixtureOwnerTag } from '../../../../e2e/fixtures/fixtureManifest';
import { fixtureResourceKey } from '../../../../e2e/fixtures/fixtureSchema';
import { fixture } from './ownership';

import type { FixtureJournal } from '../../../../e2e/fixtures/fixtureManifest';
import type {
  FixtureManifest,
  FixtureResource,
} from '../../../../e2e/fixtures/fixtureSchema';

export const auth = {
  kind: 'auth-user',
  id: '11111111-1111-4111-8111-111111111111',
} as const;
export const user = {
  kind: 'users',
  id: '01J00000000000000000000001',
  authUserId: auth.id,
} as const;
export const scenario = {
  kind: 'scenarios',
  id: '01J00000000000000000000002',
  createdBy: user.id,
} as const;
export const session = {
  kind: 'game_sessions',
  id: '01J00000000000000000000003',
  createdBy: user.id,
} as const;
export const participant = {
  kind: 'session_participants',
  sessionId: session.id,
  userId: user.id,
} as const;
export const block = {
  kind: 'game_schedule_time_blocks',
  id: '01J00000000000000000000004',
  sessionId: session.id,
  createdBy: user.id,
} as const;
export const availability = {
  kind: 'session_availability_time_blocks',
  id: '01J00000000000000000000005',
  sessionId: session.id,
  userId: user.id,
} as const;
export const resources: FixtureResource[] = [
  auth,
  user,
  scenario,
  session,
  participant,
  availability,
  block,
];

export const createCleanupFixture = () => {
  const { manifest: environment, lease } = fixture();
  const connection = {
    manifest: environment,
    lease,
    anonKey: 'anon-only',
    serviceRoleKey: 'admin-only',
  };
  const owner = {
    lease,
    project: 'chromium',
    workerIndex: 0,
    caseId: 'schedule.main',
    retry: 0,
  };
  const ownerTag = fixtureOwnerTag(owner);
  const manifest: FixtureManifest = {
    schemaVersion: 1,
    owner,
    ownerTag,
    resources: resources.map((resource) => ({ resource, status: 'created' })),
    cleanup: null,
  };
  const journal: FixtureJournal = {
    owner,
    ownerTag,
    path: 'unused',
    directory: 'unused',
    reserve: vi.fn(async (resource) => {
      manifest.resources.push({ resource, status: 'reserved' });
    }),
    record: vi.fn(async (resource) => {
      const entry = manifest.resources.find(
        (entry) =>
          fixtureResourceKey(entry.resource) === fixtureResourceKey(resource),
      );
      if (!isNil(entry)) entry.status = 'created';
    }),
    removed: vi.fn(async (resource) => {
      const entry = manifest.resources.find(
        (entry) =>
          fixtureResourceKey(entry.resource) === fixtureResourceKey(resource),
      );
      if (!isNil(entry)) entry.status = 'removed';
    }),
    snapshot: () => structuredClone(manifest),
    finishCleanup: vi.fn(async (value) => {
      manifest.cleanup = value;
    }),
  };
  const rows = new Map<string, Record<string, unknown>[]>([
    ['users', [{ user_id: user.id, auth_user_id: auth.id }]],
    ['scenarios', [{ scenario_id: scenario.id, created_by_id: user.id }]],
    [
      'game_sessions',
      [
        {
          game_session_id: session.id,
          created_by_id: user.id,
          scenario_id: scenario.id,
        },
      ],
    ],
    ['session_participants', [{ session_id: session.id, user_id: user.id }]],
    [
      'game_schedule_time_blocks',
      [
        {
          game_schedule_time_block_id: block.id,
          session_id: session.id,
          created_by: user.id,
        },
      ],
    ],
    [
      'session_availability_time_blocks',
      [
        {
          availability_time_block_id: availability.id,
          session_id: session.id,
          user_id: user.id,
        },
      ],
    ],
  ]);
  const authRows = new Map([
    [auth.id, { id: auth.id, app_metadata: { e2e_fixture_owner: ownerTag } }],
  ]);
  const deleted: string[] = [];
  const observed: {
    table: string;
    filters: Record<string, unknown>;
    deleting: boolean;
  }[] = [];
  const deleteErrors = new Set<string>();
  const observeErrors = new Set<string>();
  const discoveryErrors = new Set<string>();
  const noOpDeletes = new Set<string>();
  type QueryResult = { data: unknown; error: { message: string } | null };
  const client = {
    auth: {
      admin: {
        getUserById: vi.fn(async (id: string) => {
          if (observeErrors.has('auth-user'))
            return {
              data: { user: null },
              error: { code: 'unknown', message: 'secret-error' },
            };
          const value = [...authRows.values()].find((entry) => entry.id === id);
          return value
            ? { data: { user: value }, error: null }
            : { data: { user: null }, error: { code: 'user_not_found' } };
        }),
        deleteUser: vi.fn(async (id: string) => {
          deleted.push('auth-user');
          if (deleteErrors.has('auth-user'))
            return { error: { message: 'secret-error' } };
          for (const [key, value] of authRows)
            if (value.id === id) authRows.delete(key);
          return { error: null };
        }),
      },
    },
    from: (table: string) => {
      let filters: Record<string, unknown> = {};
      let deleting = false;
      let limit: number | undefined;
      const finish = (single: boolean): QueryResult => {
        observed.push({ table, filters: { ...filters }, deleting });
        if (
          observeErrors.has(table) ||
          (!single && !deleting && discoveryErrors.has(table))
        )
          return { data: null, error: { message: 'secret-error' } };
        const current = rows.get(table) ?? [];
        const matches = (value: Record<string, unknown>) =>
          Object.entries(filters).every(
            ([key, expected]) => value[key] === expected,
          );
        const matching = current.filter(matches);
        if (deleting) {
          deleted.push(table);
          if (deleteErrors.has(table))
            return { data: null, error: { message: 'secret-error' } };
          if (!noOpDeletes.has(table))
            rows.set(
              table,
              current.filter((value) => !matches(value)),
            );
        }
        return {
          data: single
            ? (matching[0] ?? null)
            : isNil(limit)
              ? matching
              : matching.slice(0, limit),
          error: null,
        };
      };
      const query = {
        select: () => query,
        limit: (value: number) => {
          limit = value;
          return query;
        },
        delete: () => {
          deleting = true;
          return query;
        },
        match: (value: Record<string, unknown>) => {
          filters = { ...filters, ...value };
          return query;
        },
        eq: (key: string, value: unknown) => {
          filters[key] = value;
          return query;
        },
        maybeSingle: async () => finish(true),
        // biome-ignore lint/suspicious/noThenProperty: PostgRESTの公式thenableをDBなしで再現する。
        then: (resolve: (value: QueryResult) => unknown) =>
          Promise.resolve(resolve(finish(false))),
      };
      return query;
    },
  };
  return {
    connection,
    journal,
    manifest,
    rows,
    authRows,
    client,
    deleted,
    observed,
    deleteErrors,
    observeErrors,
    discoveryErrors,
    noOpDeletes,
  };
};
