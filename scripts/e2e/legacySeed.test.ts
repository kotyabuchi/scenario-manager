import { isNil } from 'ramda';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fixtureManifestSchema,
  fixtureResourceKey,
} from '../../e2e/fixtures/fixtureSchema';
import { prepareLegacySeed } from '../../e2e/fixtures/legacySeed';
import { fixtureContext, mockFixtureApi } from './fixtures/fixtureApi';

afterEach(() => vi.unstubAllGlobals());

const setup = () => {
  const context = fixtureContext(0, 'legacy-suite');
  const api = mockFixtureApi(context.events);
  // 既存fixture APIへ、seedが既存所有行を更新するPATCHだけを追加する。
  const patch: NonNullable<typeof api.controls.intercept> = ({
    url,
    method,
    body,
  }) => {
    if (method !== 'PATCH') return undefined;
    const table = url.pathname.slice('/rest/v1/'.length);
    const target = api.rows
      .get(table)
      ?.find((row) =>
        [...url.searchParams].every(
          ([key, value]) =>
            key === 'select' || String(row[key]) === value.replace(/^eq\./, ''),
        ),
      );
    if (isNil(target)) return api.json({ message: 'missing-owned-row' }, 404);
    Object.assign(target, body);
    const fields = url.searchParams.get('select')?.split(',') ?? [];
    return api.json(
      Object.fromEntries(fields.map((field) => [field, target[field]])),
    );
  };
  api.controls.intercept = patch;
  return { ...context, api, patch };
};

describe('legacy suiteのproject所有seed', () => {
  it('4actor・参加session・21シナリオ・未投票feedbackを一意namespaceで作る', async () => {
    const value = setup();
    const result = await prepareLegacySeed(value.connection, value.journal);
    expect(result.journal).toBe(value.journal);
    expect(result.actor).toBe(result.actors['creator-only']);
    expect(result.namespace).toBe(`legacy-${value.journal.ownerTag}`);
    expect(result.session.phase).toBe('PREPARATION');
    expect(value.api.users.size).toBe(4);
    expect(value.api.rows.get('users')).toHaveLength(4);
    expect(value.api.rows.get('game_sessions')).toHaveLength(1);
    expect(value.api.rows.get('session_participants')).toContainEqual(
      expect.objectContaining({
        session_id: result.session.sessionId,
        user_id: result.actor.identity.appUserId,
        participant_status: 'CONFIRMED',
      }),
    );
    const scenarios = value.api.rows.get('scenarios') ?? [];
    expect(scenarios).toHaveLength(21);
    expect(new Set(scenarios.map((row) => row.name)).size).toBe(21);
    expect(
      scenarios.every(
        (row) =>
          typeof row.name === 'string' &&
          row.name.startsWith(result.namespace) &&
          typeof row.description === 'string' &&
          row.description.length > 0 &&
          row.min_player === 1 &&
          row.max_player === 4 &&
          row.min_playtime === 120 &&
          row.max_playtime === 240,
      ),
    ).toBe(true);
    expect(value.api.rows.get('feedbacks')).toEqual([
      expect.objectContaining({
        user_id: result.actor.identity.appUserId,
        title: `${result.namespace} feedback`,
        vote_count: 0,
        comment_count: 0,
      }),
    ]);
    expect(value.api.rows.get('feedback_votes') ?? []).toEqual([]);
    expect(value.journal.snapshot().resources).toHaveLength(37);
    expect(
      value.journal
        .snapshot()
        .resources.every((entry) => entry.status === 'created'),
    ).toBe(true);
    expect(
      fixtureManifestSchema.safeParse(value.journal.snapshot()).success,
    ).toBe(true);
    // 追加21行（scenario20+feedback1）もDBリクエストより前に予約、確認後にrecordする。
    for (const entry of value.journal.snapshot().resources.slice(16)) {
      const key = fixtureResourceKey(entry.resource);
      const reserve = value.events.indexOf(`reserve:${key}`);
      expect(value.events[reserve + 1]).toBe(
        `request:/rest/v1/${entry.resource.kind}`,
      );
      expect(value.events[reserve + 2]).toBe(`record:${key}`);
    }
  });

  it.each([
    'worker',
    'case',
    'retry',
    'ownerTag',
    'lease',
    'nonempty',
  ] as const)('%sが不正なjournalではDBへ接続しない', async (fault) => {
    const value = setup();
    const snapshot = value.journal.snapshot();
    if (fault === 'worker') snapshot.owner.workerIndex = 1;
    if (fault === 'case') snapshot.owner.caseId = 'other-suite';
    if (fault === 'retry') snapshot.owner.retry = 1;
    if (fault === 'ownerTag') snapshot.ownerTag = 'a'.repeat(64);
    if (fault === 'lease')
      snapshot.owner.lease.ownerNonce = '22222222-2222-4222-8222-222222222222';
    if (fault === 'nonempty')
      snapshot.resources.push({
        resource: {
          kind: 'auth-user',
          id: '11111111-1111-4111-8111-111111111111',
        },
        status: 'reserved',
      });
    value.journal.snapshot = () => snapshot;
    await expect(
      prepareLegacySeed(value.connection, value.journal),
    ).rejects.toThrow('所有journal');
    expect(value.api.requests).toEqual([]);
  });

  it.each([
    'scenario',
    'feedback',
  ] as const)('%s作成途中の失敗でも親が保持するjournalに予約を残す', async (kind) => {
    const value = setup();
    let scenarioPosts = 0;
    value.api.controls.intercept = (request) => {
      if (
        request.method === 'POST' &&
        request.url.pathname === '/rest/v1/scenarios'
      )
        scenarioPosts += 1;
      if (
        request.method === 'POST' &&
        ((kind === 'scenario' &&
          request.url.pathname === '/rest/v1/scenarios' &&
          scenarioPosts === 4) ||
          (kind === 'feedback' &&
            request.url.pathname === '/rest/v1/feedbacks'))
      )
        return value.api.json(
          { message: 'private-db-failure', code: 'failure' },
          400,
        );
      return value.patch(request);
    };
    await expect(
      prepareLegacySeed(value.connection, value.journal),
    ).rejects.toThrow('作成');
    const last = value.journal.snapshot().resources.at(-1);
    expect(last).toMatchObject({
      resource: { kind: kind === 'scenario' ? 'scenarios' : 'feedbacks' },
      status: 'reserved',
    });
    expect(value.journal.snapshot().resources.length).toBeGreaterThan(16);
  });

  it('reserve保存失敗なら追加INSERTへ進まず、既作成journalを保持する', async () => {
    const value = setup();
    const original = vi.mocked(value.journal.reserve).getMockImplementation();
    if (isNil(original)) throw new Error('reserve mockがありません。');
    vi.mocked(value.journal.reserve).mockImplementation(async (resource) => {
      if (resource.kind === 'feedbacks') throw new Error('reserve failed');
      await original(resource);
    });
    await expect(
      prepareLegacySeed(value.connection, value.journal),
    ).rejects.toThrow('reserve failed');
    expect(value.api.rows.get('feedbacks')).toBeUndefined();
    expect(value.api.rows.get('scenarios')).toHaveLength(21);
    expect(value.journal.snapshot().resources).toHaveLength(36);
  });
});
