import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCaseActors } from '../../e2e/fixtures/actors';
import { fixtureOwnerTag } from '../../e2e/fixtures/fixtureManifest';
import {
  assertLegacyState,
  LEGACY_STATE_FILE,
  legacyAdmin,
  legacyContextFromEnvironment,
  readLegacyContext,
  withLegacyContext,
} from '../../e2e/fixtures/legacyContext';
import { legacyContextSchema } from '../../e2e/fixtures/legacySchema';
import { writeEnvironmentCredentials } from './environmentCredentials';
import { fixtureContext, mockFixtureApi } from './fixtures/fixtureApi';

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { mkdir, readFile, rename, symlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';

const roots: string[] = [];
const setup = async () => {
  const base = join(process.cwd(), 'test-results');
  mkdirSync(base, { recursive: true });
  const root = realpathSync(mkdtempSync(join(base, 'legacy-context-')));
  roots.push(root);
  const { connection, journal: memoryJournal } = fixtureContext(
    0,
    'legacy-suite',
  );
  connection.manifest.repoRoot = root;
  connection.manifest.worktreeRoot = root;
  connection.lease.worktreeRoot = root;
  const workdir = join(
    root,
    'test-results',
    'environments',
    `run-${connection.manifest.runId}`,
  );
  connection.manifest.workdir = workdir;
  mkdirSync(workdir, { recursive: true });
  mkdirSync(join(root, 'e2e'));
  const value = { root, workdir, connection };
  writeFileSync(
    join(value.workdir, 'owner.json'),
    JSON.stringify(connection.lease),
  );
  writeFileSync(
    join(value.workdir, 'manifest.json'),
    JSON.stringify(connection.manifest),
  );
  const credentials = writeEnvironmentCredentials(
    connection.manifest,
    JSON.stringify({
      API_URL: connection.manifest.apiUrl,
      DB_URL: `postgresql://postgres:synthetic@127.0.0.1:${connection.manifest.database.port}/postgres`,
      ANON_KEY: connection.anonKey,
      SERVICE_ROLE_KEY: connection.serviceRoleKey,
    }),
  );
  const owner = {
    ...memoryJournal.owner,
    lease: connection.lease,
    project: 'chromium-auth',
  };
  // 境界に渡す不正値も構成できるtest用のjournal。実journalのreadonlyは緩めない。
  const journal = { ...memoryJournal, owner, ownerTag: fixtureOwnerTag(owner) };
  const api = mockFixtureApi();
  const actors = await createCaseActors(connection, journal);
  const actor = actors['creator-only'];
  api.controls.intercept = ({ url, method }) => {
    if (method !== 'GET') return undefined;
    if (url.pathname.startsWith('/auth/v1/admin/users/'))
      return api.json({
        user: api.users.get(url.pathname.split('/').at(-1) ?? ''),
      });
    if (url.pathname === '/rest/v1/users') {
      const id = url.searchParams.get('user_id')?.replace(/^eq\./, '');
      return api.json(api.rows.get('users')?.find((row) => row.user_id === id));
    }
    return undefined;
  };
  return {
    ...value,
    credentials,
    journal,
    api,
    actor,
    stateFile: join(value.root, LEGACY_STATE_FILE),
    contextFile: join(value.workdir, 'legacy-context.private.json'),
  };
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  for (const root of roots.splice(0)) {
    if (!root.startsWith(`${resolve('test-results')}${sep}legacy-context-`))
      throw new Error('テスト一時領域以外は削除しません。');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('legacy専用state/contextの所有権と後始末', () => {
  it('実credentialsと固定contextを読め、operation完了まで両fileを保持し返値を返す', async () => {
    const value = await setup();
    let entered = () => {};
    let finish = () => {};
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const running = withLegacyContext(
      value.connection,
      value.journal,
      value.actor,
      async (file, context) => {
        expect(file).toBe(value.contextFile);
        expect(
          readLegacyContext(value.root, value.credentials, file).context,
        ).toEqual(context);
        expect(() => assertLegacyState(value.root, context)).not.toThrow();
        expect(legacyContextSchema.safeParse(context).success).toBe(true);
        expect(
          (await readFile(file, 'utf8')).includes(
            value.connection.serviceRoleKey,
          ),
        ).toBe(false);
        entered();
        await waiting;
        return 'finished';
      },
    );
    await started;
    try {
      expect(existsSync(value.stateFile) && existsSync(value.contextFile)).toBe(
        true,
      );
    } finally {
      finish();
    }
    expect(await running).toBe('finished');
    expect(existsSync(value.stateFile) || existsSync(value.contextFile)).toBe(
      false,
    );
  });

  it('既存stateを上書きせずoperationへ進まない', async () => {
    const value = await setup();
    mkdirSync(dirname(value.stateFile));
    writeFileSync(value.stateFile, 'existing-private-state');
    const operation = vi.fn(async () => {});
    await expect(
      withLegacyContext(
        value.connection,
        value.journal,
        value.actor,
        operation,
      ),
    ).rejects.toThrow('legacy実行');
    expect(operation).not.toHaveBeenCalled();
    expect(
      (await readFile(value.stateFile, 'utf8')) === 'existing-private-state',
    ).toBe(true);
    expect(existsSync(value.contextFile)).toBe(false);
  });

  it('context書込が失敗したら作成済stateだけを削除する', async () => {
    const value = await setup();
    writeFileSync(value.contextFile, 'existing-private-context');
    const operation = vi.fn(async () => {});
    await expect(
      withLegacyContext(
        value.connection,
        value.journal,
        value.actor,
        operation,
      ),
    ).rejects.toThrow('legacy実行');
    expect(operation).not.toHaveBeenCalled();
    expect(existsSync(value.stateFile)).toBe(false);
    expect(
      (await readFile(value.contextFile, 'utf8')) ===
        'existing-private-context',
    ).toBe(true);
  });

  it('operationが失敗しても両fileを削除し生のprivate errorを表題へ出さない', async () => {
    const value = await setup();
    const running = withLegacyContext(
      value.connection,
      value.journal,
      value.actor,
      async () => {
        throw new Error('private-operation-value');
      },
    );
    await expect(running).rejects.toThrow('legacy実行');
    expect(existsSync(value.stateFile) || existsSync(value.contextFile)).toBe(
      false,
    );
  });

  it.each([
    'state',
    'context',
  ] as const)('%sの同inode内容改変は削除せず、残りの所有fileは片付ける', async (kind) => {
    const value = await setup();
    const file = kind === 'state' ? value.stateFile : value.contextFile;
    const other = kind === 'state' ? value.contextFile : value.stateFile;
    await expect(
      withLegacyContext(
        value.connection,
        value.journal,
        value.actor,
        async (_file, context) => {
          await writeFile(file, 'modified-private-value');
          if (kind === 'state')
            expect(() => assertLegacyState(value.root, context)).toThrow(
              '変更',
            );
        },
      ),
    ).rejects.toThrow('後始末');
    expect((await readFile(file, 'utf8')) === 'modified-private-value').toBe(
      true,
    );
    expect(existsSync(other)).toBe(false);
  });

  it.each([
    'state',
    'context',
  ] as const)('%sを同内容の別inodeへ交換しても削除しない', async (kind) => {
    const value = await setup();
    const file = kind === 'state' ? value.stateFile : value.contextFile;
    await expect(
      withLegacyContext(
        value.connection,
        value.journal,
        value.actor,
        async () => {
          const contents = await readFile(file, 'utf8');
          await rename(file, `${file}.original`);
          await writeFile(file, contents, { flag: 'wx' });
        },
      ),
    ).rejects.toThrow('後始末');
    expect(existsSync(file) && existsSync(`${file}.original`)).toBe(true);
  });

  it.each([
    'e2e',
    'auth',
    'root',
  ] as const)('%sのjunction経由で実体外へstateを書き込まない', async (kind) => {
    const value = await setup();
    const outside = join(value.root, 'outside');
    await mkdir(outside);
    if (kind === 'e2e') {
      rmSync(join(value.root, 'e2e'), { recursive: true });
      await symlink(
        outside,
        join(value.root, 'e2e'),
        process.platform === 'win32' ? 'junction' : 'dir',
      );
    } else if (kind === 'auth') {
      await symlink(
        outside,
        dirname(value.stateFile),
        process.platform === 'win32' ? 'junction' : 'dir',
      );
    } else {
      const alias = join(value.root, 'alias');
      await symlink(
        value.root,
        alias,
        process.platform === 'win32' ? 'junction' : 'dir',
      );
      value.connection.manifest.worktreeRoot = alias;
      value.connection.lease.worktreeRoot = alias;
      value.journal.ownerTag = fixtureOwnerTag(value.journal.owner);
    }
    const operation = vi.fn(async () => {});
    await expect(
      withLegacyContext(
        value.connection,
        value.journal,
        value.actor,
        operation,
      ),
    ).rejects.toThrow();
    expect(operation).not.toHaveBeenCalled();
    expect(
      existsSync(join(outside, 'user.json')) ||
        existsSync(join(outside, '.auth', 'user.json')) ||
        existsSync(value.stateFile),
    ).toBe(false);
  });

  it.each([
    'tag',
    'lease',
    'project',
    'worker',
    'case',
    'retry',
  ] as const)('不正なjournal %sではfile作成前に拒否する', async (kind) => {
    const value = await setup();
    if (kind === 'tag') value.journal.ownerTag = '0'.repeat(64);
    if (kind === 'lease')
      value.journal.owner = {
        ...value.journal.owner,
        lease: {
          ...value.connection.lease,
          ownerNonce: '00000000-0000-4000-8000-000000000000',
        },
      };
    if (kind === 'project') value.journal.owner.project = 'other';
    if (kind === 'worker') value.journal.owner.workerIndex = 1;
    if (kind === 'case') value.journal.owner.caseId = 'other';
    if (kind === 'retry') value.journal.owner.retry = 1;
    const operation = vi.fn(async () => {});
    await expect(
      withLegacyContext(
        value.connection,
        value.journal,
        value.actor,
        operation,
      ),
    ).rejects.toThrow();
    expect(operation).not.toHaveBeenCalled();
    expect(existsSync(value.stateFile) || existsSync(value.contextFile)).toBe(
      false,
    );
  });
});

describe('legacy読取設定とactor本人確認', () => {
  it.each([
    'tag',
    'lease',
    'path',
    'size',
    'malformed',
  ] as const)('読取contextの%s不整合を拒否する', async (kind) => {
    const value = await setup();
    await withLegacyContext(
      value.connection,
      value.journal,
      value.actor,
      async (file, context) => {
        const changed = structuredClone(context);
        if (kind === 'tag') changed.ownerTag = '0'.repeat(64);
        if (kind === 'lease')
          changed.owner.lease.ownerNonce =
            '00000000-0000-4000-8000-000000000000';
        const original = readFileSync(file, 'utf8');
        try {
          if (kind === 'size') writeFileSync(file, 'x'.repeat(17 * 1024));
          else if (kind === 'malformed') writeFileSync(file, '{invalid');
          else writeFileSync(file, JSON.stringify(changed));
          expect(() =>
            readLegacyContext(
              value.root,
              value.credentials,
              kind === 'path' ? join(value.workdir, 'other.json') : file,
            ),
          ).toThrow();
        } finally {
          writeFileSync(file, original);
        }
      },
    );
  });

  it('専用runのcontext/credentials欠落を通常helperへfallbackしない', () => {
    vi.stubEnv('SCENARIO_E2E_RUN_ID', '012345abcdef');
    vi.stubEnv('SCENARIO_E2E_LEGACY_CONTEXT', undefined);
    expect(() => legacyContextFromEnvironment()).toThrow('legacy設定');
    vi.stubEnv('SCENARIO_E2E_LEGACY_CONTEXT', '/nonexistent-context');
    vi.stubEnv('SCENARIO_E2E_CREDENTIALS', undefined);
    expect(() => legacyContextFromEnvironment()).toThrow('接続設定');
    vi.stubEnv('SCENARIO_E2E_LEGACY_CONTEXT', undefined);
    vi.stubEnv('SCENARIO_E2E_RUN_ID', undefined);
    expect(legacyContextFromEnvironment()).toBeUndefined();
  });

  it('本人のAuth UUIDとapp ULIDを実SDK経由で照合する', async () => {
    const value = await setup();
    await withLegacyContext(
      value.connection,
      value.journal,
      value.actor,
      async (_file, context) => {
        await expect(
          legacyAdmin(value.connection, context),
        ).resolves.toBeDefined();
        const requests = value.api.requests.slice(-2);
        expect(requests[0]?.url.pathname).toBe(
          `/auth/v1/admin/users/${context.actor.authUserId}`,
        );
        expect(requests[1]?.url.searchParams.get('user_id')).toBe(
          `eq.${context.actor.appUserId}`,
        );
      },
    );
  });

  it.each([
    'authId',
    'appId',
    'authLink',
    'ownerTag',
    'authError',
    'dbError',
  ] as const)('%s取り違え/エラーを拒否する', async (kind) => {
    const value = await setup();
    await withLegacyContext(
      value.connection,
      value.journal,
      value.actor,
      async (_file, context) => {
        const original = value.api.controls.intercept;
        value.api.controls.intercept = (request) => {
          if (request.url.pathname.startsWith('/auth/v1/admin/users/')) {
            if (kind === 'authError')
              return value.api.json({ message: 'private-api-error' }, 400);
            const user = value.api.users.get(context.actor.authUserId);
            if (!user) throw new Error('mock actorがありません。');
            return value.api.json({
              user: {
                ...user,
                id:
                  kind === 'authId'
                    ? '22222222-2222-4222-8222-222222222222'
                    : user.id,
                app_metadata:
                  kind === 'ownerTag'
                    ? { e2e_fixture_owner: '0'.repeat(64) }
                    : user.app_metadata,
              },
            });
          }
          if (request.url.pathname === '/rest/v1/users') {
            if (kind === 'dbError')
              return value.api.json({ message: 'private-db-error' }, 400);
            return value.api.json({
              user_id:
                kind === 'appId'
                  ? '01J00000000000000000000000'
                  : context.actor.appUserId,
              auth_user_id:
                kind === 'authLink'
                  ? '22222222-2222-4222-8222-222222222222'
                  : context.actor.authUserId,
            });
          }
          return original?.(request);
        };
        await expect(legacyAdmin(value.connection, context)).rejects.toThrow(
          '本人確認',
        );
      },
    );
  });
});
