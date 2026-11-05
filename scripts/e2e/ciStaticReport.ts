import { isNil } from 'ramda';
import { z } from 'zod';

import { baselineSchema } from './baseline';
import { ciPartitionManifestSchema } from './ciPartitionSchema';
import { githubEventPolicySchema } from './githubEventSchema';
import { parseArtifact, readArtifact } from './ledgerArtifacts';
import { ARTIFACTS, baselineDigest } from './staticGate';
import { readRevisionFile } from './trustedRevision';

import { isDeepStrictEqual } from 'node:util';

import type { GithubEventPolicy } from './githubEventSchema';

const staticBindingSchema = ciPartitionManifestSchema.pick({
  workflow: true,
  snapshotDigest: true,
  inputsDigest: true,
});

const reportSchema = z.object({
  ...staticBindingSchema.shape,
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

/** 静的ゲート成果物の欠落・古いイベント・別baselineも集約で拒否する。 */
export const assertCiStaticReport = (
  root: string,
  raw: unknown,
  policy: GithubEventPolicy,
  binding: CiStaticBinding,
) => {
  const report = reportSchema.parse(raw);
  if (
    !isDeepStrictEqual(report.workflow, binding.workflow) ||
    report.snapshotDigest !== binding.snapshotDigest ||
    report.inputsDigest !== binding.inputsDigest
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
  return report;
};

type CiStaticBinding = z.infer<typeof staticBindingSchema>;
export type { CiStaticBinding };
