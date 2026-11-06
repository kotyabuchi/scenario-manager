import { isNil } from 'ramda';
import { vi } from 'vitest';
import { z } from 'zod';

import { fixtureOwnerTag } from '../../../e2e/fixtures/fixtureManifest';
import { fixtureResourceKey } from '../../../e2e/fixtures/fixtureSchema';
import { transitionEnvironment } from '../environmentOwnership';
import { at, fixture } from './environment/ownership';

import type { User } from '@supabase/supabase-js';
import type { FixtureJournal } from '../../../e2e/fixtures/fixtureManifest';
import type { FixtureManifest } from '../../../e2e/fixtures/fixtureSchema';
import type { FixtureConnection } from '../environmentCredentials';

const bodySchema = z.record(z.string(), z.unknown());
const authRequest = z.object({
  id: z.uuid(),
  email: z.email(),
  password: z.string(),
  app_metadata: bodySchema,
});
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
/** 署名の安全性を主張せず、実SDKが解析できるmock JWTを作る。 */
export const jwt = (
  role: string,
  sub = '00000000-0000-4000-8000-000000000001',
) =>
  [
    { alg: 'HS256', typ: 'JWT' },
    {
      role,
      sub,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    },
    'synthetic-signature',
  ]
    .map((value) =>
      Buffer.from(
        typeof value === 'string' ? value : JSON.stringify(value),
      ).toString('base64url'),
    )
    .join('.');

/** 所有接続の実検査を通す稼働manifestと、書込順序を観測できるメモリjournal。 */
export const fixtureContext = (workerIndex = 0, caseId = 'schedule-case') => {
  const base = fixture();
  const connection: FixtureConnection = {
    manifest: transitionEnvironment(base.manifest, {
      type: 'running',
      at: at(4),
    }),
    lease: base.lease,
    anonKey: jwt('anon'),
    serviceRoleKey: jwt('service_role'),
  };
  const owner = {
    lease: base.lease,
    project: 'desktop',
    workerIndex,
    caseId,
    retry: 0,
  };
  const ownerTag = fixtureOwnerTag(owner);
  const resources: FixtureManifest['resources'] = [];
  const events: string[] = [];
  const journal: FixtureJournal = {
    owner,
    ownerTag,
    directory: `${connection.manifest.workdir}/fixtures/${ownerTag}`,
    path: `${connection.manifest.workdir}/fixtures/${ownerTag}/manifest.json`,
    reserve: vi.fn(async (resource) => {
      events.push(`reserve:${fixtureResourceKey(resource)}`);
      resources.push({ resource, status: 'reserved' });
    }),
    record: vi.fn(async (resource) => {
      events.push(`record:${fixtureResourceKey(resource)}`);
      const entry = resources.find(
        (item) =>
          fixtureResourceKey(item.resource) === fixtureResourceKey(resource),
      );
      if (isNil(entry)) throw new Error('未予約resourceです。');
      entry.status = 'created';
    }),
    removed: vi.fn(async () => {}),
    snapshot: () =>
      structuredClone({
        schemaVersion: 1,
        owner,
        ownerTag,
        resources,
        cleanup: null,
      }),
    finishCleanup: vi.fn(async () => {}),
  };
  return { connection, journal, events };
};

type ApiRequest = {
  url: URL;
  method: string;
  body: z.infer<typeof bodySchema>;
  headers: Headers;
};
/** 全fetchを置き換え、SDK自身のAuth/PostgREST/cookie処理を通す。実ネットワークは禁止。 */
export const mockFixtureApi = (events: string[] = []) => {
  const users = new Map<string, User>();
  const passwords = new Map<string, string>();
  const rows = new Map<string, z.infer<typeof bodySchema>[]>();
  const requests: ApiRequest[] = [];
  const controls: {
    intercept?: (request: ApiRequest) => Response | undefined;
    userMetadataSize: number;
  } = { userMetadataSize: 0 };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(
        input instanceof Request ? input.url : input.toString(),
      );
      if (url.hostname !== '127.0.0.1' || url.port !== '55321')
        throw new Error('mock外の接続先です。');
      const method = init?.method ?? 'GET';
      const body =
        typeof init?.body === 'string'
          ? bodySchema.parse(JSON.parse(init.body))
          : {};
      const headers = new Headers(init?.headers);
      const request = { url, method, body, headers };
      requests.push(request);
      events.push(`request:${url.pathname}`);
      const interception = controls.intercept?.(request);
      if (!isNil(interception)) return interception;
      if (url.pathname === '/auth/v1/admin/users' && method === 'POST') {
        const values = authRequest.parse(body);
        const user: User = {
          id: values.id,
          email: values.email,
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: values.app_metadata,
          user_metadata: { filler: 'x'.repeat(controls.userMetadataSize) },
          created_at: at(0),
        };
        users.set(user.id, user);
        passwords.set(values.email, values.password);
        return json({ user });
      }
      if (url.pathname === '/auth/v1/token') {
        const user = [...users.values()].find(
          (value) => value.email === body.email,
        );
        if (isNil(user) || passwords.get(String(body.email)) !== body.password)
          return json(
            { message: 'synthetic-login-failure', code: 'invalid_credentials' },
            400,
          );
        return json({
          user,
          access_token: jwt('authenticated', user.id),
          refresh_token: `refresh-${user.id}`,
          token_type: 'bearer',
          expires_in: 3600,
        });
      }
      const token = headers.get('authorization')?.slice('Bearer '.length) ?? '';
      const encoded = token.split('.')[1];
      const claims = isNil(encoded)
        ? {}
        : bodySchema.parse(
            JSON.parse(Buffer.from(encoded, 'base64url').toString()),
          );
      if (url.pathname === '/auth/v1/user')
        return json(users.get(String(claims.sub)));
      if (url.pathname === '/rest/v1/rpc/current_app_user_id') {
        if (claims.role !== 'authenticated')
          throw new Error('利用者JWT以外での本人照合です。');
        return json(
          rows.get('users')?.find((row) => row.auth_user_id === claims.sub)
            ?.user_id ?? null,
        );
      }
      if (url.pathname.startsWith('/rest/v1/')) {
        if (claims.role !== 'service_role')
          throw new Error('fixture作成に利用者JWTを使っています。');
        const table = url.pathname.slice('/rest/v1/'.length);
        const stored = rows.get(table) ?? [];
        rows.set(table, stored);
        if (method === 'POST') stored.push(body);
        const fields =
          url.searchParams
            .get('select')
            ?.split(',')
            .map((field) => field.trim()) ?? [];
        const project = (row: z.infer<typeof bodySchema>) =>
          Object.fromEntries(fields.map((field) => [field, row[field]]));
        if (method === 'POST') return json(project(body));
        return json(
          stored
            .filter((row) =>
              [...url.searchParams].every(
                ([key, value]) =>
                  key === 'select' ||
                  String(row[key]) === value.replace(/^eq\./, ''),
              ),
            )
            .map(project),
        );
      }
      throw new Error('未定義のmock APIです。');
    }),
  );
  return { users, rows, requests, controls, json };
};

export type { ApiRequest };
