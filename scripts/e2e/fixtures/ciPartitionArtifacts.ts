import {
  createCiPartitionManifest,
  digestCiPartitionManifest,
} from '../ciPartition';
import {
  type CiPartitionManifest,
  type CiShardId,
  ciShardEnvelopeSchema,
} from '../ciPartitionSchema';
import { inputFingerprintSchema } from '../fingerprint';
import { legacyKey } from '../legacy';
import { digestVerificationPlan } from '../verificationPlanDigest';
import { verificationReceiptSchema } from '../verificationReceiptSchema';
import {
  type VerificationPlan,
  verificationReportSchema,
  verificationStageResultSchema,
} from '../verificationSchema';
import { verifyResults } from '../verifyResults';
import { ciPartitionFixture, fixtureInputDigest } from './ciPartition';

import type { LegacyExecution } from '../legacyExecutionSchema';

const shardArtifacts = (
  id: CiShardId,
  manifest: CiPartitionManifest,
  plan: VerificationPlan,
  execution: LegacyExecution,
  legacy: ReturnType<typeof ciPartitionFixture>['legacy'],
) => {
  const verificationId = {
    required: '111111111111',
    'legacy-desktop': '222222222222',
    'legacy-mobile': '444444444444',
  }[id];
  const byKey = new Map(execution.entries.map((entry) => [entry.key, entry]));
  const selectionDigest = digestVerificationPlan(plan);
  const rows = [...plan.requirements, ...plan.allowedExtraTests];
  const stageIds = new Set(
    rows.map(({ profile, test }) =>
      profile === 'app' ? `app-${test.project}` : profile,
    ),
  );
  const stages = [...stageIds].map((stageId) => {
    const matches = ({ profile, test }: (typeof rows)[number]) =>
      (profile === 'app' ? `app-${test.project}` : profile) === stageId;
    const requiredKeys = plan.requirements
      .filter(matches)
      .map(({ key }) => key);
    const extraKeys = plan.allowedExtraTests
      .filter(matches)
      .map(({ key }) => key);
    const context = {
      verificationId,
      stageId,
      selectionDigest,
      inputDigest: fixtureInputDigest,
    };
    const kind = stageId.startsWith('app-') ? 'legacy' : 'storybook';
    const report = verificationReportSchema.parse({
      schemaVersion: 1,
      context,
      profile: kind === 'legacy' ? 'app' : 'storybook',
      runner: 'playwright',
      version: '1.57.0',
      status: 'passed',
      errorCount: 0,
      reporterErrorCount: 0,
      reporterCompleted: true,
      tests: rows.filter(matches).map(({ test }) => ({
        testId: test.testId,
        file: test.file,
        titlePath: test.titlePath,
        line: test.line,
        column: test.column,
        project: test.project,
        repeatEachIndex: test.repeatEachIndex,
        expectedStatus: test.expectedStatus,
        annotations: test.annotations,
        outcome: 'expected',
        results: [
          { retry: 0, status: 'passed', errorCount: 0, annotations: [] },
        ],
      })),
    });
    const total = requiredKeys.length + extraKeys.length;
    return verificationStageResultSchema.parse({
      context,
      requiredKeys,
      extraKeys,
      report,
      exitCode: 0,
      signal: null,
      evidence: {
        kind,
        context,
        checkedKeys: [...requiredKeys, ...extraKeys],
        result:
          kind === 'legacy'
            ? { issues: [], counts: { total }, resultsChecked: true }
            : {
                issues: [],
                counts: { expected: total, tests: total, passed: total },
              },
      },
      ...(kind === 'legacy'
        ? {
            legacyResults: rows.filter(matches).map(({ test }) => {
              const key = legacyKey('app', test);
              const disposition = byKey.get(key);
              if (!disposition)
                throw new Error('実行fixtureの正本がありません。');
              return {
                key,
                fingerprint:
                  disposition.disposition === 'replacement'
                    ? legacy.registered.find((entry) => entry.key === key)
                        ?.fingerprint
                    : disposition.fingerprint,
                ...(disposition.disposition === 'replacement'
                  ? { originFingerprint: disposition.fingerprint }
                  : {}),
                status: test.expectedStatus,
                expectedStatus: test.expectedStatus,
                annotations:
                  'expectedAnnotation' in disposition
                    ? [disposition.expectedAnnotation]
                    : [],
              };
            }),
          }
        : {}),
      cleanup:
        kind === 'legacy'
          ? {
              at: '2026-11-05T00:00:00Z',
              status: 'complete',
              remaining: { containers: [], networks: [], volumes: [] },
              issues: [],
            }
          : null,
      processCleanup: { exited: true, errorCount: 0 },
    });
  });
  const inputsStart = inputFingerprintSchema.parse({
    schemaVersion: 1,
    algorithm: 'sha256',
    root: `fixture-${id}`,
    rules: 'fixed-input-scope-v1-next16-template-v1',
    files: [],
    digest: fixtureInputDigest,
  });
  const verification = verifyResults({
    plan,
    verificationId,
    selectionDigest,
    stages,
    inputDigestBefore: fixtureInputDigest,
    inputDigestAfter: fixtureInputDigest,
  });
  if (verification.issues.length > 0)
    throw new Error('CI artifact fixtureの結果が不正です。');
  const receipt = verificationReceiptSchema.parse({
    schemaVersion: 1,
    verificationId,
    mode: 'partial',
    status: 'passed',
    phase: 'complete',
    selection: {
      snapshotDigest: manifest.snapshotDigest,
      fullPlanDigest: manifest.fullPlanDigest,
      decisionDigest: manifest.decisionDigest,
    },
    selectionDigest,
    inputDigestBefore: fixtureInputDigest,
    inputDigestAfter: fixtureInputDigest,
    checkpoints: [
      'before-stages',
      ...stages.flatMap(({ context, evidence }) =>
        [
          ...(evidence.kind === 'storybook' ? [] : ['before-environment']),
          'before-tests',
          'after-tests',
          'after-cleanup',
        ].map((phase) => `${context.stageId}:${phase}`),
      ),
    ].map((phase) => ({
      phase,
      digest: fixtureInputDigest,
      changes: { added: [], removed: [], changed: [] },
    })),
    execution: {
      stages,
      runs: stages.map(({ context, evidence }, index) => ({
        stageId: context.stageId,
        status: 'passed',
        runId:
          evidence.kind === 'legacy'
            ? `${id === 'legacy-desktop' ? '33333333333' : '55555555555'}${index}`
            : null,
      })),
    },
    verification,
    failure: null,
    legacyLocalRequested: id !== 'required',
    integrationLegacyExecuted: false,
  });
  const envelope = ciShardEnvelopeSchema.parse({
    schemaVersion: 2,
    shard: id,
    workflow: manifest.workflow,
    verificationId,
    manifestDigest: digestCiPartitionManifest(manifest),
    fullCollectionDigest: manifest.fullCollectionDigest,
    fullPlanDigest: manifest.fullPlanDigest,
  });
  return {
    envelope,
    verification: {
      plan,
      receipt,
      inputsStart,
      inputsEnd: structuredClone(inputsStart),
    },
  };
};

export const ciPartitionArtifactsFixture = () => {
  const input = ciPartitionFixture();
  const { manifest, plans } = createCiPartitionManifest(input);
  return {
    ...input,
    manifest,
    jobResults: {
      planner: 'success',
      required: 'success',
      'legacy-desktop': 'success',
      'legacy-mobile': 'success',
    },
    shards: {
      required: shardArtifacts(
        'required',
        manifest,
        plans.required,
        input.execution,
        input.legacy,
      ),
      'legacy-desktop': shardArtifacts(
        'legacy-desktop',
        manifest,
        plans['legacy-desktop'],
        input.execution,
        input.legacy,
      ),
      'legacy-mobile': shardArtifacts(
        'legacy-mobile',
        manifest,
        plans['legacy-mobile'],
        input.execution,
        input.legacy,
      ),
    },
  };
};
