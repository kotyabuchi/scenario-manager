import { createClient } from '@supabase/supabase-js';
import { isNil } from 'ramda';

import {
  assertFixtureConnection,
  readEnvironmentCredentials,
} from '../../scripts/e2e/environmentCredentials';
import { ISOLATED_BASE_URL } from '../isolatedRuntime';
import { fixtureOwnerTag } from './fixtureManifest';
import { LEGACY_STATE_FILE, legacyContextSchema } from './legacySchema';

import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  unlink,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import type { FixtureConnection } from '../../scripts/e2e/environmentCredentials';
import type { Database } from '../../src/db/types';
import type { CaseActors } from './actors';
import type { FixtureJournal } from './fixtureManifest';
import type { LegacyContext } from './legacySchema';

export { LEGACY_STATE_FILE } from './legacySchema';

const CONTEXT_FILE = 'legacy-context.private.json';
const MAX_CONTEXT_BYTES = 16 * 1024;
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

const plainPath = (root: string, file: string) => {
  const physicalRoot = realpathSync(root);
  if (physicalRoot !== resolve(root))
    throw new Error('legacy作業directoryがsymlinkです。');
  const target = resolve(physicalRoot, file);
  const local = relative(physicalRoot, target);
  if (
    !local ||
    isAbsolute(local) ||
    local === '..' ||
    local.startsWith(`..${sep}`)
  )
    throw new Error('legacy設定が作業directory外です。');
  let cursor = physicalRoot;
  for (const segment of local.split(sep)) {
    cursor = join(cursor, segment);
    const stat = lstatSync(cursor);
    if (stat.isSymbolicLink() || realpathSync(cursor) !== cursor)
      throw new Error('legacy設定のpathが置換されています。');
  }
  return target;
};

/** 所有環境の秘密設定と固定pathを照合し、既存cloud設定へfallbackしない。 */
export const readLegacyContext = (
  root: string,
  credentialsFile: string,
  contextFile: string,
) => {
  const connection = readEnvironmentCredentials(root, credentialsFile);
  if (resolve(contextFile) !== join(connection.manifest.workdir, CONTEXT_FILE))
    throw new Error('legacy設定の保存先が一致しません。');
  const file = plainPath(connection.manifest.worktreeRoot, contextFile);
  const stat = lstatSync(file);
  if (!stat.isFile() || stat.size > MAX_CONTEXT_BYTES)
    throw new Error('legacy設定の形式が不正です。');
  let context: LegacyContext;
  try {
    context = legacyContextSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  } catch {
    throw new Error('legacy設定を検証できません。');
  }
  if (
    !isDeepStrictEqual(context.owner.lease, connection.lease) ||
    context.ownerTag !== fixtureOwnerTag(context.owner)
  )
    throw new Error('legacy設定の所有者が一致しません。');
  return { connection, context };
};

/** 旧helperが専用runnerから起動された場合だけ所有設定を取得する。 */
export const legacyContextFromEnvironment = () => {
  const file = process.env.SCENARIO_E2E_LEGACY_CONTEXT;
  if (isNil(file)) {
    if (!isNil(process.env.SCENARIO_E2E_RUN_ID))
      throw new Error('専用legacy設定がありません。');
    return undefined;
  }
  const credentials = process.env.SCENARIO_E2E_CREDENTIALS;
  if (isNil(credentials)) throw new Error('専用接続設定がありません。');
  return readLegacyContext(process.cwd(), credentials, file);
};

/** cleanup前に、合成actorのUUID/ULIDとAuth側のowner tagを再確認する。 */
export const legacyAdmin = async (
  connection: FixtureConnection,
  context: LegacyContext,
) => {
  assertFixtureConnection(connection);
  if (!isDeepStrictEqual(context.owner.lease, connection.lease))
    throw new Error('legacy接続の所有者が一致しません。');
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
  const auth = await client.auth.admin.getUserById(context.actor.authUserId);
  const user = await client
    .from('users')
    .select('user_id,auth_user_id')
    .eq('user_id', context.actor.appUserId)
    .single();
  if (
    !isNil(auth.error) ||
    !isNil(user.error) ||
    auth.data.user?.id !== context.actor.authUserId ||
    user.data?.user_id !== context.actor.appUserId ||
    auth.data.user?.app_metadata.e2e_fixture_owner !== context.ownerTag ||
    user.data?.auth_user_id !== context.actor.authUserId
  )
    throw new Error('legacy actorの本人確認に失敗しました。');
  return client;
};

export const legacySessionPrefix = (context: LegacyContext) =>
  `[E2E:${context.ownerTag.slice(0, 12)}]`;

/** 認証stateの保存値をそのrunで作成したhashと照合する。 */
export const assertLegacyState = (root: string, context: LegacyContext) => {
  const file = plainPath(root, LEGACY_STATE_FILE);
  if (hash(readFileSync(file, 'utf8')) !== context.stateHash)
    throw new Error('legacy認証stateが変更されています。');
};

/** 固定stateを排他的に作り、app/worker終了後に同一fileだけを破棄する。 */
export const withLegacyContext = async <T>(
  connection: FixtureConnection,
  journal: FixtureJournal,
  actor: CaseActors['creator-only'],
  operation: (file: string, context: LegacyContext) => Promise<T>,
): Promise<T> => {
  assertFixtureConnection(connection);
  const root = connection.manifest.worktreeRoot;
  const stateFile = join(root, LEGACY_STATE_FILE);
  const contextFile = join(connection.manifest.workdir, CONTEXT_FILE);
  const state = `${JSON.stringify(actor.storageState(ISOLATED_BASE_URL))}\n`;
  const context = legacyContextSchema.parse({
    schemaVersion: 1,
    owner: journal.owner,
    ownerTag: journal.ownerTag,
    actor: actor.identity,
    startedAt: new Date().toISOString(),
    stateHash: hash(state),
  });
  if (
    !isDeepStrictEqual(context.owner.lease, connection.lease) ||
    context.ownerTag !== fixtureOwnerTag(context.owner)
  )
    throw new Error('legacy journalと接続の所有者が一致しません。');
  plainPath(root, 'e2e');
  await mkdir(dirname(stateFile), { recursive: true, mode: 0o700 });
  plainPath(root, dirname(stateFile));
  plainPath(root, connection.manifest.workdir);
  const owned: {
    file: string;
    dev: bigint;
    ino: bigint;
    contents: string | undefined;
  }[] = [];
  const removeOwned = async (file: (typeof owned)[number]) => {
    const stat = await lstat(file.file, { bigint: true });
    if (
      stat.isSymbolicLink() ||
      (await realpath(file.file)) !== file.file ||
      stat.dev !== file.dev ||
      stat.ino !== file.ino ||
      (!isNil(file.contents) &&
        (await readFile(file.file, 'utf8')) !== file.contents)
    )
      throw new Error('legacy秘密fileの所有者が変わっています。');
    await unlink(file.file);
  };
  const failures: unknown[] = [];
  let result: { value: T } | undefined;
  try {
    for (const [file, contents] of [
      [stateFile, state],
      [contextFile, `${JSON.stringify(context)}\n`],
    ] as const) {
      const handle = await open(file, 'wx', 0o600);
      try {
        // 秘密を書き始める前にFDのidentityを記録し、部分書込失敗も回収する。
        const stat = await handle.stat({ bigint: true });
        const entry: (typeof owned)[number] = {
          file,
          dev: stat.dev,
          ino: stat.ino,
          contents: undefined,
        };
        owned.push(entry);
        await handle.writeFile(contents, 'utf8');
        entry.contents = contents;
        await handle.sync();
      } finally {
        await handle.close();
      }
    }
    result = { value: await operation(contextFile, context) };
  } catch (error) {
    failures.push(error);
  } finally {
    for (const file of owned.reverse()) {
      try {
        await removeOwned(file);
      } catch (error) {
        failures.push(error);
      }
    }
  }
  if (failures.length > 0)
    throw new AggregateError(
      failures,
      'legacy実行または秘密fileの後始末に失敗しました。',
    );
  if (isNil(result)) throw new Error('legacy実行結果がありません。');
  return result.value;
};
