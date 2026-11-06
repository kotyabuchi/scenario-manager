import { describe, expect, it } from 'vitest';

import {
  catalogSqlTokens,
  checkEnvironmentCatalog,
  ENVIRONMENT_CATALOG_QUERY,
} from './environmentCatalog';
import { EXPECTED_ENVIRONMENT_CATALOG } from './environmentCatalogExpected';

import type { EnvironmentCatalog } from './environmentCatalogSchema';

const fixture = () => structuredClone(EXPECTED_ENVIRONMENT_CATALOG);
const rejected = (catalog: EnvironmentCatalog, subject: string) => {
  const report = checkEnvironmentCatalog(catalog);
  expect(report.schemaParityPassed).toBe(false);
  expect(report.authorizationStatus).toBe('not-verified');
  expect(report.issues.some((issue) => issue.subject.startsWith(subject))).toBe(
    true,
  );
};

describe('固定catalogとのschema再現性', () => {
  it('調査済みmetadataを照合しても既知の認可課題を成功認定しない', () => {
    const catalog = fixture();
    expect(catalog.tables).toHaveLength(17);
    expect(catalog.columns).toHaveLength(162);
    expect(catalog.constraints).toHaveLength(62);
    expect(catalog.policies).toHaveLength(8);
    expect(catalog.functions).toHaveLength(8);
    expect(catalog.triggers).toHaveLength(3);
    const report = checkEnvironmentCatalog(catalog);
    expect(report.schemaParityPassed).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.authorizationStatus).toBe('not-verified');
    expect(report.knownAuthorizationGaps).toHaveLength(3);
    expect(report.knownAuthorizationGaps.join('\n')).toContain('15テーブル');
    expect(report.knownAuthorizationGaps.join('\n')).toContain(
      'replace_availability_time_blocks',
    );
    expect(report.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('欠落・空metadataを新規baselineとして承認しない', () => {
    expect(() => checkEnvironmentCatalog({})).toThrow();
    const catalog = fixture();
    catalog.tables = [];
    catalog.columns = [];
    catalog.functions = [];
    rejected(catalog, 'tables:');
  });

  it('列・制約・policy・関数の順序に依存せず入力を変更しない', () => {
    const catalog = fixture();
    const before = structuredClone(catalog);
    for (const key of [
      'tables',
      'columns',
      'constraints',
      'policies',
      'functions',
      'triggers',
      'enums',
    ] as const)
      catalog[key].reverse();
    for (const routine of catalog.functions) routine.config.reverse();
    const shuffled = structuredClone(catalog);
    expect(checkEnvironmentCatalog(catalog).fingerprint).toBe(
      checkEnvironmentCatalog(before).fingerprint,
    );
    expect(catalog).toEqual(shuffled);
  });

  it.each([
    {
      title: 'table',
      subject: 'tables:',
      change: (c: EnvironmentCatalog) => {
        c.tables.pop();
      },
    },
    {
      title: 'RPC',
      subject: 'functions:',
      change: (c: EnvironmentCatalog) => {
        c.functions = c.functions.filter(
          (f) => f.name !== 'replace_confirmed_schedule_time_blocks',
        );
      },
    },
    {
      title: 'policy',
      subject: 'policies:',
      change: (c: EnvironmentCatalog) => {
        c.policies.pop();
      },
    },
    {
      title: 'FK',
      subject: 'constraints:',
      change: (c: EnvironmentCatalog) => {
        const first = c.constraints.find((item) => item.type === 'f');
        c.constraints = c.constraints.filter((item) => item !== first);
      },
    },
    {
      title: 'trigger',
      subject: 'triggers:',
      change: (c: EnvironmentCatalog) => {
        c.triggers.pop();
      },
    },
  ])('$titleが1件不足すれば拒否する', ({ subject, change }) => {
    const catalog = fixture();
    change(catalog);
    rejected(catalog, subject);
  });

  it('table/RPC/schemaの実効GRANT欠落を拒否する', () => {
    const table = fixture();
    for (const item of table.tables)
      item.privileges.authenticated.insert = false;
    rejected(table, 'tables:');
    const routine = fixture();
    for (const item of routine.functions) item.execute.authenticated = false;
    rejected(routine, 'functions:');
    const schema = fixture();
    schema.schema.privileges.anon.usage = false;
    rejected(schema, 'schema');
  });

  it('新しいanon権限・security definer・search_pathの変更を拒否する', () => {
    const grant = fixture();
    for (const item of grant.functions) item.execute.anon = true;
    rejected(grant, 'functions:');
    const definer = fixture();
    for (const item of definer.functions) item.securityDefiner = false;
    rejected(definer, 'functions:');
    const searchPath = fixture();
    for (const item of searchPath.functions)
      item.config = ['search_path=public, pg_temp'];
    rejected(searchPath, 'functions:');
  });

  it('別名の追加RPCと関数属性の変更を拒否する', () => {
    const extra = fixture();
    extra.functions.push(
      ...extra.functions.map((item) => ({
        ...item,
        name: `extra_${item.name}`,
      })),
    );
    rejected(extra, 'functions:extra_');
    for (const change of [
      { volatility: 'i' as const },
      { strict: true },
      { parallel: 's' as const },
      { leakproof: true },
      { arguments: 'value text DEFAULT NULL::text' },
      { defaults: 'NULL::text' },
    ]) {
      const catalog = fixture();
      catalog.functions = catalog.functions.map((item) => ({
        ...item,
        ...change,
      }));
      rejected(catalog, 'functions:');
    }
    expect(ENVIRONMENT_CATALOG_QUERY).not.toContain('p.proname IN');
  });

  it('RPC引数・戻り型・本文の変更を拒否する', () => {
    for (const field of ['signature', 'result', 'body'] as const) {
      const catalog = fixture();
      for (const item of catalog.functions)
        if (item.name === 'replace_confirmed_schedule_time_blocks')
          item[field] += ' changed';
      rejected(catalog, 'functions:replace_confirmed_schedule_time_blocks');
    }
  });

  it('認証条件を消した関数本文やpolicyのTRUE置換を拒否する', () => {
    const routine = fixture();
    for (const item of routine.functions)
      if (item.name === 'replace_confirmed_schedule_time_blocks')
        item.body = item.body.replace('auth.uid()', 'NULL::uuid');
    rejected(routine, 'functions:');
    const policy = fixture();
    for (const item of policy.policies) item.using = 'true';
    rejected(policy, 'policies:');
  });

  it('PostgRESTが依存するFK名だけの変更も拒否する', () => {
    const catalog = fixture();
    const first = catalog.constraints.find((item) => item.type === 'f');
    if (!first) throw new Error('FK fixtureがありません。');
    first.name = 'different_foreign_key_name';
    rejected(catalog, 'constraints:');
  });

  it('FK名の欠落を拒否し、PK名の差は比較対象に含めない', () => {
    const missing = fixture();
    const foreign = missing.constraints.find((item) => item.type === 'f');
    if (!foreign) throw new Error('FK fixtureがありません。');
    delete foreign.name;
    expect(() => checkEnvironmentCatalog(missing)).toThrow('FK名');
    const catalog = fixture();
    const before = checkEnvironmentCatalog(catalog).fingerprint;
    for (const item of catalog.constraints)
      if (item.type !== 'f') item.name = 'ignored_constraint_name';
    expect(checkEnvironmentCatalog(catalog).schemaParityPassed).toBe(true);
    expect(checkEnvironmentCatalog(catalog).fingerprint).toBe(before);
  });

  it('FKのON DELETE変更・未検証制約を拒否する', () => {
    const definition = fixture();
    for (const item of definition.constraints)
      item.definition = item.definition.replace(
        'ON DELETE CASCADE',
        'ON DELETE RESTRICT',
      );
    rejected(definition, 'constraints:');
    const validated = fixture();
    for (const item of validated.constraints) item.validated = false;
    rejected(validated, 'constraints:');
  });

  it('追加gap列のdefault・生成式・stored属性の不整合を拒否する', () => {
    for (const name of [
      'comment_count',
      'session_description',
      'sort_playtime_asc',
      'sort_playtime_desc',
    ]) {
      const catalog = fixture();
      for (const column of catalog.columns)
        if (column.name === name) column.default = null;
      rejected(catalog, 'columns:');
    }
    const generated = fixture();
    for (const column of generated.columns) column.generated = '';
    rejected(generated, 'columns:scenarios.sort_playtime');
  });

  it('enum順序・RLS状態・trigger有効性の変更を拒否する', () => {
    const enums = fixture();
    for (const item of enums.enums) item.labels.reverse();
    rejected(enums, 'enums:');
    const rls = fixture();
    for (const item of rls.tables) item.rlsEnabled = false;
    rejected(rls, 'tables:');
    const trigger = fixture();
    for (const item of trigger.triggers) item.enabled = 'D';
    rejected(trigger, 'triggers:');
  });

  it('Auth基盤の不在を拒否する', () => {
    const catalog = fixture();
    catalog.auth = {
      usersIdType: null,
      usersIdNotNull: false,
      uidResult: null,
      uidSignature: null,
      roles: [],
    };
    rejected(catalog, 'auth');
  });

  it('seedがなければ失敗し、行由来の有無はmetadata fingerprintへ混ぜない', () => {
    const catalog = fixture();
    const fingerprint = checkEnvironmentCatalog(catalog).fingerprint;
    catalog.seedPresent = false;
    rejected(catalog, 'scenario_systems:');
    expect(checkEnvironmentCatalog(catalog).fingerprint).toBe(fingerprint);
  });

  it('metadata重複と未知fieldを拒否する', () => {
    const catalog = fixture();
    catalog.tables.push(...structuredClone(catalog.tables));
    expect(
      checkEnvironmentCatalog(catalog).issues.some(
        (issue) => issue.code === 'CATALOG_DUPLICATE',
      ),
    ).toBe(true);
    expect(() => checkEnvironmentCatalog({ ...fixture(), oid: 1 })).toThrow();
    expect(() =>
      checkEnvironmentCatalog({
        ...fixture(),
        auth: { ...fixture().auth, users: [] },
      }),
    ).toThrow();
  });

  it('SQLはmetadataと合成seedの存在判定だけでアプリ行を抽出しない', () => {
    expect(ENVIRONMENT_CATALOG_QUERY).toContain('pg_get_constraintdef');
    expect(ENVIRONMENT_CATALOG_QUERY).toContain('has_function_privilege');
    expect(ENVIRONMENT_CATALOG_QUERY).toContain("to_regclass('auth.users')");
    expect(ENVIRONMENT_CATALOG_QUERY).not.toMatch(/FROM\s+auth\.users/i);
    expect(ENVIRONMENT_CATALOG_QUERY).toContain("'seedPresent', EXISTS");
    expect(ENVIRONMENT_CATALOG_QUERY).not.toMatch(
      /\b(?:DROP|ALTER|INSERT INTO|UPDATE\s+public|DELETE FROM)\b/i,
    );
  });
});

describe('SQL字句を壊さない正規化', () => {
  it('コメントと字句間の空白だけを無視する', () => {
    expect(
      catalogSqlTokens(
        "SELECT /*outer /*inner*/ comment*/ 'a -- b' -- end\n FROM users",
      ),
    ).toEqual(catalogSqlTokens("select 'a -- b' from users"));
    const catalog = fixture();
    const original = checkEnvironmentCatalog(catalog).fingerprint;
    for (const item of catalog.functions)
      item.body = `-- note\n${item.body}\n/* note */`;
    expect(checkEnvironmentCatalog(catalog).fingerprint).toBe(original);
  });

  it.each([
    ["select 'a b'", "select 'ab'"],
    ["select 'a--b'", "select 'a--c'"],
    ["select 'a/*b*/c'", "select 'ac'"],
    ["select 'it''s denied'", "select 'it''s allowed'"],
    ['select "Actor"', 'select "actor"'],
    ['select $x$a -- b$x$', 'select $x$a -- c$x$'],
    [
      String.raw`select E'it\'s -- denied'`,
      String.raw`select E'it\'s -- allowed'`,
    ],
  ])('引用内の差分を保持する %#', (before, after) => {
    expect(catalogSqlTokens(before)).not.toEqual(catalogSqlTokens(after));
  });

  it.each([
    "select 'unclosed",
    '/* unclosed',
    'select $$unclosed',
    String.raw`select E'unclosed\'`,
  ])('壊れたSQLを推測補完しない %#', (sql) => {
    expect(() => catalogSqlTokens(sql)).toThrow();
  });
});
