import { z } from 'zod';

import { environmentLeaseSchema } from '../../scripts/e2e/environmentSchema';

const ulid = z.string().regex(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/);
const uuid = z.uuid();
export const fixtureOwnerSchema = z.strictObject({
  lease: environmentLeaseSchema,
  project: z.string().min(1).max(100),
  workerIndex: z.number().int().nonnegative(),
  caseId: z.string().min(1).max(500),
  retry: z.number().int().nonnegative(),
});
export const fixtureActorSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('anonymous') }),
  z.strictObject({
    kind: z.enum([
      'creator-only',
      'keeper-only',
      'confirmed-player',
      'outsider',
    ]),
    authUserId: uuid,
    appUserId: ulid,
  }),
]);
export const fixtureResourceSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('auth-user'), id: uuid }),
  z.strictObject({ kind: z.literal('users'), id: ulid, authUserId: uuid }),
  z.strictObject({ kind: z.literal('scenarios'), id: ulid, createdBy: ulid }),
  z.strictObject({
    kind: z.literal('game_sessions'),
    id: ulid,
    createdBy: ulid,
  }),
  z.strictObject({
    kind: z.literal('session_participants'),
    sessionId: ulid,
    userId: ulid,
  }),
  z.strictObject({
    kind: z.literal('session_availability_time_blocks'),
    id: ulid,
    sessionId: ulid,
    userId: ulid,
  }),
  z.strictObject({
    kind: z.literal('game_schedule_time_blocks'),
    id: ulid,
    sessionId: ulid,
    createdBy: ulid,
  }),
]);

/** DBの主キーだけから種類付きの識別子を作る。名前prefixは使用しない。 */
export const fixtureResourceKey = (resource: FixtureResource): string =>
  resource.kind === 'session_participants'
    ? `${resource.kind}:${resource.sessionId}:${resource.userId}`
    : `${resource.kind}:${resource.id}`;

export const fixtureCleanupSchema = z
  .strictObject({
    status: z.enum(['complete', 'incomplete']),
    remaining: z.array(fixtureResourceSchema),
    issues: z.array(
      z.strictObject({
        code: z.enum([
          'OWNERSHIP_MISMATCH',
          'RESOURCE_REAPPEARED',
          'REFERENCE_REMAINS',
          'OBSERVATION_FAILED',
          'DELETE_FAILED',
          'JOURNAL_SAVE_FAILED',
        ]),
        resource: z.string(),
        reference: z
          .strictObject({
            table: z.string().regex(/^[a-z_]+$/),
            column: z.string().regex(/^[a-z_]+$/),
          })
          .optional(),
      }),
    ),
  })
  .superRefine((value, context) => {
    if (
      value.status === 'complete' &&
      (value.remaining.length > 0 || value.issues.length > 0)
    )
      context.addIssue({
        code: 'custom',
        message: '残留または問題があるcleanupは完了ではありません。',
      });
  });

export const fixtureManifestSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    owner: fixtureOwnerSchema,
    ownerTag: z.string().regex(/^[a-f0-9]{64}$/),
    resources: z.array(
      z.strictObject({
        resource: fixtureResourceSchema,
        status: z.enum(['reserved', 'created', 'removed']),
      }),
    ),
    cleanup: fixtureCleanupSchema.nullable(),
  })
  .superRefine((manifest, context) => {
    if (
      manifest.cleanup?.status === 'complete' &&
      manifest.resources.some((entry) => entry.status !== 'removed')
    )
      context.addIssue({
        code: 'custom',
        message: 'cleanup完了には全所有IDの削除確認が必要です。',
      });
    const resources = manifest.resources.map((entry) => entry.resource);
    const keys = resources.map(fixtureResourceKey);
    if (new Set(keys).size !== keys.length)
      context.addIssue({
        code: 'custom',
        message: '所有resourceが重複しています。',
      });
    const has = (kind: FixtureResource['kind'], id: string) =>
      keys.includes(`${kind}:${id}`);
    for (const resource of resources) {
      const valid =
        resource.kind === 'auth-user' ||
        (resource.kind === 'users' && has('auth-user', resource.authUserId)) ||
        ((resource.kind === 'scenarios' || resource.kind === 'game_sessions') &&
          has('users', resource.createdBy)) ||
        ((resource.kind === 'session_participants' ||
          resource.kind === 'session_availability_time_blocks') &&
          has('game_sessions', resource.sessionId) &&
          has('users', resource.userId)) ||
        (resource.kind === 'game_schedule_time_blocks' &&
          has('game_sessions', resource.sessionId) &&
          has('users', resource.createdBy));
      if (!valid)
        context.addIssue({
          code: 'custom',
          message: 'resourceの参照先は同じcaseの所有IDである必要があります。',
        });
    }
  });

type FixtureOwner = z.infer<typeof fixtureOwnerSchema>;
type FixtureActor = z.infer<typeof fixtureActorSchema>;
type FixtureResource = z.infer<typeof fixtureResourceSchema>;
type FixtureManifest = z.infer<typeof fixtureManifestSchema>;
type FixtureCleanup = z.infer<typeof fixtureCleanupSchema>;
export type {
  FixtureOwner,
  FixtureActor,
  FixtureResource,
  FixtureManifest,
  FixtureCleanup,
};
