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
import { readTestTags } from './testTags';

import { isDeepStrictEqual } from 'node:util';

import type { EnvironmentLease } from './environmentSchema';
import type { ScheduleExpectation } from './scheduleCheckExpectations';

const PROJECTS = ['chromium', 'mobile-chrome'];
const ROLES = ['creator-only', 'keeper-only', 'confirmed-player', 'outsider'];
const APPLICATION_ROLES = [
  'creator-only',
  'applicant',
  'confirmed-player',
  'outsider',
];
const APPLICATION_RESOURCE_KINDS = new Set([
  'auth-user',
  'users',
  'scenarios',
  'game_sessions',
  'session_participants',
]);
const control = (values: { type: string }[]) =>
  values.some(({ type }) => ['skip', 'fixme', 'fail'].includes(type));

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
  status: z.string(),
  retry: z.number().int(),
  workerIndex: z.number().int().nonnegative(),
  parallelIndex: z.number().int().nonnegative(),
  errors: z.array(z.unknown()),
  error: z.unknown().optional(),
  annotations: z.array(annotation),
  attachments: z.array(attachment),
});
const testSchema = z.object({
  projectName: z.string(),
  projectId: z.string(),
  status: z.string(),
  expectedStatus: z.string(),
  annotations: z.array(annotation),
  results: z.array(attemptSchema),
});
const specSchema = z.object({
  id: z.string(),
  title: z.string(),
  file: z.string(),
  line: z.number().int().positive(),
  column: z.number().int().positive(),
  tags: z.array(z.string()),
  ok: z.boolean(),
  tests: z.array(testSchema),
});
const suiteSchema = z.object({
  title: z.string(),
  file: z.string(),
  specs: z.array(specSchema),
  suites: z.array(z.unknown()).default([]),
});
const reportSchema = z.object({
  config: z.object({
    version: z.literal('1.57.0'),
    projects: z.array(
      z.object({
        name: z.string(),
        id: z.string(),
        retries: z.literal(0),
        repeatEach: z.literal(1),
      }),
    ),
  }),
  suites: z.array(z.unknown()),
  errors: z.array(z.unknown()).length(0),
  stats: z.object({
    expected: z.number().int(),
    unexpected: z.literal(0),
    flaky: z.literal(0),
    skipped: z.literal(0),
  }),
});
const actorsSchema = z.strictObject({
  owner: fixtureOwnerSchema,
  actors: z.array(fixtureActorSchema),
});
const cleanupSchema = z.strictObject({
  owner: fixtureOwnerSchema,
  result: fixtureCleanupSchema,
});
type Attempt = z.infer<typeof attemptSchema>;
type Journal = z.infer<typeof fixtureManifestSchema>;
type Add = (code: string, subject: string) => void;

const readAttachment = (attempt: Attempt, name: string): unknown => {
  const matches = attempt.attachments.filter((entry) => entry.name === name);
  const value = matches[0];
  if (
    matches.length !== 1 ||
    value?.contentType !== 'application/json' ||
    isNil(value.body)
  )
    return undefined;
  try {
    return JSON.parse(Buffer.from(value.body, 'base64').toString('utf8'));
  } catch {
    return undefined;
  }
};

const checkFixture = (
  attempt: Attempt,
  journal: Journal,
  expected: ScheduleExpectation,
  add: Add,
) => {
  const subject = expected.test.testId;
  if (
    journal.owner.project !== expected.test.project ||
    journal.owner.workerIndex !== attempt.workerIndex ||
    journal.owner.retry !== 0 ||
    journal.ownerTag !== fixtureOwnerTag(journal.owner)
  )
    add('JOURNAL_OWNER_MISMATCH', subject);
  if (
    journal.cleanup?.status !== 'complete' ||
    journal.cleanup.remaining.length > 0 ||
    journal.cleanup.issues.length > 0 ||
    journal.resources.some(({ status }) => status !== 'removed')
  )
    add('CLEANUP_INCOMPLETE', subject);
  const actors = actorsSchema.safeParse(
    readAttachment(attempt, 'fixture-actors'),
  );
  const cleanup = cleanupSchema.safeParse(
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
  const roles =
    expected.fixture === 'session-application' ? APPLICATION_ROLES : ROLES;
  if (
    identities.length !== 5 ||
    ['anonymous', ...roles].some(
      (kind) =>
        identities.filter((identity) => identity.kind === kind).length !== 1,
    )
  )
    add('ACTOR_ROLES_MISMATCH', subject);
  const authenticated = identities.filter(
    (identity) => identity.kind !== 'anonymous',
  );
  if (
    new Set(authenticated.map(({ authUserId }) => authUserId)).size !== 4 ||
    new Set(authenticated.map(({ appUserId }) => appUserId)).size !== 4
  )
    add('ACTOR_IDENTITY_DUPLICATE', subject);
  for (const identity of authenticated)
    if (
      !journal.resources.some(
        ({ resource }) =>
          resource.kind === 'users' &&
          resource.id === identity.appUserId &&
          resource.authUserId === identity.authUserId,
      )
    )
      add('ACTOR_MAPPING_MISMATCH', subject);
  for (const kind of ['auth-user', 'users'])
    if (
      journal.resources.filter(({ resource }) => resource.kind === kind)
        .length !== 4
    )
      add('RESOURCE_COUNTS_MISMATCH', subject);
  const sessions = journal.resources.filter(
    ({ resource }) => resource.kind === 'game_sessions',
  );
  const creator = authenticated.find(({ kind }) => kind === 'creator-only');
  if (
    sessions.length !== 1 ||
    sessions.some(
      ({ resource }) =>
        resource.kind !== 'game_sessions' ||
        resource.createdBy !== creator?.appUserId,
    )
  )
    add('SESSION_OWNER_MISMATCH', subject);
  if (expected.fixture === 'session-application') {
    if (
      journal.resources.some(
        ({ resource }) => !APPLICATION_RESOURCE_KINDS.has(resource.kind),
      )
    )
      add('APPLICATION_RESOURCE_KIND_MISMATCH', subject);
    const scenarios = journal.resources.flatMap(({ resource }) =>
      resource.kind === 'scenarios' ? [resource] : [],
    );
    if (
      scenarios.length !== 1 ||
      scenarios[0]?.createdBy !== creator?.appUserId
    )
      add('APPLICATION_SCENARIO_OWNER_MISMATCH', subject);
    const session = sessions[0]?.resource;
    const participants = journal.resources.flatMap(({ resource }) =>
      resource.kind === 'session_participants' ? [resource] : [],
    );
    const participantRoles = ['creator-only', 'confirmed-player', 'applicant'];
    if (
      session?.kind !== 'game_sessions' ||
      participants.length !== participantRoles.length ||
      participantRoles.some((kind) => {
        const actor = authenticated.find((identity) => identity.kind === kind);
        return !participants.some(
          ({ sessionId, userId }) =>
            sessionId === session.id && userId === actor?.appUserId,
        );
      })
    )
      add('APPLICATION_PARTICIPANT_RESOURCES_MISMATCH', subject);
  }
  const used = attempt.attachments.filter(
    ({ name }) => name === 'fixture-used-actor',
  );
  const parsed = used.map((value) =>
    fixtureActorSchema.safeParse(
      readAttachment(
        { ...attempt, attachments: [value] },
        'fixture-used-actor',
      ),
    ),
  );
  const requiredActors = [
    expected.operator,
    ...(!isNil(expected.observer) ? [expected.observer] : []),
  ];
  if (
    used.length !== requiredActors.length ||
    requiredActors.some(
      (kind) =>
        parsed.filter(
          (value) =>
            value.success &&
            value.data.kind === kind &&
            identities.some((identity) =>
              isDeepStrictEqual(identity, value.data),
            ),
        ).length !== 1,
    ) ||
    parsed.some((value) => !value.success)
  )
    add('USED_ACTOR_MISMATCH', subject);
};

/** isolatedのofficial JSONと、日程・参加申請の実fixture証跡を照合する。 */
export const validateScheduleCheckEvidence = (input: {
  expected: ScheduleExpectation[];
  report: unknown;
  journals: unknown[];
  lease: EnvironmentLease;
}) => {
  const issues: { code: string; subject: string }[] = [];
  const add: Add = (code, subject) => {
    issues.push({ code, subject });
  };
  const counts = {
    expected: input.expected.length,
    tests: 0,
    passed: 0,
    journals: input.journals.length,
  };
  const journals = new Map<string, Journal>();
  const resourceKeys = new Set<string>();
  for (const value of input.journals) {
    const parsed = fixtureManifestSchema.safeParse(value);
    if (!parsed.success) {
      add('JOURNAL_INVALID', 'journal');
      continue;
    }
    const journal = parsed.data;
    const id = journal.owner.caseId;
    if (journals.has(id)) add('DUPLICATE_JOURNAL', id);
    journals.set(id, journal);
    if (!isDeepStrictEqual(journal.owner.lease, input.lease))
      add('LEASE_MISMATCH', id);
    if (!input.expected.some(({ test }) => test.testId === id))
      add('UNKNOWN_JOURNAL', id);
    for (const { resource } of journal.resources) {
      const key = fixtureResourceKey(resource);
      if (resourceKeys.has(key)) add('RESOURCE_SHARED_BETWEEN_CASES', id);
      resourceKeys.add(key);
    }
  }
  const parsed = reportSchema.safeParse(input.report);
  if (!parsed.success) {
    add('REPORT_INVALID', 'report');
    return { issues, counts };
  }
  const report = parsed.data;
  if (
    report.config.projects.length !== 2 ||
    PROJECTS.some(
      (name) =>
        report.config.projects.filter(
          (project) => project.name === name && project.id === name,
        ).length !== 1,
    )
  )
    add('PROJECTS_MISMATCH', 'config');
  const seen = new Set<string>();
  const visit = (raw: unknown, titles: string[], parentFile?: string) => {
    const suiteResult = suiteSchema.safeParse(raw);
    if (!suiteResult.success) {
      add('SUITE_INVALID', 'suite');
      return;
    }
    const suite = suiteResult.data;
    if (!isNil(parentFile) && suite.file !== parentFile)
      add('SUITE_FILE_MISMATCH', suite.file);
    for (const spec of suite.specs) {
      const file = `e2e/isolated/${spec.file}`;
      const titlePath = [...titles, spec.title];
      const candidates = input.expected.filter(
        ({ test }) =>
          test.file === file &&
          isDeepStrictEqual(test.titlePath, titlePath) &&
          test.line === spec.line &&
          test.column === spec.column,
      );
      if (
        spec.file !== suite.file ||
        !candidates.some(({ test }) => test.testId === spec.id)
      )
        add('SPEC_IDENTITY_MISMATCH', spec.id);
      for (const result of spec.tests) {
        counts.tests++;
        const expected = candidates.find(
          ({ test }) => test.project === result.projectName,
        );
        if (isNil(expected) || result.projectId !== result.projectName) {
          add('UNKNOWN_RESULT', spec.id);
          continue;
        }
        const id = expected.test.testId;
        if (seen.has(id)) add('DUPLICATE_RESULT', id);
        seen.add(id);
        let tags: ReturnType<typeof readTestTags> = null;
        try {
          tags = readTestTags(spec.tags.map((tag) => `@${tag}`));
        } catch {
          add('RESULT_TAG_MISMATCH', id);
        }
        if (
          isNil(tags) ||
          tags.caseId !== expected.caseId ||
          tags.variant !== expected.variant ||
          tags.binding !== expected.binding
        )
          add('RESULT_TAG_MISMATCH', id);
        const attempt = result.results[0];
        if (
          !spec.ok ||
          result.status !== 'expected' ||
          result.expectedStatus !== 'passed' ||
          control(result.annotations) ||
          result.results.length !== 1 ||
          isNil(attempt) ||
          attempt.status !== 'passed' ||
          attempt.retry !== 0 ||
          attempt.errors.length > 0 ||
          !isNil(attempt.error) ||
          control(attempt.annotations)
        ) {
          add('TEST_NOT_CLEAN_PASS', id);
          continue;
        }
        counts.passed++;
        const journal = journals.get(id);
        if (isNil(journal)) add('JOURNAL_MISSING', id);
        else checkFixture(attempt, journal, expected, add);
      }
    }
    for (const child of suite.suites) {
      const parsed = suiteSchema.safeParse(child);
      visit(
        child,
        [...titles, parsed.success ? parsed.data.title : ''],
        suite.file,
      );
    }
  };
  for (const suite of report.suites) visit(suite, []);
  for (const { test } of input.expected)
    if (!seen.has(test.testId)) add('RESULT_MISSING', test.testId);
  if (
    input.expected.length === 0 ||
    counts.tests !== input.expected.length ||
    report.stats.expected !== input.expected.length ||
    journals.size !== input.expected.length
  )
    add('COUNT_MISMATCH', 'report');
  return { issues, counts };
};
