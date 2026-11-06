import { fixtureOwnerTag } from '../../../../e2e/fixtures/fixtureManifest';
import { fixtureManifestSchema } from '../../../../e2e/fixtures/fixtureSchema';
import {
  integrationExpectationSchema,
  integrationReportSchema,
} from '../../integrationSchema';
import { fixture as environment } from '../environment/ownership';

/** 本文や資格情報を含まない20登録のadapter用結果fixture。 */
export const integrationResultFixture = () => {
  const lease = environment().lease;
  const variants = [
    ['schedule-action-deny', 'anonymous'],
    ['schedule-action-deny', 'outsider'],
    ['schedule-action-deny', 'phase-recruiting'],
    ...['empty', 'reversed', 'off-grid', 'overlap'].map((variant) => [
      'schedule-action-invalid',
      variant,
    ]),
    ['schedule-action-allow', 'creator-only'],
    ['schedule-action-allow', 'keeper-only'],
    ['schedule-rpc-allow', 'creator-only'],
    ['schedule-rpc-allow', 'keeper-only'],
    ['schedule-rpc-deny', 'anonymous'],
    ['schedule-rpc-deny', 'outsider'],
    ['schedule-rpc-deny', 'actor-mismatch'],
    ['schedule-rpc-atomic', 'creator-atomic-failure'],
    ['schedule-rpc-atomic', 'keeper-atomic-failure'],
    ['schedule-calendar-missing-user', 'creator-only'],
    ['schedule-calendar-user-sessions', 'creator-only'],
    ['schedule-calendar-summary', 'creator-only'],
    ['schedule-calendar-unconfirmed', 'creator-only'],
  ];
  const entries = variants.map(([caseId, variant], index) => {
    const claim = { caseId, variant, binding: 'main' };
    const id = `task-${index}`;
    const isCalendar = caseId?.startsWith('schedule-calendar') ?? false;
    const file = isCalendar
      ? 'src/calendar.integration.test.ts'
      : caseId?.startsWith('schedule-action')
        ? 'src/actions.integration.test.ts'
        : 'src/rpc.integration.test.ts';
    const options = {
      mode: 'run',
      fails: false,
      concurrent: false,
      retry: 0,
      repeats: 0,
    };
    const operator =
      variant === 'anonymous'
        ? 'anonymous'
        : variant === 'outsider'
          ? 'outsider'
          : variant?.startsWith('keeper') || variant === 'actor-mismatch'
            ? 'keeper-only'
            : 'creator-only';
    const actorBindings = [
      { role: 'operator', actor: operator },
      ...(caseId === 'schedule-rpc-deny'
        ? [
            {
              role: 'claimed-actor',
              actor: variant === 'outsider' ? 'outsider' : 'creator-only',
            },
          ]
        : []),
    ];
    const target = isCalendar
      ? 'function:src/app/(main)/sessions/adapter.ts#getCalendarSessions'
      : file.includes('/actions')
        ? 'action:src/actions.ts#confirm'
        : 'rpc:replace_confirmed_schedule_time_blocks';
    const aspects = isCalendar
      ? ['response']
      : caseId === 'schedule-rpc-allow'
        ? ['persist', 'authorization']
        : caseId?.endsWith('atomic')
          ? ['atomicity']
          : caseId?.endsWith('invalid')
            ? ['validation']
            : ['authorization'];
    const checks = aspects.map((aspect) => ({
      target,
      aspect,
      layer: 'integration',
    }));
    const expected = integrationExpectationSchema.parse({
      test: {
        testId: id,
        file,
        line: index + 1,
        column: 1,
        titlePath: ['suite', `${caseId}/${variant}`],
        project: 'integration',
        repeatEachIndex: 0,
        tags: [`@case:${caseId}`, `@variant:${variant}`, '@binding:main'],
        expectedStatus: 'passed',
        annotations: [],
        isSetup: false,
      },
      claim,
      options,
      checks,
      actorBindings,
      fixture: 'schedule',
    });
    const actors = [
      'creator-only',
      'keeper-only',
      'confirmed-player',
      'outsider',
    ].map((kind, actor) => ({
      kind,
      appUserId: `01J${String(index * 4 + actor + 1).padStart(23, '0')}`,
      authUserId: `00000000-0000-4000-8000-${String(index * 4 + actor + 1).padStart(12, '0')}`,
    }));
    const identity = (kind: string) =>
      kind === 'anonymous'
        ? { kind: 'anonymous' }
        : actors.find((actor) => actor.kind === kind);
    const creator = actors[0]?.appUserId;
    const sessionId = `01K${String(index + 1).padStart(23, '0')}`;
    const owner = {
      lease,
      project: 'integration',
      workerIndex: 0,
      retry: 0,
      caseId: id,
    };
    const ownerTag = fixtureOwnerTag(owner);
    const journal = fixtureManifestSchema.parse({
      schemaVersion: 1,
      owner,
      ownerTag,
      resources: [
        ...actors.flatMap((actor) => [
          {
            resource: { kind: 'auth-user', id: actor.authUserId },
            status: 'removed',
          },
          {
            resource: {
              kind: 'users',
              id: actor.appUserId,
              authUserId: actor.authUserId,
            },
            status: 'removed',
          },
        ]),
        {
          resource: {
            kind: 'scenarios',
            id: `01M${String(index + 1).padStart(23, '0')}`,
            createdBy: creator,
          },
          status: 'removed',
        },
        {
          resource: {
            kind: 'game_sessions',
            id: sessionId,
            createdBy: creator,
          },
          status: 'removed',
        },
        ...actors.slice(0, 3).map((actor) => ({
          resource: {
            kind: 'session_participants',
            sessionId,
            userId: actor.appUserId,
          },
          status: 'removed',
        })),
      ],
      cleanup: { status: 'complete', remaining: [], issues: [] },
    });
    const result = {
      testId: id,
      file,
      line: expected.test.line,
      column: 1,
      titlePath: expected.test.titlePath,
      fullName: expected.test.titlePath.join(' > '),
      claim,
      options,
      state: 'passed',
      errorCount: 0,
      diagnostic: {
        retryCount: 0,
        repeatCount: 0,
        flaky: false,
        startTime: 123456,
        duration: 1,
      },
      meta: {
        claim,
        runId: lease.runId,
        lease,
        owner,
        ownerTag,
        journalPath: `test-results/environments/run-${lease.runId}/fixtures/${ownerTag}/manifest.json`,
        actors: [...actors, { kind: 'anonymous' }],
        actorBindings: actorBindings.map(({ role, actor }) => ({
          role,
          actor: identity(actor),
        })),
        clientKind: operator === 'anonymous' ? 'anonymous' : 'user-jwt',
        identityVerified: true,
        completedChecks: checks,
        preflight: 'passed',
        bodyCompleted: true,
        cleanup: 'complete',
        assertionCalls: 12,
        bodyAssertionCalls: 8,
      },
    };
    return { expected, journal, result };
  });
  const report = integrationReportSchema.parse({
    schemaVersion: 1,
    runner: {
      name: 'vitest',
      version: '3.2.4',
      project: 'integration',
      pool: 'forks',
      fileParallelism: false,
      maxWorkers: 1,
      includeTaskLocation: true,
    },
    config: 'vitest.integration.verified.config.ts',
    runId: lease.runId,
    reason: 'passed',
    unhandledErrorCount: 0,
    reporterErrorCount: 0,
    tests: entries.map(({ result }) => result),
    modules: [
      ...new Set(entries.map(({ expected }) => expected.test.file)),
    ].map((file) => ({
      file,
      project: 'integration',
      state: 'passed',
      errorCount: 0,
      suiteErrorCount: 0,
    })),
  });
  return {
    expected: entries.map(({ expected }) => expected),
    report,
    journals: entries.map(({ journal }) => journal),
    lease,
  };
};
