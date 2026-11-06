import { isNil } from 'ramda';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApplicationActors } from '../../e2e/fixtures/actors';
import { fixtureResourceKey } from '../../e2e/fixtures/fixtureSchema';
import { createSessionApplicationFixture } from '../../e2e/fixtures/sessionApplication';
import { fixtureContext, mockFixtureApi } from './fixtures/fixtureApi';

afterEach(() => vi.unstubAllGlobals());

const fixture = async () => {
  const context = fixtureContext(0, 'session-application');
  const api = mockFixtureApi(context.events);
  const actors = await createApplicationActors(
    context.connection,
    context.journal,
  );
  const readSession: NonNullable<typeof api.controls.intercept> = ({
    url,
    method,
  }) => {
    if (method !== 'GET' || url.pathname !== '/rest/v1/game_sessions') return;
    const id = url.searchParams.get('game_session_id')?.slice('eq.'.length);
    const session = api.rows
      .get('game_sessions')
      ?.find(({ game_session_id }) => game_session_id === id);
    if (isNil(session)) return api.json({ code: 'fixture-not-found' }, 404);
    const players =
      api.rows
        .get('session_participants')
        ?.filter(
          ({ session_id, participant_type, participant_status }) =>
            session_id === id &&
            participant_type === 'PLAYER' &&
            participant_status === 'CONFIRMED',
        ).length ?? 0;
    // mock PostgRESTはSQL triggerを持たないため、再取得時の席数だけ再現する。
    return api.json({
      ...session,
      remaining_seat_count: Number(session.remaining_seat_count) - players,
    });
  };
  api.controls.intercept = readSession;
  return { ...context, api, actors, readSession };
};

describe('case所有の参加申請fixture', () => {
  it.each([
    false,
    true,
  ])('公開募集中の卓に指定した初期参加行だけを作る (PENDING=%s)', async (pendingApplicant) => {
    const { connection, journal, actors, api, events } = await fixture();
    expect(Object.values(actors).map(({ identity }) => identity.kind)).toEqual([
      'creator-only',
      'applicant',
      'confirmed-player',
      'outsider',
      'anonymous',
    ]);
    expect(
      api.requests.filter(({ url }) =>
        url.pathname.endsWith('/current_app_user_id'),
      ),
    ).toHaveLength(4);
    const result = await createSessionApplicationFixture(
      connection,
      journal,
      actors,
      { pendingApplicant },
    );
    expect(result.remainingSeatCount).toBe(1);
    expect(api.rows.get('game_sessions')).toEqual([
      expect.objectContaining({
        game_session_id: result.sessionId,
        scenario_id: result.scenarioId,
        created_by_id: result.creatorId,
        keeper_id: null,
        session_phase: 'RECRUITING',
        visibility: 'PUBLIC',
      }),
    ]);
    expect(api.rows.get('session_participants')).toEqual([
      expect.objectContaining({
        session_id: result.sessionId,
        user_id: result.creatorId,
        participant_type: 'SPECTATOR',
        participant_status: 'CONFIRMED',
      }),
      expect.objectContaining({
        session_id: result.sessionId,
        user_id: result.playerId,
        participant_type: 'PLAYER',
        participant_status: 'CONFIRMED',
      }),
      ...(pendingApplicant
        ? [
            expect.objectContaining({
              session_id: result.sessionId,
              user_id: result.applicantId,
              participant_type: 'PLAYER',
              participant_status: 'PENDING',
              application_message: result.pendingApplicationMessage,
              applied_at: expect.any(String),
            }),
          ]
        : []),
    ]);
    expect(result.pendingApplicationMessage).toBe(
      pendingApplicant ? 'E2E pending application' : null,
    );
    const seeded = journal.snapshot().resources.slice(8);
    expect(seeded).toHaveLength(pendingApplicant ? 5 : 4);
    for (const { resource, status } of seeded) {
      expect(status).toBe('created');
      const key = fixtureResourceKey(resource);
      const reserve = events.indexOf(`reserve:${key}`);
      expect(reserve).toBeGreaterThanOrEqual(0);
      expect(events.slice(reserve + 1, reserve + 3)).toEqual([
        `request:/rest/v1/${resource.kind}`,
        `record:${key}`,
      ]);
    }
    expect(api.rows.has('session_availability_time_blocks')).toBe(false);
  });

  it.each([
    'other-lease',
    'other-case',
    'role-swap',
    'same-user',
  ])('%sのactorまたはjournalを作成前に拒否する', async (fault) => {
    const { connection, journal, actors, api } = await fixture();
    if (fault === 'other-lease')
      journal.owner.lease = {
        ...journal.owner.lease,
        ownerNonce: '00000000-0000-4000-8000-000000000001',
      };
    if (fault === 'other-case') {
      const other = fixtureContext(1, 'other-application');
      actors.applicant = (
        await createApplicationActors(other.connection, other.journal)
      ).applicant;
    }
    if (fault === 'role-swap') actors.applicant = actors.outsider;
    if (fault === 'same-user')
      actors.applicant.identity = {
        ...actors.outsider.identity,
        kind: 'applicant',
      };

    const before = api.requests.length;
    await expect(
      createSessionApplicationFixture(connection, journal, actors),
    ).rejects.toThrow(fault === 'other-lease' ? 'journal' : 'actor');
    expect(api.requests).toHaveLength(before);
  });

  it('初期状態の再取得で空席がなければfixtureを返さない', async () => {
    const { connection, journal, actors, api, readSession } = await fixture();
    api.controls.intercept = ({ url, method, ...request }) => {
      if (method !== 'GET' || url.pathname !== '/rest/v1/game_sessions')
        return readSession({ url, method, ...request });
      const session = api.rows.get('game_sessions')?.[0];
      return api.json({ ...session, remaining_seat_count: 0 });
    };
    await expect(
      createSessionApplicationFixture(connection, journal, actors),
    ).rejects.toThrow('初期状態');
    expect(journal.snapshot().resources.slice(8)).toHaveLength(4);
  });

  it('PENDING作成の失敗では既存cleanupが追跡できる予約キーを残す', async () => {
    const { connection, journal, actors, api, readSession } = await fixture();
    api.controls.intercept = (request) => {
      if (
        request.method === 'POST' &&
        request.url.pathname === '/rest/v1/session_participants' &&
        request.body.participant_status === 'PENDING'
      )
        return api.json({ message: 'private seed failure' }, 400);
      return readSession(request);
    };
    await expect(
      createSessionApplicationFixture(connection, journal, actors, {
        pendingApplicant: true,
      }),
    ).rejects.toThrow('参加者作成に失敗');
    const sessionId = api.rows.get('game_sessions')?.[0]?.game_session_id;
    expect(typeof sessionId).toBe('string');
    expect(journal.snapshot().resources.at(-1)).toEqual({
      resource: {
        kind: 'session_participants',
        sessionId,
        userId: actors.applicant.identity.appUserId,
      },
      status: 'reserved',
    });
  });
});
