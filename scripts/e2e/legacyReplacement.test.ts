import { isNil } from 'ramda';
import { describe, expect, it } from 'vitest';

import { legacyKey, legacyManifestSchema } from './legacy';
import { validateLegacyExecution } from './legacyExecution';
import { legacyExecutionSchema } from './legacyExecutionSchema';

const fixture = () => {
  const registration = {
    profile: 'app',
    project: 'chromium',
    file: 'e2e/sample.spec.ts',
    titlePath: ['suite', 'sample'],
    repeatEachIndex: 0,
    expectedStatus: 'passed',
    annotations: [],
    serialGroup: 'serial',
    fingerprint: 'a'.repeat(64),
    key: '',
  };
  registration.key = legacyKey(registration.profile, registration);
  const replacement = {
    caseId: 'case',
    variant: 'default',
    binding: 'binding',
  };
  const legacy = legacyManifestSchema.parse({
    schemaVersion: 1,
    tests: [],
    setups: [],
    groups: [],
    registered: [
      { ...registration, ...replacement, fingerprint: 'b'.repeat(64) },
    ],
  });
  const execution = legacyExecutionSchema.parse({
    schemaVersion: 1,
    entries: [
      {
        key: registration.key,
        fingerprint: registration.fingerprint,
        disposition: 'replacement',
        reason: '登録済みcaseへ移行',
        origin: { revision: 'c'.repeat(40), registration },
        replacement,
      },
    ],
  });
  const entry = execution.entries[0];
  const target = legacy.registered[0];
  if (entry?.disposition !== 'replacement' || isNil(target))
    throw new Error('fixture不足');
  const results = [
    {
      key: entry.key,
      fingerprint: target.fingerprint,
      originFingerprint: entry.fingerprint,
      status: 'passed',
      expectedStatus: 'passed',
      annotations: [],
    },
  ];
  const result = results[0];
  if (isNil(result)) throw new Error('fixture不足');
  const baselineExecution = legacyExecutionSchema.parse({
    schemaVersion: 1,
    entries: [
      {
        key: entry.key,
        fingerprint: entry.fingerprint,
        disposition: 'local',
      },
    ],
  });
  return {
    legacy,
    execution,
    results,
    baselineExecution,
    entry,
    target,
    result,
  };
};

const codes = (input: Parameters<typeof validateLegacyExecution>[0]) =>
  validateLegacyExecution(input).issues.map(({ code }) => code);

describe('旧app登録のreplacement契約', () => {
  it('旧目録から消えた登録をoriginで補完しlocalから移行できる', () => {
    const input = fixture();
    expect(codes(input)).toEqual([]);
    expect(validateLegacyExecution(input).counts.replacement).toBe(1);
    expect(codes({ ...input, results: [] })).toContain('RESULT_MISSING');
  });

  it('空の理由・短縮revision・不完全なorigin登録を構造エラーにする', () => {
    for (const field of ['reason', 'revision', 'registration']) {
      const input = fixture();
      if (field === 'reason') input.entry.reason = '   ';
      if (field === 'revision') input.entry.origin.revision = 'abc123';
      if (field === 'registration')
        Reflect.deleteProperty(input.entry.origin.registration, 'annotations');
      expect(() => validateLegacyExecution(input)).toThrow();
    }
  });

  it('置換行欠落と未対応の登録済みappを拒否する', () => {
    const input = fixture();
    input.execution.entries = [];
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'REGISTERED_APP_UNMAPPED',
        'REMOVED_EXECUTION_ENTRY',
      ]),
    );
  });

  it.each([
    'key',
    'fingerprint',
    'profile',
    'project',
    'file',
    'titlePath',
    'repeatEachIndex',
    'expectedStatus',
    'annotations',
    'serialGroup',
  ] as const)('originの%s改変を拒否する', (field) => {
    const input = fixture();
    const values = {
      key: 'fake',
      fingerprint: 'd'.repeat(64),
      profile: 'storybook',
      project: 'fake',
      file: 'fake.spec.ts',
      titlePath: ['fake'],
      repeatEachIndex: 1,
      expectedStatus: 'failed',
      annotations: [{ type: 'skip' }],
      serialGroup: 'fake',
    };
    Reflect.set(input.entry.origin.registration, field, values[field]);
    expect(codes(input).length).toBeGreaterThan(0);
  });

  it.each([
    'caseId',
    'variant',
    'binding',
  ] as const)('置換先%sの登録不一致を拒否する', (field) => {
    const input = fixture();
    input.entry.replacement[field] = 'fake';
    expect(codes(input)).toContain('REPLACEMENT_TARGET_MISMATCH');
  });

  it('置換targetの重複を拒否する', () => {
    const input = fixture();
    const other = structuredClone(input.entry);
    other.origin.registration.titlePath = ['suite', 'duplicate'];
    other.key = legacyKey('app', other.origin.registration);
    other.origin.registration.key = other.key;
    input.execution.entries.push(other);
    input.legacy.registered.push({
      ...input.target,
      key: other.key,
      titlePath: other.origin.registration.titlePath,
    });
    expect(codes(input)).toContain('DUPLICATE_REPLACEMENT_TARGET');
  });

  it('同じcaseの別project実行を正当な置換として扱う', () => {
    const input = fixture();
    const other = structuredClone(input.entry);
    other.origin.registration.project = 'mobile-chrome';
    other.key = legacyKey('app', other.origin.registration);
    other.origin.registration.key = other.key;
    input.execution.entries.push(other);
    input.legacy.registered.push({
      ...input.target,
      key: other.key,
      project: 'mobile-chrome',
    });
    expect(codes({ legacy: input.legacy, execution: input.execution })).toEqual(
      [],
    );
  });

  it('旧fingerprintの結果への貼り付けとorigin証跡の欠落を拒否する', () => {
    const input = fixture();
    input.result.fingerprint = input.entry.fingerprint;
    Reflect.deleteProperty(input.result, 'originFingerprint');
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'RESULT_FINGERPRINT_MISMATCH',
        'RESULT_ORIGIN_FINGERPRINT_MISMATCH',
      ]),
    );
  });

  it.each([
    'skipped',
    'failed',
    'timedOut',
    'interrupted',
  ])('置換結果の%sを拒否する', (status) => {
    const input = fixture();
    input.result.status = status;
    expect(codes(input)).toContain('LOCAL_RESULT_FAILED');
  });

  it('追加skipとexpected-failureを登録と結果の両方で拒否する', () => {
    const input = fixture();
    input.target.annotations.push({ type: 'skip' });
    input.result.expectedStatus = 'failed';
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'REPLACEMENT_TARGET_MISMATCH',
        'LOCAL_RESULT_FAILED',
      ]),
    );
  });

  it('一度固定したorigin、targetと旧fingerprintの基準変更を拒否する', () => {
    for (const field of ['origin', 'replacement', 'fingerprint']) {
      const input = fixture();
      const baselineExecution = structuredClone(input.execution);
      if (field === 'origin') input.entry.origin.revision = 'd'.repeat(40);
      if (field === 'replacement') input.entry.replacement.binding = 'fake';
      if (field === 'fingerprint') input.entry.fingerprint = 'd'.repeat(64);
      expect(codes({ ...input, baselineExecution })).toContain(
        field === 'fingerprint'
          ? 'BASELINE_FINGERPRINT_CHANGED'
          : 'REPLACEMENT_BASELINE_CHANGED',
      );
    }
  });

  it('通常legacyにoriginFingerprintを付与できない', () => {
    const input = fixture();
    input.legacy.tests = [input.entry.origin.registration];
    input.legacy.registered = [];
    input.execution = input.baselineExecution;
    expect(codes(input)).toContain('RESULT_ORIGIN_FINGERPRINT_MISMATCH');
  });
});
