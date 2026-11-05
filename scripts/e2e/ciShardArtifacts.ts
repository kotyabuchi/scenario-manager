import { isNil } from 'ramda';

import { digestCiPartitionManifest } from './ciPartition';
import { ciShardEnvelopeSchema } from './ciPartitionSchema';
import { validateVerificationArtifacts } from './verificationReceipt';

import { isDeepStrictEqual } from 'node:util';

import type { CiPartitionManifest, CiShardId } from './ciPartitionSchema';
import type { VerificationPlan } from './verificationSchema';

/** workerの公開前とaggregateの両方で、同じshardの完全な証拠を照合する。 */
export const validateCiShardArtifacts = (input: {
  manifest: CiPartitionManifest;
  shard: CiShardId;
  expectedPlan: VerificationPlan;
  envelope: unknown;
  verification: Parameters<typeof validateVerificationArtifacts>[0];
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
    receipt.legacyLocalRequested !== (id === 'legacy-local') ||
    !isDeepStrictEqual(receipt.selection, {
      snapshotDigest: manifest.snapshotDigest,
      fullPlanDigest: manifest.fullPlanDigest,
      decisionDigest: manifest.decisionDigest,
    })
  )
    throw new Error(
      'CI分割実行の計画、固定入力、または選択由来が一致しません。',
    );
  return {
    id,
    verificationId: receipt.verificationId,
    planDigest: shard.planDigest,
    business: plan.requirements.filter(({ kind }) => kind === 'business')
      .length,
    support: plan.requirements.filter(({ kind }) => kind !== 'business').length,
    extras: plan.allowedExtraTests.length,
  };
};
