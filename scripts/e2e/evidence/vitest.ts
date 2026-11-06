import { isNil } from 'ramda';

import { fixtureOwnerTag } from '../../../e2e/fixtures/fixtureManifest';
import {
  fixtureManifestSchema,
  fixtureResourceKey,
} from '../../../e2e/fixtures/fixtureSchema';
import {
  APPLICATION_VARIANT_ACTORS,
  applicationIntegrationActor,
  applicationIntegrationParticipants,
} from '../applicationIntegrationPolicy';
import {
  integrationExpectationSchema,
  integrationReportSchema,
} from '../integrationSchema';

import { isDeepStrictEqual } from 'node:util';

import type { z } from 'zod';
import type { EnvironmentLease } from '../environmentSchema';
import type {
  IntegrationAttemptMeta,
  IntegrationExpectation,
} from '../integrationSchema';

type Journal = z.infer<typeof fixtureManifestSchema>;
type Add = (code: string, subject: string) => void;
const cleanOptions = (options: IntegrationExpectation['options']) =>
  options.mode === 'run' &&
  !options.fails &&
  !options.concurrent &&
  options.retry === 0 &&
  options.repeats === 0;
const checkKey = (check: IntegrationExpectation['checks'][number]) =>
  JSON.stringify([check.target, check.aspect, check.layer]);

const checkAttempt = (
  meta: IntegrationAttemptMeta,
  expected: IntegrationExpectation,
  journal: Journal,
  lease: EnvironmentLease,
  add: Add,
) => {
  const id = expected.test.testId;
  if (!isDeepStrictEqual(meta.claim, expected.claim))
    add('RUNTIME_CLAIM_MISMATCH', id);
  if (
    meta.runId !== lease.runId ||
    !isDeepStrictEqual(meta.lease, lease) ||
    !isDeepStrictEqual(meta.owner.lease, lease) ||
    !isDeepStrictEqual(journal.owner.lease, lease)
  )
    add('LEASE_MISMATCH', id);
  if (
    !isDeepStrictEqual(meta.owner, journal.owner) ||
    meta.owner.caseId !== id ||
    meta.owner.project !== 'integration' ||
    meta.owner.retry !== 0 ||
    meta.owner.workerIndex !== 0 ||
    meta.ownerTag !== journal.ownerTag ||
    meta.ownerTag !== fixtureOwnerTag(meta.owner)
  )
    add('FIXTURE_OWNER_MISMATCH', id);
  const journalPath = `test-results/environments/run-${lease.runId}/fixtures/${fixtureOwnerTag(meta.owner)}/manifest.json`;
  if (meta.journalPath !== journalPath) add('JOURNAL_PATH_MISMATCH', id);
  if (meta.preflight !== 'passed' || !meta.identityVerified)
    add('PREFLIGHT_INCOMPLETE', id);
  if (
    !meta.bodyCompleted ||
    meta.bodyAssertionCalls === 0 ||
    meta.assertionCalls < meta.bodyAssertionCalls
  )
    add('BODY_INCOMPLETE', id);
  if (
    meta.cleanup !== 'complete' ||
    journal.cleanup?.status !== 'complete' ||
    journal.cleanup.remaining.length > 0 ||
    journal.cleanup.issues.length > 0 ||
    journal.resources.some(({ status }) => status !== 'removed')
  )
    add('CLEANUP_INCOMPLETE', id);
  const expectedChecks = expected.checks.map(checkKey).sort();
  const completed = meta.completedChecks.map(checkKey).sort();
  if (
    new Set(completed).size !== completed.length ||
    !isDeepStrictEqual(completed, expectedChecks)
  )
    add('CHECKS_INCOMPLETE', id);
  const isApplication = expected.fixture === 'session-application';
  if (
    Object.hasOwn(APPLICATION_VARIANT_ACTORS, expected.claim.caseId) !==
    isApplication
  )
    add('FIXTURE_KIND_MISMATCH', id);
  const rosterKinds = [
    'anonymous',
    'creator-only',
    isApplication ? 'applicant' : 'keeper-only',
    'confirmed-player',
    'outsider',
  ];
  if (isApplication) {
    const actor = applicationIntegrationActor(expected.claim);
    if (
      isNil(actor) ||
      !isDeepStrictEqual(expected.actorBindings, [{ role: 'operator', actor }])
    )
      add('ACTOR_BINDINGS_MISMATCH', id);
  }
  if (
    meta.actors.length !== rosterKinds.length ||
    rosterKinds.some(
      (kind) => meta.actors.filter((actor) => actor.kind === kind).length !== 1,
    )
  )
    add('ACTOR_ROSTER_INVALID', id);
  const authenticated = meta.actors.filter(
    (actor) => actor.kind !== 'anonymous',
  );
  if (
    new Set(authenticated.map((actor) => actor.authUserId)).size !== 4 ||
    new Set(authenticated.map((actor) => actor.appUserId)).size !== 4
  )
    add('ACTOR_ROSTER_INVALID', id);
  for (const actor of authenticated) {
    if (
      !journal.resources.some(
        ({ resource }) =>
          resource.kind === 'auth-user' && resource.id === actor.authUserId,
      ) ||
      !journal.resources.some(
        ({ resource }) =>
          resource.kind === 'users' &&
          resource.id === actor.appUserId &&
          resource.authUserId === actor.authUserId,
      )
    )
      add('ACTOR_MAPPING_MISMATCH', id);
  }
  const creator = authenticated.find((actor) => actor.kind === 'creator-only');
  if (
    journal.resources.some(
      ({ resource }) =>
        (resource.kind === 'game_sessions' || resource.kind === 'scenarios') &&
        resource.createdBy !== creator?.appUserId,
    )
  )
    add('SESSION_ACTOR_MISMATCH', id);
  const participantResources = journal.resources.flatMap(({ resource }) =>
    resource.kind === 'session_participants' ? [resource] : [],
  );
  const participantKinds = isApplication
    ? applicationIntegrationParticipants(expected.claim)
    : ['creator-only', 'keeper-only', 'confirmed-player'];
  const participantActors = authenticated
    .filter((actor) => participantKinds?.includes(actor.kind))
    .map((actor) => actor.appUserId);
  if (
    isNil(participantKinds) ||
    !isDeepStrictEqual(
      participantResources.map(({ userId }) => userId).sort(),
      participantActors.sort(),
    )
  )
    add('SESSION_ACTOR_MISMATCH', id);
  if (isApplication) {
    const sessionIds = journal.resources.flatMap(({ resource }) =>
      resource.kind === 'game_sessions' ? [resource.id] : [],
    );
    if (
      sessionIds.length !== 1 ||
      participantResources.some(({ sessionId }) => sessionId !== sessionIds[0])
    )
      add('SESSION_ACTOR_MISMATCH', id);
    const allowed = new Set([
      'auth-user',
      'users',
      'scenarios',
      'game_sessions',
      'session_participants',
    ]);
    if (journal.resources.some(({ resource }) => !allowed.has(resource.kind)))
      add('FIXTURE_RESOURCES_MISMATCH', id);
  }
  const roles = new Set(meta.actorBindings.map(({ role }) => role));
  if (
    roles.size !== meta.actorBindings.length ||
    meta.actorBindings.length !== expected.actorBindings.length
  )
    add('ACTOR_BINDINGS_MISMATCH', id);
  for (const binding of expected.actorBindings) {
    const actual = meta.actorBindings.find(
      ({ role }) => role === binding.role,
    )?.actor;
    if (
      isNil(actual) ||
      actual.kind !== binding.actor ||
      !meta.actors.some(
        (actor) =>
          actor.kind === binding.actor && isDeepStrictEqual(actor, actual),
      )
    ) {
      add('ACTOR_BINDINGS_MISMATCH', id);
      continue;
    }
    if (
      actual.kind !== 'anonymous' &&
      !journal.resources.some(
        ({ resource }) =>
          resource.kind === 'users' &&
          resource.id === actual.appUserId &&
          resource.authUserId === actual.authUserId,
      )
    )
      add('ACTOR_MAPPING_MISMATCH', id);
  }
  const operator = meta.actorBindings.find(
    ({ role }) => role === 'operator',
  )?.actor;
  if (
    isNil(operator) ||
    meta.clientKind !==
      (operator.kind === 'anonymous' ? 'anonymous' : 'user-jwt')
  )
    add('CLIENT_KIND_MISMATCH', id);
  const identities = meta.actorBindings.flatMap(({ actor }) =>
    actor.kind === 'anonymous' ? [] : [actor],
  );
  for (let left = 0; left < identities.length; left++)
    for (let right = left + 1; right < identities.length; right++) {
      const a = identities[left];
      const b = identities[right];
      if (isNil(a) || isNil(b)) continue;
      if (
        a.kind === b.kind
          ? !isDeepStrictEqual(a, b)
          : a.authUserId === b.authUserId || a.appUserId === b.appUserId
      )
        add('ACTOR_IDENTITY_COLLISION', id);
    }
  const count = (kind: string) =>
    journal.resources.filter(({ resource }) => resource.kind === kind).length;
  if (
    count('auth-user') !== 4 ||
    count('users') !== 4 ||
    count('game_sessions') !== 1 ||
    count('scenarios') !== 1 ||
    count('session_participants') !== participantKinds?.length
  )
    add('FIXTURE_RESOURCES_MISMATCH', id);
};

/** Vitest標準の結果と、assertion後の自己申告fixture/checkmetaを独立に照合する。test本文の正しさ自体は証明しない。 */
export const validateIntegrationEvidence = (input: {
  expected: IntegrationExpectation[];
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
  const expected = input.expected.map((entry) =>
    integrationExpectationSchema.parse(entry),
  );
  const byId = new Map(expected.map((entry) => [entry.test.testId, entry]));
  const identities = expected.map((entry) =>
    JSON.stringify([
      entry.claim,
      entry.test.project,
      entry.test.repeatEachIndex,
    ]),
  );
  if (
    expected.length === 0 ||
    byId.size !== expected.length ||
    new Set(identities).size !== expected.length
  )
    add('EXPECTED_SET_INVALID', 'expected');
  const journals = new Map<string, Journal>();
  const resources = new Set<string>();
  for (const raw of input.journals) {
    const parsed = fixtureManifestSchema.safeParse(raw);
    if (!parsed.success) {
      add('JOURNAL_INVALID', 'journal');
      continue;
    }
    const journal = parsed.data;
    const id = journal.owner.caseId;
    if (journals.has(id)) add('DUPLICATE_JOURNAL', id);
    journals.set(id, journal);
    if (!byId.has(id)) add('UNKNOWN_JOURNAL', id);
    for (const { resource } of journal.resources) {
      const key = fixtureResourceKey(resource);
      if (resources.has(key)) add('RESOURCE_SHARED_BETWEEN_TESTS', id);
      resources.add(key);
    }
  }
  const parsed = integrationReportSchema.safeParse(input.report);
  if (!parsed.success) {
    add('REPORT_INVALID', 'report');
    return { issues, counts };
  }
  const report = parsed.data;
  if (report.runId !== input.lease.runId) add('RUN_ID_MISMATCH', 'report');
  if (
    report.reason !== 'passed' ||
    report.unhandledErrorCount !== 0 ||
    report.reporterErrorCount !== 0
  )
    add('RUN_NOT_CLEAN_PASS', 'report');
  if (
    report.runner.pool !== 'forks' ||
    report.runner.fileParallelism ||
    report.runner.maxWorkers !== 1 ||
    !report.runner.includeTaskLocation ||
    report.config !== 'vitest.integration.verified.config.ts'
  )
    add('RUNNER_OPTIONS_MISMATCH', 'config');
  const files = new Set(expected.map(({ test }) => test.file));
  const moduleFiles = new Set<string>();
  for (const module of report.modules) {
    if (moduleFiles.has(module.file)) add('DUPLICATE_MODULE', module.file);
    moduleFiles.add(module.file);
    if (!files.has(module.file)) add('UNKNOWN_MODULE', module.file);
    if (
      module.project !== 'integration' ||
      module.state !== 'passed' ||
      module.errorCount !== 0 ||
      module.suiteErrorCount !== 0
    )
      add('MODULE_NOT_CLEAN_PASS', module.file);
  }
  for (const file of files)
    if (!moduleFiles.has(file)) add('MODULE_MISSING', file);
  const seen = new Set<string>();
  for (const result of report.tests) {
    counts.tests++;
    const entry = byId.get(result.testId);
    if (isNil(entry)) {
      add('UNKNOWN_RESULT', result.testId);
      continue;
    }
    const before = issues.length;
    if (seen.has(result.testId)) add('DUPLICATE_RESULT', result.testId);
    seen.add(result.testId);
    if (
      result.file !== entry.test.file ||
      result.fullName !== entry.test.titlePath.join(' > ') ||
      !isDeepStrictEqual(result.titlePath, entry.test.titlePath) ||
      result.line !== entry.test.line ||
      result.column !== entry.test.column ||
      !isDeepStrictEqual(result.claim, entry.claim) ||
      entry.test.project !== 'integration' ||
      entry.test.repeatEachIndex !== 0 ||
      entry.test.expectedStatus !== 'passed' ||
      entry.test.isSetup ||
      entry.test.annotations.some(({ type }) =>
        ['skip', 'fixme', 'fail'].includes(type),
      )
    )
      add('REGISTRATION_MISMATCH', result.testId);
    if (
      !cleanOptions(entry.options) ||
      !cleanOptions(result.options) ||
      !isDeepStrictEqual(result.options, entry.options) ||
      result.state !== 'passed' ||
      result.errorCount !== 0 ||
      isNil(result.diagnostic) ||
      result.diagnostic.retryCount !== 0 ||
      result.diagnostic.repeatCount !== 0 ||
      result.diagnostic.flaky ||
      result.diagnostic.startTime <= 0
    )
      add('TEST_NOT_CLEAN_PASS', result.testId);
    if (isNil(result.meta)) {
      add('ATTEMPT_META_MISSING', result.testId);
      continue;
    }
    const journal = journals.get(result.testId);
    if (isNil(journal)) {
      add('JOURNAL_MISSING', result.testId);
      continue;
    }
    checkAttempt(result.meta, entry, journal, input.lease, add);
    if (before === issues.length && result.state === 'passed') counts.passed++;
  }
  for (const id of byId.keys()) if (!seen.has(id)) add('RESULT_MISSING', id);
  if (counts.tests !== expected.length || journals.size !== expected.length)
    add('COUNT_MISMATCH', 'report');
  return { issues, counts };
};
