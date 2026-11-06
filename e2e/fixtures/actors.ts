import { createClient } from '@supabase/supabase-js';
import { isNil } from 'ramda';
import { ulid } from 'ulid';

import { assertFixtureConnection } from '../../scripts/e2e/environmentCredentials';
import { anonymousStorageState, signInFixtureActor } from './authState';
import { fixtureActorSchema } from './fixtureSchema';

import { randomBytes, randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import type { FixtureConnection } from '../../scripts/e2e/environmentCredentials';
import type { Database } from '../../src/db/types';
import type { AuthenticatedActor } from './authState';
import type { FixtureJournal } from './fixtureManifest';
import type { FixtureResource } from './fixtureSchema';

const prepareActorFactory = async (
  connection: FixtureConnection,
  journal: FixtureJournal,
) => {
  await assertFixtureConnection(connection);
  if (!isDeepStrictEqual(journal.owner.lease, connection.lease))
    throw new Error('actor journalが現在の所有環境と一致しません。');
  const admin = createClient<Database>(
    connection.manifest.apiUrl,
    connection.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
  const create = async (kind: AuthenticatedActor['kind']) => {
    const authUserId = randomUUID();
    const appUserId = ulid();
    const identity = fixtureActorSchema.parse({ kind, authUserId, appUserId });
    if (identity.kind === 'anonymous')
      throw new Error('認証actorの種類が不正です。');
    const credentials = {
      email: `e2e-${authUserId}@example.test`,
      password: `${randomBytes(32).toString('base64url')}Aa1!`,
    };
    const authResource: FixtureResource = { kind: 'auth-user', id: authUserId };
    await journal.reserve(authResource);
    const auth = await admin.auth.admin.createUser({
      id: authUserId,
      ...credentials,
      email_confirm: true,
      app_metadata: { e2e_fixture_owner: journal.ownerTag },
    });
    if (!isNil(auth.error) || auth.data.user?.id !== authUserId)
      throw new Error('fixtureのAuthユーザー作成に失敗しました。');
    await journal.record(authResource);
    const userResource: FixtureResource = {
      kind: 'users',
      id: appUserId,
      authUserId,
    };
    await journal.reserve(userResource);
    const row: Database['public']['Tables']['users']['Insert'] = {
      user_id: appUserId,
      auth_user_id: authUserId,
      user_name: `e2e_${appUserId.toLowerCase()}`,
      nickname: `E2E ${kind}`,
      role: 'MEMBER',
    };
    const user = await admin
      .from('users')
      .insert(row)
      .select('user_id, auth_user_id')
      .single();
    if (
      !isNil(user.error) ||
      user.data?.user_id !== appUserId ||
      user.data.auth_user_id !== authUserId
    )
      throw new Error('fixtureのアプリユーザー作成に失敗しました。');
    await journal.record(userResource);
    return signInFixtureActor(
      connection,
      identity,
      credentials,
      journal.ownerTag,
    );
  };
  return {
    create,
    anonymous: () => ({
      identity: fixtureActorSchema.parse({ kind: 'anonymous' }),
      client: createClient<Database>(
        connection.manifest.apiUrl,
        connection.anonKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        },
      ),
      storageState: anonymousStorageState,
    }),
  };
};

/** case専用の日程用actorを作り、利用者JWTの対応を確認する。 */
export const createCaseActors = async (
  connection: FixtureConnection,
  journal: FixtureJournal,
) => {
  const { create, anonymous } = await prepareActorFactory(connection, journal);
  return {
    'creator-only': await create('creator-only'),
    'keeper-only': await create('keeper-only'),
    'confirmed-player': await create('confirmed-player'),
    outsider: await create('outsider'),
    anonymous: anonymous(),
  };
};

/** 申請者と第三者を別々の所有ユーザーとして作る。 */
export const createApplicationActors = async (
  connection: FixtureConnection,
  journal: FixtureJournal,
) => {
  const { create, anonymous } = await prepareActorFactory(connection, journal);
  return {
    'creator-only': await create('creator-only'),
    applicant: await create('applicant'),
    'confirmed-player': await create('confirmed-player'),
    outsider: await create('outsider'),
    anonymous: anonymous(),
  };
};

type CaseActors = Awaited<ReturnType<typeof createCaseActors>>;
type ApplicationActors = Awaited<ReturnType<typeof createApplicationActors>>;
export type { ApplicationActors, CaseActors };
