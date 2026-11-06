import { describe, expect, it } from 'vitest';

import { scheduleEvidenceFixture as fixture } from './fixtures/scheduleCheck';
import { validateScheduleCheckEvidence } from './scheduleCheckEvidence';
import { createScheduleExpectations } from './scheduleCheckExpectations';

const at = <T>(values: T[], index: number): T => {
  const value = values[index];
  if (value === undefined) throw new Error('fixture不足');
  return value;
};
const attachment = (name: string, value: unknown) => ({
  name,
  contentType: 'application/json',
  body: Buffer.from(JSON.stringify(value)).toString('base64'),
});

const codes = (input: Parameters<typeof validateScheduleCheckEvidence>[0]) =>
  validateScheduleCheckEvidence(input).issues.map(({ code }) => code);

describe('日程browser実行の証跡', () => {
  it('official JSONのproject統合specと@なしtagを4条件へ対応させる', () => {
    const { input } = fixture();
    const before = structuredClone(input);
    expect(validateScheduleCheckEvidence(input)).toEqual({
      issues: [],
      counts: { expected: 4, tests: 4, passed: 4, journals: 4 },
    });
    expect(input).toEqual(before);
  });
  it('欠落・重複・未知project・異なるtitle/IDを拒否する', () => {
    const { input, specs } = fixture();
    const spec = at(specs, 0);
    spec.tests.pop();
    spec.tests.push(structuredClone(at(spec.tests, 0)));
    at(specs, 1).title = 'fake';
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'DUPLICATE_RESULT',
        'RESULT_MISSING',
        'SPEC_IDENTITY_MISMATCH',
        'UNKNOWN_RESULT',
      ]),
    );
  });
  it.each([
    'skipped',
    'failed',
    'timedOut',
    'interrupted',
  ])('actual %sを成功にしない', (status) => {
    const { input, data } = fixture();
    at(at(data, 0).result.results, 0).status = status;
    expect(codes(input)).toContain('TEST_NOT_CLEAN_PASS');
  });
  it.each([
    'skip',
    'fixme',
    'fail',
  ])('新しい%sとexpected-failureを拒否する', (type) => {
    const { input, data } = fixture();
    at(data, 0).result.annotations.push({ type });
    at(data, 1).result.expectedStatus = 'failed';
    expect(
      codes(input).filter((code) => code === 'TEST_NOT_CLEAN_PASS'),
    ).toHaveLength(2);
  });
  it('retry成功、attempt追加、runner errorsと失敗statsを拒否する', () => {
    const { input, data } = fixture();
    at(at(data, 0).result.results, 0).retry = 1;
    at(data, 1).result.results.push(
      structuredClone(at(at(data, 1).result.results, 0)),
    );
    expect(codes(input)).toContain('TEST_NOT_CLEAN_PASS');
    input.report.errors.push({ message: 'runner failure' });
    expect(codes(input)).toContain('REPORT_INVALID');
  });
  it('結果tagの@付き、別case、欠落を拒否する', () => {
    for (const tags of [
      ['@case:schedule-confirm-persist', 'variant:creator-only'],
      ['case:other', 'variant:creator-only'],
      [],
    ]) {
      const { input, specs } = fixture();
      at(specs, 0).tags = tags;
      expect(codes(input)).toContain('RESULT_TAG_MISMATCH');
    }
  });
  it('古いrun/lease、欠落・余分・重複journalを拒否する', () => {
    const { input } = fixture();
    at(input.journals, 0).owner.lease.runId = 'abcdef012345';
    input.journals.pop();
    input.journals.push(structuredClone(at(input.journals, 1)));
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'LEASE_MISMATCH',
        'DUPLICATE_JOURNAL',
        'JOURNAL_MISSING',
        'COUNT_MISMATCH',
      ]),
    );
  });
  it('別actor・偽actor mapping・cleanup attachment不一致を拒否する', () => {
    const { input, data } = fixture();
    const first = at(data, 0);
    const attempt = at(first.result.results, 0);
    attempt.attachments[2] = attachment(
      'fixture-used-actor',
      at(first.actors, 3),
    );
    attempt.attachments[1] = attachment('fixture-cleanup', {
      owner: first.journal.owner,
      result: { status: 'incomplete', remaining: [], issues: [] },
    });
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'USED_ACTOR_MISMATCH',
        'CLEANUP_ATTACHMENT_MISMATCH',
      ]),
    );
  });
  it('未知journalとcase間で共有されたresourceを拒否する', () => {
    const { input } = fixture();
    at(input.journals, 1).resources = structuredClone(
      at(input.journals, 0).resources,
    );
    const unknown = structuredClone(at(input.journals, 2));
    unknown.owner.caseId = 'unknown-test';
    input.journals.push(unknown);
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'UNKNOWN_JOURNAL',
        'RESOURCE_SHARED_BETWEEN_CASES',
      ]),
    );
  });

  it('別caseのactor添付と不正なworkerを拒否する', () => {
    const { input, data } = fixture();
    const first = at(data, 0);
    const attempt = at(first.result.results, 0);
    attempt.attachments[0] = attachment('fixture-actors', {
      owner: first.journal.owner,
      actors: [...at(data, 1).actors, { kind: 'anonymous' }],
    });
    attempt.workerIndex++;
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'ACTOR_MAPPING_MISMATCH',
        'JOURNAL_OWNER_MISMATCH',
      ]),
    );
  });

  it('journalのcleanup不完了・resource残留・actor証跡欠落を拒否する', () => {
    const { input, data } = fixture();
    const first = at(data, 0);
    first.journal.cleanup = { status: 'incomplete', remaining: [], issues: [] };
    at(first.journal.resources, 0).status = 'created';
    at(first.result.results, 0).attachments.shift();
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'CLEANUP_INCOMPLETE',
        'ACTOR_ATTACHMENT_INVALID',
      ]),
    );
  });
});

describe('日程の必要登録集合', () => {
  it('必要4条件を台帳側から削っても成功にしない', () => {
    const { ledger, discovery } = fixture();
    at(at(ledger.scenarios, 0).cases, 0).executions.pop();
    discovery.tests.pop();
    expect(() => createScheduleExpectations(ledger, discovery)).toThrow();
  });
  it.each([
    'planned',
    'repeat',
    'skip',
    'unknown',
    'actor',
  ])('%s登録の混入や不足を拒否する', (kind) => {
    const { ledger, discovery } = fixture();
    const item = at(at(ledger.scenarios, 0).cases, 0);
    if (kind === 'planned') item.status = 'planned';
    if (kind === 'repeat') at(discovery.tests, 0).repeatEachIndex = 1;
    if (kind === 'skip')
      at(discovery.tests, 0).annotations.push({ type: 'skip' });
    if (kind === 'unknown') at(discovery.tests, 0).tags = [];
    if (kind === 'actor')
      at(at(item.executions, 0).actorBindings, 0).actor = 'outsider';
    expect(() => createScheduleExpectations(ledger, discovery)).toThrow();
  });
  it('operatorだけの後続implemented caseもPC/mobileの両登録を要求する', () => {
    const { ledger, discovery } = fixture();
    const cases = at(ledger.scenarios, 0).cases;
    const original = at(cases, 0);
    cases.push({
      ...structuredClone(original),
      caseId: 'schedule-confirm-invalid-input',
      roles: ['operator'],
      executions: original.executions
        .filter(({ variant }) => variant === 'creator-only')
        .map((execution) => ({
          ...execution,
          actorBindings: execution.actorBindings.filter(
            ({ role }) => role === 'operator',
          ),
        })),
    });
    for (const project of ['chromium', 'mobile-chrome']) {
      discovery.tests.push({
        ...structuredClone(at(discovery.tests, 0)),
        testId: `invalid-${project}`,
        project,
        line: 30,
        titlePath: ['日程', 'invalid'],
        tags: [
          '@case:schedule-confirm-invalid-input',
          '@variant:creator-only',
          '@binding:main',
        ],
      });
    }
    const expected = createScheduleExpectations(ledger, discovery);
    expect(expected).toHaveLength(6);
    expect(
      expected
        .filter(({ caseId }) => caseId === 'schedule-confirm-invalid-input')
        .every(
          ({ operator, observer }) =>
            operator === 'creator-only' && observer === undefined,
        ),
    ).toBe(true);
  });

  it('後続implemented caseも必要集合へ含め、未登録なら拒否する', () => {
    const { ledger, discovery } = fixture();
    const cases = at(ledger.scenarios, 0).cases;
    cases.push({
      ...structuredClone(at(cases, 0)),
      caseId: 'schedule-reject',
      executions: at(cases, 0).executions.filter(
        ({ variant }) => variant === 'creator-only',
      ),
    });
    expect(() => createScheduleExpectations(ledger, discovery)).toThrow();
  });
});
