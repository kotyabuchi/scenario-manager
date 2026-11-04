import { z } from 'zod';

const text = z.string();
const named = text.min(1);
const tablePrivileges = z.strictObject({
  select: z.boolean(),
  insert: z.boolean(),
  update: z.boolean(),
  delete: z.boolean(),
  truncate: z.boolean(),
  references: z.boolean(),
  trigger: z.boolean(),
});
const rolePrivileges = <T extends z.ZodType>(value: T) =>
  z.strictObject({
    anon: value,
    authenticated: value,
    service_role: value,
  });

/** アプリ所有のmetadataのみを受け付け、OID・秘密値・行データを保存しない。 */
export const environmentCatalogSchema = z.strictObject({
  schemaVersion: z.literal(1),
  schema: z.strictObject({
    name: z.literal('public'),
    privileges: rolePrivileges(
      z.strictObject({ usage: z.boolean(), create: z.boolean() }),
    ),
  }),
  tables: z.array(
    z.strictObject({
      name: named,
      rlsEnabled: z.boolean(),
      forceRls: z.boolean(),
      privileges: rolePrivileges(tablePrivileges),
    }),
  ),
  enums: z.array(z.strictObject({ name: named, labels: z.array(named) })),
  columns: z.array(
    z.strictObject({
      table: named,
      name: named,
      type: named,
      notNull: z.boolean(),
      default: text.nullable(),
      identity: text,
      generated: text,
    }),
  ),
  constraints: z.array(
    z.strictObject({
      table: named,
      type: z.enum(['c', 'f', 'p', 'u', 'x']),
      definition: named,
      validated: z.boolean(),
    }),
  ),
  policies: z.array(
    z.strictObject({
      table: named,
      name: named,
      command: named,
      permissive: named,
      roles: z.array(named),
      using: text.nullable(),
      withCheck: text.nullable(),
    }),
  ),
  functions: z.array(
    z.strictObject({
      name: named,
      signature: text,
      result: named,
      language: named,
      body: text,
      volatility: z.enum(['i', 's', 'v']),
      strict: z.boolean(),
      parallel: z.enum(['s', 'r', 'u']),
      leakproof: z.boolean(),
      arguments: text,
      defaults: text.nullable(),
      securityDefiner: z.boolean(),
      config: z.array(text),
      execute: rolePrivileges(z.boolean()),
    }),
  ),
  triggers: z.array(
    z.strictObject({
      name: named,
      table: named,
      tableSchema: named,
      functionName: named,
      functionSchema: named,
      enabled: named,
      definition: named,
    }),
  ),
  auth: z.strictObject({
    usersIdType: text.nullable(),
    usersIdNotNull: z.boolean(),
    uidResult: text.nullable(),
    uidSignature: text.nullable(),
    roles: z.array(named),
  }),
  seedPresent: z.boolean(),
});

type EnvironmentCatalog = z.infer<typeof environmentCatalogSchema>;
export type { EnvironmentCatalog };
