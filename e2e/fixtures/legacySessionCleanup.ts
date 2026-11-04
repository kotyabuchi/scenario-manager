import { isNil } from 'ramda';
import { z } from 'zod';

import { inspectFixtureReferences } from './fixtureCleanupRelations';
import { fixtureOwnerTag } from './fixtureManifest';
import { legacyAdmin, legacySessionPrefix } from './legacyContext';
import { legacyContextSchema } from './legacySchema';
import { LEGACY_SESSION_CHILDREN } from './legacySessionResources';

import { randomUUID } from 'node:crypto';
import { lstat, mkdir, open, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import type { FixtureConnection } from '../../scripts/e2e/environmentCredentials';
import type { LegacyContext } from './legacySchema';
import type { LegacySessionChildTable } from './legacySessionResources';

const sessionSchema = z.object({
  game_session_id: z.ulid(),
  created_by_id: z.ulid(),
  keeper_id: z.ulid().nullable(),
  session_name: z.string(),
  created_at: z.iso.datetime({ offset: true }),
});
const childTableSchema = z.custom<LegacySessionChildTable>(
  (value) =>
    typeof value === 'string' && Object.hasOwn(LEGACY_SESSION_CHILDREN, value),
);
const targetSchema = z.object({
  table: z.union([z.literal('game_sessions'), childTableSchema]),
  primary: z.record(z.string(), z.string()),
  identity: z.record(z.string(), z.string()),
  status: z.enum(['pending', 'removed']),
});
type Target = z.infer<typeof targetSchema>;

/** 名前だけで所有と認めず、専用接続・actor・日時も毎回照合する。 */
const assertContext = (context: LegacyContext) => {
  const value = legacyContextSchema.parse(context);
  if (value.ownerTag !== fixtureOwnerTag(value.owner))
    throw new Error('legacy cleanupの所有identityが不正です。');
  return value;
};

const readSession = async (
  connection: FixtureConnection,
  context: LegacyContext,
  sessionId: string,
) => {
  const admin = await legacyAdmin(connection, context);
  const result = await admin
    .from('game_sessions')
    .select('game_session_id,created_by_id,keeper_id,session_name,created_at')
    .eq('game_session_id', sessionId)
    .maybeSingle();
  if (!isNil(result.error))
    throw new Error('legacy sessionの観測に失敗しました。');
  if (isNil(result.data)) return null;
  const row = sessionSchema.parse(result.data);
  if (
    row.game_session_id !== sessionId ||
    row.created_by_id !== context.actor.appUserId ||
    !row.session_name.startsWith(legacySessionPrefix(context)) ||
    Date.parse(row.created_at) < Date.parse(context.startedAt) ||
    (!isNil(row.keeper_id) && row.keeper_id !== context.actor.appUserId)
  )
    throw new Error('legacy sessionの所有条件が一致しません。');
  return row;
};

/** 呼出ごとのappend-only記録をsyncし、worker間でseed journalを共有更新しない。 */
const openReceipt = async (
  connection: FixtureConnection,
  context: LegacyContext,
  sessionId: string,
) => {
  const workdir = resolve(connection.manifest.workdir);
  if (
    (await realpath(workdir)) !== workdir ||
    (await lstat(workdir)).isSymbolicLink()
  )
    throw new Error('legacy cleanupの保存先が不正です。');
  const directory = join(workdir, 'legacy-cleanup');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const directoryStat = await lstat(directory, { bigint: true });
  if (
    directoryStat.isSymbolicLink() ||
    (await realpath(directory)) !== directory
  )
    throw new Error('legacy cleanupの保存先が不正です。');
  const path = join(directory, `${sessionId}.${randomUUID()}.jsonl`);
  const handle = await open(path, 'wx', 0o600);
  const fileStat = await handle
    .stat({ bigint: true })
    .catch(async (error: unknown) => {
      await handle.close();
      throw error;
    });
  const save = async (
    status: 'running' | 'passed' | 'failed',
    targets: Target[],
    failure: string | null,
  ) => {
    const currentDirectory = await lstat(directory, { bigint: true });
    const currentFile = await lstat(path, { bigint: true });
    if (
      (await realpath(directory)) !== directory ||
      currentDirectory.isSymbolicLink() ||
      currentDirectory.dev !== directoryStat.dev ||
      currentDirectory.ino !== directoryStat.ino ||
      currentFile.isSymbolicLink() ||
      currentFile.dev !== fileStat.dev ||
      currentFile.ino !== fileStat.ino
    )
      throw new Error('legacy cleanupの記録先が置換されています。');
    await handle.writeFile(
      `${JSON.stringify({
        schemaVersion: 1,
        ownerTag: context.ownerTag,
        actor: context.actor,
        sessionId,
        status,
        targets,
        remaining: targets.filter((target) => target.status === 'pending'),
        failure,
      })}\n`,
    );
    await handle.sync();
  };
  return { save, close: () => handle.close() };
};

/** 全子の所有確認・計画保存を終えてから、exact identityで一行ずつ削除する。 */
export const cleanupLegacySession = async (
  connection: FixtureConnection,
  rawContext: LegacyContext,
  rawSessionId: string,
) => {
  const context = assertContext(rawContext);
  const sessionId = z.ulid().parse(rawSessionId);
  await legacyAdmin(connection, context);
  const receipt = await openReceipt(connection, context, sessionId);
  const targets: Target[] = [];
  let failure = 'observe-session';
  try {
    await receipt.save('running', targets, null);
    const session = await readSession(connection, context, sessionId);
    if (isNil(session)) {
      await receipt.save('passed', targets, null);
      return;
    }
    targets.push(
      targetSchema.parse({
        table: 'game_sessions',
        primary: { game_session_id: sessionId },
        identity: {
          game_session_id: sessionId,
          created_by_id: session.created_by_id,
          created_at: session.created_at,
        },
        status: 'pending',
      }),
    );
    const admin = await legacyAdmin(connection, context);
    for (const table of Object.keys(LEGACY_SESSION_CHILDREN)) {
      const parsedTable = childTableSchema.parse(table);
      const definition = LEGACY_SESSION_CHILDREN[parsedTable];
      failure = `observe:${parsedTable}`;
      const result = await admin
        .from(parsedTable)
        .select(Object.keys(definition.schema.shape).join(','))
        .eq('session_id', sessionId);
      if (!isNil(result.error) || !Array.isArray(result.data))
        throw new Error('legacy子行の観測に失敗しました。');
      for (const raw of result.data) {
        const row = z
          .record(z.string(), z.string())
          .parse(definition.schema.parse(raw));
        if (
          row.session_id !== sessionId ||
          Date.parse(row.created_at ?? '') < Date.parse(context.startedAt) ||
          (!isNil(definition.owner) &&
            row[definition.owner] !== context.actor.appUserId)
        )
          throw new Error('legacy子行の所有条件が一致しません。');
        const primary = Object.fromEntries(
          definition.primary.map((key) => [key, row[key]]),
        );
        targets.push(
          targetSchema.parse({
            table: parsedTable,
            primary,
            identity: row,
            status: 'pending',
          }),
        );
      }
    }
    const parentIdentity = {
      game_session_id: sessionId,
      created_by_id: session.created_by_id,
      session_name: session.session_name,
      created_at: session.created_at,
    };
    // 名前・本文は記録しない。session名は削除直前のメモリ上照合にだけ使用する。
    targets.sort(
      (left, right) =>
        Number(left.table === 'game_sessions') -
        Number(right.table === 'game_sessions'),
    );
    await receipt.save('running', targets, null);
    for (const target of targets) {
      // 記録先の差替えや保存不能も、次の削除を始める前に検出する。
      await receipt.save('running', targets, null);
      failure = `delete:${target.table}`;
      if (
        !isDeepStrictEqual(
          await readSession(connection, context, sessionId),
          session,
        )
      )
        throw new Error('legacy sessionの所有者が削除前に変更されています。');
      const currentAdmin = await legacyAdmin(connection, context);
      if (target.table === 'game_sessions') {
        const references = await inspectFixtureReferences(currentAdmin, {
          kind: 'game_sessions',
          id: sessionId,
          createdBy: context.actor.appUserId,
        });
        if (references.length > 0)
          throw new Error('legacy sessionの参照が残っています。');
        let query = currentAdmin
          .from('game_sessions')
          .delete()
          .match(parentIdentity);
        query = isNil(session.keeper_id)
          ? query.is('keeper_id', null)
          : query.eq('keeper_id', session.keeper_id);
        const deleted = await query;
        if (!isNil(deleted.error))
          throw new Error('legacy sessionの削除に失敗しました。');
      } else {
        const table = childTableSchema.parse(target.table);
        const deleted = await currentAdmin
          .from(table)
          .delete()
          .match(target.identity);
        if (!isNil(deleted.error))
          throw new Error('legacy子行の削除に失敗しました。');
      }
      const remaining = await currentAdmin
        .from(target.table)
        .select('*')
        .match(target.primary)
        .maybeSingle();
      if (!isNil(remaining.error) || !isNil(remaining.data))
        throw new Error('legacy削除後の行が残っています。');
      target.status = 'removed';
      await receipt.save('running', targets, null);
    }
    await receipt.save('passed', targets, null);
  } catch {
    await receipt.save('failed', targets, failure);
    throw new Error(`legacy session cleanupに失敗しました: ${failure}`);
  } finally {
    await receipt.close();
  }
};

/** 候補取得はcreatorとprefixの積で限定し、削除は各sessionの所有検査へ委譲する。 */
export const cleanupLegacySessions = async (
  connection: FixtureConnection,
  rawContext: LegacyContext,
) => {
  const context = assertContext(rawContext);
  const admin = await legacyAdmin(connection, context);
  const result = await admin
    .from('game_sessions')
    .select('game_session_id')
    .eq('created_by_id', context.actor.appUserId)
    .like('session_name', `${legacySessionPrefix(context)}%`);
  if (!isNil(result.error) || !Array.isArray(result.data))
    throw new Error('legacy session一覧の観測に失敗しました。');
  const ids = z
    .array(z.object({ game_session_id: z.ulid() }))
    .parse(result.data);
  const failures: unknown[] = [];
  for (const { game_session_id: id } of ids) {
    try {
      await cleanupLegacySession(connection, context, id);
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length > 0)
    throw new AggregateError(
      failures,
      'legacy sessionの後始末が完了しませんでした。',
    );
};
