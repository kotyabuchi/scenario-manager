import { isNil } from 'ramda';

import { assertFixtureConnection } from '../../scripts/e2e/environmentCredentials';
import {
  fixtureManifestSchema,
  fixtureOwnerSchema,
  fixtureResourceKey,
  fixtureResourceSchema,
} from './fixtureSchema';

import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, open, realpath, rename, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import type { FixtureConnection } from '../../scripts/e2e/environmentCredentials';
import type {
  FixtureCleanup,
  FixtureManifest,
  FixtureOwner,
  FixtureResource,
} from './fixtureSchema';

/** 保存形式に秘密を持ち込まず、同じcase/attemptだけを一つのjournalへ集約する。 */
export const fixtureOwnerTag = (owner: FixtureOwner): string =>
  createHash('sha256')
    .update(JSON.stringify(fixtureOwnerSchema.parse(owner)))
    .digest('hex');

/** reserve完了前は作成禁止。record保存が失敗してもreserve済みIDを復旧に使える。 */
export const createFixtureJournal = async (
  connection: FixtureConnection,
  identity: Omit<FixtureOwner, 'lease'>,
): Promise<FixtureJournal> => {
  await assertFixtureConnection(connection);
  const owner = fixtureOwnerSchema.parse({
    ...identity,
    lease: connection.lease,
  });
  const ownerTag = fixtureOwnerTag(owner);
  const workdir = await realpath(connection.manifest.workdir);
  if (workdir !== resolve(connection.manifest.workdir))
    throw new Error(
      'fixtureのworkdirにsymlinkまたはjunctionを使用できません。',
    );
  const root = join(workdir, 'fixtures');
  await mkdir(root, { recursive: true, mode: 0o700 });
  if ((await lstat(root)).isSymbolicLink() || (await realpath(root)) !== root)
    throw new Error(
      'fixture journalの保存先が所有ディレクトリではありません。',
    );
  const directory = join(root, ownerTag);
  await mkdir(directory, { mode: 0o700 });
  const path = join(directory, 'manifest.json');
  let manifest = fixtureManifestSchema.parse({
    schemaVersion: 1,
    owner,
    ownerTag,
    resources: [],
    cleanup: null,
  });
  const save = async (value: FixtureManifest, initial = false) => {
    if (
      (await realpath(directory)) !== directory ||
      (await lstat(directory)).isSymbolicLink()
    )
      throw new Error('fixture journalのディレクトリが置換されています。');
    const contents = `${JSON.stringify(fixtureManifestSchema.parse(value), null, 2)}\n`;
    const temporary = initial ? path : `${path}.${randomUUID()}.tmp`;
    const handle = await open(temporary, 'wx', 0o600);
    try {
      await handle.writeFile(contents, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    if (!initial) {
      try {
        const target = await lstat(path);
        if (!target.isFile() || target.isSymbolicLink())
          throw new Error('fixture journalの保存先が置換されています。');
        await rename(temporary, path);
      } finally {
        await unlink(temporary).catch(() => undefined);
      }
    }
  };
  await save(manifest, true);
  // 同一case内で並列作成されても更新を失わない。失敗後のcleanupもqueueを継続する。
  let queue = Promise.resolve();
  const mutate = (change: (current: FixtureManifest) => FixtureManifest) => {
    const task = queue.then(async () => {
      const next = fixtureManifestSchema.parse(
        change(structuredClone(manifest)),
      );
      await save(next);
      manifest = next;
    });
    queue = task.catch(() => undefined);
    return task;
  };
  const transition = async (
    raw: FixtureResource,
    status: 'reserved' | 'created' | 'removed',
  ) => {
    const resource = fixtureResourceSchema.parse(raw);
    return mutate((current) => {
      const entry = current.resources.find(
        (item) =>
          fixtureResourceKey(item.resource) === fixtureResourceKey(resource),
      );
      if (isNil(entry)) {
        if (status !== 'reserved')
          throw new Error('作成前のresource予約がありません。');
        current.resources.push({ resource, status });
      } else {
        if (
          !isDeepStrictEqual(entry.resource, resource) ||
          (entry.status === 'removed' && status !== 'removed')
        )
          throw new Error('resourceの所有identityを変更できません。');
        if (status === 'reserved') throw new Error('resourceは予約済みです。');
        entry.status = status;
      }
      current.cleanup = null;
      return current;
    });
  };
  return {
    owner,
    ownerTag,
    path,
    directory,
    reserve: (resource) => transition(resource, 'reserved'),
    record: (resource) => transition(resource, 'created'),
    removed: (resource) => transition(resource, 'removed'),
    snapshot: () => structuredClone(manifest),
    finishCleanup: (cleanup) => mutate((current) => ({ ...current, cleanup })),
  };
};

type FixtureJournal = {
  readonly owner: FixtureOwner;
  readonly ownerTag: string;
  readonly path: string;
  readonly directory: string;
  reserve: (resource: FixtureResource) => Promise<void>;
  record: (resource: FixtureResource) => Promise<void>;
  removed: (resource: FixtureResource) => Promise<void>;
  snapshot: () => FixtureManifest;
  finishCleanup: (cleanup: FixtureCleanup) => Promise<void>;
};
export type { FixtureJournal };
