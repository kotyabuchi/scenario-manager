import { isNil } from 'ramda';
import { ulid } from 'ulid';
import { expect } from 'vitest';

import { createCaseActors } from '../../../e2e/fixtures/actors';
import { assertActorIdentity } from '../../../e2e/fixtures/authState';
import { cleanupFixture } from '../../../e2e/fixtures/fixtureCleanup';
import { createFixtureJournal } from '../../../e2e/fixtures/fixtureManifest';
import { createSessionFixture } from '../../../e2e/fixtures/sessions';
import { readEnvironmentCredentials } from '../../../scripts/e2e/environmentCredentials';
import { integrationAttemptMetaSchema } from '../../../scripts/e2e/integrationSchema';
import { beginIntegrationEvidence } from './integrationEvidence';

import type { TestContext } from 'vitest';
import type { AvailabilityTimeBlockInput } from '@/app/(main)/sessions/[id]/schedule/availability/interface';
import type { CaseActors } from '../../../e2e/fixtures/actors';
import type { FixtureJournal } from '../../../e2e/fixtures/fixtureManifest';
import type { FixtureConnection } from '../../../scripts/e2e/environmentCredentials';
import type { IntegrationAttemptMeta } from '../../../scripts/e2e/integrationSchema';

/** 稼働中の専用leaseから読み取り、共有環境へのfallbackを拒否する。 */
export const readIntegrationConnection = () => {
  const file = process.env.SCENARIO_E2E_CREDENTIALS;
  if (isNil(file))
    throw new Error('専用integration runnerから実行してください');
  return readEnvironmentCredentials(process.cwd(), file);
};

/** 利用者JWTで親・子の全保存値を読み、拒否前後の正確な同値を確認できるようにする。 */
export const readIntegrationSchedule = async (
  client: CaseActors['creator-only']['client'],
  sessionId: string,
) => {
  const [session, blocks] = await Promise.all([
    client
      .from('game_sessions')
      .select('*')
      .eq('game_session_id', sessionId)
      .single(),
    client
      .from('game_schedule_time_blocks')
      .select('*')
      .eq('session_id', sessionId)
      .order('block_order'),
  ]);
  if (
    !isNil(session.error) ||
    isNil(session.data) ||
    !isNil(blocks.error) ||
    isNil(blocks.data)
  )
    throw new Error('利用者JWTによる保存状態の観測に失敗しました');
  return { session: session.data, blocks: blocks.data };
};

/** RPCの実引数を生成する。申告actorは呼出clientとは独立して渡す。 */
export const scheduleRpcArguments = (
  sessionId: string,
  claimedActor: string,
  blocks: readonly AvailabilityTimeBlockInput[],
) => {
  const first = blocks[0];
  if (isNil(first)) throw new Error('RPC準備には最低1枠必要です');
  return {
    p_session_id: sessionId,
    p_actor_user_id: claimedActor,
    p_schedule_date: first.startAt,
    p_time_blocks: blocks.map((block, index) => ({
      gameScheduleTimeBlockId: ulid(),
      ...block,
      blockOrder: index + 1,
    })),
  };
};

/** RPC/Actionが保存した日時・順序・作成者・親状態を全件照合する。 */
export const expectIntegrationSchedule = (
  state: Awaited<ReturnType<typeof readIntegrationSchedule>>,
  expected: readonly AvailabilityTimeBlockInput[],
  createdBy: string,
) => {
  const rawDate = state.session.schedule_date;
  const scheduleDate = isNil(rawDate)
    ? null
    : new Date(
        /(?:Z|[+-]\d{2}:\d{2})$/.test(rawDate) ? rawDate : `${rawDate}Z`,
      ).toISOString();
  expect(state.session).toMatchObject({
    session_phase: 'PREPARATION',
    schedule_phase: 'CONFIRMED',
  });
  expect(scheduleDate).toBe(expected[0]?.startAt);
  expect(
    state.blocks.map((block) => ({
      startAt: new Date(block.start_at).toISOString(),
      endAt: new Date(block.end_at).toISOString(),
      order: block.block_order,
      createdBy: block.created_by,
      sessionId: block.session_id,
    })),
  ).toEqual(
    expected.map((block, index) => ({
      ...block,
      order: index + 1,
      createdBy,
      sessionId: state.session.game_session_id,
    })),
  );
};

const createRuntimeFixture = async (
  connection: FixtureConnection,
  journal: FixtureJournal,
  options: Parameters<typeof createSessionFixture>[3],
  evidence: IntegrationAttemptMeta,
) => {
  const actors = await createCaseActors(connection, journal);
  evidence.actors = Object.values(actors).map((actor) => actor.identity);
  const session = await createSessionFixture(
    connection,
    journal,
    actors,
    options,
  );
  const snapshot = () =>
    readIntegrationSchedule(actors['creator-only'].client, session.sessionId);
  await snapshot();
  return { actors, session, journal, snapshot };
};

type IntegrationFixture = Awaited<ReturnType<typeof createRuntimeFixture>>;

/** fixture枠を日単位でずらし、初期値と置換値を別々に作る。 */
export const integrationTimeBlocks = (
  block: AvailabilityTimeBlockInput,
  days: readonly number[] = [0, 1],
): AvailabilityTimeBlockInput[] =>
  days.map((day) => ({
    startAt: new Date(
      Date.parse(block.startAt) + day * 24 * 60 * 60_000,
    ).toISOString(),
    endAt: new Date(
      Date.parse(block.endAt) + day * 24 * 60 * 60_000,
    ).toISOString(),
  }));

/** 拒否試験の旧値は、権限のある利用者JWTによる実RPCで準備・再読取する。 */
export const seedIntegrationSchedule = async (fixture: IntegrationFixture) => {
  const old = integrationTimeBlocks(fixture.session.timeBlock);
  const result = await fixture.actors['creator-only'].client.rpc(
    'replace_confirmed_schedule_time_blocks',
    scheduleRpcArguments(
      fixture.session.sessionId,
      fixture.session.creatorId,
      old,
    ),
  );
  if (!isNil(result.error)) throw new Error('旧確定枠のJWT準備に失敗しました');
  const snapshot = await fixture.snapshot();
  // recruiting phaseを拒否するAction試験でも、RPC自体にはphase制約を追加しない
  if (snapshot.blocks.length !== old.length)
    throw new Error('旧確定枠の再読取が一致しません');
  return snapshot;
};

/** taskごとの独立fixtureを作り、失敗時も全cleanupを待って証跡へ反映する。 */
export const withIntegrationFixture = async (
  context: TestContext,
  bindings: readonly { role: string; kind: keyof CaseActors }[],
  operation: (
    fixture: IntegrationFixture,
    evidence: IntegrationAttemptMeta,
  ) => Promise<void>,
  options: Parameters<typeof createSessionFixture>[3] = {},
) => {
  const connection = readIntegrationConnection();
  const journal = await createFixtureJournal(connection, {
    project: 'integration',
    workerIndex: 0,
    caseId: context.task.id,
    retry: context.task.result?.retryCount ?? 0,
  });
  const evidence = beginIntegrationEvidence(context, journal);
  const initialAssertions = expect.getState().assertionCalls;
  let bodyAssertions = initialAssertions;
  const failures: unknown[] = [];
  try {
    const fixture = await createRuntimeFixture(
      connection,
      journal,
      options,
      evidence,
    );
    evidence.actorBindings = bindings.map(({ role, kind }) => ({
      role,
      actor: fixture.actors[kind].identity,
    }));
    evidence.clientKind =
      bindings.find(({ role }) => role === 'operator')?.kind === 'anonymous'
        ? 'anonymous'
        : 'user-jwt';
    const operatorBinding = bindings.find(({ role }) => role === 'operator');
    if (isNil(operatorBinding)) throw new Error('実行operatorがありません');
    const operator = fixture.actors[operatorBinding.kind];
    if (operator.identity.kind === 'anonymous') {
      const { data, error } = await operator.client.auth.getUser();
      if (data.user !== null || error?.name !== 'AuthSessionMissingError')
        throw new Error('匿名clientの実認証状態が一致しません');
    } else {
      await assertActorIdentity(
        operator.client,
        operator.identity,
        journal.ownerTag,
      );
    }
    evidence.identityVerified = true;
    evidence.preflight = 'passed';
    bodyAssertions = expect.getState().assertionCalls;
    await operation(fixture, evidence);
    evidence.bodyCompleted = true;
  } catch (error) {
    if (evidence.preflight === 'pending') evidence.preflight = 'failed';
    failures.push(error);
  } finally {
    evidence.bodyAssertionCalls =
      expect.getState().assertionCalls - bodyAssertions;
    evidence.assertionCalls =
      expect.getState().assertionCalls - initialAssertions;
    try {
      const cleanup = await cleanupFixture(connection, journal);
      evidence.cleanup = cleanup.status === 'complete' ? 'complete' : 'failed';
      if (cleanup.status !== 'complete')
        failures.push(new Error('integration fixtureのcleanupが未完了です'));
    } catch (error) {
      evidence.cleanup = 'failed';
      failures.push(error);
    }
    context.task.meta.integration =
      integrationAttemptMetaSchema.parse(evidence);
  }
  if (failures.length > 0)
    throw new AggregateError(
      failures,
      'integration試験またはcleanupに失敗しました',
    );
};

export type { IntegrationFixture };
