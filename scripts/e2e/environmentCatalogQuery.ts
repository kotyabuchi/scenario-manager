const roles = ['anon', 'authenticated', 'service_role'];
const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;
const roleObject = (value: (role: string) => string) =>
  `jsonb_build_object(${roles.map((role) => `${sqlString(role)}, ${value(sqlString(role))}`).join(', ')})`;
const tablePrivileges = roleObject(
  (role) =>
    `jsonb_build_object(${['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'].map((privilege) => `${sqlString(privilege.toLowerCase())}, has_table_privilege(${role}, t.oid, ${sqlString(privilege)})`).join(', ')})`,
);

/**
 * publicのアプリ所有metadataとlocal合成seedの有無だけを取得する単一SELECT。
 * pg_catalogの定義・実効権限を使い、OIDやアプリ行・Authユーザーは返さない。
 * https://www.postgresql.org/docs/17/functions-info.html
 */
export const ENVIRONMENT_CATALOG_QUERY = `
WITH owned_tables AS (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
    AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_class'::regclass
      AND d.objid = c.oid AND d.deptype = 'e')
), owned_functions AS (
  SELECT p.*, l.lanname FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname = 'public' AND p.prokind = 'f'
    AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_proc'::regclass
      AND d.objid = p.oid AND d.deptype = 'e')
)
SELECT jsonb_build_object(
  'schemaVersion', 1,
  'schema', jsonb_build_object('name', 'public', 'privileges', ${roleObject((role) => `jsonb_build_object('usage', has_schema_privilege(${role}, 'public', 'USAGE'), 'create', has_schema_privilege(${role}, 'public', 'CREATE'))`)}),
  'tables', COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'name', t.relname, 'rlsEnabled', t.relrowsecurity, 'forceRls', t.relforcerowsecurity,
    'privileges', ${tablePrivileges}
  ) ORDER BY t.relname) FROM owned_tables t), '[]'::jsonb),
  'enums', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', e.name, 'labels', e.labels) ORDER BY e.name)
    FROM (SELECT t.typname AS name, jsonb_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
      FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE n.nspname = 'public' AND NOT EXISTS (SELECT 1 FROM pg_depend d
        WHERE d.classid = 'pg_type'::regclass AND d.objid = t.oid AND d.deptype = 'e')
      GROUP BY t.typname) e), '[]'::jsonb),
  'columns', COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'table', t.relname, 'name', a.attname, 'type', format_type(a.atttypid, a.atttypmod),
    'notNull', a.attnotnull, 'default', pg_get_expr(d.adbin, d.adrelid),
    'identity', a.attidentity, 'generated', a.attgenerated
  ) ORDER BY t.relname, a.attname)
    FROM owned_tables t JOIN pg_attribute a ON a.attrelid = t.oid
    LEFT JOIN pg_attrdef d ON d.adrelid = t.oid AND d.adnum = a.attnum
    WHERE a.attnum > 0 AND NOT a.attisdropped), '[]'::jsonb),
  'constraints', COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'table', t.relname, 'type', c.contype, 'definition', pg_get_constraintdef(c.oid, false),
    'validated', c.convalidated
  ) ORDER BY t.relname, c.contype, pg_get_constraintdef(c.oid, false))
    FROM owned_tables t JOIN pg_constraint c ON c.conrelid = t.oid), '[]'::jsonb),
  'policies', COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'table', p.tablename, 'name', p.policyname, 'command', p.cmd,
    'permissive', p.permissive, 'roles', p.roles, 'using', p.qual, 'withCheck', p.with_check
  ) ORDER BY p.tablename, p.policyname) FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename IN (SELECT relname FROM owned_tables)), '[]'::jsonb),
  'functions', COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'name', p.proname, 'signature', pg_get_function_identity_arguments(p.oid),
    'result', pg_get_function_result(p.oid), 'language', p.lanname, 'body', p.prosrc,
    'securityDefiner', p.prosecdef, 'config', COALESCE(to_jsonb(p.proconfig), '[]'::jsonb),
    'volatility', p.provolatile, 'strict', p.proisstrict, 'parallel', p.proparallel,
    'leakproof', p.proleakproof, 'arguments', pg_get_function_arguments(p.oid),
    'defaults', pg_get_expr(p.proargdefaults, 0),
    'execute', ${roleObject((role) => `has_function_privilege(${role}, p.oid, 'EXECUTE')`)}
  ) ORDER BY p.proname, pg_get_function_identity_arguments(p.oid)) FROM owned_functions p), '[]'::jsonb),
  'triggers', COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'name', t.tgname, 'table', c.relname, 'tableSchema', n.nspname,
    'functionName', p.proname, 'functionSchema', pn.nspname,
    'enabled', t.tgenabled, 'definition', pg_get_triggerdef(t.oid, false)
  ) ORDER BY n.nspname, c.relname, t.tgname)
    FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_namespace pn ON pn.oid = p.pronamespace
    WHERE NOT t.tgisinternal AND (c.oid IN (SELECT oid FROM owned_tables)
      OR (n.nspname = 'auth' AND pn.nspname = 'public'))), '[]'::jsonb),
  'auth', jsonb_build_object(
    'usersIdType', (SELECT format_type(a.atttypid, a.atttypmod) FROM pg_attribute a
      WHERE a.attrelid = to_regclass('auth.users') AND a.attname = 'id' AND NOT a.attisdropped),
    'usersIdNotNull', COALESCE((SELECT a.attnotnull FROM pg_attribute a
      WHERE a.attrelid = to_regclass('auth.users') AND a.attname = 'id' AND NOT a.attisdropped), false),
    'uidResult', pg_get_function_result(to_regprocedure('auth.uid()')),
    'uidSignature', pg_get_function_identity_arguments(to_regprocedure('auth.uid()')),
    'roles', (SELECT jsonb_agg(rolname ORDER BY rolname) FROM pg_roles
      WHERE rolname IN ('anon', 'authenticated', 'service_role'))
  ),
  'seedPresent', EXISTS (SELECT 1 FROM public.scenario_systems
    WHERE system_id = '00000000000000000000000001' AND name = 'E2Eテストシステム')
);`;
