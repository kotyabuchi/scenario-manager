import { createClient } from '@supabase/supabase-js';
import { isNil } from 'ramda';
import { ulid } from 'ulid';

import { assertFixtureConnection } from '../../scripts/e2e/environmentCredentials';

import { isDeepStrictEqual } from 'node:util';

import type { FixtureConnection } from '../../scripts/e2e/environmentCredentials';
import type { Database } from '../../src/db/types';
import type { ApplicationActors } from './actors';
import type { FixtureJournal } from './fixtureManifest';
import type { FixtureResource } from './fixtureSchema';

const ACTORS = [
  'creator-only',
  'applicant',
  'confirmed-player',
  'outsider',
] as const;
const PLAYER_CAPACITY = 2;
const EXPECTED_OPEN_SEATS = PLAYER_CAPACITY - 1;
const SYSTEM_ID = '00000000000000000000000001';
const PLAYTIME_MINUTES = 120;
const PENDING_MESSAGE = 'E2E pending application';
const PARTICIPANT_COLUMNS =
  'session_id, user_id, participant_type, participant_status, application_message, applied_at';
type Tables = Database['public']['Tables'];
type ParticipantSeed = Pick<
  Tables['session_participants']['Row'],
  | 'session_id'
  | 'user_id'
  | 'participant_type'
  | 'participant_status'
  | 'application_message'
  | 'applied_at'
>;

const assertOwnedActors = (
  journal: FixtureJournal,
  actors: ApplicationActors,
) => {
  const resources = journal.snapshot().resources;
  const identities = ACTORS.map((kind) => {
    const identity = actors[kind].identity;
    if (
      identity.kind !== kind ||
      !resources.some(
        ({ resource, status }) =>
          status === 'created' &&
          resource.kind === 'auth-user' &&
          resource.id === identity.authUserId,
      ) ||
      !resources.some(
        ({ resource, status }) =>
          status === 'created' &&
          resource.kind === 'users' &&
          resource.id === identity.appUserId &&
          resource.authUserId === identity.authUserId,
      )
    )
      throw new Error('申請fixtureのactorがcase所有の役割と一致しません。');
    return identity;
  });
  if (
    actors.anonymous.identity.kind !== 'anonymous' ||
    new Set(identities.map(({ authUserId }) => authUserId)).size !==
      ACTORS.length ||
    new Set(identities.map(({ appUserId }) => appUserId)).size !== ACTORS.length
  )
    throw new Error('申請fixtureのactorは別々の所有ユーザーが必要です。');
};

const matchesParticipant = (
  actual: ParticipantSeed,
  expected: ParticipantSeed,
) =>
  actual.session_id === expected.session_id &&
  actual.user_id === expected.user_id &&
  actual.participant_type === expected.participant_type &&
  actual.participant_status === expected.participant_status &&
  actual.application_message === expected.application_message &&
  (isNil(expected.applied_at)
    ? isNil(actual.applied_at)
    : !isNil(actual.applied_at));

/** case所有の公開募集中セッションと、必要な場合だけ申請者のPENDING行を作る。 */
export const createSessionApplicationFixture = async (
  connection: FixtureConnection,
  journal: FixtureJournal,
  actors: ApplicationActors,
  options: { pendingApplicant?: boolean } = {},
) => {
  await assertFixtureConnection(connection);
  if (!isDeepStrictEqual(journal.owner.lease, connection.lease))
    throw new Error('申請fixtureのjournalが現在の所有環境と一致しません。');
  assertOwnedActors(journal, actors);
  const admin = createClient<Database>(
    connection.manifest.apiUrl,
    connection.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
  const creatorId = actors['creator-only'].identity.appUserId;
  const applicantId = actors.applicant.identity.appUserId;
  const playerId = actors['confirmed-player'].identity.appUserId;
  const outsiderId = actors.outsider.identity.appUserId;
  const scenarioId = ulid();
  const sessionId = ulid();
  const scenarioResource: FixtureResource = {
    kind: 'scenarios',
    id: scenarioId,
    createdBy: creatorId,
  };
  await journal.reserve(scenarioResource);
  const scenario = await admin
    .from('scenarios')
    .insert({
      scenario_id: scenarioId,
      scenario_system_id: SYSTEM_ID,
      created_by_id: creatorId,
      name: `E2E application scenario ${scenarioId}`,
      source_type: 'manual',
      min_player: 1,
      max_player: PLAYER_CAPACITY,
      min_playtime: PLAYTIME_MINUTES,
      max_playtime: PLAYTIME_MINUTES,
    })
    .select('scenario_id, created_by_id')
    .single();
  if (
    !isNil(scenario.error) ||
    scenario.data?.scenario_id !== scenarioId ||
    scenario.data.created_by_id !== creatorId
  )
    throw new Error('申請fixtureのシナリオ作成に失敗しました。');
  await journal.record(scenarioResource);

  const sessionResource: FixtureResource = {
    kind: 'game_sessions',
    id: sessionId,
    createdBy: creatorId,
  };
  await journal.reserve(sessionResource);
  const parent = await admin
    .from('game_sessions')
    .insert({
      game_session_id: sessionId,
      scenario_id: scenarioId,
      created_by_id: creatorId,
      keeper_id: null,
      session_name: `E2E application session ${sessionId}`,
      session_phase: 'RECRUITING',
      schedule_phase: 'ADJUSTING',
      visibility: 'PUBLIC',
      recruited_player_count: PLAYER_CAPACITY,
      max_participant_count: PLAYER_CAPACITY,
      remaining_seat_count: PLAYER_CAPACITY,
    })
    .select('game_session_id, scenario_id, created_by_id')
    .single();
  if (
    !isNil(parent.error) ||
    parent.data?.game_session_id !== sessionId ||
    parent.data.scenario_id !== scenarioId ||
    parent.data.created_by_id !== creatorId
  )
    throw new Error('申請fixtureのセッション作成に失敗しました。');
  await journal.record(sessionResource);

  const participants: ParticipantSeed[] = [
    {
      session_id: sessionId,
      user_id: creatorId,
      participant_type: 'SPECTATOR',
      participant_status: 'CONFIRMED',
      application_message: null,
      applied_at: null,
    },
    {
      session_id: sessionId,
      user_id: playerId,
      participant_type: 'PLAYER',
      participant_status: 'CONFIRMED',
      application_message: null,
      applied_at: null,
    },
  ];
  const pendingApplicationMessage = options.pendingApplicant
    ? PENDING_MESSAGE
    : null;
  if (!isNil(pendingApplicationMessage))
    participants.push({
      session_id: sessionId,
      user_id: applicantId,
      participant_type: 'PLAYER',
      participant_status: 'PENDING',
      application_message: pendingApplicationMessage,
      applied_at: new Date().toISOString(),
    });
  for (const row of participants) {
    const resource: FixtureResource = {
      kind: 'session_participants',
      sessionId,
      userId: row.user_id,
    };
    await journal.reserve(resource);
    const created = await admin
      .from('session_participants')
      .insert(row)
      .select(PARTICIPANT_COLUMNS)
      .single();
    if (
      !isNil(created.error) ||
      isNil(created.data) ||
      !matchesParticipant(created.data, row)
    )
      throw new Error('申請fixtureの参加者作成に失敗しました。');
    await journal.record(resource);
  }

  const [session, observed] = await Promise.all([
    admin
      .from('game_sessions')
      .select(
        'game_session_id, scenario_id, created_by_id, keeper_id, session_phase, visibility, remaining_seat_count',
      )
      .eq('game_session_id', sessionId)
      .single(),
    admin
      .from('session_participants')
      .select(PARTICIPANT_COLUMNS)
      .eq('session_id', sessionId),
  ]);
  if (
    !isNil(session.error) ||
    session.data?.game_session_id !== sessionId ||
    session.data.scenario_id !== scenarioId ||
    session.data.created_by_id !== creatorId ||
    !isNil(session.data.keeper_id) ||
    session.data.session_phase !== 'RECRUITING' ||
    session.data.visibility !== 'PUBLIC' ||
    session.data.remaining_seat_count !== EXPECTED_OPEN_SEATS ||
    !isNil(observed.error) ||
    observed.data?.length !== participants.length ||
    participants.some(
      (row) =>
        !observed.data?.some((actual) => matchesParticipant(actual, row)),
    )
  )
    throw new Error(
      '申請fixtureの初期状態が期待する席数・参加者と一致しません。',
    );
  return {
    sessionId,
    scenarioId,
    creatorId,
    applicantId,
    playerId,
    outsiderId,
    remainingSeatCount: session.data.remaining_seat_count,
    pendingApplicationMessage,
  };
};
