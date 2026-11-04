import { createClient } from '@supabase/supabase-js';
import { isNil } from 'ramda';
import { z } from 'zod';

import { assertFixtureConnection } from '../../scripts/e2e/environmentCredentials';
import { inspectFixtureReferences } from './fixtureCleanupRelations';
import { fixtureOwnerTag } from './fixtureManifest';
import {
  fixtureCleanupSchema,
  fixtureManifestSchema,
  fixtureResourceKey,
  fixtureResourceSchema,
} from './fixtureSchema';

import { isDeepStrictEqual } from 'node:util';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FixtureConnection } from '../../scripts/e2e/environmentCredentials';
import type { Database } from '../../src/db/types';
import type { FixtureJournal } from './fixtureManifest';
import type { FixtureCleanup, FixtureResource } from './fixtureSchema';

type RowResource = Exclude<FixtureResource, { kind: 'auth-user' }>;
const row = z.record(z.string(), z.unknown());
const ORDER: FixtureResource['kind'][] = [
  'game_schedule_time_blocks',
  'session_availability_time_blocks',
  'session_participants',
  'game_sessions',
  'scenarios',
  'users',
  'auth-user',
];

const primaryKey = (resource: RowResource): Record<string, string> => {
  switch (resource.kind) {
    case 'users':
      return { user_id: resource.id };
    case 'scenarios':
      return { scenario_id: resource.id };
    case 'game_sessions':
      return { game_session_id: resource.id };
    case 'session_participants':
      return { session_id: resource.sessionId, user_id: resource.userId };
    case 'session_availability_time_blocks':
      return { availability_time_block_id: resource.id };
    case 'game_schedule_time_blocks':
      return { game_schedule_time_block_id: resource.id };
  }
};
const identity = (resource: RowResource): Record<string, string> => {
  const key = primaryKey(resource);
  switch (resource.kind) {
    case 'users':
      return { ...key, auth_user_id: resource.authUserId };
    case 'scenarios':
    case 'game_sessions':
      return { ...key, created_by_id: resource.createdBy };
    case 'session_participants':
      return key;
    case 'session_availability_time_blocks':
      return {
        ...key,
        session_id: resource.sessionId,
        user_id: resource.userId,
      };
    case 'game_schedule_time_blocks':
      return {
        ...key,
        session_id: resource.sessionId,
        created_by: resource.createdBy,
      };
  }
};
const dependencies = (resource: FixtureResource): string[] => {
  switch (resource.kind) {
    case 'auth-user':
      return [];
    case 'users':
      return [`auth-user:${resource.authUserId}`];
    case 'scenarios':
    case 'game_sessions':
      return [`users:${resource.createdBy}`];
    case 'session_participants':
    case 'session_availability_time_blocks':
      return [
        `game_sessions:${resource.sessionId}`,
        `users:${resource.userId}`,
      ];
    case 'game_schedule_time_blocks':
      return [
        `game_sessions:${resource.sessionId}`,
        `users:${resource.createdBy}`,
      ];
  }
};

/** 予定IDも観測するが、作成identityを照合できない行は削除しない。 */
const observe = async (
  client: SupabaseClient<Database>,
  resource: FixtureResource,
  ownerTag: string,
): Promise<'absent' | 'owned' | 'mismatch'> => {
  if (resource.kind === 'auth-user') {
    const result = await client.auth.admin.getUserById(resource.id);
    if (!isNil(result.error)) {
      if (result.error.code === 'user_not_found') return 'absent';
      throw new Error('Auth所有IDを観測できません。');
    }
    if (isNil(result.data.user))
      throw new Error('Auth所有IDの観測結果が不正です。');
    return result.data.user.id === resource.id &&
      result.data.user.app_metadata.e2e_fixture_owner === ownerTag
      ? 'owned'
      : 'mismatch';
  }
  const result = await client
    .from(resource.kind)
    .select('*')
    .match(primaryKey(resource))
    .maybeSingle();
  if (!isNil(result.error)) throw new Error('所有行を観測できません。');
  if (isNil(result.data)) return 'absent';
  const actual = row.parse(result.data);
  return Object.entries(identity(resource)).every(
    ([key, value]) => actual[key] === value,
  )
    ? 'owned'
    : 'mismatch';
};

/** 所有接続を再検証し、exact IDと所有関係だけでFKの子から削除する。 */
export const cleanupFixture = async (
  connection: FixtureConnection,
  journal: FixtureJournal,
): Promise<FixtureCleanup> => {
  await assertFixtureConnection(connection);
  const manifest = fixtureManifestSchema.parse(journal.snapshot());
  if (
    !isDeepStrictEqual(manifest.owner.lease, connection.lease) ||
    manifest.ownerTag !== fixtureOwnerTag(manifest.owner) ||
    manifest.ownerTag !== journal.ownerTag
  )
    throw new Error('fixture journalと接続の所有者が一致しません。');
  const client = createClient<Database>(
    connection.manifest.apiUrl,
    connection.serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  const issues: FixtureCleanup['issues'] = [];
  const denied = new Set<string>();
  const known = new Map(
    manifest.resources.map((entry) => [
      fixtureResourceKey(entry.resource),
      entry.resource,
    ]),
  );
  const removed = new Set(
    manifest.resources
      .filter((entry) => entry.status === 'removed')
      .map((entry) => fixtureResourceKey(entry.resource)),
  );
  const pending = new Set(
    manifest.resources
      .filter((entry) => entry.status !== 'removed')
      .map((entry) => fixtureResourceKey(entry.resource)),
  );
  const protect = (resource: FixtureResource): void => {
    denied.add(fixtureResourceKey(resource));
    for (const key of dependencies(resource)) {
      const parent = known.get(key);
      if (!isNil(parent) && !denied.has(key)) protect(parent);
    }
  };
  const issue = (
    code: FixtureCleanup['issues'][number]['code'],
    resource: string,
    reference?: FixtureCleanup['issues'][number]['reference'],
  ) => {
    issues.push({ code, resource, ...(isNil(reference) ? {} : { reference }) });
    const found = known.get(resource);
    if (!isNil(found) && code !== 'JOURNAL_SAVE_FAILED') protect(found);
  };
  // 先に親identityを確認し、別ownerへ差し替わった親に属する行を保護する。
  for (const resource of [...known.values()].sort(
    (a, b) => ORDER.indexOf(b.kind) - ORDER.indexOf(a.kind),
  )) {
    const key = fixtureResourceKey(resource);
    if (dependencies(resource).some((parent) => denied.has(parent))) {
      denied.add(key);
      issue('OWNERSHIP_MISMATCH', key);
      continue;
    }
    try {
      const observed = await observe(client, resource, manifest.ownerTag);
      if (observed !== 'absent' && removed.has(key)) {
        // 削除済みIDの再利用は同じownerでも自動承認せず、残留として保護する。
        pending.add(key);
        issue('RESOURCE_REAPPEARED', key);
      } else if (observed === 'mismatch') {
        denied.add(key);
        issue('OWNERSHIP_MISMATCH', key);
      }
    } catch {
      denied.add(key);
      issue('OBSERVATION_FAILED', key);
    }
  }
  // RPCが生成したIDはcase所有session内だけで収集し、保存後に削除対象へ加える。
  for (const resource of [...known.values()]) {
    if (
      resource.kind !== 'game_sessions' ||
      denied.has(fixtureResourceKey(resource))
    )
      continue;
    for (const table of [
      'game_schedule_time_blocks',
      'session_availability_time_blocks',
    ] as const) {
      try {
        const result = await client
          .from(table)
          .select('*')
          .eq('session_id', resource.id);
        if (!isNil(result.error) || isNil(result.data)) {
          issue('OBSERVATION_FAILED', `${table}:${resource.id}`);
          protect(resource);
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
              : {
                  kind: table,
                  id: data.availability_time_block_id,
                  sessionId: data.session_id,
                  userId: data.user_id,
                },
          );
          if (!parsed.success) {
            issue('OWNERSHIP_MISMATCH', `${table}:${resource.id}`);
            protect(resource);
            continue;
          }
          const child = parsed.data;
          const key = fixtureResourceKey(child);
          if (
            dependencies(child).some(
              (parent) => !known.has(parent) || denied.has(parent),
            )
          ) {
            issue('OWNERSHIP_MISMATCH', key);
            protect(resource);
            continue;
          }
          const old = known.get(key);
          if (!isNil(old)) {
            if (!isDeepStrictEqual(old, child)) {
              denied.add(key);
              issue('OWNERSHIP_MISMATCH', key);
            }
            continue;
          }
          try {
            await journal.reserve(child);
            known.set(key, child);
            pending.add(key);
            await journal.record(child);
          } catch {
            issue('JOURNAL_SAVE_FAILED', key);
            if (!known.has(key)) protect(resource);
          }
        }
      } catch {
        issue('OBSERVATION_FAILED', `${table}:${resource.id}`);
        protect(resource);
      }
    }
  }
  for (const resource of [...known.values()].sort(
    (a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind),
  )) {
    const key = fixtureResourceKey(resource);
    if (!pending.has(key) || denied.has(key)) continue;
    try {
      await assertFixtureConnection(connection);
      const state = await observe(client, resource, manifest.ownerTag);
      if (state === 'mismatch') {
        issue('OWNERSHIP_MISMATCH', key);
        continue;
      }
      if (state === 'owned') {
        const references = await inspectFixtureReferences(client, resource);
        if (references.length > 0) {
          for (const failure of references)
            issue(failure.code, failure.resource, failure.reference);
          continue;
        }
        const result =
          resource.kind === 'auth-user'
            ? await client.auth.admin.deleteUser(resource.id)
            : await client
                .from(resource.kind)
                .delete()
                .match(identity(resource));
        if (!isNil(result.error)) {
          issue('DELETE_FAILED', key);
          continue;
        }
        if ((await observe(client, resource, manifest.ownerTag)) !== 'absent') {
          issue('DELETE_FAILED', key);
          continue;
        }
      }
      pending.delete(key);
      try {
        await journal.removed(resource);
      } catch {
        issue('JOURNAL_SAVE_FAILED', key);
      }
    } catch {
      issue('OBSERVATION_FAILED', key);
    }
  }
  let result = fixtureCleanupSchema.parse({
    status:
      pending.size === 0 && issues.length === 0 ? 'complete' : 'incomplete',
    remaining: [...pending].flatMap((key) => {
      const value = known.get(key);
      return isNil(value) ? [] : [value];
    }),
    issues,
  });
  try {
    await journal.finishCleanup(result);
  } catch {
    result = {
      ...result,
      status: 'incomplete',
      issues: [
        ...result.issues,
        { code: 'JOURNAL_SAVE_FAILED', resource: 'manifest' },
      ],
    };
  }
  return result;
};
