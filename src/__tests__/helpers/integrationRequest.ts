import { assertActorIdentity } from '../../../e2e/fixtures/authState';
import { ISOLATED_BASE_URL } from '../../../e2e/isolatedRuntime';

import type { CaseActors } from '../../../e2e/fixtures/actors';

let jar: Map<string, string> | null = null;

/** 実server clientが読むNext cookie境界。SDK生成済みcookie以外を捏造しない。 */
export const integrationCookies = () => {
  const current = jar;
  if (current === null)
    throw new Error('integration requestが選択されていません');
  return {
    getAll: () => [...current].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string, options?: { maxAge?: number }) => {
      if (options?.maxAge === 0) current.delete(name);
      else current.set(name, value);
    },
  };
};

/** cookie経由の実認証本人確認後にActionを呼び、成否に関係なくrequestを解除する。 */
export const withIntegrationRequest = async <T>(
  actor: CaseActors[keyof CaseActors],
  ownerTag: string,
  operation: () => Promise<T>,
): Promise<T> => {
  if (jar !== null) throw new Error('integration requestの並列利用は禁止です');
  jar = new Map(
    actor
      .storageState(ISOLATED_BASE_URL)
      .cookies.map(({ name, value }) => [name, value]),
  );
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const client = await createClient();
    if (actor.identity.kind === 'anonymous') {
      const { data, error } = await client.auth.getUser();
      if (data.user !== null || error?.name !== 'AuthSessionMissingError')
        throw new Error('匿名requestのcookie境界が一致しません');
    } else {
      await assertActorIdentity(client, actor.identity, ownerTag);
    }
    return await operation();
  } finally {
    jar = null;
  }
};
