import { createServerClient } from '@supabase/ssr';
import { isNil } from 'ramda';

import { assertFixtureConnection } from '../../scripts/e2e/environmentCredentials';

import type { BrowserContext } from '@playwright/test';
import type { CookieMethodsServer } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FixtureConnection } from '../../scripts/e2e/environmentCredentials';
import type { Database } from '../../src/db/types';
import type { FixtureActor } from './fixtureSchema';

type AuthenticatedActor = Exclude<FixtureActor, { kind: 'anonymous' }>;
type CookieWrite = Parameters<
  NonNullable<CookieMethodsServer['setAll']>
>[0][number];
type FixtureStorageState = Awaited<ReturnType<BrowserContext['storageState']>>;
const localBrowserUrl = (baseURL: string) => {
  const url = new URL(baseURL);
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error(
      '認証stateの宛先は専用localアプリのHTTPルートURLに限定してください。',
    );
  return url;
};

/** ログインJWTのAuth UUID・所有case・アプリULIDの対応を実APIで照合する。 */
export const assertActorIdentity = async (
  client: SupabaseClient<Database>,
  identity: AuthenticatedActor,
  ownerTag: string,
): Promise<void> => {
  const { data, error } = await client.auth.getUser();
  if (
    !isNil(error) ||
    data.user?.id !== identity.authUserId ||
    data.user.app_metadata.e2e_fixture_owner !== ownerTag
  )
    throw new Error('fixtureのログインユーザーまたは所有caseが一致しません。');
  const mapping = await client.rpc('current_app_user_id');
  if (!isNil(mapping.error) || mapping.data !== identity.appUserId)
    throw new Error('fixtureのAuth UUIDとアプリULIDの対応が一致しません。');
};

/** SDKが生成したcookieだけを保持する。password/session/cookieをjournalへ返さない。 */
export const signInFixtureActor = async (
  connection: FixtureConnection,
  identity: AuthenticatedActor,
  credentials: { email: string; password: string },
  ownerTag: string,
) => {
  await assertFixtureConnection(connection);
  const jar = new Map<string, CookieWrite>();
  const client = createServerClient<Database>(
    connection.manifest.apiUrl,
    connection.anonKey,
    {
      cookies: {
        getAll: () =>
          [...jar.values()].map(({ name, value }) => ({ name, value })),
        setAll: (values) => {
          for (const cookie of values) {
            if (cookie.options.maxAge === 0) jar.delete(cookie.name);
            else jar.set(cookie.name, cookie);
          }
        },
      },
    },
  );
  const { data, error } = await client.auth.signInWithPassword(credentials);
  if (
    !isNil(error) ||
    isNil(data.session) ||
    data.user?.id !== identity.authUserId
  )
    throw new Error('fixtureのログインに失敗しました。');
  await assertActorIdentity(client, identity, ownerTag);
  if (jar.size === 0)
    throw new Error('SDKの認証cookieが生成されませんでした。');
  return {
    identity,
    client,
    storageState: (baseURL: string): FixtureStorageState => {
      const url = localBrowserUrl(baseURL);
      return {
        cookies: [...jar.values()].map(({ name, value, options }) => ({
          name,
          value,
          domain: url.hostname,
          path: options.path ?? '/',
          httpOnly: options.httpOnly ?? false,
          secure: false,
          sameSite:
            options.sameSite === 'strict' || options.sameSite === true
              ? 'Strict'
              : options.sameSite === 'none'
                ? 'None'
                : 'Lax',
          expires: !isNil(options.expires)
            ? Math.floor(options.expires.getTime() / 1000)
            : !isNil(options.maxAge)
              ? Math.floor(Date.now() / 1000) + options.maxAge
              : -1,
        })),
        origins: [],
      };
    },
  };
};

/** anonymousはAuthユーザーを作らず、別contextで空のstateを使う。 */
export const anonymousStorageState = (baseURL: string): FixtureStorageState => {
  localBrowserUrl(baseURL);
  return { cookies: [], origins: [] };
};

export type { AuthenticatedActor, FixtureStorageState };
