import { isNil } from 'ramda';

import { EXPECTED_ENVIRONMENT_CATALOG } from './environmentCatalogExpected';
import { environmentCatalogSchema } from './environmentCatalogSchema';

import { createHash } from 'node:crypto';

import type { EnvironmentCatalog } from './environmentCatalogSchema';
import type { EnvironmentIssue } from './environmentSchema';

export { ENVIRONMENT_CATALOG_QUERY } from './environmentCatalogQuery';
export { environmentCatalogSchema } from './environmentCatalogSchema';

/** SQLの文字列・引用識別子を保持し、コメントと字句間空白だけを除く。意味の同値判定はしない。 */
export const catalogSqlTokens = (sql: string): string[] => {
  const tokens: string[] = [];
  let index = 0;
  while (index < sql.length) {
    const rest = sql.slice(index);
    const ignored = /^(?:\s+|--[^\r\n]*(?:\r?\n|$))/.exec(rest)?.[0];
    if (!isNil(ignored)) {
      index += ignored.length;
      continue;
    }
    if (rest.startsWith('/*')) {
      let depth = 1;
      index += 2;
      while (depth > 0 && index < sql.length) {
        if (sql.slice(index, index + 2) === '/*') {
          depth++;
          index += 2;
        } else if (sql.slice(index, index + 2) === '*/') {
          depth--;
          index += 2;
        } else index++;
      }
      if (depth > 0) throw new Error('catalog SQLのコメントが閉じていません。');
      continue;
    }
    if (/^[eE]'/.test(rest)) {
      const escaped = /^[eE]'(?:\\[\s\S]|''|[^'\\])*'/.exec(rest)?.[0];
      if (isNil(escaped))
        throw new Error('catalog SQLのescape literalが不正です。');
      tokens.push(`e${escaped.slice(1)}`);
      index += escaped.length;
      continue;
    }
    const quoted = /^(?:'(?:''|[^'])*'|"(?:""|[^"])*")/.exec(rest)?.[0];
    if (!isNil(quoted)) {
      tokens.push(quoted);
      index += quoted.length;
      continue;
    }
    const dollar = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(rest)?.[0];
    if (!isNil(dollar)) {
      const end = sql.indexOf(dollar, index + dollar.length);
      if (end < 0)
        throw new Error('catalog SQLのdollar quoteが閉じていません。');
      tokens.push(sql.slice(index, end + dollar.length));
      index = end + dollar.length;
      continue;
    }
    const word =
      /^(?:[A-Za-z_][A-Za-z0-9_$]*|\d+(?:\.\d+)?|::|<>|!=|<=|>=|:=|->>|->|\|\|)/.exec(
        rest,
      )?.[0];
    if (!isNil(word)) {
      tokens.push(word.toLowerCase());
      index += word.length;
      continue;
    }
    const character = sql[index];
    if (isNil(character) || character === "'" || character === '"')
      throw new Error('catalog SQLの引用符が不正です。');
    tokens.push(character);
    index++;
  }
  return tokens;
};

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const sqlKey = (value: string | null) =>
  isNil(value) ? null : catalogSqlTokens(value);
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (typeof value === 'object' && !isNil(value))
    return `{${Object.entries(value)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(',')}}`;
  const serialized = JSON.stringify(value);
  if (isNil(serialized))
    throw new Error('catalog metadataを直列化できません。');
  return serialized;
};
const ordered = <T>(items: T[]) =>
  [...items].sort((left, right) => {
    const a = stable(left);
    const b = stable(right);
    return a < b ? -1 : a > b ? 1 : 0;
  });

const subject = (category: string, value: unknown) => {
  if (typeof value !== 'object' || isNil(value)) return category;
  const identity = ['tableSchema', 'table', 'name', 'signature', 'type']
    .map((key) => Reflect.get(value, key))
    .filter((part): part is string => typeof part === 'string' && part !== '');
  return `${category}:${identity.join('.')}`;
};

const canonical = (catalog: EnvironmentCatalog) => ({
  schema: catalog.schema,
  tables: ordered(catalog.tables),
  enums: ordered(catalog.enums),
  columns: ordered(
    catalog.columns.map((column) => ({
      ...column,
      default: sqlKey(column.default),
    })),
  ),
  constraints: ordered(
    catalog.constraints.map(({ name, ...constraint }) => ({
      ...constraint,
      // FK名はPostgRESTの!constraint契約。PK等の名前は比較対象に含めない。
      ...(constraint.type === 'f' ? { name } : {}),
      definition: sqlKey(constraint.definition),
    })),
  ),
  policies: ordered(
    catalog.policies.map((policy) => ({
      ...policy,
      roles: [...policy.roles].sort(),
      using: sqlKey(policy.using),
      withCheck: sqlKey(policy.withCheck),
    })),
  ),
  functions: ordered(
    catalog.functions.map(({ body, ...routine }) => ({
      ...routine,
      config: [...routine.config].sort(),
      bodyHash: hash(stable(catalogSqlTokens(body))),
    })),
  ),
  triggers: ordered(
    catalog.triggers.map((trigger) => ({
      ...trigger,
      definition: sqlKey(trigger.definition),
    })),
  ),
  auth: { ...catalog.auth, roles: [...catalog.auth.roles].sort() },
});

/** 調査済みcloud基準の認可課題。metadata不正時も安全性の認定へ変換しない。 */
export const ENVIRONMENT_AUTHORIZATION_GAPS = [
  '既知cloud基準では15テーブルのRLSが無効で、anon/authenticatedに更新権限がある。',
  'replace_availability_time_blocksはSECURITY DEFINERかつanon EXECUTE可能で、呼出者認可を持たない。',
  'replace_confirmed_schedule_time_blocksのphase等の業務条件は、このmetadata一致では認可成功と認定しない。',
];

/** 固定期待値との再現性だけを判定する。既存認可の弱さを安全性の証拠へ変換しない。 */
export const checkEnvironmentCatalog = (input: unknown) => {
  const actual = environmentCatalogSchema.parse(input);
  const current = canonical(actual);
  const expected = canonical(EXPECTED_ENVIRONMENT_CATALOG);
  const issues: EnvironmentIssue[] = [];
  const compare = (category: string, left: unknown[], right: unknown[]) => {
    const wanted = new Set(right.map(stable));
    const seen = new Set<string>();
    for (const value of left) {
      const item = stable(value);
      if (seen.has(item))
        issues.push({
          code: 'CATALOG_DUPLICATE',
          subject: subject(category, value),
          message: 'metadataが重複しています。',
        });
      seen.add(item);
      if (!wanted.has(item))
        issues.push({
          code: 'CATALOG_UNEXPECTED',
          subject: subject(category, value),
          message: '期待値と異なるmetadataがあります。',
        });
    }
    for (const value of right)
      if (!seen.has(stable(value)))
        issues.push({
          code: 'CATALOG_MISSING',
          subject: subject(category, value),
          message: '必要なmetadataが欠落または変更されています。',
        });
  };
  for (const category of [
    'tables',
    'enums',
    'columns',
    'constraints',
    'policies',
    'functions',
    'triggers',
  ] as const)
    compare(category, current[category], expected[category]);
  for (const category of ['schema', 'auth'] as const)
    if (stable(current[category]) !== stable(expected[category]))
      issues.push({
        code: 'CATALOG_MISMATCH',
        subject: category,
        message: 'schema/Authの基盤または実効権限が期待値と一致しません。',
      });
  if (!actual.seedPresent)
    issues.push({
      code: 'SEED_MISSING',
      subject: 'scenario_systems:00000000000000000000000001',
      message: '定義した合成seedがありません。',
    });
  return {
    schemaVersion: 1 as const,
    schemaParityPassed: issues.length === 0,
    authorizationStatus: 'not-verified' as const,
    fingerprint: hash(stable(current)),
    issues,
    knownAuthorizationGaps: [...ENVIRONMENT_AUTHORIZATION_GAPS],
  };
};
