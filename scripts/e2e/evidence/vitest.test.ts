import { describe, expect, it } from 'vitest';

import { integrationResultFixture } from '../fixtures/results/integration';
import { validateIntegrationEvidence } from './vitest';

const at = <T>(values: T[], index: number): T => {
  const value = values[index];
  if (value === undefined) throw new Error('fixture不足');
  return value;
};
const meta = (
  input: ReturnType<typeof integrationResultFixture>,
  index = 0,
) => {
  const value = at(input.report.tests, index).meta;
  if (value === null) throw new Error('meta fixture不足');
  return value;
};
type Input = ReturnType<typeof integrationResultFixture>;
const codes = (input: Input) =>
  validateIntegrationEvidence(input).issues.map(({ code }) => code);

describe('Vitest integration evidence', () => {
  it('16登録の標準runner値と実actor/check/fixture証跡を照合し、入力を変更しない', () => {
    const input = integrationResultFixture();
    const before = structuredClone(input);
    expect(validateIntegrationEvidence(input)).toEqual({
      issues: [],
      counts: { expected: 16, tests: 16, passed: 16, journals: 16 },
    });
    expect(input).toEqual(before);
  });

  const failures: [string, string, (input: Input) => void][] = [
    [
      '結果欠落',
      'RESULT_MISSING',
      (input) => {
        input.report.tests.pop();
      },
    ],
    [
      '結果重複',
      'DUPLICATE_RESULT',
      (input) => {
        input.report.tests.push(structuredClone(at(input.report.tests, 0)));
      },
    ],
    [
      '未知結果',
      'UNKNOWN_RESULT',
      (input) => {
        at(input.report.tests, 0).testId = 'unknown';
      },
    ],
    [
      'variant交換',
      'REGISTRATION_MISMATCH',
      (input) => {
        at(input.report.tests, 0).claim.variant = 'outsider';
      },
    ],
    [
      'module path交換',
      'REGISTRATION_MISMATCH',
      (input) => {
        at(input.report.tests, 0).file = 'src/fake.ts';
      },
    ],
    [
      'title交換',
      'REGISTRATION_MISMATCH',
      (input) => {
        at(input.report.tests, 0).titlePath = ['fake'];
      },
    ],
    [
      '座標変更',
      'REGISTRATION_MISMATCH',
      (input) => {
        at(input.report.tests, 0).line++;
      },
    ],
    [
      'repeat登録',
      'REGISTRATION_MISMATCH',
      (input) => {
        at(input.expected, 0).test.repeatEachIndex = 1;
      },
    ],
    [
      'skip',
      'TEST_NOT_CLEAN_PASS',
      (input) => {
        at(input.report.tests, 0).options.mode = 'skip';
      },
    ],
    [
      'todo',
      'TEST_NOT_CLEAN_PASS',
      (input) => {
        at(input.report.tests, 0).state = 'skipped';
      },
    ],
    [
      'only',
      'TEST_NOT_CLEAN_PASS',
      (input) => {
        at(input.report.tests, 0).options.mode = 'only';
      },
    ],
    [
      'xfail',
      'TEST_NOT_CLEAN_PASS',
      (input) => {
        at(input.report.tests, 0).options.fails = true;
      },
    ],
    [
      'retry成功',
      'TEST_NOT_CLEAN_PASS',
      (input) => {
        const result = at(input.report.tests, 0);
        if (result.diagnostic) {
          result.diagnostic.retryCount = 1;
          result.diagnostic.flaky = true;
        }
      },
    ],
    [
      'repeats',
      'TEST_NOT_CLEAN_PASS',
      (input) => {
        at(input.report.tests, 0).options.repeats = 1;
      },
    ],
    [
      'concurrent',
      'TEST_NOT_CLEAN_PASS',
      (input) => {
        at(input.report.tests, 0).options.concurrent = true;
      },
    ],
    [
      'beforeAll/afterAll失敗',
      'MODULE_NOT_CLEAN_PASS',
      (input) => {
        at(input.report.modules, 0).state = 'failed';
        at(input.report.modules, 0).suiteErrorCount = 1;
      },
    ],
    [
      'module欠落',
      'MODULE_MISSING',
      (input) => {
        input.report.modules.pop();
      },
    ],
    [
      'global error',
      'RUN_NOT_CLEAN_PASS',
      (input) => {
        input.report.unhandledErrorCount = 1;
      },
    ],
    [
      'reporter障害',
      'RUN_NOT_CLEAN_PASS',
      (input) => {
        input.report.reporterErrorCount = 1;
      },
    ],
    [
      '途中停止',
      'RUN_NOT_CLEAN_PASS',
      (input) => {
        input.report.reason = 'interrupted';
      },
    ],
    [
      '別run report',
      'RUN_ID_MISMATCH',
      (input) => {
        input.report.runId = 'abcdef012345';
      },
    ],
    [
      '別lease',
      'LEASE_MISMATCH',
      (input) => {
        meta(input).lease.ownerNonce = '18e0fb3b-5c82-4fb6-8867-cf77953c3a87';
      },
    ],
    [
      '別run meta',
      'LEASE_MISMATCH',
      (input) => {
        meta(input).runId = 'abcdef012345';
      },
    ],
    [
      'owner改変',
      'FIXTURE_OWNER_MISMATCH',
      (input) => {
        meta(input).owner.workerIndex = 1;
      },
    ],
    [
      'journal path交換',
      'JOURNAL_PATH_MISMATCH',
      (input) => {
        meta(input).journalPath = 'test-results/wrong.json';
      },
    ],
    [
      'runtime claim交換',
      'RUNTIME_CLAIM_MISMATCH',
      (input) => {
        meta(input).claim.variant = 'wrong';
      },
    ],
    [
      'preflight失敗',
      'PREFLIGHT_INCOMPLETE',
      (input) => {
        meta(input).preflight = 'failed';
      },
    ],
    [
      'identity未検証',
      'PREFLIGHT_INCOMPLETE',
      (input) => {
        meta(input).identityVerified = false;
      },
    ],
    [
      '途中return',
      'BODY_INCOMPLETE',
      (input) => {
        meta(input).bodyCompleted = false;
      },
    ],
    [
      'beforeEach assertionのみ',
      'BODY_INCOMPLETE',
      (input) => {
        meta(input).bodyAssertionCalls = 0;
      },
    ],
    [
      'assertion数矛盾',
      'BODY_INCOMPLETE',
      (input) => {
        meta(input).assertionCalls = 1;
      },
    ],
    [
      'check欠落',
      'CHECKS_INCOMPLETE',
      (input) => {
        meta(input).completedChecks = [];
      },
    ],
    [
      'check重複',
      'CHECKS_INCOMPLETE',
      (input) => {
        const m = meta(input);
        m.completedChecks.push(structuredClone(at(m.completedChecks, 0)));
      },
    ],
    [
      '未知check',
      'CHECKS_INCOMPLETE',
      (input) => {
        at(meta(input).completedChecks, 0).target = 'rpc:wrong';
      },
    ],
    [
      'persistだけ完了',
      'CHECKS_INCOMPLETE',
      (input) => {
        meta(input, 9).completedChecks.pop();
      },
    ],
    [
      'actor役割交換',
      'ACTOR_BINDINGS_MISMATCH',
      (input) => {
        const bindings = meta(input, 13).actorBindings;
        const actor = at(bindings, 0).actor;
        at(bindings, 0).actor = at(bindings, 1).actor;
        at(bindings, 1).actor = actor;
      },
    ],
    [
      'RLS bypass混入',
      'CLIENT_KIND_MISMATCH',
      (input) => {
        meta(input).clientKind = 'service-role';
      },
    ],
    [
      '別case actor流用',
      'ACTOR_BINDINGS_MISMATCH',
      (input) => {
        at(meta(input, 1).actorBindings, 0).actor = at(
          meta(input, 12).actorBindings,
          0,
        ).actor;
      },
    ],
    [
      'cleanup失敗',
      'CLEANUP_INCOMPLETE',
      (input) => {
        meta(input).cleanup = 'failed';
      },
    ],
    [
      'journal未回収',
      'CLEANUP_INCOMPLETE',
      (input) => {
        at(input.journals, 0).cleanup = {
          status: 'incomplete',
          remaining: [],
          issues: [],
        };
      },
    ],
    [
      'journal欠落',
      'JOURNAL_MISSING',
      (input) => {
        input.journals.shift();
      },
    ],
    [
      'journal重複',
      'DUPLICATE_JOURNAL',
      (input) => {
        input.journals.push(structuredClone(at(input.journals, 0)));
      },
    ],
    [
      'resource共有',
      'RESOURCE_SHARED_BETWEEN_TESTS',
      (input) => {
        at(input.journals, 1).resources = structuredClone(
          at(input.journals, 0).resources,
        );
      },
    ],
    [
      '空meta',
      'ATTEMPT_META_MISSING',
      (input) => {
        at(input.report.tests, 0).meta = null;
      },
    ],
  ];
  it.each(failures)('%sを拒否する', (_name, code, mutate) => {
    const input = integrationResultFixture();
    mutate(input);
    expect(codes(input)).toContain(code);
  });

  it('kindラベルを維持したcreator/keeperのUUID/ULID交換を拒否する', () => {
    const input = integrationResultFixture();
    const bindings = meta(input, 13).actorBindings;
    const first = at(bindings, 0).actor;
    const second = at(bindings, 1).actor;
    if (first.kind === 'anonymous' || second.kind === 'anonymous')
      throw new Error('actor fixture不足');
    const ids = { appUserId: first.appUserId, authUserId: first.authUserId };
    first.appUserId = second.appUserId;
    first.authUserId = second.authUserId;
    second.appUserId = ids.appUserId;
    second.authUserId = ids.authUserId;
    expect(codes(input)).toContain('ACTOR_BINDINGS_MISMATCH');
  });

  it('roster自体の欠落・別case ID・creatorラベル付替も拒否する', () => {
    const input = integrationResultFixture();
    meta(input).actors = [];
    expect(codes(input)).toContain('ACTOR_ROSTER_INVALID');
    const other = integrationResultFixture();
    const roster = meta(other, 7).actors;
    const creator = at(roster, 0);
    const keeper = at(roster, 1);
    if (creator.kind === 'anonymous' || keeper.kind === 'anonymous')
      throw new Error('actor fixture不足');
    const ids = {
      appUserId: creator.appUserId,
      authUserId: creator.authUserId,
    };
    creator.appUserId = keeper.appUserId;
    creator.authUserId = keeper.authUserId;
    keeper.appUserId = ids.appUserId;
    keeper.authUserId = ids.authUserId;
    expect(codes(other)).toEqual(
      expect.arrayContaining([
        'SESSION_ACTOR_MISMATCH',
        'ACTOR_BINDINGS_MISMATCH',
      ]),
    );
  });

  it('不正/欠落JSONと余分なcredential fieldを構造拒否する', () => {
    const input = integrationResultFixture();
    expect(
      validateIntegrationEvidence({ ...input, report: null }).issues,
    ).toContainEqual({ code: 'REPORT_INVALID', subject: 'report' });
    Reflect.set(meta(input), 'serviceRoleKey', 'private-secret');
    const result = validateIntegrationEvidence(input);
    expect(result.issues).toContainEqual({
      code: 'REPORT_INVALID',
      subject: 'report',
    });
    expect(JSON.stringify(result)).not.toContain('private-secret');
  });
});
