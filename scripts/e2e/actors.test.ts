import { createServerClient } from '@supabase/ssr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCaseActors } from '../../e2e/fixtures/actors';
import { assertActorIdentity } from '../../e2e/fixtures/authState';
import { fixtureContext, mockFixtureApi } from './fixtures/fixtureApi';

import type { Database } from '../../src/db/types';

afterEach(() => vi.unstubAllGlobals());

describe('case別actorとSDK認証state', () => {
  it('4組のAuth UUID/app ULIDを事前予約し、JWT本人照合後に別々のactorを返す', async () => {
    const { connection, journal, events } = fixtureContext();
    const api = mockFixtureApi(events);
    const actors = await createCaseActors(connection, journal);
    expect(journal.snapshot().resources).toHaveLength(8);
    const identities = Object.values(actors).map((actor) => actor.identity);
    expect(
      new Set(
        identities
          .filter((identity) => identity.kind !== 'anonymous')
          .map((identity) => identity.appUserId),
      ).size,
    ).toBe(4);
    expect(api.users.size).toBe(4);
    for (const [id, user] of api.users) {
      expect(user.app_metadata.e2e_fixture_owner).toBe(journal.ownerTag);
      expect(events.indexOf(`reserve:auth-user:${id}`)).toBeLessThan(
        events.indexOf(`record:auth-user:${id}`),
      );
    }
    expect(events[0]).toMatch(/^reserve:auth-user:/);
    expect(events[1]).toBe('request:/auth/v1/admin/users');
    expect(
      api.requests.filter(({ url }) =>
        url.pathname.includes('current_app_user_id'),
      ),
    ).toHaveLength(4);
    expect(JSON.stringify(journal.snapshot())).not.toMatch(
      /password|access_token|refresh_token|auth-token|example\.test/,
    );
    expect(actors.anonymous.storageState('http://127.0.0.1:3100')).toEqual({
      cookies: [],
      origins: [],
    });
  });

  it('2 worker・別caseのユーザーとsession cookieを共有しない', async () => {
    const one = fixtureContext(0, 'one');
    const two = fixtureContext(1, 'two');
    mockFixtureApi();
    const first = await createCaseActors(one.connection, one.journal);
    const second = await createCaseActors(two.connection, two.journal);
    expect(first['creator-only'].identity.authUserId).not.toBe(
      second['creator-only'].identity.authUserId,
    );
    expect(first['creator-only'].identity.appUserId).not.toBe(
      second['creator-only'].identity.appUserId,
    );
    expect(
      first['creator-only'].storageState('http://localhost:3100'),
    ).not.toEqual(second['creator-only'].storageState('http://localhost:3100'));
  });

  it('SDKの分割cookieをそのまま使い、宛先hostはAPIではなくbaseURLから決める', async () => {
    const context = fixtureContext();
    const api = mockFixtureApi();
    api.controls.userMetadataSize = 6000;
    const actor = (await createCaseActors(context.connection, context.journal))[
      'creator-only'
    ];
    const state = actor.storageState('http://localhost:3100');
    expect(state.cookies.length).toBeGreaterThan(1);
    expect(
      state.cookies.every(
        ({ domain, path, secure }) =>
          domain === 'localhost' && path === '/' && !secure,
      ),
    ).toBe(true);
    expect(state.cookies.map(({ name }) => name).join(',')).toContain('.0');
    const restored = createServerClient<Database>(
      context.connection.manifest.apiUrl,
      context.connection.anonKey,
      {
        cookies: { getAll: () => state.cookies, setAll: () => {} },
      },
    );
    await expect(
      assertActorIdentity(restored, actor.identity, context.journal.ownerTag),
    ).resolves.toBeUndefined();
    expect(
      actor
        .storageState('http://127.0.0.1:3100')
        .cookies.every(({ domain }) => domain === '127.0.0.1'),
    ).toBe(true);
    expect(() => actor.storageState('https://example.com')).toThrow();
    expect(() => actor.storageState('http://localhost:3100/private')).toThrow();
  });

  it('停止済み/remote接続や他leaseのjournalはネットワークより先に拒否する', async () => {
    const { connection, journal } = fixtureContext();
    const api = mockFixtureApi();
    connection.manifest.apiUrl = 'https://example.com';
    await expect(createCaseActors(connection, journal)).rejects.toThrow('接続');
    expect(api.requests).toHaveLength(0);
    connection.manifest.apiUrl = 'http://127.0.0.1:55321';
    journal.owner.lease = {
      ...journal.owner.lease,
      ownerNonce: '00000000-0000-4000-8000-000000000001',
    };
    await expect(createCaseActors(connection, journal)).rejects.toThrow(
      'journal',
    );
    expect(api.requests).toHaveLength(0);
  });

  it('journal reserve失敗時にAuthユーザーを作らない', async () => {
    const { connection, journal } = fixtureContext();
    const api = mockFixtureApi();
    vi.mocked(journal.reserve).mockRejectedValueOnce(new Error('disk failed'));
    await expect(createCaseActors(connection, journal)).rejects.toThrow();
    expect(api.requests).toHaveLength(0);
  });

  it.each([
    'auth-id',
    'user-insert',
    'login',
    'mapping',
    'owner',
  ] as const)('%s不整合を成功扱いせず予約IDを残す', async (fault) => {
    const { connection, journal } = fixtureContext();
    const api = mockFixtureApi();
    api.controls.intercept = ({ url }) => {
      if (fault === 'auth-id' && url.pathname === '/auth/v1/admin/users')
        return api.json({
          user: { id: '00000000-0000-4000-8000-000000000001' },
        });
      if (fault === 'user-insert' && url.pathname === '/rest/v1/users')
        return api.json(
          { message: 'private-service-key', code: 'failure' },
          400,
        );
      if (fault === 'login' && url.pathname === '/auth/v1/token')
        return api.json(
          { message: 'private-password', code: 'invalid_credentials' },
          400,
        );
      if (fault === 'mapping' && url.pathname.includes('current_app_user_id'))
        return api.json('00000000000000000000000001');
      if (fault === 'owner' && url.pathname === '/auth/v1/user') {
        for (const user of api.users.values())
          return api.json({
            ...user,
            app_metadata: { e2e_fixture_owner: 'another-case' },
          });
      }
      return undefined;
    };
    const error = await createCaseActors(connection, journal).catch(
      (value: unknown) => value,
    );
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).not.toMatch(/private-service-key|private-password/);
    expect(journal.snapshot().resources.length).toBeGreaterThan(0);
    if (fault === 'auth-id')
      expect(journal.snapshot().resources[0]?.status).toBe('reserved');
  });

  it('別actorのclientを渡した本人照合を拒否する', async () => {
    const { connection, journal } = fixtureContext();
    mockFixtureApi();
    const actors = await createCaseActors(connection, journal);
    await expect(
      assertActorIdentity(
        actors.outsider.client,
        actors['creator-only'].identity,
        journal.ownerTag,
      ),
    ).rejects.toThrow('ログインユーザー');
  });
});
