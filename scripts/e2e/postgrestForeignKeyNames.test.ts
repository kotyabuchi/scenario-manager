import { describe, expect, it } from 'vitest';

import { EXPECTED_ENVIRONMENT_CATALOG } from './environmentCatalogExpected';

import { readFileSync } from 'node:fs';

const migration = readFileSync(
  'supabase/migrations/20261104162014_align_postgrest_foreign_key_names.sql',
  'utf8',
);
const original = readFileSync(
  'supabase/migrations/0001_gifted_shard.sql',
  'utf8',
);
const mappings = [
  ...migration.matchAll(
    /\('([a-z_]+)', '([a-z_]+)', '([a-z_]+)', '([^']+)'\)/gu,
  ),
];
const canonical = (sql: string) =>
  sql
    .replaceAll('"', '')
    .replaceAll('public.', '')
    .replace(/ON UPDATE NO ACTION/giu, '')
    .replace(/ON DELETE NO ACTION/giu, '')
    .replace(/\s*\(\s*/gu, '(')
    .replace(/\s*\)\s*/gu, ')')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLowerCase();

describe('確認済cloud FK名への追補migration', () => {
  it('旧FKのtable・列・参照先・削除動作が原cloud metadata定義と同じである', () => {
    expect(mappings).toHaveLength(6);
    expect(new Set(mappings.map((entry) => entry[3])).size).toBe(6);
    for (const mapping of mappings) {
      const [, table, oldName, cloudName, definition] = mapping;
      if (!table || !oldName || !cloudName || !definition)
        throw new Error('migration mapping不足');
      const source = original.match(
        new RegExp(
          `ALTER TABLE "${table}" ADD CONSTRAINT "${oldName}" ([^;]+);`,
          'u',
        ),
      );
      expect(source?.[1]).toBeDefined();
      expect(canonical(source?.[1] ?? '')).toBe(canonical(definition));
      const evidence = EXPECTED_ENVIRONMENT_CATALOG.constraints.filter(
        (entry) =>
          entry.table === table &&
          entry.type === 'f' &&
          entry.name === cloudName,
      );
      expect(evidence).toHaveLength(1);
      expect(canonical(evidence[0]?.definition ?? '')).toBe(
        canonical(definition),
      );
      expect(evidence[0]?.validated).toBe(true);
    }
  });
});
