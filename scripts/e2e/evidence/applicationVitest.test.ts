import { isNil } from 'ramda';
import { describe, expect, it } from 'vitest';

import { integrationResultFixture } from '../fixtures/results/integration';
import { validateIntegrationEvidence } from './vitest';

type Input = ReturnType<typeof integrationResultFixture>;

const application = (
  input: Input,
  caseId = 'session-application-apply',
  variant = 'applicant',
) => {
  const expected = input.expected.find(
    ({ claim }) => claim.caseId === caseId && claim.variant === variant,
  );
  const result = input.report.tests.find(
    ({ testId }) => testId === expected?.test.testId,
  );
  const journal = input.journals.find(
    ({ owner }) => owner.caseId === expected?.test.testId,
  );
  const meta = result?.meta;
  if (isNil(expected) || isNil(result) || isNil(journal) || isNil(meta))
    throw new Error('申請の証拠fixtureが不足しています');
  return { expected, result, journal, meta };
};

const codes = (input: Input) =>
  validateIntegrationEvidence(input).issues.map(({ code }) => code);

describe('参加申請・取消のintegration証拠', () => {
  it('日程20条件を維持し、申請10条件の異なる予約行集合を照合する', () => {
    for (const includeApplication of [false, true]) {
      const input = integrationResultFixture({ includeApplication });
      const verified = validateIntegrationEvidence(input);
      expect(verified.issues).toEqual([]);
      expect(verified.counts.passed).toBe(includeApplication ? 30 : 20);
    }
  });

  it('日程fixtureやkeeperのrosterを申請の証拠として借用しない', () => {
    for (const fault of ['fixture', 'roster']) {
      const input = integrationResultFixture({ includeApplication: true });
      const { expected, meta } = application(input);
      if (fault === 'fixture') expected.fixture = 'schedule';
      else {
        const actor = meta.actors.find(({ kind }) => kind === 'applicant');
        if (isNil(actor)) throw new Error('申請者fixtureが不足しています');
        actor.kind = 'keeper-only';
      }
      expect(codes(input)).toContain('ACTOR_ROSTER_INVALID');
    }
  });

  it('申請のcase名を保ったまま日程のfixtureとactorへ付け替えても拒否する', () => {
    const input = integrationResultFixture({ includeApplication: true });
    const { expected, meta } = application(input);
    const applicant = meta.actors.find(({ kind }) => kind === 'applicant');
    if (isNil(applicant) || applicant.kind === 'anonymous')
      throw new Error('申請者fixtureが不足しています');
    const keeper = { ...applicant, kind: 'keeper-only' as const };
    meta.actors = meta.actors.map((actor) =>
      actor.kind === 'applicant' ? keeper : actor,
    );
    meta.actorBindings = [{ role: 'operator', actor: keeper }];
    expected.actorBindings = [{ role: 'operator', actor: 'keeper-only' }];
    expected.fixture = 'schedule';
    expect(codes(input)).toEqual(['FIXTURE_KIND_MISMATCH']);
  });

  it('期待値と実行結果の両方を別のoperatorへ変更しても拒否する', () => {
    const input = integrationResultFixture({ includeApplication: true });
    const { expected, meta } = application(input);
    const creator = meta.actors.find(({ kind }) => kind === 'creator-only');
    if (isNil(creator)) throw new Error('主催者fixtureが不足しています');
    expected.actorBindings = [{ role: 'operator', actor: 'creator-only' }];
    meta.actorBindings = [{ role: 'operator', actor: creator }];
    expect(codes(input)).toContain('ACTOR_BINDINGS_MISMATCH');
  });

  it.each([
    'wrong-user',
    'wrong-session',
    'unremoved',
  ])('%sの申請予約行を成功の証拠にしない', (fault) => {
    const input = integrationResultFixture({ includeApplication: true });
    const { journal, meta } = application(input);
    const applicant = meta.actors.find(({ kind }) => kind === 'applicant');
    const outsider = meta.actors.find(({ kind }) => kind === 'outsider');
    if (
      isNil(applicant) ||
      applicant.kind === 'anonymous' ||
      isNil(outsider) ||
      outsider.kind === 'anonymous'
    )
      throw new Error('申請者と第三者のfixtureが不足しています');
    const entry = journal.resources.find(
      ({ resource }) =>
        resource.kind === 'session_participants' &&
        resource.userId === applicant.appUserId,
    );
    if (isNil(entry) || entry.resource.kind !== 'session_participants')
      throw new Error('申請行のfixtureが不足しています');
    if (fault === 'wrong-user') entry.resource.userId = outsider.appUserId;
    if (fault === 'wrong-session')
      entry.resource.sessionId = '01K99999999999999999999999';
    if (fault === 'unremoved') {
      entry.status = 'reserved';
      journal.cleanup = null;
    }
    expect(codes(input)).toContain(
      fault === 'unremoved'
        ? 'CLEANUP_INCOMPLETE'
        : fault === 'wrong-session'
          ? 'JOURNAL_INVALID'
          : 'SESSION_ACTOR_MISMATCH',
    );
  });

  it('書込拒否ケースに余分な参加行が記録された場合も拒否する', () => {
    const input = integrationResultFixture({ includeApplication: true });
    const { journal, meta } = application(
      input,
      'session-application-apply-deny',
      'anonymous',
    );
    const applicant = meta.actors.find(({ kind }) => kind === 'applicant');
    const session = journal.resources.find(
      ({ resource }) => resource.kind === 'game_sessions',
    );
    if (
      isNil(applicant) ||
      applicant.kind === 'anonymous' ||
      isNil(session) ||
      session.resource.kind !== 'game_sessions'
    )
      throw new Error('申請先fixtureが不足しています');
    journal.resources.push({
      resource: {
        kind: 'session_participants',
        sessionId: session.resource.id,
        userId: applicant.appUserId,
      },
      status: 'removed',
    });
    expect(codes(input)).toContain('SESSION_ACTOR_MISMATCH');
    expect(codes(input)).toContain('FIXTURE_RESOURCES_MISMATCH');
  });
});
