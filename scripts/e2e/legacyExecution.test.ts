import { isNil } from 'ramda';
import { describe, expect, it } from 'vitest';

import { legacyKey, legacyManifestSchema } from './legacy';
import { validateLegacyExecution } from './legacyExecution';
import {
  legacyExecutionResultsSchema,
  legacyExecutionSchema,
} from './legacyExecutionSchema';

import { readFileSync } from 'node:fs';

import type { LegacyManifest } from './legacy';

const fixture = () => {
  const tests = [0, 1, 2, 3].map((index) => {
    const test = {
      profile: 'app',
      file: 'e2e/sample.spec.ts',
      titlePath: ['suite', `test-${index}`],
      project: index === 1 ? 'mobile-chrome' : 'chromium',
      repeatEachIndex: 0,
      expectedStatus: index === 2 ? 'skipped' : 'passed',
      annotations: index === 2 ? [{ type: 'fixme' }] : [],
      fingerprint: String(index + 1).repeat(64),
      serialGroup: null,
    };
    return { ...test, key: legacyKey(test.profile, test) };
  });
  const legacy = legacyManifestSchema.parse({
    schemaVersion: 1,
    tests,
    registered: [],
    setups: [],
    groups: [],
  });
  const execution = legacyExecutionSchema.parse({
    schemaVersion: 1,
    entries: tests.map(({ key, fingerprint }, index) => {
      const identity = { key, fingerprint };
      if (index === 1)
        return {
          ...identity,
          disposition: 'existing-skip',
          reason: '既存のPC専用検証',
          expectedAnnotation: { type: 'skip', description: 'PCのみ' },
        };
      if (index === 2)
        return {
          ...identity,
          disposition: 'existing-fixme',
          reason: '既存の共有状態の問題',
          expectedAnnotation: { type: 'fixme' },
        };
      if (index === 3)
        return {
          ...identity,
          disposition: 'deferred-live',
          reason: '外部依存',
        };
      return { ...identity, disposition: 'local' };
    }),
  });
  const results = legacyExecutionResultsSchema.parse(
    execution.entries
      .filter(({ disposition }) => disposition !== 'deferred-live')
      .map((entry) => ({
        key: entry.key,
        fingerprint: entry.fingerprint,
        status: entry.disposition === 'local' ? 'passed' : 'skipped',
        expectedStatus: entry.disposition === 'local' ? 'passed' : 'skipped',
        annotations:
          'expectedAnnotation' in entry ? [entry.expectedAnnotation] : [],
      })),
  );
  return { legacy, execution, results };
};
const at = <T>(values: T[], index: number): T => {
  const value = values[index];
  if (isNil(value)) throw new Error('fixtureが不足しています。');
  return value;
};
const codes = (input: Parameters<typeof validateLegacyExecution>[0]) =>
  validateLegacyExecution(input).issues.map(({ code }) => code);
const separate = (legacy: LegacyManifest, isSetup: boolean) => {
  const original = at(legacy.tests, 0);
  const next = {
    ...original,
    file: isSetup ? 'e2e/auth.setup.ts' : '.storybook/sample.spec.ts',
    profile: isSetup ? 'app' : 'storybook',
    project: isSetup ? 'auth-setup' : '',
  };
  const entry = { ...next, key: legacyKey(next.profile, next) };
  if (isSetup) legacy.setups.push(entry);
  else
    legacy.registered.push({
      ...entry,
      caseId: 'case',
      variant: 'one',
      binding: 'main',
    });
  return entry;
};

describe('旧登録の実行先集合', () => {
  it('構造・集合だけの検査と実行結果を区別する', () => {
    const { legacy, execution } = fixture();
    expect(validateLegacyExecution({ legacy, execution })).toEqual({
      issues: [],
      resultsChecked: false,
      counts: {
        total: 4,
        local: 1,
        existingSkip: 1,
        existingFixme: 1,
        deferredLive: 1,
      },
    });
  });

  it('4種類の実行先と一致する結果を受け付け、入力順・入力値を変えない', () => {
    const input = fixture();
    const before = structuredClone(input);
    expect(validateLegacyExecution(input).issues).toEqual([]);
    expect(input).toEqual(before);
    input.execution.entries.reverse();
    input.results.reverse();
    expect(validateLegacyExecution(input).issues).toEqual([]);
    expect(validateLegacyExecution(input).resultsChecked).toBe(true);
  });

  it('実行先の欠落・重複・未知のkeyを拒否する', () => {
    const input = fixture();
    input.execution.entries.pop();
    input.execution.entries.push(
      structuredClone(at(input.execution.entries, 0)),
    );
    input.execution.entries.push({
      key: 'unknown',
      fingerprint: 'a'.repeat(64),
      disposition: 'local',
    });
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'EXECUTION_MISSING',
        'DUPLICATE_EXECUTION',
        'UNKNOWN_ENTRY',
      ]),
    );
  });

  it.each([
    true,
    false,
  ])('setupと登録済みStorybookを旧app集合へ混ぜない: %s', (isSetup) => {
    const input = fixture();
    const entry = separate(input.legacy, isSetup);
    input.execution.entries.push({
      key: entry.key,
      fingerprint: entry.fingerprint,
      disposition: 'local',
    });
    expect(codes(input)).toContain('OUT_OF_SCOPE_ENTRY');
  });

  it('旧test集合の空・本文fingerprint変更を拒否する', () => {
    const input = fixture();
    at(input.execution.entries, 0).fingerprint = 'e'.repeat(64);
    expect(codes(input)).toContain('FINGERPRINT_MISMATCH');
    input.legacy.tests = [];
    input.execution.entries = [];
    expect(codes(input)).toContain('EMPTY_LEGACY');
  });

  it('project/title/repeatを含む登録identityを省略しない', () => {
    const input = fixture();
    const source = at(input.legacy.tests, 0);
    at(input.execution.entries, 0).key = legacyKey(source.profile, {
      ...source,
      repeatEachIndex: 1,
    });
    expect(codes(input)).toEqual(
      expect.arrayContaining(['UNKNOWN_ENTRY', 'EXECUTION_MISSING']),
    );
  });

  it.each([
    'existing-skip',
    'existing-fixme',
    'deferred-live',
  ])('非localの理由なし・空白だけを拒否する: %s', (disposition) => {
    for (const reason of [undefined, '', '   ']) {
      const input = fixture();
      const entry = input.execution.entries.find(
        (item) => item.disposition === disposition,
      );
      if (isNil(entry)) throw new Error('fixture不足');
      Reflect.set(entry, 'reason', reason);
      expect(() => validateLegacyExecution(input)).toThrow();
    }
  });

  it('不正field・fingerprint形式・null結果を構造エラーにする', () => {
    const input = fixture();
    expect(() =>
      validateLegacyExecution({ ...input, results: null }),
    ).toThrow();
    expect(() =>
      validateLegacyExecution({ ...input, baselineExecution: null }),
    ).toThrow();
    expect(() =>
      validateLegacyExecution({
        ...input,
        execution: { ...input.execution, extra: true },
      }),
    ).toThrow();
    at(input.execution.entries, 0).fingerprint = 'short';
    expect(() => validateLegacyExecution(input)).toThrow();
  });

  it('既存fixmeの理由annotation不一致やlocalへの偽装を拒否する', () => {
    const input = fixture();
    const entry = at(input.execution.entries, 2);
    if (entry.disposition !== 'existing-fixme') throw new Error('fixture不足');
    entry.expectedAnnotation.description = '別理由';
    expect(codes(input)).toContain('LEGACY_STATE_MISMATCH');
    input.execution.entries[2] = {
      key: entry.key,
      fingerprint: entry.fingerprint,
      disposition: 'local',
    };
    expect(codes(input)).toContain('LEGACY_STATE_MISMATCH');
  });

  it('登録のexpected-failureをlocal/deferredで隠さない', () => {
    const input = fixture();
    at(input.legacy.tests, 0).expectedStatus = 'failed';
    at(input.legacy.tests, 3).annotations.push({ type: 'fail' });
    expect(
      codes(input).filter((code) => code === 'LEGACY_STATE_MISMATCH'),
    ).toHaveLength(2);
  });
});

describe('信頼するbaseからの変更', () => {
  it('localを新skipやdeferredへ変えて理由を付けても拒否する', () => {
    const input = fixture();
    const baselineExecution = structuredClone(input.execution);
    const entry = at(input.execution.entries, 0);
    input.execution.entries[0] = {
      ...entry,
      disposition: 'deferred-live',
      reason: '後から外部依存と記録',
    };
    expect(codes({ ...input, baselineExecution })).toContain('NEW_EXCLUSION');
    input.execution.entries[0] = {
      ...entry,
      disposition: 'existing-skip',
      reason: '後からskipと記録',
      expectedAnnotation: { type: 'skip', description: '不足' },
    };
    expect(codes({ ...input, baselineExecution })).toContain('NEW_EXCLUSION');
  });

  it('既存skipの条件変更とfingerprintの同時リベースを拒否する', () => {
    const input = fixture();
    const baselineExecution = structuredClone(input.execution);
    const entry = at(input.execution.entries, 1);
    if (entry.disposition !== 'existing-skip') throw new Error('fixture不足');
    entry.expectedAnnotation.description = 'データ不足';
    at(input.legacy.tests, 0).fingerprint = 'e'.repeat(64);
    at(input.execution.entries, 0).fingerprint = 'e'.repeat(64);
    expect(codes({ ...input, baselineExecution })).toEqual(
      expect.arrayContaining(['NEW_EXCLUSION', 'BASELINE_FINGERPRINT_CHANGED']),
    );
  });

  it('baseの重複・対象削除・追加を拒否する', () => {
    const input = fixture();
    const baselineExecution = structuredClone(input.execution);
    baselineExecution.entries.push(
      structuredClone(at(baselineExecution.entries, 0)),
    );
    input.execution.entries.pop();
    input.execution.entries.push({
      key: 'new-key',
      fingerprint: 'e'.repeat(64),
      disposition: 'local',
    });
    expect(codes({ ...input, baselineExecution })).toEqual(
      expect.arrayContaining([
        'DUPLICATE_BASELINE',
        'REMOVED_EXECUTION_ENTRY',
        'NEW_EXECUTION_ENTRY',
      ]),
    );
  });

  it('外部依存の解消によるlocal化は許容し、理由文の改善だけでは条件を変えない', () => {
    const input = fixture();
    const baselineExecution = structuredClone(input.execution);
    const deferred = at(input.execution.entries, 3);
    input.execution.entries[3] = {
      key: deferred.key,
      fingerprint: deferred.fingerprint,
      disposition: 'local',
    };
    const skip = at(input.execution.entries, 1);
    if (skip.disposition !== 'existing-skip') throw new Error('fixture不足');
    skip.reason = 'PC専用という理由を詳しく説明';
    const { legacy, execution } = input;
    expect(
      validateLegacyExecution({ legacy, execution, baselineExecution }).issues,
    ).toEqual([]);
  });
});

describe('runtimeのskipと失敗', () => {
  it.each([
    'skipped',
    'failed',
    'timedOut',
    'interrupted',
  ] as const)('localの%sを成功にしない', (status) => {
    const input = fixture();
    at(input.results, 0).status = status;
    expect(codes(input)).toContain('LOCAL_RESULT_FAILED');
  });

  it('passedでもexpected-failure/skip annotationが追加されていれば拒否する', () => {
    const input = fixture();
    at(input.results, 0).expectedStatus = 'failed';
    expect(codes(input)).toContain('LOCAL_RESULT_FAILED');
    at(input.results, 0).expectedStatus = 'passed';
    at(input.results, 0).annotations.push({
      type: 'skip',
      description: '新しい不足',
    });
    expect(codes(input)).toContain('LOCAL_RESULT_FAILED');
  });

  it('既存skipでもデータ不足など別理由を許可せず、fixmeへの変更も拒否する', () => {
    const input = fixture();
    at(input.results, 1).annotations = [
      { type: 'skip', description: 'データ不足' },
    ];
    at(input.results, 2).annotations = [{ type: 'skip' }];
    expect(
      codes(input).filter((code) => code === 'EXCLUSION_RESULT_MISMATCH'),
    ).toHaveLength(2);
  });

  it('既存skipをpassedと偽装した結果も拒否する', () => {
    const input = fixture();
    at(input.results, 1).status = 'passed';
    expect(codes(input)).toContain('EXCLUSION_RESULT_MISMATCH');
  });

  it('結果欠落・重複・未知・fingerprint不一致をそれぞれ拒否する', () => {
    const input = fixture();
    input.results.pop();
    const first = at(input.results, 0);
    first.fingerprint = 'e'.repeat(64);
    input.results.push(structuredClone(first));
    input.results.push({ ...first, key: 'unknown' });
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'RESULT_MISSING',
        'DUPLICATE_RESULT',
        'UNKNOWN_RESULT',
        'RESULT_FINGERPRINT_MISMATCH',
      ]),
    );
  });

  it('resultsを指定した空配列は静的検査へ戻さず欠落にする', () => {
    const input = fixture();
    input.results = [];
    expect(validateLegacyExecution(input).resultsChecked).toBe(true);
    expect(
      codes(input).filter((code) => code === 'RESULT_MISSING'),
    ).toHaveLength(3);
  });

  it('deferredの結果はskipを含め一切実行済みへ混ぜない', () => {
    const input = fixture();
    const deferred = at(input.execution.entries, 3);
    input.results.push({
      key: deferred.key,
      fingerprint: deferred.fingerprint,
      status: 'skipped',
      expectedStatus: 'skipped',
      annotations: [{ type: 'skip', description: '外部保留' }],
    });
    expect(codes(input)).toContain('DEFERRED_TEST_EXECUTED');
  });
});

describe('保存した348登録の対応表', () => {
  it('旧目録を変更せず319/9/2/18へ分類し、setupとStorybookを別に保つ', () => {
    const read = (name: string): unknown =>
      JSON.parse(
        readFileSync(
          new URL(`../../e2e/ledger/${name}`, import.meta.url),
          'utf8',
        ),
      );
    const legacy = legacyManifestSchema.parse(
      read('legacy-tests.generated.json'),
    );
    const execution = legacyExecutionSchema.parse(
      read('legacy-execution.json'),
    );
    const report = validateLegacyExecution({ legacy, execution });
    expect(report.issues).toEqual([]);
    expect(report.counts).toEqual({
      total: 348,
      local: 319,
      existingSkip: 9,
      existingFixme: 2,
      deferredLive: 18,
    });
    expect(legacy.setups).toHaveLength(1);
    expect(legacy.registered).toHaveLength(8);
    const byKey = new Map(legacy.tests.map((entry) => [entry.key, entry]));
    for (const entry of execution.entries) {
      const source = byKey.get(entry.key);
      if (isNil(source)) throw new Error('対応する旧登録がありません。');
      if (entry.disposition === 'existing-skip') {
        expect(source.project).toBe('mobile-chrome');
        expect(source.file).toBe('e2e/scenarios/routing.spec.ts');
        expect(entry.expectedAnnotation.description).toBe(
          'ビューポート幅を明示したPC検証',
        );
      }
    }
    const reasons = execution.entries
      .filter((entry) => entry.disposition === 'deferred-live')
      .map((entry) => entry.reason)
      .join('\n');
    expect(reasons).toContain('items/99999999999');
    expect(reasons).toContain('items/12345');
    expect(reasons).toContain('E2E_LIVE_IMPORT未設定');
  });
});
