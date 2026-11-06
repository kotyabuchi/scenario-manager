import { createClient } from '@supabase/supabase-js';
import { isNil } from 'ramda';
import { ulid } from 'ulid';
import { z } from 'zod';

import { assertFixtureConnection } from '../../scripts/e2e/environmentCredentials';
import { Constants } from '../../src/db/types';

import { isDeepStrictEqual } from 'node:util';

import type { FixtureConnection } from '../../scripts/e2e/environmentCredentials';
import type { Database } from '../../src/db/types';
import type { CaseActors } from './actors';
import type { FixtureJournal } from './fixtureManifest';
import type { FixtureResource } from './fixtureSchema';

const optionsSchema = z.strictObject({
  phase: z.enum(Constants.public.Enums.session_phase).default('PREPARATION'),
  startAt: z.iso.datetime({ offset: true }).optional(),
});
const MINUTE = 60_000;
const HALF_HOUR = 30 * MINUTE;
const WEEK = 7 * 24 * 60 * MINUTE;
const PLAYTIME_MINUTES = 120;
const SYSTEM_ID = '00000000000000000000000001';
const ROLES = [
  'creator-only',
  'keeper-only',
  'confirmed-player',
  'outsider',
] as const;

/** actorの取り違えや他caseのuser流用は、データ作成より前に拒否する。 */
const assertActors = (journal: FixtureJournal, actors: CaseActors) => {
  const resources = journal.snapshot().resources;
  const identities = ROLES.map((role) => {
    const actor = actors[role].identity;
    if (
      actor.kind !== role ||
      !resources.some(
        ({ resource, status }) =>
          status === 'created' &&
          resource.kind === 'users' &&
          resource.id === actor.appUserId &&
          resource.authUserId === actor.authUserId,
      )
    )
      throw new Error('session fixtureのactorがcase所有の役割と一致しません。');
    return actor;
  });
  if (
    new Set(identities.map(({ authUserId }) => authUserId)).size !==
      ROLES.length ||
    new Set(identities.map(({ appUserId }) => appUserId)).size !==
      ROLES.length ||
    actors.anonymous.identity.kind !== 'anonymous'
  )
    throw new Error(
      'session fixtureの役割を同じユーザーへ兼任させることはできません。',
    );
};

/** PREPARATIONから開始できるcase所有のシナリオ・セッション・提出済みスケジュールを作る。 */
export const createSessionFixture = async (
  connection: FixtureConnection,
  journal: FixtureJournal,
  actors: CaseActors,
  input: z.input<typeof optionsSchema> = {},
) => {
  await assertFixtureConnection(connection);
  if (!isDeepStrictEqual(journal.owner.lease, connection.lease))
    throw new Error('session journalが現在の所有環境と一致しません。');
  assertActors(journal, actors);
  const options = optionsSchema.parse(input);
  const start = isNil(options.startAt)
    ? Math.ceil((Date.now() + WEEK) / HALF_HOUR) * HALF_HOUR
    : Date.parse(options.startAt);
  if (start % HALF_HOUR !== 0)
    throw new Error('fixtureの開始時刻は30分境界にしてください。');
  const timeBlock = {
    startAt: new Date(start).toISOString(),
    endAt: new Date(start + PLAYTIME_MINUTES * MINUTE).toISOString(),
  };
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
  const creator = actors['creator-only'].identity.appUserId;
  const keeper = actors['keeper-only'].identity.appUserId;
  const player = actors['confirmed-player'].identity.appUserId;
  const scenarioId = ulid();
  const sessionId = ulid();
  const scenarioResource: FixtureResource = {
    kind: 'scenarios',
    id: scenarioId,
    createdBy: creator,
  };
  await journal.reserve(scenarioResource);
  const scenarioRow: Database['public']['Tables']['scenarios']['Insert'] = {
    scenario_id: scenarioId,
    scenario_system_id: SYSTEM_ID,
    created_by_id: creator,
    name: `E2E scenario ${scenarioId}`,
    source_type: 'manual',
    min_player: 1,
    max_player: 1,
    min_playtime: PLAYTIME_MINUTES,
    max_playtime: PLAYTIME_MINUTES,
  };
  const scenario = await admin
    .from('scenarios')
    .insert(scenarioRow)
    .select('scenario_id, created_by_id')
    .single();
  if (
    !isNil(scenario.error) ||
    scenario.data?.scenario_id !== scenarioId ||
    scenario.data.created_by_id !== creator
  )
    throw new Error('fixtureのシナリオ作成に失敗しました。');
  await journal.record(scenarioResource);
  const sessionResource: FixtureResource = {
    kind: 'game_sessions',
    id: sessionId,
    createdBy: creator,
  };
  await journal.reserve(sessionResource);
  const sessionRow: Database['public']['Tables']['game_sessions']['Insert'] = {
    game_session_id: sessionId,
    scenario_id: scenarioId,
    created_by_id: creator,
    keeper_id: keeper,
    session_name: `E2E session ${sessionId}`,
    session_description: 'case所有の日程確定fixture',
    session_phase: options.phase,
    schedule_phase: 'ADJUSTING',
    visibility: 'PUBLIC',
    max_participant_count: 1,
    remaining_seat_count: 1,
  };
  const session = await admin
    .from('game_sessions')
    .insert(sessionRow)
    .select(
      'game_session_id, created_by_id, keeper_id, session_phase, schedule_phase',
    )
    .single();
  if (
    !isNil(session.error) ||
    session.data?.game_session_id !== sessionId ||
    session.data.created_by_id !== creator ||
    session.data.keeper_id !== keeper ||
    session.data.session_phase !== options.phase ||
    session.data.schedule_phase !== 'ADJUSTING'
  )
    throw new Error('fixtureのセッション作成または役割設定に失敗しました。');
  await journal.record(sessionResource);
  const participants: Database['public']['Tables']['session_participants']['Insert'][] =
    [
      {
        session_id: sessionId,
        user_id: creator,
        participant_type: 'SPECTATOR',
        participant_status: 'CONFIRMED',
      },
      {
        session_id: sessionId,
        user_id: keeper,
        participant_type: 'KEEPER',
        participant_status: 'CONFIRMED',
      },
      {
        session_id: sessionId,
        user_id: player,
        participant_type: 'PLAYER',
        participant_status: 'CONFIRMED',
      },
    ];
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
      .select('session_id, user_id, participant_type, participant_status')
      .single();
    if (!isNil(created.error) || !isDeepStrictEqual(created.data, row))
      throw new Error('fixtureの参加者作成または役割設定に失敗しました。');
    await journal.record(resource);
  }
  // outsiderが参加しておらず、keeper/creator/playerの業務上の役割が別々であることを実行前に確認する。
  const observed = await admin
    .from('session_participants')
    .select('session_id, user_id, participant_type, participant_status')
    .eq('session_id', sessionId);
  if (
    !isNil(observed.error) ||
    observed.data?.length !== participants.length ||
    participants.some(
      (row) => !observed.data?.some((actual) => isDeepStrictEqual(actual, row)),
    )
  )
    throw new Error('fixtureの参加者集合が期待する役割と一致しません。');
  for (const participant of participants) {
    const id = ulid();
    const resource: FixtureResource = {
      kind: 'session_availability_time_blocks',
      id,
      sessionId,
      userId: participant.user_id,
    };
    await journal.reserve(resource);
    const row: Database['public']['Tables']['session_availability_time_blocks']['Insert'] =
      {
        availability_time_block_id: id,
        session_id: sessionId,
        user_id: participant.user_id,
        start_at: timeBlock.startAt,
        end_at: timeBlock.endAt,
      };
    const created = await admin
      .from('session_availability_time_blocks')
      .insert(row)
      .select('availability_time_block_id, session_id, user_id')
      .single();
    if (
      !isNil(created.error) ||
      created.data?.availability_time_block_id !== id ||
      created.data.session_id !== sessionId ||
      created.data.user_id !== participant.user_id
    )
      throw new Error('fixtureのスケジュール作成に失敗しました。');
    await journal.record(resource);
  }
  return {
    sessionId,
    scenarioId,
    creatorId: creator,
    keeperId: keeper,
    playerId: player,
    phase: options.phase,
    timeBlock,
  };
};
