import { isNil } from 'ramda';

import { ledgerSchema } from '../../../e2e/ledger/schema';
import { BOOTSTRAP_SMOKE_REVISION } from '../ciBootstrap';
import { githubEventPolicySchema } from '../githubEventSchema';
import { legacyKey, legacyManifestSchema } from '../legacy';
import { selectionDecisionSchema, selectionReason } from '../selectionSchema';
import { verificationTestKey } from '../verificationPlan';
import { digestVerificationPlan } from '../verificationPlanDigest';
import { verificationFixture } from './verification';

import { createHash } from 'node:crypto';

import type {
  VerificationExtraTest,
  VerificationPlan,
  VerificationRequirement,
} from '../verificationSchema';

export const fixtureInputDigest = createHash('sha256')
  .update('[]')
  .digest('hex');

const bootstrapTitles = [
  ['スモークテスト', 'ランディングページが表示される'],
  ['スモークテスト', 'サービスについてのページに権利表記を表示する'],
  ['スモークテスト', 'シナリオ一覧ページが表示される'],
  ['アクセシビリティ', 'ランディングページにa11y違反がない'],
  ['アクセシビリティ', 'シナリオ一覧ページにa11y違反がない'],
  ['アクセシビリティ', 'セッション一覧ページにa11y違反がない'],
  ['アクセシビリティ', 'シナリオ詳細ページにa11y違反がない'],
];

export const ciPartitionFixture = (isBootstrap = false) => {
  const existing = verificationFixture();
  const template = existing.plan.requirements.find(
    ({ kind }) => kind === 'business',
  );
  const item = existing.ledger.scenarios[0]?.cases[0];
  if (isNil(template) || isNil(template.execution) || isNil(item))
    throw new Error('fixture不足');
  const appExecution = { ...template.execution, project: 'chromium' };
  const storyExecution = {
    profile: 'storybook',
    project: '',
    runtime: 'storybook' as const,
    variant: 'mobile',
    actorBindings: [],
  };
  const isolatedExecution = {
    ...appExecution,
    profile: 'isolated',
  };
  const storyCaseId = 'scenario-search-reset';
  const isolatedCaseId = 'isolated-business';
  const row = (
    caseId: string,
    file: string,
    execution: NonNullable<VerificationRequirement['execution']>,
    layer: 'browser' | 'storybook',
  ): VerificationRequirement => {
    const test = {
      ...template.test,
      testId: caseId,
      file,
      titlePath: [caseId],
      project: execution.project,
      repeatEachIndex: 0,
      tags: [
        `@case:${caseId}`,
        `@variant:${execution.variant}`,
        '@binding:main',
      ],
    };
    return {
      ...template,
      test,
      execution,
      key: verificationTestKey(execution.profile, test),
      runtime: execution.runtime,
      profile: execution.profile,
      claim: { caseId, variant: execution.variant, binding: 'main' },
      checks: template.checks.map((check) => ({ ...check, layer })),
      dependencies: [],
    };
  };
  const appRow = row(item.caseId, 'e2e/app.spec.ts', appExecution, 'browser');
  const storyRow = row(
    storyCaseId,
    '.storybook/tests/smoke.spec.ts',
    storyExecution,
    'storybook',
  );
  const isolatedRow = row(
    isolatedCaseId,
    'e2e/isolated/fixture.spec.ts',
    isolatedExecution,
    'browser',
  );
  const ledger = ledgerSchema.parse({
    ...existing.ledger,
    profiles: [
      { id: 'app', layer: 'browser', executions: [appExecution] },
      { id: 'storybook', layer: 'storybook', executions: [storyExecution] },
      { id: 'isolated', layer: 'browser', executions: [isolatedExecution] },
    ].map(({ executions, ...profile }) => ({
      ...profile,
      executions: executions.map(({ project, runtime }) => ({
        project,
        runtime,
      })),
    })),
    scenarios: [
      {
        scenarioId: 'ci-fixture',
        title: 'CI',
        cases: [
          {
            ...item,
            checks: appRow.checks,
            executions: [appExecution],
            testBindings: ['main'],
          },
          {
            ...item,
            caseId: storyCaseId,
            layer: 'storybook',
            roles: [],
            checks: storyRow.checks,
            executions: [storyExecution],
            testBindings: ['main'],
          },
          {
            ...item,
            caseId: isolatedCaseId,
            checks: isolatedRow.checks,
            executions: [isolatedExecution],
            testBindings: ['main'],
          },
        ],
      },
    ],
  });
  const extras: VerificationExtraTest[] = ['chromium', 'mobile-chrome'].flatMap(
    (project) =>
      Array.from({ length: 7 }, (_, index) => {
        const test = {
          ...appRow.test,
          file: 'e2e/smoke.spec.ts',
          titlePath: isBootstrap
            ? [...(bootstrapTitles[index] ?? [])]
            : [`smoke-${index}`],
          testId: `${project}-smoke-${index}`,
          project,
          tags: [],
        };
        return {
          key: verificationTestKey('app', test),
          profile: 'app',
          runtime: 'next-production',
          test,
          legacy: {
            key: legacyKey('app', test),
            disposition: 'local',
            fingerprint: 'a'.repeat(64),
          },
        };
      }),
  );
  const legacy = legacyManifestSchema.parse({
    schemaVersion: 1,
    tests: extras.map(({ test, profile, legacy }) => ({
      profile,
      key: legacy.key,
      fingerprint: legacy.fingerprint,
      serialGroup: null,
      file: test.file,
      titlePath: test.titlePath,
      project: test.project,
      repeatEachIndex: test.repeatEachIndex,
      expectedStatus: test.expectedStatus,
      annotations: test.annotations,
    })),
    registered: [
      {
        profile: 'app',
        key: legacyKey('app', appRow.test),
        fingerprint: 'b'.repeat(64),
        serialGroup: null,
        file: appRow.test.file,
        titlePath: appRow.test.titlePath,
        project: appRow.test.project,
        repeatEachIndex: appRow.test.repeatEachIndex,
        expectedStatus: appRow.test.expectedStatus,
        annotations: appRow.test.annotations,
        caseId: item.caseId,
        variant: appExecution.variant,
        binding: 'main',
      },
    ],
    setups: [],
    groups: [],
  });
  const fullPlan: VerificationPlan = {
    schemaVersion: 1,
    requirements: [appRow, storyRow, isolatedRow],
    allowedExtraTests: extras,
  };
  const staticBaseSha = 'a'.repeat(40);
  const eventPolicy = githubEventPolicySchema.parse({
    schemaVersion: 1,
    repository: 'example/repo',
    head: 'b'.repeat(40),
    event: 'pull_request',
    eventRef: 'refs/pull/42/merge',
    staticBase: { kind: 'comparison', sha: staticBaseSha },
    impactBase: 'c'.repeat(40),
    execution: 'changed-plus-smoke',
  });
  const snapshotDigest = 'c'.repeat(64);
  const changeDecision = selectionDecisionSchema.parse({
    schemaVersion: 1,
    mode: 'docs-only',
    snapshotDigest,
    base: eventPolicy.impactBase,
    head: eventPolicy.head,
    rulesDigest: 'd'.repeat(64),
    graphDigest: 'e'.repeat(64),
    fullPlanDigest: digestVerificationPlan(fullPlan),
    caseIds: [],
    targetIds: [],
    requestedRequiredKeys: [],
    reasons: [
      selectionReason('DOCS_ALLOWLIST', {
        changedPaths: ['README.md'],
        ruleIds: ['readme'],
      }),
    ],
    coverageGaps: [],
    coverageStatus: 'no-known-gaps',
    legacyPolicy: 'omit',
  });
  return {
    workflow: { runId: '111', attempt: 1 },
    eventPolicy,
    snapshotDigest,
    inputsDigest: fixtureInputDigest,
    fullCollectionDigest: 'f'.repeat(64),
    fullPlan,
    changeDecision,
    ledger,
    legacy,
    smokeReference: {
      kind: isBootstrap
        ? ('approved-bootstrap-origin' as const)
        : ('static-base' as const),
      revision: isBootstrap ? BOOTSTRAP_SMOKE_REVISION : staticBaseSha,
      isBootstrap,
      legacy: structuredClone(legacy),
    },
    appRow,
    storyRow,
    isolatedRow,
  };
};
