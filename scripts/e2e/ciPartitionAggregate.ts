import { isNil } from 'ramda';

import {
  digestCiPartitionManifest,
  validateCiPartitionManifest,
} from './ciPartition';
import {
  type CiShardId,
  type CiWorkflow,
  ciShardIdSchema,
  ciWorkflowSchema,
} from './ciPartitionSchema';
import { validateCiShardArtifacts } from './ciShardArtifacts';
import {
  type GithubEventPolicy,
  githubEventPolicySchema,
} from './githubEventSchema';
import { validateLegacyExecution } from './legacyExecution';

import { isDeepStrictEqual } from 'node:util';

import type { Ledger } from '../../e2e/ledger/schema';
import type { CiSmokeReference } from './ciBootstrap';
import type { LegacyManifest } from './legacy';
import type {
  LegacyExecution,
  LegacyExecutionResult,
} from './legacyExecutionSchema';

type ShardArtifacts = {
  envelope: unknown;
  verification: Parameters<typeof validateCiShardArtifacts>[0]['verification'];
};

/** 独立した各runの証拠を保存planに再照合し、全体の分割契約を検証する。 */
export const aggregateCiPartition = (input: {
  manifest: unknown;
  workflow: CiWorkflow;
  eventPolicy: GithubEventPolicy;
  jobResults: Record<'planner' | CiShardId, string>;
  ledger: Ledger;
  legacy: LegacyManifest;
  execution: LegacyExecution;
  smokeReference?: CiSmokeReference;
  surfaceMigrationHistoryDigest?: string;
  shards: Partial<Record<CiShardId, ShardArtifacts>>;
}) => {
  const ids = ciShardIdSchema.options;
  if (
    input.jobResults.planner !== 'success' ||
    ids.some((id) => input.jobResults[id] !== 'success')
  )
    throw new Error('CIの必須jobが成功していません。');
  if (
    Object.keys(input.shards).length !== ids.length ||
    ids.some((id) => !Object.hasOwn(input.shards, id))
  )
    throw new Error('CIの分割実行artifact集合が一致しません。');

  const { manifest, plans } = validateCiPartitionManifest(input);
  if (
    !isDeepStrictEqual(
      manifest.workflow,
      ciWorkflowSchema.parse(input.workflow),
    ) ||
    !isDeepStrictEqual(
      manifest.eventPolicy,
      githubEventPolicySchema.parse(input.eventPolicy),
    )
  )
    throw new Error(
      'CI manifestのworkflow attemptまたはイベントが一致しません。',
    );
  const manifestDigest = digestCiPartitionManifest(manifest);
  const seen = new Set<string>();
  const owners = new Set<string>();
  const results: LegacyExecutionResult[] = [];
  const shards = manifest.shards.map((shard) => {
    const { id } = shard;
    const artifacts = input.shards[id];
    if (isNil(artifacts)) throw new Error('CI分割実行artifactがありません。');
    const verified = validateCiShardArtifacts({
      manifest,
      shard: id,
      expectedPlan: plans[id],
      ...artifacts,
      ...(id === 'required'
        ? {}
        : {
            legacyEvidence: {
              legacy: input.legacy,
              execution: input.execution,
            },
          }),
    });
    if (seen.has(verified.verificationId))
      throw new Error('CI分割実行の由来またはverification IDが一致しません。');
    seen.add(verified.verificationId);
    const { ownerRunIds, legacyResults, ...summary } = verified;
    for (const owner of ownerRunIds) {
      if (owners.has(owner))
        throw new Error('CI分割実行のowner run IDが重複しています。');
      owners.add(owner);
    }
    results.push(...legacyResults);
    return summary;
  });
  if (
    validateLegacyExecution({
      legacy: input.legacy,
      execution: input.execution,
      results,
    }).issues.length > 0
  )
    throw new Error('legacy全体の実行結果が正本と一致しません。');
  return {
    schemaVersion: 2 as const,
    status: 'passed' as const,
    workflow: manifest.workflow,
    eventPolicy: manifest.eventPolicy,
    manifestDigest,
    snapshotDigest: manifest.snapshotDigest,
    inputsDigest: manifest.inputsDigest,
    fullCollectionDigest: manifest.fullCollectionDigest,
    fullPlanDigest: manifest.fullPlanDigest,
    effectivePlanDigest: manifest.effectivePlanDigest,
    smokeReference: manifest.smokeReference,
    coverageStatus: manifest.changeDecision?.coverageStatus ?? null,
    coverageGaps: manifest.changeDecision?.coverageGaps ?? [],
    integrationLegacyExecuted: false as const,
    shards,
  };
};
