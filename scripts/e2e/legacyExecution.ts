import { isNil } from 'ramda';

import { legacyManifestSchema } from './legacy';
import {
  legacyExecutionResultsSchema,
  legacyExecutionSchema,
} from './legacyExecutionSchema';

import type { LegacyManifest } from './legacy';
import type {
  LegacyExecution,
  LegacyExecutionEntry,
  LegacyExecutionResult,
} from './legacyExecutionSchema';

type LegacyExecutionIssue = { code: string; key: string; message: string };
type LegacyExecutionInput = {
  legacy: unknown;
  execution: unknown;
  baselineExecution?: unknown;
  results?: unknown;
};
type AddIssue = (code: string, key: string, message: string) => void;
type LegacyEntry = LegacyManifest['tests'][number];

const controlAnnotations = (annotations: LegacyEntry['annotations']) =>
  annotations
    .filter(({ type }) => ['skip', 'fixme', 'fail'].includes(type))
    .map(({ type, description }) => JSON.stringify([type, description ?? null]))
    .sort();
const sameAnnotations = (
  left: LegacyEntry['annotations'],
  right: LegacyEntry['annotations'],
) =>
  JSON.stringify(controlAnnotations(left)) ===
  JSON.stringify(controlAnnotations(right));

const entriesByKey = (
  manifest: LegacyExecution,
  code: string,
  add: AddIssue,
) => {
  const entries = new Map<string, LegacyExecutionEntry>();
  for (const entry of manifest.entries) {
    if (entries.has(entry.key))
      add(code, entry.key, '実行先が重複しています。');
    entries.set(entry.key, entry);
  }
  return entries;
};

const checkBaseline = (
  baseline: LegacyExecution,
  current: Map<string, LegacyExecutionEntry>,
  add: AddIssue,
) => {
  const previous = entriesByKey(baseline, 'DUPLICATE_BASELINE', add);
  for (const entry of current.values()) {
    const old = previous.get(entry.key);
    if (isNil(old)) {
      add('NEW_EXECUTION_ENTRY', entry.key, '信頼するbaseにない実行先です。');
      continue;
    }
    if (old.fingerprint !== entry.fingerprint)
      add(
        'BASELINE_FINGERPRINT_CHANGED',
        entry.key,
        '旧testの本文を新しい基準へ自動更新できません。',
      );
    if (
      entry.disposition !== 'local' &&
      (old.disposition !== entry.disposition ||
        ('expectedAnnotation' in entry &&
          (!('expectedAnnotation' in old) ||
            !sameAnnotations(
              [old.expectedAnnotation],
              [entry.expectedAnnotation],
            ))))
    )
      add(
        'NEW_EXCLUSION',
        entry.key,
        '新しい未実行分類またはskip条件への変更は認められません。',
      );
  }
  for (const key of previous.keys())
    if (!current.has(key))
      add('REMOVED_EXECUTION_ENTRY', key, '旧testの実行先が失われています。');
};

const checkDeclaredState = (
  source: LegacyEntry,
  entry: LegacyExecutionEntry,
  add: AddIssue,
) => {
  if (
    (entry.disposition === 'local' || entry.disposition === 'deferred-live') &&
    (source.expectedStatus !== 'passed' ||
      controlAnnotations(source.annotations).length > 0)
  )
    add(
      'LEGACY_STATE_MISMATCH',
      entry.key,
      'skip/fixme/expected-failure登録をlocal成功として扱えません。',
    );
  if (
    entry.disposition === 'existing-fixme' &&
    (source.expectedStatus !== 'skipped' ||
      !sameAnnotations(source.annotations, [entry.expectedAnnotation]))
  )
    add(
      'LEGACY_STATE_MISMATCH',
      entry.key,
      '既存fixmeの登録状態とannotationが一致しません。',
    );
  if (
    entry.disposition === 'existing-skip' &&
    (source.expectedStatus === 'passed'
      ? controlAnnotations(source.annotations).length > 0
      : source.expectedStatus !== 'skipped' ||
        !sameAnnotations(source.annotations, [entry.expectedAnnotation]))
  )
    add(
      'LEGACY_STATE_MISMATCH',
      entry.key,
      '既存skipの登録状態とannotationが一致しません。',
    );
};

const checkResults = (
  results: LegacyExecutionResult[],
  entries: Map<string, LegacyExecutionEntry>,
  add: AddIssue,
) => {
  const seen = new Set<string>();
  for (const result of results) {
    if (seen.has(result.key))
      add('DUPLICATE_RESULT', result.key, '同じ登録の結果が重複しています。');
    seen.add(result.key);
    const entry = entries.get(result.key);
    if (isNil(entry)) {
      add('UNKNOWN_RESULT', result.key, '実行先台帳にない結果です。');
      continue;
    }
    if (result.fingerprint !== entry.fingerprint)
      add(
        'RESULT_FINGERPRINT_MISMATCH',
        result.key,
        '実行したtestのfingerprintが一致しません。',
      );
    if (entry.disposition === 'deferred-live') {
      add(
        'DEFERRED_TEST_EXECUTED',
        result.key,
        '外部依存として延期したtestをlocalで実行しています。',
      );
      continue;
    }
    if (entry.disposition === 'local') {
      if (
        result.status !== 'passed' ||
        result.expectedStatus !== 'passed' ||
        controlAnnotations(result.annotations).length > 0
      )
        add(
          'LOCAL_RESULT_FAILED',
          result.key,
          'local testはskipやexpected-failureを含まない成功が必要です。',
        );
    } else if (
      result.status !== 'skipped' ||
      result.expectedStatus !== 'skipped' ||
      !sameAnnotations(result.annotations, [entry.expectedAnnotation])
    )
      add(
        'EXCLUSION_RESULT_MISMATCH',
        result.key,
        '既存skip/fixmeの結果または理由が宣言と一致しません。',
      );
  }
  for (const entry of entries.values())
    if (entry.disposition !== 'deferred-live' && !seen.has(entry.key))
      add('RESULT_MISSING', entry.key, '実行すべき登録の結果がありません。');
};

/**
 * appの旧test集合を検証する。setupとcase登録済みStorybookは対象外。
 * 構造不正はthrow、集合・状態不整合はissuesへ返す。results省略は静的検査のみ。
 * baselineExecutionはCIの信頼するbaseから渡し、現行JSONを代入して承認しない。
 */
export const validateLegacyExecution = (input: LegacyExecutionInput) => {
  const legacy = legacyManifestSchema.parse(input.legacy);
  const execution = legacyExecutionSchema.parse(input.execution);
  const issues: LegacyExecutionIssue[] = [];
  const add: AddIssue = (code, key, message) =>
    issues.push({ code, key, message });
  const source = new Map(
    legacy.tests
      .filter((entry) => entry.profile === 'app')
      .map((entry) => [entry.key, entry]),
  );
  const separate = new Set(
    [
      ...legacy.setups,
      ...legacy.registered,
      ...legacy.tests.filter((entry) => entry.profile !== 'app'),
    ].map(({ key }) => key),
  );
  const entries = entriesByKey(execution, 'DUPLICATE_EXECUTION', add);
  if (source.size === 0)
    add('EMPTY_LEGACY', 'app', '旧app testの登録集合が空です。');
  for (const entry of entries.values()) {
    const original = source.get(entry.key);
    if (isNil(original)) {
      add(
        separate.has(entry.key) ? 'OUT_OF_SCOPE_ENTRY' : 'UNKNOWN_ENTRY',
        entry.key,
        '旧app test集合にない実行先です。setupと登録済みcaseは別に検証してください。',
      );
      continue;
    }
    if (entry.fingerprint !== original.fingerprint)
      add(
        'FINGERPRINT_MISMATCH',
        entry.key,
        '旧test登録とfingerprintが一致しません。',
      );
    checkDeclaredState(original, entry, add);
  }
  for (const key of source.keys())
    if (!entries.has(key))
      add('EXECUTION_MISSING', key, '旧testの実行先がありません。');
  if ('baselineExecution' in input)
    checkBaseline(
      legacyExecutionSchema.parse(input.baselineExecution),
      entries,
      add,
    );
  const resultsChecked = 'results' in input;
  if (resultsChecked)
    checkResults(
      legacyExecutionResultsSchema.parse(input.results),
      entries,
      add,
    );
  const count = (disposition: LegacyExecutionEntry['disposition']) =>
    execution.entries.filter((entry) => entry.disposition === disposition)
      .length;
  return {
    issues: issues.sort((left, right) => {
      const a = JSON.stringify([left.key, left.code]);
      const b = JSON.stringify([right.key, right.code]);
      return a < b ? -1 : a > b ? 1 : 0;
    }),
    resultsChecked,
    counts: {
      total: execution.entries.length,
      local: count('local'),
      existingSkip: count('existing-skip'),
      existingFixme: count('existing-fixme'),
      deferredLive: count('deferred-live'),
    },
  };
};

export type { LegacyExecutionInput, LegacyExecutionIssue };
