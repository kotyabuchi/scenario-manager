import { createClient } from '@supabase/supabase-js';
import { isNil } from 'ramda';
import { ulid } from 'ulid';

import { assertFixtureConnection } from '../../scripts/e2e/environmentCredentials';
import { createCaseActors } from './actors';
import { fixtureOwnerTag } from './fixtureManifest';
import { fixtureManifestSchema } from './fixtureSchema';
import { createSessionFixture } from './sessions';

import { isDeepStrictEqual } from 'node:util';

import type { FixtureConnection } from '../../scripts/e2e/environmentCredentials';
import type { Database } from '../../src/db/types';
import type { FixtureJournal } from './fixtureManifest';
import type { FixtureResource } from './fixtureSchema';

const ADDITIONAL_SCENARIOS = 20;
const MIN_PLAYTIME = 120;
const MAX_PLAYTIME = 240;

/** 親が先に保持したjournalへ記録するため、作成途中の失敗も同じ所有範囲で回収できる。 */
export const prepareLegacySeed = async (
  connection: FixtureConnection,
  journal: FixtureJournal,
) => {
  await assertFixtureConnection(connection);
  const manifest = fixtureManifestSchema.parse(journal.snapshot());
  if (
    !isDeepStrictEqual(manifest.owner.lease, connection.lease) ||
    !isDeepStrictEqual(manifest.owner, journal.owner) ||
    manifest.ownerTag !== journal.ownerTag ||
    manifest.ownerTag !== fixtureOwnerTag(manifest.owner) ||
    manifest.owner.workerIndex !== 0 ||
    manifest.owner.caseId !== 'legacy-suite' ||
    manifest.owner.retry !== 0 ||
    manifest.resources.length !== 0 ||
    !isNil(manifest.cleanup)
  )
    throw new Error('legacy seedの所有journalが不正です。');
  const namespace = `legacy-${journal.ownerTag}`;
  const actors = await createCaseActors(connection, journal);
  const actor = actors['creator-only'];
  const session = await createSessionFixture(connection, journal, actors);
  const creator = actor.identity.appUserId;
  const admin = createClient<Database>(
    connection.manifest.apiUrl,
    connection.serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  const scenarioValues: Database['public']['Tables']['scenarios']['Update'] = {
    name: `${namespace} scenario 01`,
    description: `${namespace} 詳細表示と一覧のためのシナリオです。`,
    min_player: 1,
    max_player: 4,
    min_playtime: MIN_PLAYTIME,
    max_playtime: MAX_PLAYTIME,
  };
  const scenario = await admin
    .from('scenarios')
    .update(scenarioValues)
    .eq('scenario_id', session.scenarioId)
    .eq('created_by_id', creator)
    .select('scenario_id, created_by_id, scenario_system_id, name')
    .single();
  if (
    !isNil(scenario.error) ||
    scenario.data?.scenario_id !== session.scenarioId ||
    scenario.data.created_by_id !== creator ||
    scenario.data.name !== scenarioValues.name
  )
    throw new Error('legacy seedのシナリオ設定に失敗しました。');
  const sessionName = `${namespace} session`;
  const updatedSession = await admin
    .from('game_sessions')
    .update({
      session_name: sessionName,
      session_description: `${namespace} 参加予定セッションです。`,
    })
    .eq('game_session_id', session.sessionId)
    .eq('created_by_id', creator)
    .select('game_session_id, created_by_id, session_name')
    .single();
  if (
    !isNil(updatedSession.error) ||
    updatedSession.data?.game_session_id !== session.sessionId ||
    updatedSession.data.created_by_id !== creator ||
    updatedSession.data.session_name !== sessionName
  )
    throw new Error('legacy seedのセッション設定に失敗しました。');
  for (let index = 0; index < ADDITIONAL_SCENARIOS; index += 1) {
    const id = ulid();
    const resource: FixtureResource = {
      kind: 'scenarios',
      id,
      createdBy: creator,
    };
    const row: Database['public']['Tables']['scenarios']['Insert'] = {
      scenario_id: id,
      created_by_id: creator,
      scenario_system_id: scenario.data.scenario_system_id,
      name: `${namespace} scenario ${String(index + 2).padStart(2, '0')}`,
      description: `${namespace} 一覧のページ切替と詳細表示を確認するシナリオです。`,
      source_type: 'manual',
      min_player: 1,
      max_player: 4,
      min_playtime: MIN_PLAYTIME,
      max_playtime: MAX_PLAYTIME,
    };
    await journal.reserve(resource);
    const created = await admin
      .from('scenarios')
      .insert(row)
      .select('scenario_id, created_by_id')
      .single();
    if (
      !isNil(created.error) ||
      created.data?.scenario_id !== id ||
      created.data.created_by_id !== creator
    )
      throw new Error('legacy seedの追加シナリオ作成に失敗しました。');
    await journal.record(resource);
  }
  const feedbackId = ulid();
  const feedbackResource: FixtureResource = {
    kind: 'feedbacks',
    id: feedbackId,
    userId: creator,
  };
  const feedbackRow: Database['public']['Tables']['feedbacks']['Insert'] = {
    feedback_id: feedbackId,
    user_id: creator,
    title: `${namespace} feedback`,
    description: `${namespace} 詳細・投票・コメントの確認用です。`,
    category: 'FEATURE',
    status: 'NEW',
    vote_count: 0,
    comment_count: 0,
  };
  await journal.reserve(feedbackResource);
  const feedback = await admin
    .from('feedbacks')
    .insert(feedbackRow)
    .select('feedback_id, user_id, vote_count')
    .single();
  if (
    !isNil(feedback.error) ||
    feedback.data?.feedback_id !== feedbackId ||
    feedback.data.user_id !== creator ||
    feedback.data.vote_count !== 0
  )
    throw new Error('legacy seedのフィードバック作成に失敗しました。');
  await journal.record(feedbackResource);
  return { journal, actors, actor, session, namespace };
};
