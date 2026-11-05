import { ledgerSchema } from '../../../e2e/ledger/schema';
import { discoverySchema } from '../discoverySchema';
import { legacyKey } from '../legacy';
import { createVerificationPlan } from '../verificationPlan';
import { digestVerificationPlan } from '../verificationPlanDigest';
import {
  verificationReportSchema,
  verificationStageResultSchema,
} from '../verificationSchema';
import { fixture as environment } from './environment/ownership';

/** 2binding×2repeat、独立setup、明示legacy skipを持つ純checker fixture。実fixture成功の証明には使わない。 */
export const verificationFixture = () => {
  const ledger = ledgerSchema.parse({
    schemaVersion: 1,
    profiles: [
      {
        id: 'app',
        layer: 'browser',
        executions: [{ project: 'desktop', runtime: 'next-production' }],
      },
    ],
    fixtures: [{ id: 'schedule', actors: ['creator-only'] }],
    contracts: [],
    executionGroups: [],
    exceptions: [],
    scenarios: [
      {
        scenarioId: 'sample',
        title: 'sample',
        cases: [
          {
            caseId: 'business',
            title: 'business',
            status: 'implemented',
            layer: 'browser',
            fixture: 'schedule',
            roles: ['operator'],
            checks: [
              { target: 'page:sample', aspect: 'render', layer: 'browser' },
            ],
            executions: [
              {
                profile: 'app',
                project: 'desktop',
                runtime: 'next-production',
                variant: 'default',
                actorBindings: [{ role: 'operator', actor: 'creator-only' }],
              },
            ],
            testBindings: ['first', 'second'],
          },
        ],
      },
    ],
  });
  const tests = ['first', 'second'].flatMap((binding) =>
    [0, 1].map((repeatEachIndex) => ({
      testId: `${binding}-${repeatEachIndex}`,
      file: 'e2e/sample.spec.ts',
      line: 10,
      column: 3,
      titlePath: ['suite', binding],
      project: 'desktop',
      repeatEachIndex,
      tags: ['@case:business', '@variant:default', `@binding:${binding}`],
      expectedStatus: 'passed',
      annotations: [],
      isSetup: false,
    })),
  );
  const setup = {
    testId: 'authenticate',
    file: 'e2e/setup.spec.ts',
    line: 1,
    column: 1,
    titlePath: ['auth'],
    project: 'setup',
    repeatEachIndex: 0,
    tags: [],
    expectedStatus: 'passed',
    annotations: [],
    isSetup: true,
  };
  const extra = {
    testId: 'old-skip',
    file: 'e2e/old.spec.ts',
    line: 2,
    column: 1,
    titlePath: ['old'],
    project: 'desktop',
    repeatEachIndex: 0,
    tags: [],
    expectedStatus: 'skipped',
    annotations: [{ type: 'skip', description: '既存条件' }],
    isSetup: false,
  };
  const discovery = discoverySchema.parse({
    schemaVersion: 1,
    profile: 'app',
    errors: [],
    projects: [
      {
        name: 'desktop',
        testDir: 'e2e',
        dependencies: ['setup'],
        repeatEach: 2,
      },
      { name: 'setup', testDir: 'e2e', dependencies: [], repeatEach: 1 },
    ],
    tests: [...tests, setup, extra],
  });
  // repeatEach=2のprojectのlegacy行も全instanceを明示する。
  const firstExtra = discovery.tests.find(
    ({ testId }) => testId === 'old-skip',
  );
  if (firstExtra === undefined) throw new Error('fixture不足');
  discovery.tests.push({
    ...firstExtra,
    testId: 'old-skip-1',
    repeatEachIndex: 1,
  });
  const extras = discovery.tests
    .filter(({ testId }) => testId.startsWith('old-skip'))
    .map((test) => ({
      profile: 'app',
      runtime: 'next-production' as const,
      test,
      legacy: {
        key: legacyKey('app', test),
        fingerprint: 'a'.repeat(64),
        disposition: 'existing-skip' as const,
        reason: '既存条件',
        expectedAnnotation: { type: 'skip' as const, description: '既存条件' },
      },
    }));
  const plan = createVerificationPlan({
    ledger,
    discoveries: [discovery],
    allowedExtraTests: extras,
  });
  const context = {
    verificationId: '012345abcdef',
    stageId: 'app-desktop',
    selectionDigest: digestVerificationPlan(plan),
    inputDigest: 'c'.repeat(64),
  };
  const report = verificationReportSchema.parse({
    schemaVersion: 1,
    context,
    profile: 'app',
    runner: 'playwright',
    version: '1.57.0',
    status: 'passed',
    errorCount: 0,
    reporterErrorCount: 0,
    reporterCompleted: true,
    tests: [...plan.requirements, ...plan.allowedExtraTests].map(
      ({ test }) => ({
        testId: test.testId,
        file: test.file,
        titlePath: test.titlePath,
        line: test.line,
        column: test.column,
        project: test.project,
        repeatEachIndex: test.repeatEachIndex,
        expectedStatus: test.expectedStatus,
        annotations: test.annotations,
        outcome: test.expectedStatus === 'skipped' ? 'skipped' : 'expected',
        results: [
          {
            retry: 0,
            status: test.expectedStatus,
            errorCount: 0,
            annotations: test.annotations,
          },
        ],
      }),
    ),
  });
  const stage = verificationStageResultSchema.parse({
    context,
    requiredKeys: plan.requirements.map(({ key }) => key),
    extraKeys: plan.allowedExtraTests.map(({ key }) => key),
    report,
    exitCode: 0,
    signal: null,
    evidence: {
      kind: 'legacy',
      context,
      checkedKeys: [...plan.requirements, ...plan.allowedExtraTests].map(
        ({ key }) => key,
      ),
      result: {
        issues: [],
        counts: { total: 7, local: 5, existingSkip: 2 },
        resultsChecked: true,
      },
    },
    cleanup: {
      at: '2026-11-05T00:00:00Z',
      status: 'complete',
      remaining: { containers: [], networks: [], volumes: [] },
      issues: [],
    },
    processCleanup: { exited: true, errorCount: 0 },
  });
  return {
    ledger,
    discovery,
    plan,
    report,
    stage,
    input: {
      plan,
      verificationId: context.verificationId,
      selectionDigest: context.selectionDigest,
      inputDigestBefore: context.inputDigest,
      inputDigestAfter: context.inputDigest,
      stages: [stage],
    },
    lease: environment().lease,
  };
};
