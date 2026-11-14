import { isNil } from 'ramda';

import { validateCiLegacyResults } from './ciLegacyResults';
import { digestCiPartitionManifest } from './ciPartition';
import { CI_LEGACY_PROJECTS, ciShardEnvelopeSchema } from './ciPartitionSchema';
import { validateVerificationArtifacts } from './verificationReceipt';

import { isDeepStrictEqual } from 'node:util';

import type { CiPartitionManifest, CiShardId } from './ciPartitionSchema';
import type { LegacyManifest } from './legacy';
import type {
  LegacyExecution,
  LegacyExecutionResult,
} from './legacyExecutionSchema';
import type { VerificationPlan } from './verificationSchema';

/** workerの公開前とaggregateの両方で、同じshardの完全な証拠を照合する。 */
export const validateCiShardArtifacts = (input: {
  manifest: CiPartitionManifest;
  shard: CiShardId;
  expectedPlan: VerificationPlan;
  envelope: unknown;
  verification: Parameters<typeof validateVerificationArtifacts>[0];
  legacyEvidence?: { legacy: LegacyManifest; execution: LegacyExecution };
}) => {
  const { manifest, shard: id, expectedPlan } = input;
  const shard = manifest.shards.find(({ id: candidate }) => candidate === id);
  const envelope = ciShardEnvelopeSchema.parse(input.envelope);
  if (
    isNil(shard) ||
    envelope.shard !== id ||
    !isDeepStrictEqual(envelope.workflow, manifest.workflow) ||
    envelope.manifestDigest !== digestCiPartitionManifest(manifest) ||
    envelope.fullCollectionDigest !== manifest.fullCollectionDigest ||
    envelope.fullPlanDigest !== manifest.fullPlanDigest
  )
    throw new Error('CI分割実行の由来またはverification IDが一致しません。');
  const { plan, receipt, inputsStart, inputsEnd } =
    validateVerificationArtifacts(input.verification);
  if (receipt.verificationId !== envelope.verificationId)
    throw new Error('CI分割実行の由来またはverification IDが一致しません。');
  if (
    !isDeepStrictEqual(plan, expectedPlan) ||
    receipt.mode !== 'partial' ||
    receipt.selectionDigest !== shard.planDigest ||
    inputsStart.digest !== manifest.inputsDigest ||
    inputsEnd.digest !== manifest.inputsDigest ||
    receipt.legacyLocalRequested !== (id !== 'required') ||
    !isDeepStrictEqual(receipt.selection, {
      snapshotDigest: manifest.snapshotDigest,
      fullPlanDigest: manifest.fullPlanDigest,
      decisionDigest: manifest.decisionDigest,
    })
  )
    throw new Error(
      'CI分割実行の計画、固定入力、または選択由来が一致しません。',
    );
  if (isNil(receipt.execution)) throw new Error('CI実行記録がありません。');
  const legacyResults: LegacyExecutionResult[] = [];
  if (id !== 'required') {
    if (isNil(input.legacyEvidence))
      throw new Error('legacy実行正本がありません。');
    legacyResults.push(
      ...validateCiLegacyResults({
        ...input.legacyEvidence,
        scope: CI_LEGACY_PROJECTS[id],
        stages: receipt.execution.stages,
      }),
    );
  }
  return {
    ownerRunIds: receipt.execution.runs.flatMap(({ runId }) =>
      isNil(runId) ? [] : [runId],
    ),
    legacyResults,
    id,
    verificationId: receipt.verificationId,
    planDigest: shard.planDigest,
    business: plan.requirements.filter(({ kind }) => kind === 'business')
      .length,
    support: plan.requirements.filter(({ kind }) => kind !== 'business').length,
    extras: plan.allowedExtraTests.length,
  };
};
