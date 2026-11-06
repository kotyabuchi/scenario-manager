import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFixtureJournal } from '../../e2e/fixtures/fixtureManifest';
import {
  fixtureActorSchema,
  fixtureManifestSchema,
} from '../../e2e/fixtures/fixtureSchema';
import { fixture } from './fixtures/environment/ownership';

import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  rmdir,
  symlink,
} from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

vi.mock('./environmentCredentials', () => ({
  assertFixtureConnection: vi.fn(),
}));
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, rename: vi.fn(actual.rename) };
});
const directories: string[] = [];
const auth = {
  kind: 'auth-user',
  id: '11111111-1111-4111-8111-111111111111',
} as const;
const user = {
  kind: 'users',
  id: '01J00000000000000000000001',
  authUserId: auth.id,
} as const;
const identity = {
  project: 'chromium',
  workerIndex: 0,
  caseId: 'schedule.main',
  retry: 0,
};
const setup = async () => {
  const base = join(process.cwd(), 'test-results');
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(join(base, 'fixture-journal-'));
  directories.push(directory);
  const { manifest, lease } = fixture();
  return {
    manifest: { ...manifest, workdir: directory },
    lease,
    anonKey: 'private-anon',
    serviceRoleKey: 'private-admin',
  };
};
afterEach(async () => {
  vi.mocked(rename).mockReset();
  for (const directory of directories.splice(0)) {
    if (
      !resolve(directory).startsWith(
        `${resolve('test-results')}${sep}fixture-journal-`,
      )
    )
      throw new Error('テスト所有外です。');
    await rm(directory, { recursive: true, force: true });
  }
});

describe('fixture journal', () => {
  it.skipIf(process.platform !== 'win32')(
    '一時的なEPERM/EBUSY後もatomic renameで保存する',
    async () => {
      const journal = await createFixtureJournal(await setup(), identity);
      vi.mocked(rename)
        .mockRejectedValueOnce(
          Object.assign(new Error('locked'), { code: 'EPERM' }),
        )
        .mockRejectedValueOnce(
          Object.assign(new Error('busy'), { code: 'EBUSY' }),
        );
      await journal.reserve(auth);
      expect(rename).toHaveBeenCalledTimes(3);
      expect(
        JSON.parse(await readFile(journal.path, 'utf8')).resources,
      ).toEqual([{ resource: auth, status: 'reserved' }]);
    },
  );

  it.skipIf(process.platform !== 'win32')(
    '恒久的なEPERMは上限で失敗し、予約と既存manifestを変更しない',
    async () => {
      const journal = await createFixtureJournal(await setup(), identity);
      const previous = await readFile(journal.path, 'utf8');
      const failure = Object.assign(new Error('locked'), { code: 'EPERM' });
      vi.mocked(rename).mockRejectedValue(failure);
      await expect(journal.reserve(auth)).rejects.toBe(failure);
      expect(rename).toHaveBeenCalledTimes(6);
      expect(journal.snapshot().resources).toEqual([]);
      expect(await readFile(journal.path, 'utf8')).toBe(previous);
    },
  );

  it.skipIf(process.platform !== 'win32')(
    'retry待機中の保存先差替えを次のrename前に拒否する',
    async () => {
      const journal = await createFixtureJournal(await setup(), identity);
      vi.mocked(rename).mockImplementationOnce(async () => {
        await rm(journal.path);
        await mkdir(journal.path);
        throw Object.assign(new Error('locked'), { code: 'EPERM' });
      });
      await expect(journal.reserve(auth)).rejects.toThrow('置換');
      expect(rename).toHaveBeenCalledTimes(1);
      expect(journal.snapshot().resources).toEqual([]);
    },
  );

  it('再試行対象外のrenameエラーを即座に保持する', async () => {
    const journal = await createFixtureJournal(await setup(), identity);
    const failure = Object.assign(new Error('denied'), { code: 'EACCES' });
    vi.mocked(rename).mockRejectedValueOnce(failure);
    await expect(journal.reserve(auth)).rejects.toBe(failure);
    expect(rename).toHaveBeenCalledTimes(1);
  });

  it('直接接続を渡してもworkdirのjunctionを拒否する', async () => {
    const connection = await setup();
    const target = join(connection.manifest.workdir, 'target');
    const alias = join(connection.manifest.workdir, 'alias');
    await mkdir(target);
    await symlink(
      target,
      alias,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    await expect(
      createFixtureJournal(
        { ...connection, manifest: { ...connection.manifest, workdir: alias } },
        identity,
      ),
    ).rejects.toThrow('junction');
  });

  it('行の削除確認が残ったmanifestでcleanup完了を保存しない', async () => {
    const journal = await createFixtureJournal(await setup(), identity);
    await journal.reserve(auth);
    await expect(
      journal.finishCleanup({ status: 'complete', remaining: [], issues: [] }),
    ).rejects.toThrow('削除確認');
  });
  it('run/project/worker/case/retryを所有identityへ含める', async () => {
    const connection = await setup();
    const variants = [
      identity,
      { ...identity, project: 'mobile-chrome' },
      { ...identity, workerIndex: 1 },
      { ...identity, caseId: 'schedule.other' },
      { ...identity, retry: 1 },
    ];
    const journals = await Promise.all(
      variants.map((value) => createFixtureJournal(connection, value)),
    );
    expect(new Set(journals.map((journal) => journal.ownerTag)).size).toBe(5);
    expect(
      journals.every((journal) =>
        journal.directory.startsWith(connection.manifest.workdir),
      ),
    ).toBe(true);
    await expect(createFixtureJournal(connection, identity)).rejects.toThrow();
  });

  it('mutation前に予約を保存し、成功後にconfirmedへ遷移する', async () => {
    const journal = await createFixtureJournal(await setup(), identity);
    await journal.reserve(auth);
    const reserved = JSON.parse(await readFile(journal.path, 'utf8'));
    expect(reserved.resources).toEqual([
      { resource: auth, status: 'reserved' },
    ]);
    await journal.record(auth);
    expect(journal.snapshot().resources[0]?.status).toBe('created');
    expect(await readFile(journal.path, 'utf8')).not.toContain('private-admin');
  });

  it('予約なしの成功記録・同じIDの再予約・identity変更を拒否する', async () => {
    const journal = await createFixtureJournal(await setup(), identity);
    await expect(journal.record(auth)).rejects.toThrow('予約');
    await journal.reserve(auth);
    await expect(journal.reserve(auth)).rejects.toThrow('予約済み');
    await journal.reserve(user);
    await expect(
      journal.record({
        ...user,
        authUserId: '22222222-2222-4222-8222-222222222222',
      }),
    ).rejects.toThrow('identity');
  });

  it('並列の予約を失わず、snapshotから内部状態を変更できない', async () => {
    const journal = await createFixtureJournal(await setup(), identity);
    await Promise.all([
      journal.reserve(auth),
      journal.reserve({ ...auth, id: '22222222-2222-4222-8222-222222222222' }),
    ]);
    const snapshot = journal.snapshot();
    snapshot.resources.length = 0;
    expect(journal.snapshot().resources).toHaveLength(2);
  });

  it('成功記録の保存失敗後も予約を保持し、cleanupを継続できる', async () => {
    const journal = await createFixtureJournal(await setup(), identity);
    await journal.reserve(auth);
    const backup = `${journal.path}.backup`;
    await rename(journal.path, backup);
    await mkdir(journal.path);
    await expect(journal.record(auth)).rejects.toThrow('置換');
    expect(journal.snapshot().resources[0]?.status).toBe('reserved');
    await rmdir(journal.path);
    await rename(backup, journal.path);
    await journal.removed(auth);
    await journal.finishCleanup({
      status: 'complete',
      remaining: [],
      issues: [],
    });
    expect(journal.snapshot().cleanup?.status).toBe('complete');
    await expect(journal.record(auth)).rejects.toThrow('identity');
  });

  it('予約保存に失敗したIDは所有一覧へ追加しない', async () => {
    const journal = await createFixtureJournal(await setup(), identity);
    await rename(journal.path, `${journal.path}.backup`);
    await expect(journal.reserve(auth)).rejects.toThrow();
    expect(journal.snapshot().resources).toEqual([]);
  });

  it('秘密・他caseの参照・重複・不正ID・偽のcleanup完了を拒否する', async () => {
    const journal = await createFixtureJournal(await setup(), identity);
    await expect(journal.reserve(user)).rejects.toThrow('参照先');
    const manifest = journal.snapshot();
    expect(
      fixtureManifestSchema.safeParse({ ...manifest, serviceRoleKey: 'secret' })
        .success,
    ).toBe(false);
    expect(
      fixtureManifestSchema.safeParse({
        ...manifest,
        resources: [
          { resource: auth, status: 'reserved' },
          { resource: auth, status: 'reserved' },
        ],
      }).success,
    ).toBe(false);
    await expect(
      journal.reserve({ ...auth, id: 'not-a-uuid' }),
    ).rejects.toThrow();
    await expect(
      journal.finishCleanup({
        status: 'complete',
        remaining: [auth],
        issues: [],
      }),
    ).rejects.toThrow();
  });

  it('anonymousはUUID/ULIDを持たず、認証actorは両方必須', () => {
    expect(fixtureActorSchema.safeParse({ kind: 'anonymous' }).success).toBe(
      true,
    );
    expect(
      fixtureActorSchema.safeParse({ kind: 'anonymous', authUserId: auth.id })
        .success,
    ).toBe(false);
    expect(
      fixtureActorSchema.safeParse({
        kind: 'creator-only',
        authUserId: auth.id,
        appUserId: user.id,
      }).success,
    ).toBe(true);
    expect(
      fixtureActorSchema.safeParse({ kind: 'keeper-only', authUserId: auth.id })
        .success,
    ).toBe(false);
  });
});
