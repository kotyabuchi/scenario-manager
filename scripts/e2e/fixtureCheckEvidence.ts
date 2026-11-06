import { isNil } from 'ramda';
import { z } from 'zod';

import { fixtureOwnerTag } from '../../e2e/fixtures/fixtureManifest';
import {
  fixtureActorSchema,
  fixtureCleanupSchema,
  fixtureManifestSchema,
  fixtureOwnerSchema,
  fixtureResourceKey,
} from '../../e2e/fixtures/fixtureSchema';

import { isDeepStrictEqual } from 'node:util';

import type { FixtureManifest } from '../../e2e/fixtures/fixtureSchema';

const PROJECTS = ['chromium', 'mobile-chrome'] as const;
const ROLES = [
  'creator-only',
  'keeper-only',
  'confirmed-player',
  'outsider',
] as const;
// Playwright 1.57.0のguard付き--listで確認した、受入専用4登録のID。
const EXPECTED = (
  [
    ['chromium', 'creator-only', '5f38a9d80d97bc73afac'],
    ['chromium', 'keeper-only', '107e8fcac18c29625526'],
    ['mobile-chrome', 'creator-only', 'd153b6f0d6cbd06c999c'],
    ['mobile-chrome', 'keeper-only', '647eb407c6baefd66be5'],
  ] as const
).map(([project, role, hash]) => ({
  project,
  role,
  title: `${role}の認証とcase所有行を分離する`,
  id: `5db385c67e1993015e4c-${hash}`,
}));
const annotation = z.object({
  type: z.string(),
  description: z.string().optional(),
});
const attachment = z.object({
  name: z.string(),
  contentType: z.string(),
  body: z.string().optional(),
});
const attemptSchema = z.object({
  workerIndex: z.number().int(),
  parallelIndex: z.number().int(),
  retry: z.number().int().nonnegative(),
  status: z.string().optional(),
  error: z.unknown().optional(),
  errors: z.array(z.unknown()),
  annotations: z.array(annotation),
  attachments: z.array(attachment),
});
const testSchema = z.object({
  projectName: z.string(),
  projectId: z.string(),
  expectedStatus: z.string(),
  status: z.string(),
  annotations: z.array(annotation),
  results: z.array(attemptSchema),
});
const specSchema = z.object({
  title: z.string(),
  id: z.string(),
  file: z.string(),
  ok: z.boolean(),
  tests: z.array(testSchema),
});
// JSON reporterの公開型に沿う。余分な通常metadataは保持せず、判定に必要な構造だけ読む。
const reportSchema = z.object({
  config: z.object({
    version: z.string(),
    workers: z.number().int().positive(),
    fullyParallel: z.boolean(),
    projects: z.array(
      z.object({
        name: z.string(),
        id: z.string(),
        retries: z.number().int().nonnegative(),
        repeatEach: z.number().int().positive(),
      }),
    ),
  }),
  suites: z.array(
    z.object({
      title: z.string(),
      file: z.string(),
      specs: z.array(specSchema),
      suites: z.array(z.unknown()).optional(),
    }),
  ),
  errors: z.array(z.unknown()),
  stats: z.object({
    expected: z.number().int().nonnegative(),
    unexpected: z.number().int().nonnegative(),
    flaky: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
  }),
});
const actorAttachmentSchema = z.strictObject({
  owner: fixtureOwnerSchema,
  actors: z.array(fixtureActorSchema),
});
const cleanupAttachmentSchema = z.strictObject({
  owner: fixtureOwnerSchema,
  result: fixtureCleanupSchema,
});
type Issue = { code: string; subject: string };
type Attempt = z.infer<typeof attemptSchema>;
type AddIssue = (code: string, subject: string) => void;

const hasControl = (values: z.infer<typeof annotation>[]) =>
  values.some(({ type }) => ['skip', 'fixme', 'fail'].includes(type));

const readAttachment = (attempt: Attempt, name: string): unknown => {
  const values = attempt.attachments.filter((value) => value.name === name);
  const value = values[0];
  if (
    values.length !== 1 ||
    isNil(value?.body) ||
    value.contentType !== 'application/json'
  )
    return undefined;
  try {
    return JSON.parse(Buffer.from(value.body, 'base64').toString('utf8'));
  } catch {
    return undefined;
  }
};

const checkAttachments = (
  attempt: Attempt,
  journal: FixtureManifest,
  role: string,
  add: AddIssue,
) => {
  const subject = journal.owner.caseId;
  const actors = actorAttachmentSchema.safeParse(
    readAttachment(attempt, 'fixture-actors'),
  );
  const cleanup = cleanupAttachmentSchema.safeParse(
    readAttachment(attempt, 'fixture-cleanup'),
  );
  if (
    !cleanup.success ||
    !isDeepStrictEqual(cleanup.data.owner, journal.owner) ||
    !isDeepStrictEqual(cleanup.data.result, journal.cleanup)
  )
    add('CLEANUP_ATTACHMENT_MISMATCH', subject);
  if (!actors.success || !isDeepStrictEqual(actors.data.owner, journal.owner)) {
    add('ACTOR_ATTACHMENT_INVALID', subject);
    return;
  }
  const identities = actors.data.actors;
  if (
    identities.length !== 5 ||
    ['anonymous', ...ROLES].some(
      (kind) => identities.filter((actor) => actor.kind === kind).length !== 1,
    )
  )
    add('ACTOR_ROLES_MISMATCH', subject);
  const authenticated = identities.filter(
    (identity) => identity.kind !== 'anonymous',
  );
  if (
    new Set(authenticated.map((identity) => identity.authUserId)).size !== 4 ||
    new Set(authenticated.map((identity) => identity.appUserId)).size !== 4
  )
    add('ACTOR_IDENTITY_DUPLICATE', subject);
  const users = journal.resources.flatMap(({ resource }) =>
    resource.kind === 'users' ? [resource] : [],
  );
  for (const identity of identities) {
    if (
      identity.kind !== 'anonymous' &&
      !users.some(
        (user) =>
          user.id === identity.appUserId &&
          user.authUserId === identity.authUserId,
      )
    )
      add('ACTOR_MAPPING_MISMATCH', subject);
  }
  const used = attempt.attachments.filter(
    (value) => value.name === 'fixture-used-actor',
  );
  const usedActors = used.map((value) => {
    try {
      return fixtureActorSchema.safeParse(
        JSON.parse(Buffer.from(value.body ?? '', 'base64').toString('utf8')),
      );
    } catch {
      return fixtureActorSchema.safeParse(undefined);
    }
  });
  if (
    used.length !== 2 ||
    used.some((value) => value.contentType !== 'application/json') ||
    usedActors.some((value) => !value.success) ||
    [role, 'anonymous'].some(
      (kind) =>
        !usedActors.some(
          (value) =>
            value.success &&
            value.data.kind === kind &&
            identities.some((identity) =>
              isDeepStrictEqual(identity, value.data),
            ),
        ),
    )
  )
    add('USED_ACTOR_MISMATCH', subject);
};

/**
 * 基盤受入4登録だけを検査する。業務caseのverifiedや認可成功へは変換しない。
 * 不正入力もissuesへ返し、レポートの秘密値・生エラーは診断へ転記しない。
 */
export const validateFixtureCheckEvidence = (
  report: unknown,
  journals: unknown[],
) => {
  const issues: Issue[] = [];
  const add: AddIssue = (code, subject) => {
    issues.push({ code, subject });
  };
  const counts = {
    tests: 0,
    passed: 0,
    projects: 0,
    workers: 0,
    journals: 0,
    authUsers: 0,
    appUsers: 0,
    sessions: 0,
  };
  const parsed = reportSchema.safeParse(report);
  const validJournals: FixtureManifest[] = [];
  for (const [index, input] of journals.entries()) {
    const result = fixtureManifestSchema.safeParse(input);
    if (!result.success) add('JOURNAL_INVALID', `journal:${index}`);
    else validJournals.push(result.data);
  }
  counts.journals = validJournals.length;
  if (journals.length !== EXPECTED.length)
    add('JOURNAL_COUNT_MISMATCH', 'journals');
  const byId = new Map<string, FixtureManifest>();
  const resourceKeys = new Set<string>();
  const firstLease = validJournals[0]?.owner.lease;
  for (const journal of validJournals) {
    const id = journal.owner.caseId;
    if (byId.has(id)) add('DUPLICATE_JOURNAL', id);
    byId.set(id, journal);
    if (!isDeepStrictEqual(journal.owner.lease, firstLease))
      add('LEASE_MISMATCH', id);
    if (journal.ownerTag !== fixtureOwnerTag(journal.owner))
      add('OWNER_TAG_MISMATCH', id);
    if (
      journal.cleanup?.status !== 'complete' ||
      journal.cleanup.remaining.length > 0 ||
      journal.cleanup.issues.length > 0 ||
      journal.resources.some(({ status }) => status !== 'removed')
    )
      add('CLEANUP_INCOMPLETE', id);
    const kindCount = (kind: string) =>
      journal.resources.filter(({ resource }) => resource.kind === kind).length;
    counts.authUsers += kindCount('auth-user');
    counts.appUsers += kindCount('users');
    counts.sessions += kindCount('game_sessions');
    if (
      kindCount('auth-user') !== 4 ||
      kindCount('users') !== 4 ||
      kindCount('game_sessions') !== 1
    )
      add('RESOURCE_COUNTS_MISMATCH', id);
    const authMappings = journal.resources.flatMap(({ resource }) =>
      resource.kind === 'users' ? [resource.authUserId] : [],
    );
    if (new Set(authMappings).size !== 4) add('ACTOR_MAPPING_DUPLICATE', id);
    for (const { resource } of journal.resources) {
      const key = fixtureResourceKey(resource);
      if (resourceKeys.has(key)) add('RESOURCE_SHARED_BETWEEN_CASES', id);
      resourceKeys.add(key);
    }
  }
  if (!parsed.success) {
    add('REPORT_INVALID', 'report');
    return { issues, counts };
  }
  const data = parsed.data;
  if (data.config.version !== '1.57.0')
    add('PLAYWRIGHT_VERSION_MISMATCH', 'config');
  if (data.errors.length > 0) add('GLOBAL_ERRORS', 'report');
  if (
    !isDeepStrictEqual(data.stats, {
      expected: 4,
      unexpected: 0,
      flaky: 0,
      skipped: 0,
    })
  )
    add('STATS_MISMATCH', 'report');
  counts.projects = data.config.projects.length;
  if (
    data.config.projects.length !== 2 ||
    PROJECTS.some(
      (project) =>
        data.config.projects.filter(
          (value) =>
            value.name === project &&
            value.id === project &&
            value.retries === 0 &&
            value.repeatEach === 1,
        ).length !== 1,
    )
  )
    add('PROJECTS_MISMATCH', 'config');
  if (data.config.workers < 2 || !data.config.fullyParallel)
    add('PARALLEL_CONFIG_REQUIRED', 'config');
  if (data.suites.length !== 1) add('SUITES_MISMATCH', 'report');
  const seen = new Set<string>();
  const workers = new Set<number>();
  const projectWorkers = new Map<string, Set<number>>();
  const parallelSlots = new Map<string, Set<number>>();
  for (const suite of data.suites) {
    if (
      suite.file !== 'actors.spec.ts' ||
      suite.title !== 'actors.spec.ts' ||
      (suite.suites?.length ?? 0) > 0
    )
      add('SUITES_MISMATCH', 'report');
    for (const spec of suite.specs) {
      if (spec.tests.length !== 1) add('SPEC_TEST_COUNT_MISMATCH', spec.id);
      for (const test of spec.tests) {
        counts.tests++;
        const expected = EXPECTED.find((value) => value.id === spec.id);
        if (seen.has(spec.id)) add('DUPLICATE_TEST', spec.id);
        seen.add(spec.id);
        if (
          isNil(expected) ||
          expected.title !== spec.title ||
          expected.project !== test.projectName ||
          test.projectId !== test.projectName ||
          spec.file !== 'actors.spec.ts'
        ) {
          add('TEST_IDENTITY_MISMATCH', spec.id);
          continue;
        }
        const attempt = test.results[0];
        if (
          !spec.ok ||
          test.status !== 'expected' ||
          test.expectedStatus !== 'passed' ||
          hasControl(test.annotations) ||
          test.results.length !== 1 ||
          isNil(attempt) ||
          attempt.retry !== 0 ||
          attempt.status !== 'passed' ||
          !isNil(attempt.error) ||
          attempt.errors.length > 0 ||
          hasControl(attempt.annotations) ||
          attempt.workerIndex < 0 ||
          attempt.parallelIndex < 0
        ) {
          add('TEST_NOT_CLEAN_PASS', spec.id);
          continue;
        }
        counts.passed++;
        workers.add(attempt.workerIndex);
        const ids = projectWorkers.get(test.projectName) ?? new Set<number>();
        ids.add(attempt.workerIndex);
        projectWorkers.set(test.projectName, ids);
        const slots = parallelSlots.get(test.projectName) ?? new Set<number>();
        slots.add(attempt.parallelIndex);
        parallelSlots.set(test.projectName, slots);
        const journal = byId.get(spec.id);
        if (isNil(journal)) add('JOURNAL_MISSING', spec.id);
        else {
          if (
            journal.owner.project !== test.projectName ||
            journal.owner.workerIndex !== attempt.workerIndex ||
            journal.owner.retry !== attempt.retry
          )
            add('JOURNAL_ATTEMPT_MISMATCH', spec.id);
          checkAttachments(attempt, journal, expected.role ?? '', add);
        }
      }
    }
  }
  counts.workers = workers.size;
  for (const expected of EXPECTED)
    if (!seen.has(expected.id)) add('TEST_MISSING', expected.id);
  for (const id of byId.keys())
    if (!seen.has(id)) add('JOURNAL_WITHOUT_TEST', id);
  for (const project of PROJECTS)
    if (
      (projectWorkers.get(project)?.size ?? 0) < 2 ||
      (parallelSlots.get(project)?.size ?? 0) < 2
    )
      add('MULTIPLE_WORKERS_REQUIRED', project);
  return { issues, counts };
};
