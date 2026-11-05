import {
  assertCiUnchanged,
  captureCiInputs,
  readCiArtifact,
  readCiContext,
  readCiLedgers,
  writeCiArtifact,
} from './ciContext';
import {
  digestCiFullCollection,
  digestCiPartitionManifest,
  validateCiPartitionManifest,
} from './ciPartition';
import {
  ciPartitionManifestSchema,
  ciShardEnvelopeSchema,
} from './ciPartitionSchema';
import { validateCiShardArtifacts } from './ciShardArtifacts';
import { prepareVerificationDetails } from './prepareVerification';
import { selectedPreparation } from './selectedPreparation';
import { digestVerificationPlan } from './verificationPlanDigest';
import { loadVerificationArtifacts } from './verificationReceipt';
import { hasReleasedStageResources } from './verificationRelease';
import { runVerification } from './verificationRun';

import { isDeepStrictEqual } from 'node:util';

import type { CiProgress } from './ciDiagnostics';
import type { CiShardId } from './ciPartitionSchema';

/** workerも全登録を独立列挙し、plannerと一致したときだけ自分のownerを実行する。 */
export const runCiShard = async (
  root: string,
  env: NodeJS.ProcessEnv,
  shard: CiShardId,
  signal: AbortSignal,
  onProgress?: CiProgress,
) => {
  onProgress?.({ phase: 'context' });
  const context = await readCiContext(root, env);
  onProgress?.({ phase: 'manifest' });
  const rawManifest = ciPartitionManifestSchema.parse(
    readCiArtifact(root, 'plan/manifest.json'),
  );
  const { manifest, plans } = validateCiPartitionManifest({
    manifest: rawManifest,
    ...(await readCiLedgers(
      root,
      context.eventPolicy,
      readCiArtifact(root, 'plan/static.json'),
      rawManifest,
    )),
  });
  onProgress?.({ phase: 'inputs' });
  const initial = await captureCiInputs(root, context.eventPolicy);
  if (
    !isDeepStrictEqual(manifest.eventPolicy, context.eventPolicy) ||
    !isDeepStrictEqual(manifest.workflow, context.workflow) ||
    initial.snapshot.digest !== manifest.snapshotDigest ||
    initial.inputs.digest !== manifest.inputsDigest
  )
    throw new Error('CI workerのイベント・入力がplannerと一致しません。');
  onProgress?.({ phase: 'collection' });
  const prepared = await prepareVerificationDetails(root);
  if (
    prepared.inputs.digest !== manifest.inputsDigest ||
    digestVerificationPlan(prepared.plan) !== manifest.fullPlanDigest ||
    digestCiFullCollection(
      prepared.discoveries,
      prepared.integrationCollection,
    ) !== manifest.fullCollectionDigest
  )
    throw new Error('CI workerの全登録がplannerと一致しません。');
  const checkpoint = () =>
    assertCiUnchanged(root, env, context, initial).then(() => {});
  await checkpoint();
  signal.throwIfAborted();
  onProgress?.({ phase: 'execution' });
  const run = await runVerification(root, {
    ...selectedPreparation(
      prepared,
      { plan: plans[shard] },
      { shouldAllowFullProfile: true },
    ),
    mode: 'partial',
    signal,
    checkpoint,
    selection: {
      snapshotDigest: manifest.snapshotDigest,
      fullPlanDigest: manifest.fullPlanDigest,
      decisionDigest: manifest.decisionDigest,
    },
  });
  onProgress?.({
    phase: 'receipt',
    verificationId: run.verificationId,
    ...(run.verification ? { issueCount: run.verification.issues.length } : {}),
    // 未起動stageやテスト失敗も後始末の照合条件を満たさないため、回収漏れと断定しない。
    cleanup:
      run.execution &&
      run.execution.stages.length > 0 &&
      run.execution.stages.every(hasReleasedStageResources)
        ? 'complete'
        : 'unknown',
  });
  const verified = loadVerificationArtifacts(root, run.verificationId);
  await checkpoint();
  signal.throwIfAborted();
  const envelope = ciShardEnvelopeSchema.parse({
    schemaVersion: 1,
    shard,
    workflow: context.workflow,
    manifestDigest: digestCiPartitionManifest(manifest),
    fullCollectionDigest: manifest.fullCollectionDigest,
    fullPlanDigest: manifest.fullPlanDigest,
    verificationId: run.verificationId,
  });
  validateCiShardArtifacts({
    manifest,
    shard,
    expectedPlan: plans[shard],
    envelope,
    verification: verified,
  });
  onProgress?.({ phase: 'artifacts', verificationId: run.verificationId });
  for (const [file, value] of Object.entries({
    'envelope.json': envelope,
    'plan.json': verified.plan,
    'receipt.json': verified.receipt,
    'inputs-start.json': verified.inputsStart,
    'inputs-end.json': verified.inputsEnd,
  }))
    writeCiArtifact(root, `${shard}/${file}`, value);
  return {
    status: 'passed' as const,
    phase: shard,
    verificationId: run.verificationId,
  };
};
