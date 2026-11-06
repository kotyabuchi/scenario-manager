import { fixtureOwnerTag } from '../../../e2e/fixtures/fixtureManifest';
import { fixtureManifestSchema } from '../../../e2e/fixtures/fixtureSchema';
import { ledgerSchema } from '../../../e2e/ledger/schema';
import { discoverySchema } from '../discoverySchema';
import { createScheduleExpectations } from '../scheduleCheckExpectations';
import { fixture as environment } from './environment/ownership';

const at = <T>(values: T[], index: number): T => {
  const value = values[index];
  if (value === undefined) throw new Error('fixture不足');
  return value;
};
const attachment = (name: string, value: unknown) => ({
  name,
  contentType: 'application/json',
  body: Buffer.from(JSON.stringify(value)).toString('base64'),
});
export const scheduleEvidenceFixture = () => {
  const projects = ['chromium', 'mobile-chrome'];
  const variants = ['creator-only', 'keeper-only', 'applicant'];
  const isApplication = (variant: string) => variant === 'applicant';
  const caseId = (variant: string) =>
    isApplication(variant)
      ? 'session-application-round-trip'
      : 'schedule-confirm-persist';
  const executions = variants.flatMap((variant) =>
    projects.map((project) => ({
      profile: 'isolated',
      project,
      runtime: 'next-production',
      variant,
      actorBindings: [
        { role: 'operator', actor: variant },
        {
          role: 'observer',
          actor: isApplication(variant) ? 'creator-only' : 'confirmed-player',
        },
      ],
    })),
  );
  const ledger = ledgerSchema.parse({
    schemaVersion: 1,
    profiles: [],
    fixtures: [],
    contracts: [],
    executionGroups: [],
    exceptions: [],
    scenarios: [
      {
        scenarioId: 'schedule',
        title: '日程',
        cases: [
          {
            caseId: 'schedule-confirm-persist',
            title: '保存',
            status: 'implemented',
            layer: 'browser',
            fixture: 'schedule',
            roles: ['operator', 'observer'],
            checks: [
              { target: 'page:sample', aspect: 'persist', layer: 'browser' },
            ],
            executions: executions.filter(
              ({ variant }) => !isApplication(variant),
            ),
            testBindings: ['main'],
          },
        ],
      },
      {
        scenarioId: 'session-application',
        title: '参加申請',
        cases: [
          {
            caseId: caseId('applicant'),
            title: '申請と取り消し',
            status: 'implemented',
            layer: 'browser',
            fixture: 'session-application',
            roles: ['operator', 'observer'],
            checks: [
              {
                target:
                  'action:src/app/(main)/sessions/[id]/actions.ts#applyToSessionAction',
                aspect: 'persist',
                layer: 'browser',
              },
              {
                target:
                  'action:src/app/(main)/sessions/[id]/actions.ts#cancelApplicationAction',
                aspect: 'persist',
                layer: 'browser',
              },
            ],
            executions: executions.filter(({ variant }) =>
              isApplication(variant),
            ),
            testBindings: ['main'],
          },
        ],
      },
    ],
  });
  const discovery = discoverySchema.parse({
    schemaVersion: 1,
    profile: 'isolated',
    errors: [],
    projects: projects.map((name) => ({
      name,
      testDir: 'e2e/isolated',
      dependencies: [],
      repeatEach: 1,
    })),
    tests: executions.map((execution, index) => ({
      testId: `test-${index}`,
      file: isApplication(execution.variant)
        ? 'e2e/isolated/session-application.spec.ts'
        : 'e2e/isolated/schedule.spec.ts',
      line: execution.variant === 'creator-only' ? 10 : 20,
      column: 3,
      titlePath: isApplication(execution.variant)
        ? [execution.variant]
        : ['日程', execution.variant],
      project: execution.project,
      repeatEachIndex: 0,
      tags: [
        `@case:${caseId(execution.variant)}`,
        `@variant:${execution.variant}`,
        '@binding:main',
      ],
      expectedStatus: 'passed',
      annotations: [],
      isSetup: false,
    })),
  });
  const expected = createScheduleExpectations(ledger, discovery);
  const lease = environment().lease;
  const data = expected.map((entry, index) => {
    const actors = [
      'creator-only',
      entry.fixture === 'session-application' ? 'applicant' : 'keeper-only',
      'confirmed-player',
      'outsider',
    ].map((kind, actor) => ({
      kind,
      authUserId: `00000000-0000-4000-8000-${String(index * 4 + actor + 1).padStart(12, '0')}`,
      appUserId: `01J${String(index * 4 + actor + 1).padStart(23, '0')}`,
    }));
    const owner = {
      lease,
      project: entry.test.project,
      workerIndex: index,
      retry: 0,
      caseId: entry.test.testId,
    };
    const sessionId = `01K${String(index + 1).padStart(23, '0')}`;
    const journal = fixtureManifestSchema.parse({
      schemaVersion: 1,
      owner,
      ownerTag: fixtureOwnerTag(owner),
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
            kind: 'game_sessions',
            id: sessionId,
            createdBy: at(actors, 0).appUserId,
          },
          status: 'removed',
        },
        ...(entry.fixture === 'session-application'
          ? [
              {
                resource: {
                  kind: 'scenarios',
                  id: `01M${String(index + 1).padStart(23, '0')}`,
                  createdBy: at(actors, 0).appUserId,
                },
                status: 'removed',
              },
              ...[0, 1, 2].map((position) => ({
                resource: {
                  kind: 'session_participants',
                  sessionId,
                  userId: at(actors, position).appUserId,
                },
                status: 'removed',
              })),
            ]
          : []),
      ],
      cleanup: { status: 'complete', remaining: [], issues: [] },
    });
    const result = {
      projectName: entry.test.project,
      projectId: entry.test.project,
      expectedStatus: 'passed',
      status: 'expected',
      annotations: [] as { type: string }[],
      results: [
        {
          status: 'passed',
          workerIndex: index,
          parallelIndex: index % 2,
          retry: 0,
          errors: [] as unknown[],
          annotations: [] as { type: string }[],
          attachments: [
            attachment('fixture-actors', {
              owner,
              actors: [...actors, { kind: 'anonymous' }],
            }),
            attachment('fixture-cleanup', { owner, result: journal.cleanup }),
            attachment(
              'fixture-used-actor',
              actors.find(({ kind }) => kind === entry.operator),
            ),
            attachment(
              'fixture-used-actor',
              actors.find(({ kind }) => kind === entry.observer),
            ),
          ],
        },
      ],
    };
    return { entry, journal, result, actors };
  });
  const specs = variants.map((variant) => {
    const entries = data.filter(({ entry }) => entry.variant === variant);
    const first = at(entries, 0).entry.test;
    return {
      id: first.testId,
      title: variant,
      file: isApplication(variant)
        ? 'session-application.spec.ts'
        : 'schedule.spec.ts',
      line: first.line,
      column: first.column,
      tags: [`case:${caseId(variant)}`, `variant:${variant}`, 'binding:main'],
      ok: true,
      tests: entries.map(({ result }) => result),
    };
  });
  const report = {
    config: {
      version: '1.57.0',
      projects: projects.map((name) => ({
        name,
        id: name,
        retries: 0,
        repeatEach: 1,
      })),
    },
    suites: [
      {
        title: 'schedule.spec.ts',
        file: 'schedule.spec.ts',
        specs: [],
        suites: [
          { title: '日程', file: 'schedule.spec.ts', specs: specs.slice(0, 2) },
        ],
      },
      {
        title: 'session-application.spec.ts',
        file: 'session-application.spec.ts',
        specs: specs.slice(2),
        suites: [],
      },
    ],
    errors: [] as unknown[],
    stats: { expected: expected.length, unexpected: 0, flaky: 0, skipped: 0 },
  };
  const input = {
    expected,
    report,
    journals: data.map(({ journal }) => journal),
    lease,
  };
  return { input, data, specs, ledger, discovery };
};
