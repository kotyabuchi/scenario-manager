import { isNil } from 'ramda';
import { z } from 'zod';

import { discoverySchema, discoveryTestSchema } from './discoverySchema';
import { createLegacySource } from './legacySource';
import { readTestTags } from './testTags';

import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

import type { DiscoveredTest, Discovery } from './discoverySchema';

const text = z.string().trim().min(1);
const entrySchema = discoveryTestSchema
  .pick({
    file: true,
    titlePath: true,
    project: true,
    repeatEachIndex: true,
    expectedStatus: true,
    annotations: true,
  })
  .extend({
    key: text,
    profile: text,
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    serialGroup: text.nullable(),
  });
export const legacyManifestSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    tests: z.array(entrySchema),
    registered: z.array(
      entrySchema.extend({ caseId: text, variant: text, binding: text }),
    ),
    setups: z.array(entrySchema),
    groups: z.array(
      z.strictObject({
        id: text,
        profile: text,
        project: z.string(),
        file: text,
        reason: text,
        testKeys: z.array(text).min(1),
      }),
    ),
  })
  .superRefine((manifest, context) => {
    const keys = new Set<string>();
    for (const entry of [
      ...manifest.tests,
      ...manifest.registered,
      ...manifest.setups,
    ]) {
      if (keys.has(entry.key))
        context.addIssue({
          code: 'custom',
          message: `登録identity重複: ${entry.key}`,
        });
      if (entry.key !== legacyKey(entry.profile, entry))
        context.addIssue({
          code: 'custom',
          message: `登録identityがフィールドと一致しません: ${entry.key}`,
        });
      keys.add(entry.key);
    }
  });
export const legacyMigrationSchema = z.strictObject({
  from: text,
  to: text,
  reason: text,
});

/** 内部test IDとsource位置を除く、runner登録の恒久identity。 */
export const legacyKey = (
  profile: string,
  test: Pick<
    DiscoveredTest,
    'project' | 'file' | 'titlePath' | 'repeatEachIndex'
  >,
) =>
  JSON.stringify([
    profile,
    test.project,
    test.file,
    test.titlePath,
    test.repeatEachIndex,
  ]);

/** 未登録test・ID付きtest・setupを分離し、serial suiteの全登録を保持する。 */
export const buildLegacy = async (
  root: string,
  reports: Discovery[],
): Promise<LegacyManifest> => {
  const physicalRoot = await realpath(root);
  const sources = new Map<string, ReturnType<typeof createLegacySource>>();
  const manifest: LegacyManifest = {
    schemaVersion: 1,
    tests: [],
    registered: [],
    setups: [],
    groups: [],
  };
  const groups = new Map<string, LegacyManifest['groups'][number]>();
  for (const input of reports) {
    const report = discoverySchema.parse(input);
    if (report.errors.length > 0)
      throw new Error(`test列挙が失敗しています: ${report.profile}`);
    for (const test of report.tests) {
      let inspect = sources.get(test.file);
      if (isNil(inspect)) {
        if (
          test.file.includes('\\') ||
          isAbsolute(test.file) ||
          test.file.split('/').includes('..')
        )
          throw new Error(`不正なtestパス: ${test.file}`);
        const file = await realpath(resolve(root, test.file));
        const path = relative(physicalRoot, file);
        if (isAbsolute(path) || path === '..' || path.startsWith(`..${sep}`))
          throw new Error(`testがproject外を参照しています: ${test.file}`);
        inspect = createLegacySource(test.file, await readFile(file, 'utf8'));
        sources.set(test.file, inspect);
      }
      const source = inspect(test);
      const key = legacyKey(report.profile, test);
      const serialGroup = isNil(source.serialScope)
        ? null
        : `serial:${createHash('sha256')
            .update(
              JSON.stringify([
                report.profile,
                test.project,
                test.file,
                source.serialScope,
              ]),
            )
            .digest('hex')}`;
      const entry = entrySchema.parse({
        key,
        profile: report.profile,
        file: test.file,
        project: test.project,
        titlePath: test.titlePath,
        repeatEachIndex: test.repeatEachIndex,
        expectedStatus: test.expectedStatus,
        annotations: test.annotations,
        fingerprint: source.fingerprint,
        serialGroup,
      });
      const tags = readTestTags(test.tags);
      if (test.isSetup) {
        if (!isNil(tags))
          throw new Error(`setupを業務caseとして登録できません: ${key}`);
        manifest.setups.push(entry);
      } else if (isNil(tags)) manifest.tests.push(entry);
      else manifest.registered.push({ ...entry, ...tags });
      if (!test.isSetup && !isNil(serialGroup)) {
        const group = groups.get(serialGroup) ?? {
          id: serialGroup,
          profile: report.profile,
          project: test.project,
          file: test.file,
          reason: 'ASTで宣言されたserial suite全体を選択する',
          testKeys: [],
        };
        group.testKeys.push(key);
        groups.set(serialGroup, group);
      }
    }
  }
  const sort = <T extends { key: string }>(items: T[]) =>
    items.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  sort(manifest.tests);
  sort(manifest.registered);
  sort(manifest.setups);
  manifest.groups = [...groups.values()].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
  for (const group of manifest.groups) group.testKeys.sort();
  return legacyManifestSchema.parse(manifest);
};

/** 信頼するbaseとの比較でlegacy除外の増加・変更・説明のない削除を検出する。 */
export const checkLegacy = (
  baseInput: LegacyManifest,
  currentInput: LegacyManifest,
  migrationInput: LegacyMigration[] = [],
) => {
  const base = legacyManifestSchema.parse(baseInput);
  const current = legacyManifestSchema.parse(currentInput);
  const migrations = z.array(legacyMigrationSchema).parse(migrationInput);
  const issues: { code: string; key: string; message: string }[] = [];
  const old = new Map(base.tests.map((entry) => [entry.key, entry]));
  const now = new Map(current.tests.map((entry) => [entry.key, entry]));
  const registered = new Map(
    current.registered.map((entry) => [entry.key, entry]),
  );
  const fromKeys = new Set<string>();
  const toKeys = new Set<string>();
  const moved = new Map<string, LegacyMigration>();
  for (const migration of migrations) {
    if (fromKeys.has(migration.from) || toKeys.has(migration.to)) {
      issues.push({
        code: 'DUPLICATE_LEGACY_MIGRATION',
        key: migration.from,
        message: '移行元・先はそれぞれ一意に指定してください',
      });
      continue;
    }
    fromKeys.add(migration.from);
    toKeys.add(migration.to);
    if (
      !old.has(migration.from) ||
      now.has(migration.from) ||
      old.has(migration.to) ||
      (!now.has(migration.to) && !registered.has(migration.to))
    ) {
      issues.push({
        code: 'UNUSED_LEGACY_MIGRATION',
        key: migration.from,
        message: '移行元または移行先に対応する変更がありません',
      });
      continue;
    }
    moved.set(migration.to, migration);
  }
  const metadata = (entry: LegacyManifest['tests'][number]) =>
    JSON.stringify([
      entry.fingerprint,
      entry.expectedStatus,
      entry.annotations.map((item) => JSON.stringify(item)).sort(),
    ]);
  for (const entry of current.tests) {
    const migration = moved.get(entry.key);
    const previous =
      old.get(entry.key) ??
      (!isNil(migration) ? old.get(migration.from) : undefined);
    if (isNil(previous))
      issues.push({
        code: 'NEW_LEGACY',
        key: entry.key,
        message: '新しいtestにはcase/variant IDが必要です',
      });
    else if (
      metadata(previous) !== metadata(entry) ||
      (!isNil(migration) &&
        (previous.profile !== entry.profile ||
          previous.project !== entry.project ||
          previous.repeatEachIndex !== entry.repeatEachIndex))
    )
      issues.push({
        code: 'CHANGED_LEGACY',
        key: entry.key,
        message:
          '本文・suite context・実行状態を変更したtestにはcase IDが必要です',
      });
  }
  for (const entry of base.tests) {
    if (
      !now.has(entry.key) &&
      !registered.has(entry.key) &&
      ![...moved.values()].some((migration) => migration.from === entry.key)
    ) {
      issues.push({
        code: 'REMOVED_LEGACY',
        key: entry.key,
        message: '旧testの削除にはcase移行または理由付き移動記録が必要です',
      });
    }
  }
  return issues.sort((a, b) =>
    JSON.stringify(a) < JSON.stringify(b)
      ? -1
      : JSON.stringify(a) > JSON.stringify(b)
        ? 1
        : 0,
  );
};

type LegacyManifest = z.infer<typeof legacyManifestSchema>;
type LegacyMigration = z.infer<typeof legacyMigrationSchema>;
export type { LegacyManifest, LegacyMigration };
