import { isNil } from 'ramda';
import { afterEach, describe, expect, it } from 'vitest';

import { discoverySchema } from './discoverySchema';
import { buildLegacy, checkLegacy, legacyManifestSchema } from './legacy';
import { createLegacySource } from './legacySource';

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import type { DiscoveredTest } from './discoverySchema';
import type { LegacyManifest } from './legacy';

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});

const location = (source: string, marker: string) => {
  const offset = source.indexOf(marker);
  if (offset < 0) throw new Error(`fixture marker不足: ${marker}`);
  const before = source.slice(0, offset).split('\n');
  return { line: before.length, column: (before.at(-1)?.length ?? 0) + 1 };
};
const snapshot = async (
  source: string,
  tests: Array<Partial<DiscoveredTest> & { marker: string }>,
  file = 'e2e/sample.spec.ts',
) => {
  const root = await mkdtemp(join(tmpdir(), 'legacy-fixture-'));
  roots.push(root);
  await mkdir(dirname(join(root, file)), { recursive: true });
  await writeFile(join(root, file), source);
  const report = discoverySchema.parse({
    schemaVersion: 1,
    profile: 'app',
    errors: [],
    projects: [...new Set(tests.map((test) => test.project ?? 'chromium'))].map(
      (name) => ({
        name,
        testDir: 'e2e',
        dependencies: [],
        repeatEach:
          Math.max(
            0,
            ...tests
              .filter((test) => (test.project ?? 'chromium') === name)
              .map((test) => test.repeatEachIndex ?? 0),
          ) + 1,
      }),
    ),
    tests: tests.map(({ marker, ...overrides }, index) => ({
      testId: `internal-${index}`,
      file,
      ...location(source, marker),
      titlePath: ['sample', 'one'],
      project: 'chromium',
      repeatEachIndex: 0,
      tags: [],
      expectedStatus: 'passed',
      annotations: [],
      isSetup: false,
      ...overrides,
    })),
  });
  return { root, report, manifest: await buildLegacy(root, [report]) };
};
const one = "test('one', async () => { expect(1).toBe(1) });";
const marker = "test('one'";
const firstKey = (manifest: LegacyManifest) => {
  const key = manifest.tests[0]?.key;
  if (isNil(key)) throw new Error('legacy test不足');
  return key;
};

describe('legacyの定義fingerprint', () => {
  const fingerprint = (source: string, find = marker) =>
    createLegacySource('e2e/sample.spec.ts', source)(location(source, find))
      .fingerprint;
  it('空白・コメント・引用符・位置だけの変更を同一とする', () => {
    expect(fingerprint(one)).toBe(
      fingerprint(
        '\n// comment\ntest(\n"one", async () => {\n /* explanation */ expect(1).toBe(1);\n});',
        'test(',
      ),
    );
  });
  it('同名testの本文変更を検出する', () => {
    expect(fingerprint(one)).not.toBe(
      fingerprint(one.replace('toBe(1)', 'toBe(2)')),
    );
  });
  it.each([
    'skip',
    'fixme',
    'fail',
  ])('test本体と参照callback内の%s条件を保持する', (method) => {
    const source = `const reason = 'unsupported'; test('one', () => { if (true) { test.${method}(false, reason); } expect(1).toBe(1); });`;
    expect(fingerprint(source)).not.toBe(
      fingerprint(source.replace(`${method}(false`, `${method}(true`)),
    );
    const helper = `const reason = 'unsupported'; const callback = () => { test.${method}(false, reason); expect(1).toBe(1); }; test('one', callback);`;
    expect(fingerprint(helper)).not.toBe(
      fingerprint(helper.replace(`${method}(false`, `${method}(true`)),
    );
  });

  it('他testだけの本文変更では除外を解除しない', () => {
    const sibling = "\ntest('two', () => expect(2).toBe(2));";
    expect(fingerprint(one + sibling)).toBe(
      fingerprint(one + sibling.replace('toBe(2)', 'toBe(3)')),
    );
  });
  it.each([
    ['const value = 1;\n', 'const value = 2;\n'],
    [
      'test.beforeEach(() => prepare(1));\n',
      'test.beforeEach(() => prepare(2));\n',
    ],
    ["test.use({ locale: 'ja' });\n", "test.use({ locale: 'en' });\n"],
  ])('root宣言・hook・fixture設定の変更を保持する', (before, after) => {
    expect(fingerprint(before + one)).not.toBe(fingerprint(after + one));
  });
  it('所属suiteとloop parameterの変更を保持する', () => {
    const suite = `test.describe('suite', () => { test.beforeEach(() => prepare(1)); ${one} });`;
    expect(fingerprint(suite)).not.toBe(
      fingerprint(suite.replace('prepare(1)', 'prepare(2)')),
    );
    const loop = `for (const value of [1, 2]) { ${one} }`;
    expect(fingerprint(loop)).not.toBe(
      fingerprint(loop.replace('[1, 2]', '[1, 3]')),
    );
  });
  it('正規表現・templateの意味のある空白は除去しない', () => {
    const regex = one.replace('expect(1)', 'expect(/a b/)');
    expect(fingerprint(regex)).not.toBe(
      fingerprint(regex.replace('/a b/', '/a  b/')),
    );
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 解析対象のtemplateを実行せず文字列として与える
    const template = one.replace('expect(1)', 'expect(`a ${value} b`)');
    expect(fingerprint(template)).not.toBe(
      fingerprint(template.replace('} b`', '}  b`')),
    );
  });
  it('callee先頭から開き括弧の範囲だけを一意に識別する', () => {
    const inspect = createLegacySource('e2e/sample.spec.ts', one);
    expect(inspect({ line: 1, column: 5 })).toEqual(
      inspect({ line: 1, column: 1 }),
    );
    const multiline = "test\n(\n'one', () => { expect(1).toBe(1) });";
    const multilineInspect = createLegacySource(
      'e2e/sample.spec.ts',
      multiline,
    );
    expect(multilineInspect({ line: 2, column: 1 })).toEqual(
      multilineInspect({ line: 1, column: 1 }),
    );
    const loop = `for (const row of [1, 2]) { test.skip('one', () => {}); }`;
    const loopInspect = createLegacySource('e2e/sample.spec.ts', loop);
    const start = location(loop, 'test.skip');
    expect(loopInspect({ ...start, column: start.column + 5 })).toEqual(
      loopInspect(start),
    );
    expect(() => inspect({ line: 1, column: 6 })).toThrow('特定');
    expect(() => inspect(location(one, 'expect(1)'))).toThrow();
  });

  it('登録の位置がsourceに存在しなければ推測しない', () => {
    expect(() =>
      createLegacySource('e2e/test.ts', one)({ line: 100, column: 1 }),
    ).toThrow('特定');
  });
});

describe('legacy登録と移行', () => {
  it('内部IDや行番号の変更をidentityへ含めない', async () => {
    const before = await snapshot(one, [{ marker }]);
    const after = await snapshot(`\n${one}`, [
      { marker, testId: 'changed-internal' },
    ]);
    expect(after.manifest).toEqual(before.manifest);
    expect(checkLegacy(before.manifest, after.manifest)).toEqual([]);
  });
  it('同一位置のparameter・project・repeatを別登録として保持する', async () => {
    const tests = ['one-a', 'one-b'].flatMap((title) =>
      ['chromium', 'mobile-chrome'].flatMap((project) =>
        [0, 1].map((repeatEachIndex) => ({
          marker,
          titlePath: ['sample', title],
          project,
          repeatEachIndex,
        })),
      ),
    );
    const { manifest } = await snapshot(one, tests);
    expect(manifest.tests).toHaveLength(8);
    expect(new Set(manifest.tests.map((test) => test.key)).size).toBe(8);
  });
  it('新しい未登録testと同名の本文変更を拒否する', async () => {
    const before = await snapshot(one, [{ marker }]);
    const changed = await snapshot(one.replace('toBe(1)', 'toBe(2)'), [
      { marker },
    ]);
    expect(
      checkLegacy(before.manifest, changed.manifest).map((issue) => issue.code),
    ).toEqual(['CHANGED_LEGACY']);
    const extra = await snapshot(`${one}\ntest('two', () => {});`, [
      { marker },
      { marker: "test('two'", titlePath: ['sample', 'two'] },
    ]);
    expect(
      checkLegacy(before.manifest, extra.manifest).map((issue) => issue.code),
    ).toEqual(['NEW_LEGACY']);
  });
  it('testタイトル変更で旧登録を暗黙に置き換えない', async () => {
    const before = await snapshot(one, [{ marker }]);
    const after = await snapshot(one.replace("'one'", "'renamed'"), [
      { marker: "test('renamed'", titlePath: ['sample', 'renamed'] },
    ]);
    expect(
      checkLegacy(before.manifest, after.manifest)
        .map((issue) => issue.code)
        .sort(),
    ).toEqual(['NEW_LEGACY', 'REMOVED_LEGACY']);
  });
  it('同じ登録のcase移行を認め、legacyと成功証拠を分離する', async () => {
    const before = await snapshot(one, [{ marker }]);
    const after = await snapshot(one, [
      { marker, tags: ['@case:save', '@variant:creator'] },
    ]);
    expect(after.manifest.tests).toEqual([]);
    expect(after.manifest.registered[0]).toMatchObject({
      caseId: 'save',
      variant: 'creator',
      binding: 'main',
    });
    expect(checkLegacy(before.manifest, after.manifest)).toEqual([]);
  });
  it('setupをlegacy業務testの代わりに数えない', async () => {
    const before = await snapshot(one, [{ marker }]);
    const after = await snapshot(one, [{ marker, isSetup: true }]);
    expect(after.manifest.setups).toHaveLength(1);
    expect(
      checkLegacy(before.manifest, after.manifest).map((issue) => issue.code),
    ).toEqual(['REMOVED_LEGACY']);
    await expect(
      snapshot(one, [
        { marker, isSetup: true, tags: ['@case:save', '@variant:creator'] },
      ]),
    ).rejects.toThrow('setup');
  });
  it('aliasでimportしたsetupも静的に識別する', async () => {
    const source = `import { test as setup } from '@playwright/test';\nsetup('auth', () => {});`;
    const { manifest } = await snapshot(source, [
      { marker: "setup('auth'", isSetup: true },
    ]);
    expect(manifest.setups).toHaveLength(1);
  });
  it('理由付きfile移動は認め、内容の変更はID登録を要求する', async () => {
    const before = await snapshot(one, [{ marker }]);
    const after = await snapshot(one, [{ marker }], 'e2e/moved.spec.ts');
    const migration = {
      from: firstKey(before.manifest),
      to: firstKey(after.manifest),
      reason: 'feature配下へ移動',
    };
    expect(checkLegacy(before.manifest, after.manifest, [migration])).toEqual(
      [],
    );
    const changed = await snapshot(
      one.replace('toBe(1)', 'toBe(2)'),
      [{ marker }],
      'e2e/moved.spec.ts',
    );
    expect(
      checkLegacy(before.manifest, changed.manifest, [migration]).map(
        (issue) => issue.code,
      ),
    ).toEqual(['CHANGED_LEGACY']);
    expect(() =>
      checkLegacy(before.manifest, after.manifest, [
        { ...migration, reason: ' ' },
      ]),
    ).toThrow();
  });
  it('移動記録で端末やrepeatの条件を置き換えない', async () => {
    const before = await snapshot(one, [{ marker }]);
    for (const overrides of [
      { project: 'mobile-chrome' },
      { repeatEachIndex: 1 },
    ]) {
      const after = await snapshot(one, [{ marker, ...overrides }]);
      const issues = checkLegacy(before.manifest, after.manifest, [
        {
          from: firstKey(before.manifest),
          to: firstKey(after.manifest),
          reason: '条件を移動',
        },
      ]);
      expect(issues.map((issue) => issue.code)).toEqual(['CHANGED_LEGACY']);
    }
  });

  it('重複・対応のない移動記録を拒否する', async () => {
    const before = await snapshot(one, [{ marker }]);
    const after = await snapshot(one, [{ marker }], 'e2e/moved.spec.ts');
    const migration = {
      from: firstKey(before.manifest),
      to: firstKey(after.manifest),
      reason: '移動',
    };
    expect(
      checkLegacy(before.manifest, after.manifest, [migration, migration]).map(
        (issue) => issue.code,
      ),
    ).toEqual(['DUPLICATE_LEGACY_MIGRATION']);
    expect(
      checkLegacy(before.manifest, before.manifest, [migration]).map(
        (issue) => issue.code,
      ),
    ).toEqual(['UNUSED_LEGACY_MIGRATION']);
  });

  it('既存legacyへの合流で削除を説明しない', async () => {
    const before = await snapshot(`${one}\ntest('two', () => {});`, [
      { marker },
      { marker: "test('two'", titlePath: ['sample', 'two'] },
    ]);
    const after = await snapshot("test('two', () => {});", [
      { marker: "test('two'", titlePath: ['sample', 'two'] },
    ]);
    const source = before.manifest.tests.find(
      (test) => test.titlePath.at(-1) === 'one',
    );
    if (isNil(source)) throw new Error('移行元不足');
    const issues = checkLegacy(before.manifest, after.manifest, [
      { from: source.key, to: firstKey(after.manifest), reason: '合流' },
    ]);
    expect(issues.map((issue) => issue.code).sort()).toEqual([
      'REMOVED_LEGACY',
      'UNUSED_LEGACY_MIGRATION',
    ]);
  });
  it('serial suiteは途中の1件がcase移行しても全員のgroupを保持する', async () => {
    const source = `test.describe('flow', () => { test.describe.configure({ mode: 'serial' }); ${one}\ntest('two', () => {}); });`;
    const { manifest } = await snapshot(source, [
      { marker },
      {
        marker: "test('two'",
        titlePath: ['sample', 'two'],
        tags: ['@case:next', '@variant:default'],
      },
    ]);
    expect(manifest.groups).toHaveLength(1);
    expect(manifest.groups[0]?.testKeys).toHaveLength(2);
    expect(manifest.tests[0]?.serialGroup).toBe(
      manifest.registered[0]?.serialGroup,
    );
    const singleton = await snapshot(
      `test.describe.serial('flow', () => { ${one} });`,
      [{ marker }],
    );
    expect(singleton.manifest.groups[0]?.testKeys).toHaveLength(1);
  });
  it('新しいskip/fixme相当の実行状態変化をlegacy成功へ隠さない', async () => {
    const before = await snapshot(one, [{ marker }]);
    const after = await snapshot(one, [
      {
        marker,
        expectedStatus: 'skipped',
        annotations: [{ type: 'fixme', description: '未対応' }],
      },
    ]);
    expect(
      checkLegacy(before.manifest, after.manifest).map((issue) => issue.code),
    ).toEqual(['CHANGED_LEGACY']);
  });
  it('単一Windows区切りを含む非POSIXパスを拒否する', async () => {
    const { root, report } = await snapshot(one, [{ marker }]);
    const invalid = {
      ...report,
      tests: report.tests.map((test) => ({
        ...test,
        file: test.file.replaceAll('/', '\\'),
      })),
    };
    await expect(buildLegacy(root, [invalid])).rejects.toThrow(
      '不正なtestパス',
    );
  });

  it('破損identity・重複登録・列挙errorを拒否する', async () => {
    const { root, report, manifest } = await snapshot(one, [{ marker }]);
    expect(() =>
      legacyManifestSchema.parse({
        ...manifest,
        tests: [...manifest.tests, ...manifest.tests],
      }),
    ).toThrow('重複');
    expect(() =>
      legacyManifestSchema.parse({
        ...manifest,
        tests: manifest.tests.map((test) => ({ ...test, key: 'spoofed' })),
      }),
    ).toThrow('一致');
    await expect(
      buildLegacy(root, [{ ...report, errors: ['list failed'] }]),
    ).rejects.toThrow('列挙');
  });
});
