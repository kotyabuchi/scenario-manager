import { describe, expect, it } from 'vitest';

import { legacyKey, legacyManifestSchema } from './legacy';
import { legacyExecutionSchema } from './legacyExecutionSchema';
import {
  createLegacySelection,
  validateLegacyDiscovery,
} from './legacySelection';

import { readFileSync } from 'node:fs';

const legacy = legacyManifestSchema.parse(
  JSON.parse(readFileSync('e2e/ledger/legacy-tests.generated.json', 'utf8')),
);
const execution = legacyExecutionSchema.parse(
  JSON.parse(readFileSync('e2e/ledger/legacy-execution.json', 'utf8')),
);
const input = () => ({
  legacy: structuredClone(legacy),
  execution: structuredClone(execution),
  currentLegacy: legacyManifestSchema.parse({
    ...structuredClone(legacy),
    registered: structuredClone(
      legacy.registered.filter((entry) => entry.profile === 'app'),
    ),
    setups: [],
  }),
  project: 'chromium',
});

describe('旧testのexact選択', () => {
  it('移行済み5caseをauth projectごとの実行対象へ保つ', () => {
    for (const project of ['chromium-auth', 'mobile-chrome-auth']) {
      const selection = createLegacySelection({ ...input(), project });
      expect(
        selection.entries.filter((entry) => 'caseId' in entry),
      ).toHaveLength(5);
      expect(selection.keys).toHaveLength(108);
    }
  });

  it.each([
    'missing',
    'fingerprint',
    'caseId',
    'variant',
    'binding',
  ] as const)('現在の移行済み登録の%s改変を拒否する', (mode) => {
    const value = input();
    const first = value.currentLegacy.registered[0];
    if (!first) throw new Error('replacement fixtureが空です。');
    if (mode === 'missing') value.currentLegacy.registered.pop();
    else if (mode === 'fingerprint') first.fingerprint = '0'.repeat(64);
    else first[mode] = 'different';
    expect(() => createLegacySelection(value)).toThrow();
  });
  it('全348登録を照合したうえで4projectの非deferred330件だけを選択する', () => {
    const value = input();
    expect(value.currentLegacy.tests).toHaveLength(338);
    expect(value.currentLegacy.registered).toHaveLength(10);
    const selections = [
      ...new Set(legacy.tests.map((entry) => entry.project)),
    ].map((project) => createLegacySelection({ ...value, project }));
    expect(
      selections.reduce((count, selection) => count + selection.keys.length, 0),
    ).toBe(330);
    const selected = createLegacySelection(value);
    expect(selected.testList.split('\n').filter(Boolean)).toEqual(
      selected.entries.map(
        (entry) =>
          `[${entry.project}] › ${entry.file.slice(4)} › ${entry.titlePath.join(' › ')}`,
      ),
    );
    expect(
      selected.keys.some(
        (key) =>
          execution.entries.find((entry) => entry.key === key)?.disposition ===
          'deferred-live',
      ),
    ).toBe(false);
  });

  it.each([
    'missing',
    'extra',
    'fingerprint',
    'status',
    'annotation',
    'setup',
    'registered',
  ] as const)('現在discoveryの%s差異を拒否する', (mode) => {
    const value = input();
    const first = value.currentLegacy.tests[0];
    if (!first) throw new Error('fixtureが空です。');
    if (mode === 'missing') value.currentLegacy.tests.pop();
    if (mode === 'extra') {
      const extra = { ...first, titlePath: ['追加', '登録'] };
      extra.key = legacyKey('app', extra);
      value.currentLegacy.tests.push(extra);
    }
    if (mode === 'fingerprint') first.fingerprint = '0'.repeat(64);
    if (mode === 'status') first.expectedStatus = 'failed';
    if (mode === 'annotation') first.annotations.push({ type: 'skip' });
    if (mode === 'setup') value.currentLegacy.setups = legacy.setups;
    if (mode === 'registered')
      value.currentLegacy.registered = legacy.registered;
    expect(() => validateLegacyDiscovery(value)).toThrow();
  });

  it.each([
    'separator',
    'newline',
    'whitespace',
    'repeat',
    'file',
    'project',
  ] as const)('test-listに正確に表現できない%sを拒否する', (mode) => {
    const value = input();
    const first = value.legacy.tests[0];
    if (!first) throw new Error('fixtureが空です。');
    const oldKey = first.key;
    if (mode === 'separator') first.titlePath = ['a › b', 'test'];
    if (mode === 'newline') first.titlePath = ['a\nb', 'test'];
    if (mode === 'whitespace') first.titlePath = [' padded ', 'test'];
    if (mode === 'repeat') first.repeatEachIndex = 1;
    if (mode === 'file') first.file = 'e2e/../outside.spec.ts';
    if (mode === 'project') first.project = 'bad]name';
    first.key = legacyKey('app', first);
    const entry = value.execution.entries.find((item) => item.key === oldKey);
    if (!entry) throw new Error('実行先が空です。');
    entry.key = first.key;
    value.currentLegacy.tests = structuredClone(value.legacy.tests);
    value.project = first.project;
    expect(() => createLegacySelection(value)).toThrow();
  });

  it('重複登録・未知project・不正execution台帳を拒否する', () => {
    const value = input();
    const first = value.currentLegacy.tests[0];
    if (!first) throw new Error('fixtureが空です。');
    value.currentLegacy.tests.push(first);
    expect(() => createLegacySelection(value)).toThrow();
    expect(() =>
      createLegacySelection({ ...input(), project: 'unknown' }),
    ).toThrow();
    const invalid = input();
    invalid.execution.entries.pop();
    expect(() => createLegacySelection(invalid)).toThrow();
  });
});
