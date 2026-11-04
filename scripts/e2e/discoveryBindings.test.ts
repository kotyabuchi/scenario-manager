import { describe, expect, it } from 'vitest';

import { bindDiscovery } from './discoveryBindings';
import { createLedgerFixture } from './fixtures/ledger';
import { readTestTags } from './testTags';

import type { Discovery } from './discoverySchema';

const reportFixture = (): Discovery => ({
  schemaVersion: 1,
  profile: 'app',
  errors: [],
  projects: ['chromium', 'mobile-chrome'].map((name) => ({
    name,
    testDir: 'e2e',
    dependencies: [],
    repeatEach: 2,
  })),
  tests: ['chromium', 'mobile-chrome'].flatMap((project) =>
    [0, 1].map((repeatEachIndex) => ({
      testId: `${project}:${repeatEachIndex}`,
      file: 'e2e/save.spec.ts',
      line: 3,
      column: 1,
      titlePath: ['日程', '保存'],
      project,
      repeatEachIndex,
      tags: [
        '@case:schedule-save',
        '@variant:creator-only',
        '@binding:save-and-reload',
      ],
      expectedStatus: 'passed' as const,
      annotations: [],
      isSetup: false,
    })),
  ),
});

describe('恒久testタグ', () => {
  it('通常タグを許容し予約タグのないtestをlegacyとして区別する', () => {
    expect(readTestTags(['@smoke'])).toBeNull();
    expect(readTestTags(['@smoke', '@case:save', '@variant:creator'])).toEqual({
      caseId: 'save',
      variant: 'creator',
      binding: 'main',
    });
  });
  it.each([
    ['@case'],
    ['@case:'],
    ['@case:save'],
    ['@variant:creator'],
    ['@binding:main'],
    ['@case:a', '@case:b', '@variant:creator'],
    ['@case:a', '@variant:creator', '@variant:creator'],
    ['@case:a/b', '@variant:creator'],
  ])('不完全・重複・不正タグをlegacyに降格しない: %j', (...tags) => {
    expect(() => readTestTags(tags)).toThrow();
  });
});

describe('discoveryと台帳の対応', () => {
  it('projectとrepeatを独立した登録として保持する', () => {
    const result = bindDiscovery(createLedgerFixture(), [reportFixture()]);
    expect(result.issues).toEqual([]);
    expect(result.registrations).toHaveLength(4);
    expect(
      result.registrations.map((item) => [
        item.execution.project,
        item.repeatEachIndex,
      ]),
    ).toEqual([
      ['chromium', 0],
      ['chromium', 1],
      ['mobile-chrome', 0],
      ['mobile-chrome', 1],
    ]);
  });
  it('repeatの一部欠落を登録不足にする', () => {
    const report = reportFixture();
    report.tests.shift();
    expect(bindDiscovery(createLedgerFixture(), [report]).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_DISCOVERY_REPEAT' }),
      ]),
    );
  });
  it.each([
    ['UNKNOWN_CASE_BINDING', ['@case:unknown', '@variant:creator-only']],
    [
      'AMBIGUOUS_EXECUTION',
      [
        '@case:schedule-save',
        '@variant:keeper-only',
        '@binding:save-and-reload',
      ],
    ],
    ['INVALID_TAG', ['@case:schedule-save']],
  ])('不正な対応を登録として数えない: %s', (code, tags) => {
    const report = reportFixture();
    for (const test of report.tests) test.tags = tags;
    const result = bindDiscovery(createLedgerFixture(), [report]);
    expect(result.registrations).toEqual([]);
    expect(result.issues.every((issue) => issue.code === code)).toBe(true);
  });
  it('setupにcaseを割り当てても業務testに数えない', () => {
    const report = reportFixture();
    for (const test of report.tests) test.isSetup = true;
    const result = bindDiscovery(createLedgerFixture(), [report]);
    expect(result.registrations).toEqual([]);
    expect(
      result.issues.every((issue) => issue.code === 'SETUP_CLAIMS_CASE'),
    ).toBe(true);
  });
  it('同じタグでactor bindingが異なる宣言は推測せず拒否する', () => {
    const ledger = createLedgerFixture();
    const item = ledger.scenarios[0]?.cases[0];
    const execution = item?.executions[0];
    if (!item || !execution) throw new Error('fixture不足');
    item.executions.push({
      ...execution,
      actorBindings: [{ role: 'operator', actor: 'keeper' }],
    });
    expect(
      bindDiscovery(ledger, [reportFixture()]).issues.some(
        (issue) => issue.code === 'AMBIGUOUS_EXECUTION',
      ),
    ).toBe(true);
  });
  it('列挙時エラー・重複profile・同一repeatの重複を報告する', () => {
    const report = reportFixture();
    report.errors.push('collection failed');
    const test = report.tests[0];
    if (!test) throw new Error('fixture不足');
    report.tests.push({ ...test });
    const codes = bindDiscovery(createLedgerFixture(), [
      report,
      report,
    ]).issues.map((issue) => issue.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'DISCOVERY_ERROR',
        'DUPLICATE_PROFILE',
        'DUPLICATE_TEST',
        'INVALID_DISCOVERY_REPEAT',
      ]),
    );
  });
});
