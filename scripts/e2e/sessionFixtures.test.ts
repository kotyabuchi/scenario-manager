import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCaseActors } from '../../e2e/fixtures/actors';
import { createSessionFixture } from '../../e2e/fixtures/sessions';
import { fixtureContext, mockFixtureApi } from './fixtures/fixtureApi';

afterEach(() => vi.unstubAllGlobals());
const START_AT = '2026-12-01T05:00:00.000Z';

describe('case所有のsession fixture', () => {
  it('PREPARATIONから始め、creator/keeper/playerを別人・outsiderを不参加にする', async () => {
    const { connection, journal, events } = fixtureContext();
    const api = mockFixtureApi(events);
    const actors = await createCaseActors(connection, journal);
    const result = await createSessionFixture(connection, journal, actors, {
      startAt: START_AT,
    });
    expect(result.phase).toBe('PREPARATION');
    expect(
      new Set([result.creatorId, result.keeperId, result.playerId]).size,
    ).toBe(3);
    expect(api.rows.get('game_sessions')).toEqual([
      expect.objectContaining({
        game_session_id: result.sessionId,
        created_by_id: result.creatorId,
        keeper_id: result.keeperId,
        session_phase: 'PREPARATION',
        schedule_phase: 'ADJUSTING',
      }),
    ]);
    expect(api.rows.get('session_participants')).toEqual([
      {
        session_id: result.sessionId,
        user_id: result.creatorId,
        participant_type: 'SPECTATOR',
        participant_status: 'CONFIRMED',
      },
      {
        session_id: result.sessionId,
        user_id: result.keeperId,
        participant_type: 'KEEPER',
        participant_status: 'CONFIRMED',
      },
      {
        session_id: result.sessionId,
        user_id: result.playerId,
        participant_type: 'PLAYER',
        participant_status: 'CONFIRMED',
      },
    ]);
    expect(
      api.rows
        .get('session_participants')
        ?.some(({ user_id }) => user_id === actors.outsider.identity.appUserId),
    ).toBe(false);
    expect(api.rows.get('session_availability_time_blocks')).toHaveLength(3);
    expect(result.timeBlock).toEqual({
      startAt: START_AT,
      endAt: '2026-12-01T07:00:00.000Z',
    });
    expect(journal.snapshot().resources).toHaveLength(16);
    expect(
      journal.snapshot().resources.every(({ status }) => status === 'created'),
    ).toBe(true);
    const reserve = events.indexOf(`reserve:scenarios:${result.scenarioId}`);
    expect(events[reserve + 1]).toBe('request:/rest/v1/scenarios');
    expect(events[reserve + 2]).toBe(`record:scenarios:${result.scenarioId}`);
  });

  it('別caseと別workerで全作成IDを分け、phaseを明示できる', async () => {
    mockFixtureApi();
    const first = fixtureContext(0, 'first');
    const second = fixtureContext(1, 'second');
    const a = await createCaseActors(first.connection, first.journal);
    const b = await createCaseActors(second.connection, second.journal);
    const one = await createSessionFixture(first.connection, first.journal, a, {
      startAt: START_AT,
    });
    const two = await createSessionFixture(
      second.connection,
      second.journal,
      b,
      { phase: 'RECRUITING', startAt: START_AT },
    );
    expect(two.phase).toBe('RECRUITING');
    expect(one.sessionId).not.toBe(two.sessionId);
    expect(one.scenarioId).not.toBe(two.scenarioId);
    expect(one.creatorId).not.toBe(two.creatorId);
    expect(first.journal.ownerTag).not.toBe(second.journal.ownerTag);
  });

  it.each([
    'swap',
    'other-case',
    'unrecorded',
  ] as const)('%sのactorをDB作成前に拒否する', async (fault) => {
    const context = fixtureContext();
    const api = mockFixtureApi();
    const actors = await createCaseActors(context.connection, context.journal);
    if (fault === 'swap') actors['creator-only'] = actors['keeper-only'];
    if (fault === 'other-case') {
      const other = fixtureContext(1, 'other');
      actors.outsider = (
        await createCaseActors(other.connection, other.journal)
      ).outsider;
    }
    if (fault === 'unrecorded') {
      const snapshot = context.journal.snapshot();
      snapshot.resources = snapshot.resources.map((entry) => ({
        ...entry,
        status: 'reserved',
      }));
      context.journal.snapshot = () => snapshot;
    }
    const before = api.requests.length;
    await expect(
      createSessionFixture(context.connection, context.journal, actors),
    ).rejects.toThrow('actor');
    expect(api.requests).toHaveLength(before);
  });

  it('同じuserへ役割名だけ付け替えた兼任を拒否する', async () => {
    const context = fixtureContext();
    const api = mockFixtureApi();
    const actors = await createCaseActors(context.connection, context.journal);
    actors['keeper-only'].identity = {
      ...actors['creator-only'].identity,
      kind: 'keeper-only',
    };
    const before = api.requests.length;
    await expect(
      createSessionFixture(context.connection, context.journal, actors),
    ).rejects.toThrow('兼任');
    expect(api.requests).toHaveLength(before);
  });

  it('30分境界以外や未知phaseをデータ作成前に拒否する', async () => {
    const context = fixtureContext();
    const api = mockFixtureApi();
    const actors = await createCaseActors(context.connection, context.journal);
    const before = api.requests.length;
    await expect(
      createSessionFixture(context.connection, context.journal, actors, {
        startAt: '2026-12-01T05:01:00Z',
      }),
    ).rejects.toThrow('30分');
    const options = { startAt: START_AT };
    Reflect.set(options, 'phase', 'UNKNOWN');
    await expect(
      createSessionFixture(
        context.connection,
        context.journal,
        actors,
        options,
      ),
    ).rejects.toThrow();
    expect(api.requests).toHaveLength(before);
  });

  it.each([
    'scenarios',
    'game_sessions',
    'session_participants',
    'session_availability_time_blocks',
  ] as const)('%sのinsert失敗でも予約IDをcleanupへ残す', async (table) => {
    const context = fixtureContext();
    const api = mockFixtureApi();
    const actors = await createCaseActors(context.connection, context.journal);
    api.controls.intercept = ({ url, method }) =>
      url.pathname === `/rest/v1/${table}` && method === 'POST'
        ? api.json({ message: 'private-db-connection', code: 'failure' }, 400)
        : undefined;
    const error = await createSessionFixture(
      context.connection,
      context.journal,
      actors,
      { startAt: START_AT },
    ).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).not.toContain('private-db-connection');
    if (table === 'session_participants') {
      expect(String(error)).toContain('status=400 code=unknown type=SPECTATOR');
      expect(String(error)).not.toContain('code=failure');
    }
    expect(context.journal.snapshot().resources).toContainEqual({
      resource: expect.objectContaining({ kind: table }),
      status: 'reserved',
    });
  });

  it.each([
    '23505',
    'PGRST116',
    'private-db-code',
  ])('参加者INSERTの診断code=%sを検証して機密本文を出さない', async (code) => {
    const context = fixtureContext();
    const api = mockFixtureApi();
    const actors = await createCaseActors(context.connection, context.journal);
    api.controls.intercept = ({ url, method }) =>
      url.pathname === '/rest/v1/session_participants' && method === 'POST'
        ? api.json(
            {
              code,
              message: 'private-db-message',
              details: 'private-db-details',
              hint: 'private-db-hint',
            },
            409,
          )
        : undefined;
    const error = await createSessionFixture(
      context.connection,
      context.journal,
      actors,
      { startAt: START_AT },
    ).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain(
      `status=409 code=${code === 'private-db-code' ? 'unknown' : code} type=SPECTATOR`,
    );
    expect(String(error)).not.toContain('private-db');
  });

  it('reserve保存失敗ならINSERTを開始せず、record保存失敗なら予約を保持する', async () => {
    const context = fixtureContext();
    const api = mockFixtureApi();
    const actors = await createCaseActors(context.connection, context.journal);
    const before = api.requests.length;
    vi.mocked(context.journal.reserve).mockRejectedValueOnce(
      new Error('reserve failed'),
    );
    await expect(
      createSessionFixture(context.connection, context.journal, actors),
    ).rejects.toThrow('reserve failed');
    expect(api.requests).toHaveLength(before);
    vi.mocked(context.journal.record).mockRejectedValueOnce(
      new Error('record failed'),
    );
    await expect(
      createSessionFixture(context.connection, context.journal, actors),
    ).rejects.toThrow('record failed');
    expect(context.journal.snapshot().resources.at(-1)).toMatchObject({
      resource: { kind: 'scenarios' },
      status: 'reserved',
    });
  });

  it.each([
    'keeper',
    'participant',
    'outsider',
  ] as const)('保存後の%s役割不整合を拒否する', async (fault) => {
    const context = fixtureContext();
    const api = mockFixtureApi();
    const actors = await createCaseActors(context.connection, context.journal);
    api.controls.intercept = ({ url, method, body }) => {
      if (fault === 'keeper' && url.pathname === '/rest/v1/game_sessions')
        return api.json({ ...body, keeper_id: body.created_by_id });
      if (
        fault === 'participant' &&
        url.pathname === '/rest/v1/session_participants' &&
        method === 'POST'
      )
        return api.json({ ...body, participant_status: 'PENDING' });
      if (
        fault === 'outsider' &&
        url.pathname === '/rest/v1/session_participants' &&
        method === 'GET'
      )
        return api.json([
          ...(api.rows.get('session_participants') ?? []),
          {
            session_id: 'unexpected',
            user_id: actors.outsider.identity.appUserId,
            participant_status: 'CONFIRMED',
            participant_type: 'PLAYER',
          },
        ]);
      return undefined;
    };
    await expect(
      createSessionFixture(context.connection, context.journal, actors, {
        startAt: START_AT,
      }),
    ).rejects.toThrow('役割');
  });
});
