import { isNil } from 'ramda';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FIXTURE_PARENT_REFERENCES } from '../../e2e/fixtures/fixtureCleanupRelations';
import { fixtureOwnerTag } from '../../e2e/fixtures/fixtureManifest';
import {
  cleanupLegacySession,
  cleanupLegacySessions,
} from '../../e2e/fixtures/legacySessionCleanup';
import { LEGACY_SESSION_CHILDREN } from '../../e2e/fixtures/legacySessionResources';
import { EXPECTED_ENVIRONMENT_CATALOG } from './environmentCatalogExpected';
import { fixture } from './fixtures/environment/ownership';

import { readdirSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

import type { LegacyContext } from '../../e2e/fixtures/legacySchema';

const mocks = vi.hoisted(() => ({ admin: vi.fn() }));
vi.mock('../../e2e/fixtures/legacyContext', () => ({
  legacyAdmin: mocks.admin,
  legacySessionPrefix: (context: LegacyContext) =>
    `[E2E:${context.ownerTag.slice(0, 12)}]`,
}));
const roots: string[] = [];
const ID = '01J00000000000000000000001';
const ACTOR = '01J00000000000000000000002';
const OTHER = '01J00000000000000000000999';
const START = '2026-11-05T00:00:00.000Z';
const CREATED = '2026-11-05T00:01:00.000Z';
const OLD = '2026-11-04T23:59:00.000Z';
const tables = Object.keys(LEGACY_SESSION_CHILDREN);
type Query = {
  table: string;
  filters: Record<string, unknown>;
  deleting: boolean;
  single: boolean;
};
beforeEach(() => vi.resetAllMocks());
afterEach(async () => {
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) {
    if (
      !resolve(root).startsWith(
        `${resolve('test-results')}${sep}legacy-cleanup-`,
      )
    )
      throw new Error('テスト所有外です。');
    await rm(root, { recursive: true, force: true });
  }
});

const setup = async () => {
  await mkdir(resolve('test-results'), { recursive: true });
  const root = await mkdtemp(join(resolve('test-results'), 'legacy-cleanup-'));
  roots.push(root);
  const base = fixture();
  const connection = {
    manifest: { ...base.manifest, workdir: root },
    lease: base.lease,
    anonKey: 'private-anon',
    serviceRoleKey: 'private-admin',
  };
  const owner = {
    lease: base.lease,
    project: 'chromium' as const,
    workerIndex: 0 as const,
    caseId: 'legacy-suite' as const,
    retry: 0 as const,
  };
  const context: LegacyContext = {
    schemaVersion: 1,
    owner,
    ownerTag: fixtureOwnerTag(owner),
    actor: {
      kind: 'creator-only',
      appUserId: ACTOR,
      authUserId: '11111111-1111-4111-8111-111111111111',
    },
    startedAt: START,
    stateHash: 'a'.repeat(64),
  };
  const session = {
    game_session_id: ID,
    created_by_id: ACTOR,
    keeper_id: ACTOR,
    session_name: `[E2E:${context.ownerTag.slice(0, 12)}] private-session-name`,
    created_at: CREATED,
  };
  const rows = new Map<string, Record<string, unknown>[]>([
    ['game_sessions', [session]],
  ]);
  for (const [table, definition] of Object.entries(LEGACY_SESSION_CHILDREN)) {
    const row: Record<string, unknown> = {
      session_id: ID,
      created_at: CREATED,
      private_text: 'private-body',
    };
    for (const key of definition.primary)
      row[key] = key === 'user_id' ? ACTOR : ID;
    if (!isNil(definition.owner)) row[definition.owner] = ACTOR;
    rows.set(table, [row]);
  }
  const deleted: Query[] = [];
  const observed: Query[] = [];
  const controls: {
    errors: Set<string>;
    deleteErrors: Set<string>;
    noOp: Set<string>;
    hook?: (query: Query) => void;
    override?: (query: Query, matches: Record<string, unknown>[]) => unknown;
  } = { errors: new Set(), deleteErrors: new Set(), noOp: new Set() };
  const client = {
    from: (table: string) => {
      const filters: Record<string, unknown> = {};
      let deleting = false;
      let limit: number | undefined;
      let prefix: string | undefined;
      const finish = async (single: boolean) => {
        const query = { table, filters: { ...filters }, deleting, single };
        controls.hook?.(query);
        observed.push(query);
        if (
          controls.errors.has(table) ||
          (deleting && controls.deleteErrors.has(table))
        )
          return { data: null, error: { message: 'private-db-error' } };
        const current = rows.get(table) ?? [];
        const matches = current.filter(
          (row) =>
            Object.entries(filters).every(
              ([key, value]) => row[key] === value,
            ) &&
            (isNil(prefix) ||
              (typeof row.session_name === 'string' &&
                row.session_name.startsWith(prefix))),
        );
        if (deleting) {
          deleted.push(query);
          if (!controls.noOp.has(table))
            rows.set(
              table,
              current.filter((row) => !matches.includes(row)),
            );
        }
        const data = controls.override?.(query, matches);
        return {
          data: !isNil(data)
            ? data
            : single
              ? (matches[0] ?? null)
              : isNil(limit)
                ? matches
                : matches.slice(0, limit),
          error: null,
        };
      };
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          filters[key] = value;
          return query;
        },
        is: (key: string, value: unknown) => {
          filters[key] = value;
          return query;
        },
        like: (_key: string, value: string) => {
          prefix = value.slice(0, -1);
          return query;
        },
        match: (value: Record<string, unknown>) => {
          Object.assign(filters, value);
          return query;
        },
        limit: (value: number) => {
          limit = value;
          return query;
        },
        delete: () => {
          deleting = true;
          return query;
        },
        maybeSingle: () => finish(true),
        // biome-ignore lint/suspicious/noThenProperty: PostgRESTのthenableをDBなしで再現する。
        then: (
          resolve: (value: Awaited<ReturnType<typeof finish>>) => unknown,
        ) => finish(false).then(resolve),
      };
      return query;
    },
  };
  mocks.admin.mockResolvedValue(client);
  const receipts = async () => {
    const directory = join(root, 'legacy-cleanup');
    const files = await readdir(directory);
    return Promise.all(
      files.map(async (file) =>
        (await readFile(join(directory, file), 'utf8'))
          .trim()
          .split('\n')
          .map((line): unknown => JSON.parse(line)),
      ),
    );
  };
  return {
    connection,
    context,
    session,
    rows,
    controls,
    observed,
    deleted,
    receipts,
    root,
  };
};

describe('local専用UI session cleanup', () => {
  it('実DBのnaive/offset付きcreated_atをUTCで照合しraw値でexact削除する', async () => {
    vi.stubEnv('TZ', 'Asia/Tokyo');
    const value = await setup();
    const naive = '2026-11-05T00:01:00.123456';
    value.session.created_at = naive;
    for (const table of tables) {
      const child = value.rows.get(table)?.[0];
      if (isNil(child)) throw new Error('fixture不足');
      child.created_at = table.endsWith('time_blocks')
        ? `${naive}+00:00`
        : naive;
    }
    await cleanupLegacySession(value.connection, value.context, ID);
    expect(value.deleted).toHaveLength(8);
    expect(value.deleted.at(-1)?.filters.created_at).toBe(naive);
    expect((await value.receipts())[0]?.at(-1)).toMatchObject({
      status: 'passed',
      remaining: [],
    });
  });

  it('対応7テーブルがfixture保護一覧と固定catalogのincoming FKに完全一致する', () => {
    const expected = EXPECTED_ENVIRONMENT_CATALOG.constraints
      .filter(
        (entry) =>
          entry.type === 'f' &&
          /REFERENCES game_sessions\(/.test(entry.definition),
      )
      .map((entry) => entry.table)
      .sort();
    expect(tables.toSorted()).toEqual(expected);
    expect(
      FIXTURE_PARENT_REFERENCES.filter(
        (entry) => entry.parent === 'game_sessions',
      )
        .map((entry) => entry.table)
        .sort(),
    ).toEqual(expected);
    expect(expected).toHaveLength(7);
  });

  it('全子観測と専用計画保存後にexact削除し、本文を保存しない', async () => {
    const value = await setup();
    let checked = false;
    value.controls.hook = (query) => {
      if (query.deleting && !checked) {
        checked = true;
        const directory = join(value.root, 'legacy-cleanup');
        const file = readdirSync(directory)[0];
        if (isNil(file)) throw new Error('削除前の記録がありません。');
        const snapshots = readFileSync(join(directory, file), 'utf8')
          .trim()
          .split('\n');
        expect(JSON.parse(snapshots.at(-1) ?? '{}')).toMatchObject({
          status: 'running',
          targets: expect.any(Array),
          remaining: expect.any(Array),
        });
        expect(JSON.parse(snapshots.at(-1) ?? '{}').targets).toHaveLength(8);
        expect(
          tables.every((table) =>
            value.observed.some(
              (entry) => entry.table === table && !entry.deleting,
            ),
          ),
        ).toBe(true);
      }
    };
    await cleanupLegacySession(value.connection, value.context, ID);
    expect(value.deleted).toHaveLength(8);
    expect(value.deleted.at(-1)?.table).toBe('game_sessions');
    for (const query of value.deleted.filter(
      (entry) => entry.table !== 'game_sessions',
    )) {
      expect(query.filters).toMatchObject({
        session_id: ID,
        created_at: CREATED,
      });
      expect(Object.keys(query.filters).length).toBeGreaterThanOrEqual(3);
    }
    const receipts = await value.receipts();
    expect(receipts[0]?.at(-1)).toMatchObject({
      status: 'passed',
      remaining: [],
    });
    expect(receipts[0]?.[1]).toMatchObject({
      status: 'running',
      targets: expect.arrayContaining([
        expect.objectContaining({ table: 'game_sessions', status: 'pending' }),
      ]),
    });
    expect(JSON.stringify(receipts)).not.toMatch(
      /private-session-name|private-body|private-admin|private-anon/,
    );
    expect(mocks.admin.mock.calls.length).toBeGreaterThan(8);
  });

  it.each([
    'owner',
    'prefix',
    'old',
    'keeper',
  ] as const)('sessionの%s不一致は子削除前に拒否する', async (fault) => {
    const value = await setup();
    if (fault === 'owner') value.session.created_by_id = OTHER;
    if (fault === 'prefix') value.session.session_name = 'legacy-seed-session';
    if (fault === 'old') value.session.created_at = OLD;
    if (fault === 'keeper') value.session.keeper_id = OTHER;
    await expect(
      cleanupLegacySession(value.connection, value.context, ID),
    ).rejects.toThrow('observe-session');
    expect(value.deleted).toEqual([]);
    expect((await value.receipts())[0]?.at(-1)).toMatchObject({
      status: 'failed',
    });
  });

  it('keeper=nullの所有sessionも削除できる', async () => {
    const value = await setup();
    Reflect.set(value.session, 'keeper_id', null);
    await cleanupLegacySession(value.connection, value.context, ID);
    expect(value.deleted.at(-1)?.filters).toMatchObject({ keeper_id: null });
  });

  it.each(tables)('%sの古い子は全削除を開始する前に拒否する', async (table) => {
    const value = await setup();
    const child = value.rows.get(table)?.[0];
    if (isNil(child)) throw new Error('fixture不足');
    child.created_at = OLD;
    await expect(
      cleanupLegacySession(value.connection, value.context, ID),
    ).rejects.toThrow(`observe:${table}`);
    expect(value.deleted).toEqual([]);
    expect((await value.receipts())[0]?.at(-1)).toMatchObject({
      status: 'failed',
      remaining: expect.arrayContaining([
        expect.objectContaining({ table: 'game_sessions' }),
      ]),
    });
  });

  it.each(
    Object.entries(LEGACY_SESSION_CHILDREN).filter(
      ([, value]) => !isNil(value.owner),
    ),
  )('%sの未知actor子を削除前に拒否する', async (table, definition) => {
    const value = await setup();
    const child = value.rows.get(table)?.[0];
    if (isNil(child) || isNil(definition.owner)) throw new Error('fixture不足');
    child[definition.owner] = OTHER;
    await expect(
      cleanupLegacySession(value.connection, value.context, ID),
    ).rejects.toThrow('observe:');
    expect(value.deleted).toEqual([]);
  });

  it('別sessionの返却行をDB応答からそのまま所有扱いしない', async () => {
    const value = await setup();
    value.controls.override = (query, matches) =>
      query.table === 'session_links' && !query.deleting
        ? matches.map((row) => ({ ...row, session_id: OTHER }))
        : undefined;
    await expect(
      cleanupLegacySession(value.connection, value.context, ID),
    ).rejects.toThrow('observe:session_links');
    expect(value.deleted).toEqual([]);
  });

  it.each([
    'observe',
    'delete',
    'remaining',
  ] as const)('DB%s失敗を成功に変えず残留を記録する', async (fault) => {
    const value = await setup();
    if (fault === 'observe') value.controls.errors.add('session_links');
    if (fault === 'delete') value.controls.deleteErrors.add('session_links');
    if (fault === 'remaining') value.controls.noOp.add('session_links');
    await expect(
      cleanupLegacySession(value.connection, value.context, ID),
    ).rejects.toThrow('cleanup');
    expect(value.deleted.some((entry) => entry.table === 'game_sessions')).toBe(
      false,
    );
    const receipts = await value.receipts();
    expect(receipts[0]?.at(-1)).toMatchObject({
      status: 'failed',
      remaining: expect.arrayContaining([
        expect.objectContaining({ table: 'game_sessions' }),
      ]),
    });
    expect(JSON.stringify(receipts)).not.toContain('private-db-error');
  });

  it('親identityが観測後に変われば最初の削除前に拒否する', async () => {
    const value = await setup();
    value.controls.hook = (query) => {
      if (query.table === 'user_scenario_preferences' && !query.deleting)
        value.session.created_by_id = OTHER;
    };
    await expect(
      cleanupLegacySession(value.connection, value.context, ID),
    ).rejects.toThrow('delete:session_links');
    expect(value.deleted).toEqual([]);
  });

  it('観測後に増えた未知参照をCASCADE任せにせず親削除前に止める', async () => {
    const value = await setup();
    value.controls.hook = (query) => {
      if (
        query.table === 'game_sessions' &&
        !query.deleting &&
        value.deleted.length === 7
      )
        value.rows.set('session_links', [
          { link_id: OTHER, session_id: ID, created_at: CREATED },
        ]);
    };
    await expect(
      cleanupLegacySession(value.connection, value.context, ID),
    ).rejects.toThrow('delete:game_sessions');
    expect(value.deleted).toHaveLength(7);
  });

  it('不存在は再実行として成功し、観測エラーは不在にしない', async () => {
    const value = await setup();
    value.rows.set('game_sessions', []);
    await cleanupLegacySession(value.connection, value.context, ID);
    expect(value.deleted).toEqual([]);
    value.controls.errors.add('game_sessions');
    await expect(
      cleanupLegacySession(value.connection, value.context, ID),
    ).rejects.toThrow('observe-session');
  });

  it('全cleanupはcreatorとprefixで候補を絞り、seedと別ownerを残す', async () => {
    const value = await setup();
    const foreign = {
      ...value.session,
      game_session_id: OTHER,
      created_by_id: OTHER,
    };
    const seed = {
      ...value.session,
      game_session_id: '01J00000000000000000000888',
      session_name: 'legacy-seed-session',
    };
    value.rows.get('game_sessions')?.push(foreign, seed);
    await cleanupLegacySessions(value.connection, value.context);
    expect(value.rows.get('game_sessions')).toEqual([foreign, seed]);
    expect(value.observed[0]?.filters).toEqual({ created_by_id: ACTOR });
  });

  it('偽ownerTagと不正session IDはadmin接続前に拒否する', async () => {
    const value = await setup();
    await expect(
      cleanupLegacySession(
        value.connection,
        { ...value.context, ownerTag: 'b'.repeat(64) },
        ID,
      ),
    ).rejects.toThrow('所有identity');
    await expect(
      cleanupLegacySession(value.connection, value.context, 'invalid'),
    ).rejects.toThrow();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
});
