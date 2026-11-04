import { isNil } from 'ramda';
import { z } from 'zod';

import { posix, win32 } from 'node:path';

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const timestamp = z.iso.datetime({ offset: true });
const name = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/);
const absolutePath = z
  .string()
  .refine(
    (value) =>
      !/[\0\r\n]/.test(value) &&
      (value.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(value)) &&
      !value.split(/[\\/]/).some((part) => part === '..' || part === '.'),
    '正規化済みの絶対パスが必要です。',
  );
const port = z.number().int().min(1024).max(65535);
// 開発用configのproject/portを専用テスト環境へ持ち込まない。
const DEVELOPMENT_PORTS = new Set([
  54320, 54321, 54322, 54323, 54324, 54327, 54329, 8083,
]);
export const environmentPortsSchema = z
  .strictObject({ api: port, db: port, shadow: port })
  .superRefine((ports, context) => {
    const values = Object.values(ports);
    if (new Set(values).size !== values.length)
      context.addIssue({
        code: 'custom',
        message: '環境内のportは重複できません。',
      });
    if (values.some((value) => DEVELOPMENT_PORTS.has(value)))
      context.addIssue({
        code: 'custom',
        message: '開発用Supabaseのportは再利用できません。',
      });
  });
export const environmentLeaseSchema = z.strictObject({
  runId: z.string().regex(/^[a-f0-9]{12}$/),
  ownerNonce: z.uuid(),
  projectId: z.string().regex(/^sm-e2e-[a-f0-9]{12}$/),
  worktreeRoot: absolutePath,
});
export const environmentPlanInputSchema = environmentLeaseSchema
  .omit({ projectId: true })
  .extend({
    repoRoot: absolutePath,
    commit: z.string().regex(/^[a-f0-9]{40}$/),
    ports: environmentPortsSchema,
    inputHashes: z.strictObject({ config: hash, migrations: hash, seed: hash }),
    createdAt: timestamp,
  });
const resource = z.strictObject({
  name,
  // CLIのproject label以外は保存しない。未証明の候補もjournalへ残せる。
  projectLabel: z.string().min(1).nullable(),
  createdAt: timestamp,
});
export const environmentResourcesSchema = z
  .strictObject({
    containers: z.array(
      resource.extend({
        id: hash,
        imageId: z.string().regex(/^sha256:[a-f0-9]{64}$/),
        digest: z
          .string()
          .regex(/^sha256:[a-f0-9]{64}$/)
          .optional(),
      }),
    ),
    networks: z.array(resource.extend({ id: hash })),
    volumes: z.array(resource),
  })
  .superRefine((resources, context) => {
    for (const [kind, entries] of Object.entries(resources)) {
      const ids = entries.map((entry) =>
        'id' in entry ? entry.id : entry.name,
      );
      if (new Set(ids).size !== ids.length)
        context.addIssue({
          code: 'custom',
          path: [kind],
          message: 'resource identityが重複しています。',
        });
    }
  });
export const environmentIssueSchema = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  subject: z.string().min(1),
  message: z.string().min(1),
});
export const environmentCleanupSchema = z
  .strictObject({
    at: timestamp,
    status: z.enum(['complete', 'incomplete']),
    remaining: environmentResourcesSchema,
    issues: z.array(environmentIssueSchema),
  })
  .superRefine((cleanup, context) => {
    const hasRemaining = Object.values(cleanup.remaining).some(
      (items) => items.length > 0,
    );
    if (
      cleanup.status === 'complete' &&
      (hasRemaining || cleanup.issues.length > 0)
    )
      context.addIssue({
        code: 'custom',
        message: '残留resourceまたは問題があるcleanupは完了扱いにできません。',
      });
  });
export const environmentManifestSchema = environmentPlanInputSchema
  .extend({
    schemaVersion: z.literal(1),
    workdir: absolutePath,
    projectId: z.string().regex(/^sm-e2e-[a-f0-9]{12}$/),
    apiUrl: z.string(),
    database: z.strictObject({
      host: z.literal('127.0.0.1'),
      port,
      name: z.literal('postgres'),
    }),
    cliVersion: z.literal('2.75.0'),
    state: z.enum(['starting', 'running', 'stopping', 'stopped', 'failed']),
    preflightAt: timestamp.nullable(),
    updatedAt: timestamp,
    resources: environmentResourcesSchema,
    failure: z
      .strictObject({
        code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
        at: timestamp,
      })
      .nullable(),
    cleanup: environmentCleanupSchema.nullable(),
  })
  .superRefine((manifest, context) => {
    const paths = /^[a-zA-Z]:/.test(manifest.worktreeRoot) ? win32 : posix;
    const expectedWorkdir = paths.join(
      manifest.worktreeRoot,
      'test-results',
      'environments',
      `run-${manifest.runId}`,
    );
    if (manifest.workdir !== expectedWorkdir)
      context.addIssue({
        code: 'custom',
        path: ['workdir'],
        message: 'workdirはこのrun専用の環境ディレクトリである必要があります。',
      });
    if (manifest.projectId !== `sm-e2e-${manifest.runId}`)
      context.addIssue({
        code: 'custom',
        path: ['projectId'],
        message: 'project IDとrun IDが一致しません。',
      });
    if (
      manifest.apiUrl !== `http://127.0.0.1:${manifest.ports.api}` ||
      manifest.database.port !== manifest.ports.db
    )
      context.addIssue({
        code: 'custom',
        message: '接続先は予約したlocal portに一致する必要があります。',
      });
    const hasResources = Object.values(manifest.resources).some(
      (items) => items.length > 0,
    );
    if (hasResources && isNil(manifest.preflightAt))
      context.addIssue({
        code: 'custom',
        message: 'preflight前のresourceは記録できません。',
      });
    if (
      manifest.state === 'running' &&
      (isNil(manifest.preflightAt) ||
        manifest.resources.containers.length === 0 ||
        Object.values(manifest.resources).some((items) =>
          items.some((item) => item.projectLabel !== manifest.projectId),
        ))
    )
      context.addIssue({
        code: 'custom',
        message: 'runningには所有resourceの記録が必要です。',
      });
    if (manifest.state === 'stopped' && manifest.cleanup?.status !== 'complete')
      context.addIssue({
        code: 'custom',
        message: 'stoppedにはcleanup完了の記録が必要です。',
      });
    if (manifest.state === 'failed' && isNil(manifest.failure))
      context.addIssue({
        code: 'custom',
        message: 'failedには失敗理由codeが必要です。',
      });
    for (const at of [
      manifest.preflightAt,
      manifest.failure?.at,
      manifest.cleanup?.at,
    ])
      if (
        !isNil(at) &&
        (Date.parse(at) < Date.parse(manifest.createdAt) ||
          Date.parse(at) > Date.parse(manifest.updatedAt))
      )
        context.addIssue({
          code: 'custom',
          message: '環境の記録日時が有効範囲外です。',
        });
    if (Date.parse(manifest.updatedAt) < Date.parse(manifest.createdAt))
      context.addIssue({
        code: 'custom',
        path: ['updatedAt'],
        message: '更新日時が作成日時より前です。',
      });
  });
export const environmentObservationSchema = z.strictObject({
  lease: environmentLeaseSchema,
  projectId: z.string(),
  apiUrl: z.string(),
  database: z.strictObject({ host: z.string(), port, name: z.string() }),
});
export const environmentEventSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('preflight'),
    at: timestamp,
    existingResourceCount: z.literal(0),
  }),
  z.strictObject({
    type: z.literal('resources-recorded'),
    at: timestamp,
    resources: environmentResourcesSchema,
  }),
  z.strictObject({ type: z.literal('running'), at: timestamp }),
  z.strictObject({ type: z.literal('stopping'), at: timestamp }),
  z.strictObject({
    type: z.literal('failed'),
    at: timestamp,
    code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  }),
  z.strictObject({
    type: z.literal('cleanup-recorded'),
    at: timestamp,
    cleanup: environmentCleanupSchema,
  }),
]);

type EnvironmentPlanInput = z.infer<typeof environmentPlanInputSchema>;
type EnvironmentManifest = z.infer<typeof environmentManifestSchema>;
type EnvironmentLease = z.infer<typeof environmentLeaseSchema>;
type EnvironmentResources = z.infer<typeof environmentResourcesSchema>;
type EnvironmentObservation = z.infer<typeof environmentObservationSchema>;
type EnvironmentEvent = z.infer<typeof environmentEventSchema>;
type EnvironmentIssue = z.infer<typeof environmentIssueSchema>;
type EnvironmentCleanup = z.infer<typeof environmentCleanupSchema>;
export type {
  EnvironmentPlanInput,
  EnvironmentManifest,
  EnvironmentLease,
  EnvironmentResources,
  EnvironmentObservation,
  EnvironmentEvent,
  EnvironmentIssue,
  EnvironmentCleanup,
};
