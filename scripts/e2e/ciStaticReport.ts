import { isNil } from 'ramda';
import { z } from 'zod';

import { baselineSchema } from './baseline';
import { ciPartitionManifestSchema } from './ciPartitionSchema';
import { githubEventPolicySchema } from './githubEventSchema';
import { parseArtifact, readArtifact } from './ledgerArtifacts';
import { ARTIFACTS, baselineDigest } from './staticGate';
import { assertSurfaceReceipt, surfaceReceiptSchema } from './surfaceReceipt';
import { readRevisionFile } from './trustedRevision';

import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import type { InputFingerprint } from './fingerprint';
import type { GithubEventPolicy } from './githubEventSchema';

const staticBindingSchema = ciPartitionManifestSchema.pick({
  workflow: true,
  snapshotDigest: true,
  inputsDigest: true,
});

const reportSchema = z.object({
  ...staticBindingSchema.shape,
  ...surfaceReceiptSchema.shape,
  status: z.literal('passed'),
  mode: z.literal('ci'),
  base: z.string(),
  head: z.string(),
  eventPolicy: githubEventPolicySchema,
  issues: z.array(z.unknown()).length(0),
  isBootstrap: z.boolean(),
  historicalComparison: z
    .enum(['unavailable', 'baseline-not-introduced'])
    .optional(),
  baselineDigest: z.string().regex(/^[a-f0-9]{64}$/),
});

type CiStaticReportOptions = {
  bootstrapApproval?: string | undefined;
  inputs?: InputFingerprint;
};

/** 静的ゲート成果物の欠落・古いイベント・別baselineも集約で拒否する。 */
export const assertCiStaticReport = (
  root: string,
  raw: unknown,
  policy: GithubEventPolicy,
  binding: CiStaticBinding,
  options: CiStaticReportOptions = {},
) => {
  const report = reportSchema.parse(raw);
  if (
    !isDeepStrictEqual(report.workflow, binding.workflow) ||
    report.snapshotDigest !== binding.snapshotDigest ||
    report.inputsDigest !== binding.inputsDigest ||
    (!isNil(options.inputs) && options.inputs.digest !== binding.inputsDigest)
  )
    throw new Error(
      'CI静的検査のworkflow attemptまたは固定入力が一致しません。',
    );
  const baseline = baselineSchema.parse(
    parseArtifact(readArtifact(root, ARTIFACTS.baseline), ARTIFACTS.baseline),
  );
  const base =
    policy.staticBase.kind === 'push-bootstrap'
      ? policy.head
      : policy.staticBase.sha;
  const missingBase = isNil(readRevisionFile(root, base, ARTIFACTS.baseline));
  const isPushBootstrap = policy.staticBase.kind === 'push-bootstrap';
  const isBootstrap = isPushBootstrap || missingBase;
  const historicalComparison = isPushBootstrap
    ? 'unavailable'
    : policy.event === 'push' && missingBase
      ? 'baseline-not-introduced'
      : undefined;
  if (
    !isDeepStrictEqual(report.eventPolicy, policy) ||
    report.head !== policy.head ||
    report.base !== base ||
    report.baselineDigest !== baselineDigest(baseline) ||
    report.isBootstrap !== isBootstrap ||
    report.historicalComparison !== historicalComparison ||
    (policy.staticBase.kind !== 'comparison' && missingBase)
  )
    throw new Error(
      'CI静的検査の由来が現在のイベント・baselineと一致しません。',
    );
  assertSurfaceReceipt({
    root,
    policy,
    report,
    artifacts: ARTIFACTS,
    ...options,
  });
  return report;
};

/** 検証済みの履歴証拠を現在のイベント・run・固定入力に結び付ける。 */
export const digestCiSurfaceHistory = (
  report: ReturnType<typeof assertCiStaticReport>,
) =>
  isNil(report.surfaceMigrationHistory)
    ? undefined
    : createHash('sha256')
        .update(
          JSON.stringify({
            history: report.surfaceMigrationHistory,
            workflow: report.workflow,
            eventPolicy: report.eventPolicy,
            base: report.base,
            head: report.head,
            baselineDigest: report.baselineDigest,
            snapshotDigest: report.snapshotDigest,
            inputsDigest: report.inputsDigest,
          }),
        )
        .digest('hex');

type CiStaticBinding = z.infer<typeof staticBindingSchema>;
export type { CiStaticBinding, CiStaticReportOptions };
