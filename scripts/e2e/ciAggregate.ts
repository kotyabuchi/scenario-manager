import {
  assertCiUnchanged,
  captureCiInputs,
  readCiArtifact,
  readCiContext,
  readCiLedgers,
  writeCiArtifact,
} from './ciContext';
import { aggregateCiPartition } from './ciPartitionAggregate';
import { ciPartitionManifestSchema } from './ciPartitionSchema';

import type { CiProgress } from './ciDiagnostics';
import type { CiShardId } from './ciPartitionSchema';

/** job状態と個別IDの証拠を再検査して、必須checkを一つに集約する。 */
export const aggregateCiVerification = async (
  root: string,
  env: NodeJS.ProcessEnv,
  signal: AbortSignal,
  onProgress?: CiProgress,
) => {
  onProgress?.({ phase: 'aggregate' });
  if (
    [
      env.CI_PLANNER_RESULT,
      env.CI_REQUIRED_RESULT,
      env.CI_LEGACY_RESULT,
      env.CI_FIXTURES_RESULT,
    ].some((result) => result !== 'success')
  )
    throw new Error('CIの必須jobが成功していません。');
  onProgress?.({ phase: 'context' });
  const context = await readCiContext(root, env);
  onProgress?.({ phase: 'inputs' });
  const initial = await captureCiInputs(root, context.eventPolicy);
  onProgress?.({ phase: 'manifest' });
  const manifest = ciPartitionManifestSchema.parse(
    readCiArtifact(root, 'plan/manifest.json'),
  );
  const ledgers = await readCiLedgers(
    root,
    context.eventPolicy,
    readCiArtifact(root, 'plan/static.json'),
    manifest,
    {
      bootstrapApproval: env.E2E_LEDGER_BOOTSTRAP_APPROVAL,
      inputs: initial.inputs,
    },
  );
  if (
    initial.inputs.digest !== manifest.inputsDigest ||
    initial.snapshot.digest !== manifest.snapshotDigest
  )
    throw new Error('CI aggregateのcheckoutがplannerと一致しません。');
  const shard = (id: CiShardId) => ({
    envelope: readCiArtifact(root, `${id}/envelope.json`),
    verification: {
      plan: readCiArtifact(root, `${id}/plan.json`),
      receipt: readCiArtifact(root, `${id}/receipt.json`),
      inputsStart: readCiArtifact(root, `${id}/inputs-start.json`),
      inputsEnd: readCiArtifact(root, `${id}/inputs-end.json`),
    },
  });
  onProgress?.({ phase: 'aggregate' });
  const result = aggregateCiPartition({
    manifest,
    ...context,
    ...ledgers,
    jobResults: {
      planner: env.CI_PLANNER_RESULT ?? '',
      required: env.CI_REQUIRED_RESULT ?? '',
      'legacy-local': env.CI_LEGACY_RESULT ?? '',
    },
    shards: {
      required: shard('required'),
      'legacy-local': shard('legacy-local'),
    },
  });
  await assertCiUnchanged(root, env, context, initial);
  signal.throwIfAborted();
  onProgress?.({ phase: 'artifacts' });
  writeCiArtifact(root, 'aggregate/receipt.json', result);
  return result;
};
