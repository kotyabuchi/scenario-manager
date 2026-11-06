import { describe, expect, it } from 'vitest';

import { integrationLedgerFixture } from './fixtures/integrationLedger';
import {
  createIntegrationExpectations,
  scopeIntegrationLedger,
} from './integrationExpectations';

describe('integration必要集合', () => {
  it('実台帳の30条件を一意照合し、actor申告と複数checkを保持する', async () => {
    const { ledger, collection } = await integrationLedgerFixture();
    const expected = createIntegrationExpectations(ledger, collection);
    expect(expected).toHaveLength(30);
    const applications = expected.filter(
      ({ fixture }) => fixture === 'session-application',
    );
    expect(applications).toHaveLength(10);
    expect(
      applications.find(({ claim }) => claim.variant === 'outsider-self')
        ?.actorBindings,
    ).toEqual([{ role: 'operator', actor: 'outsider' }]);
    const calendar = expected.filter(({ claim }) =>
      claim.caseId.startsWith('schedule-calendar-'),
    );
    expect(calendar.map(({ claim }) => claim.caseId).sort()).toEqual([
      'schedule-calendar-missing-user',
      'schedule-calendar-summary',
      'schedule-calendar-unconfirmed',
      'schedule-calendar-user-sessions',
    ]);
    for (const entry of calendar) {
      expect(entry.claim).toMatchObject({
        variant: 'creator-only',
        binding: 'main',
      });
      expect(entry.fixture).toBe('schedule');
      expect(entry.actorBindings).toEqual([
        { role: 'operator', actor: 'creator-only' },
      ]);
      expect(entry.checks).toEqual([
        {
          target:
            'function:src/app/(main)/sessions/adapter.ts#getCalendarSessions',
          aspect: 'response',
          layer: 'integration',
        },
      ]);
    }
    expect(
      expected.find(
        ({ claim }) =>
          claim.caseId === 'schedule-rpc-deny' &&
          claim.variant === 'actor-mismatch',
      )?.actorBindings,
    ).toEqual([
      { role: 'operator', actor: 'keeper-only' },
      { role: 'claimed-actor', actor: 'creator-only' },
    ]);
    expect(
      expected
        .find(({ claim }) => claim.caseId === 'schedule-rpc-allow')
        ?.checks.map(({ aspect }) => aspect)
        .sort(),
    ).toEqual(['authorization', 'persist']);
    expect(
      scopeIntegrationLedger(ledger)
        .scenarios.flatMap(({ cases }) => cases)
        .every(({ layer }) => layer === 'integration'),
    ).toBe(true);
  });

  it.each([
    'missing',
    'duplicate',
    'wrong-location',
    'wrong-claim',
    'missing-tags',
    'unknown',
  ])('%s登録を成功集合へ変換しない', async (fault) => {
    const { ledger, collection } = await integrationLedgerFixture();
    const first = collection.registrations[0];
    const test = collection.discovery.tests[0];
    if (!first || !test) throw new Error('fixture不足');
    if (fault === 'missing') collection.registrations.shift();
    if (fault === 'duplicate')
      collection.registrations.push(structuredClone(first));
    if (fault === 'wrong-location') first.line++;
    if (fault === 'wrong-claim') first.claim.variant = 'outsider';
    if (fault === 'missing-tags') test.tags = [];
    if (fault === 'unknown') {
      const extra = structuredClone(first);
      extra.testId = 'unknown';
      collection.registrations.push(extra);
    }
    expect(() => createIntegrationExpectations(ledger, collection)).toThrow();
  });

  it.each([
    'skip',
    'todo',
    'only',
    'fails',
    'concurrent',
    'retry',
    'repeats',
  ])('%sの登録を実行前に拒否する', async (fault) => {
    const { ledger, collection } = await integrationLedgerFixture();
    const row = collection.registrations[0];
    if (!row) throw new Error('fixture不足');
    if (fault === 'skip' || fault === 'todo' || fault === 'only')
      row.options.mode = fault;
    if (fault === 'fails') row.options.fails = true;
    if (fault === 'concurrent') row.options.concurrent = true;
    if (fault === 'retry') row.options.retry = 1;
    if (fault === 'repeats') row.options.repeats = 1;
    expect(() => createIntegrationExpectations(ledger, collection)).toThrow();
  });

  it.each([
    'schedule-rpc-atomic',
    'schedule-calendar-missing-user',
    'schedule-calendar-user-sessions',
    'schedule-calendar-summary',
    'schedule-calendar-unconfirmed',
    'session-application-apply',
    'session-application-apply-deny',
    'session-application-apply-invalid',
    'session-application-cancel',
    'session-application-cancel-deny',
    'session-application-cancel-invalid',
  ])('%sのcaseと登録の両方を消しても初期必須条件の削減を拒否する', async (id) => {
    const { ledger, collection } = await integrationLedgerFixture();
    for (const scenario of ledger.scenarios)
      scenario.cases = scenario.cases.filter(({ caseId }) => caseId !== id);
    const removed = new Set(
      collection.registrations
        .filter(({ claim }) => claim.caseId === id)
        .map(({ testId }) => testId),
    );
    collection.registrations = collection.registrations.filter(
      ({ testId }) => !removed.has(testId),
    );
    collection.discovery.tests = collection.discovery.tests.filter(
      ({ testId }) => !removed.has(testId),
    );
    expect(() => createIntegrationExpectations(ledger, collection)).toThrow(
      '初期必須条件',
    );
  });

  it.each([
    'fixture',
    'actor',
  ])('申請の%sを別の検証条件へ置き換えても拒否する', async (fault) => {
    const { ledger, collection } = await integrationLedgerFixture();
    const item = ledger.scenarios
      .flatMap(({ cases }) => cases)
      .find(({ caseId }) => caseId === 'session-application-apply');
    if (!item) throw new Error('申請fixture不足');
    if (fault === 'fixture') item.fixture = 'schedule';
    else
      for (const execution of item.executions)
        execution.actorBindings = [{ role: 'operator', actor: 'creator-only' }];
    expect(() => createIntegrationExpectations(ledger, collection)).toThrow();
  });

  it('caseを残して1つの申請variantと実登録だけを減らしても拒否する', async () => {
    const { ledger, collection } = await integrationLedgerFixture();
    const item = ledger.scenarios
      .flatMap(({ cases }) => cases)
      .find(({ caseId }) => caseId === 'session-application-apply');
    if (!item) throw new Error('申請fixture不足');
    item.executions = item.executions.filter(
      ({ variant }) => variant !== 'outsider-self',
    );
    const removed = new Set(
      collection.registrations
        .filter(
          ({ claim }) =>
            claim.caseId === item.caseId && claim.variant === 'outsider-self',
        )
        .map(({ testId }) => testId),
    );
    collection.registrations = collection.registrations.filter(
      ({ testId }) => !removed.has(testId),
    );
    collection.discovery.tests = collection.discovery.tests.filter(
      ({ testId }) => !removed.has(testId),
    );
    expect(() => createIntegrationExpectations(ledger, collection)).toThrow(
      '初期必須条件',
    );
  });

  it('必須10条件を保っていても未知の申請variantを追加できない', async () => {
    const { ledger, collection } = await integrationLedgerFixture();
    const item = ledger.scenarios
      .flatMap(({ cases }) => cases)
      .find(({ caseId }) => caseId === 'session-application-apply');
    const execution = item?.executions.find(
      ({ variant }) => variant === 'applicant',
    );
    const side = collection.registrations.find(
      ({ claim }) =>
        claim.caseId === item?.caseId && claim.variant === 'applicant',
    );
    const test = collection.discovery.tests.find(
      ({ testId }) => testId === side?.testId,
    );
    if (!item || !execution || !side || !test)
      throw new Error('申請fixture不足');
    const unknown = 'unknown-application';
    item.executions.push({ ...structuredClone(execution), variant: unknown });
    for (const contract of ledger.contracts) {
      if (!contract.target.endsWith('#applyToSessionAction')) continue;
      for (const requirement of contract.requirements) {
        const required = requirement.executions.find(
          ({ profile, variant }) =>
            profile === 'integration' && variant === 'applicant',
        );
        if (required)
          requirement.executions.push({
            ...structuredClone(required),
            variant: unknown,
          });
      }
    }
    const extraSide = structuredClone(side);
    extraSide.testId += '-unknown';
    extraSide.claim.variant = unknown;
    extraSide.titlePath = [item.caseId, unknown, 'main'];
    extraSide.fullName = extraSide.titlePath.join(' ');
    collection.registrations.push(extraSide);
    const extraTest = structuredClone(test);
    extraTest.testId = extraSide.testId;
    extraTest.titlePath = [...extraSide.titlePath];
    extraTest.tags = extraTest.tags.map((tag) =>
      tag === '@variant:applicant' ? `@variant:${unknown}` : tag,
    );
    collection.discovery.tests.push(extraTest);
    expect(() => createIntegrationExpectations(ledger, collection)).toThrow(
      'variantと実行主体',
    );
  });

  it('planned caseの実登録、空集合、collector失敗を拒否する', async () => {
    for (const fault of ['planned', 'empty', 'collect-error']) {
      const { ledger, collection } = await integrationLedgerFixture();
      if (fault === 'planned') {
        const item = ledger.scenarios
          .flatMap(({ cases }) => cases)
          .find(({ caseId }) => caseId === 'schedule-action-allow');
        if (!item) throw new Error('fixture不足');
        item.status = 'planned';
      }
      if (fault === 'empty') {
        collection.discovery.tests = [];
        collection.registrations = [];
      }
      if (fault === 'collect-error')
        collection.discovery.errors.push('収集失敗');
      expect(() => createIntegrationExpectations(ledger, collection)).toThrow();
    }
  });

  it('実行位置・runner設定・実行制御の両面を照合する', async () => {
    for (const fault of [
      'config',
      'pool',
      'workers',
      'parallel',
      'location',
      'repeat',
      'annotation',
      'status',
    ]) {
      const { ledger, collection } = await integrationLedgerFixture();
      const test = collection.discovery.tests[0];
      if (!test) throw new Error('fixture不足');
      if (fault === 'config')
        collection.config = 'vitest.integration.config.ts';
      if (fault === 'pool') collection.runner.pool = 'forks';
      if (fault === 'workers') collection.runner.maxWorkers = 2;
      if (fault === 'parallel') collection.runner.fileParallelism = true;
      if (fault === 'location') collection.runner.includeTaskLocation = false;
      if (fault === 'repeat') test.repeatEachIndex = 1;
      if (fault === 'annotation') test.annotations.push({ type: 'fail' });
      if (fault === 'status') test.expectedStatus = 'failed';
      expect(() => createIntegrationExpectations(ledger, collection)).toThrow();
    }
  });
});
