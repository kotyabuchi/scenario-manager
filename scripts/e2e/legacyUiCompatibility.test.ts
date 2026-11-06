import { describe, expect, it } from 'vitest';

import uiCompatibility from '../../e2e/legacy/ui-compatibility.json';
import { legacyManifestSchema } from './legacy';
import {
  readVerifiedLegacyBaselines,
  readVerifiedLegacyUiCompatibility,
} from './legacyBaseline';
import { legacyExecutionSchema } from './legacyExecutionSchema';
import { applyLegacyUiCompatibility } from './legacyUiCompatibility';

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const differentFingerprint = 'f'.repeat(64);

const fixture = () => {
  const baselines = readVerifiedLegacyBaselines(root);
  const legacy = legacyManifestSchema.parse(baselines.legacy);
  const execution = legacyExecutionSchema.parse(baselines.execution);
  const compatibility = structuredClone(uiCompatibility);
  const first = compatibility.entries[0];
  if (!first) throw new Error('UI互換fixtureの対応がありません。');
  const targets = new Map(
    compatibility.entries.map(({ key, to }) => [key, to]),
  );
  const currentLegacy = structuredClone(legacy);
  currentLegacy.setups = [];
  currentLegacy.registered = currentLegacy.registered.filter(
    ({ profile }) => profile === 'app',
  );
  for (const entry of currentLegacy.tests)
    entry.fingerprint = targets.get(entry.key) ?? entry.fingerprint;
  const current = currentLegacy.tests.find(({ key }) => key === first.key);
  if (!current) throw new Error('UI互換fixtureの対象登録がありません。');
  return {
    input: { legacy, execution, compatibility, currentLegacy },
    first,
    current,
    targets,
  };
};

describe('前提PRの旧suiteと現行UIの本文対応', () => {
  it('原本を変更せず指定した10登録の本文だけを置換する', () => {
    const { input, targets } = fixture();
    const before = structuredClone(input);
    const result = applyLegacyUiCompatibility(input);
    expect(readVerifiedLegacyUiCompatibility(root)).toEqual(uiCompatibility);
    expect(result.compatibility.entries).toHaveLength(10);
    expect(input).toEqual(before);
    expect(result.legacy).toEqual({
      ...before.legacy,
      tests: input.currentLegacy.tests,
    });
    expect(result.execution.entries).toEqual(
      before.execution.entries.map((entry) => ({
        ...entry,
        fingerprint: targets.get(entry.key) ?? entry.fingerprint,
      })),
    );
  });

  it('対応ファイルのbyteを変更すると読取時に拒否する', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'legacy-ui-'));
    try {
      const directory = join(temporaryRoot, 'e2e', 'legacy');
      mkdirSync(directory, { recursive: true });
      writeFileSync(
        join(directory, 'ui-compatibility.json'),
        JSON.stringify(uiCompatibility),
      );
      expect(() => readVerifiedLegacyUiCompatibility(temporaryRoot)).toThrow(
        'UI互換対応が固定元と一致しません',
      );
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('未知の登録を拒否する', () => {
    const { input, first } = fixture();
    first.key = 'unknown';
    expect(() => applyLegacyUiCompatibility(input)).toThrow('対象外の登録');
  });

  it('同じ登録を重複させた対応を拒否する', () => {
    const { input, first } = fixture();
    input.compatibility.entries.splice(1, 1, { ...first });
    expect(() => applyLegacyUiCompatibility(input)).toThrow('重複');
  });

  it('登録の対応を減らすと拒否する', () => {
    const { input } = fixture();
    input.compatibility.entries.pop();
    expect(() => applyLegacyUiCompatibility(input)).toThrow('too_small');
  });

  it('登録の対応を増やすと拒否する', () => {
    const { input, first } = fixture();
    input.compatibility.entries.push({ ...first });
    expect(() => applyLegacyUiCompatibility(input)).toThrow('too_big');
  });

  it('原本の変更元と一致しない対応を拒否する', () => {
    const { input, first } = fixture();
    first.from = differentFingerprint;
    expect(() => applyLegacyUiCompatibility(input)).toThrow('変更元');
  });

  it('実行先台帳の変更元と一致しない対応を拒否する', () => {
    const { input, first } = fixture();
    const planned = input.execution.entries.find(
      ({ key }) => key === first.key,
    );
    if (!planned) throw new Error('UI互換fixtureの実行先がありません。');
    planned.fingerprint = differentFingerprint;
    expect(() => applyLegacyUiCompatibility(input)).toThrow('変更元');
  });

  it('列挙で得た本文と一致しない変更先を拒否する', () => {
    const { input, first } = fixture();
    first.to = differentFingerprint;
    expect(() => applyLegacyUiCompatibility(input)).toThrow('変更先');
  });

  it('本文が同じでも新しいskipと注釈を拒否する', () => {
    const { input, current } = fixture();
    current.expectedStatus = 'skipped';
    current.annotations = [{ type: 'skip', description: '新規skip' }];
    expect(() => applyLegacyUiCompatibility(input)).toThrow(
      '状態が一致しません',
    );
  });

  it('本文が同じでも通常caseへの登録変更を拒否する', () => {
    const { input, current } = fixture();
    input.currentLegacy.tests = input.currentLegacy.tests.filter(
      ({ key }) => key !== current.key,
    );
    input.currentLegacy.registered.push({
      ...current,
      caseId: 'new-case',
      variant: 'new-variant',
      binding: 'new-binding',
    });
    expect(() => applyLegacyUiCompatibility(input)).toThrow('変更先');
  });

  it('対応外の本文変更を拒否する', () => {
    const { input, targets } = fixture();
    const unrelated = input.currentLegacy.tests.find(
      ({ key }) => !targets.has(key),
    );
    if (!unrelated) throw new Error('UI互換fixtureの対応外登録がありません。');
    unrelated.fingerprint = differentFingerprint;
    expect(() => applyLegacyUiCompatibility(input)).toThrow('本文/状態');
  });
});
