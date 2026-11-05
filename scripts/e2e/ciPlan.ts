import {
  assertCiUnchanged,
  captureCiInputs,
  readCiContext,
  readCiLedgers,
  writeCiArtifact,
} from './ciContext';
import {
  createCiPartitionManifest,
  digestCiFullCollection,
} from './ciPartition';
import { PlaywrightSelectionRepresentationError } from './playwrightTestList';
import { prepareChangedVerification } from './prepareChangedVerification';
import { runQualityChecks } from './qualityChecks';
import { selectedPreparation } from './selectedPreparation';
import { assertNoOpDecision } from './selectionNoOp';
import { prepareVerificationDirectory } from './verificationContext';

import { randomBytes } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import type { CiProgress } from './ciDiagnostics';

/** 品質前段と全体M1を完了してから、同じ入力に対する分割manifestを公開する。 */
export const planCiVerification = async (
  root: string,
  env: NodeJS.ProcessEnv,
  signal: AbortSignal,
  onProgress?: CiProgress,
) => {
  onProgress?.({ phase: 'context' });
  const context = await readCiContext(root, env);
  onProgress?.({ phase: 'inputs' });
  const initial = await captureCiInputs(root, context.eventPolicy);
  const id = randomBytes(6).toString('hex');
  const directory = prepareVerificationDirectory(root, id);
  const checkpoint = () =>
    assertCiUnchanged(root, env, context, initial).then(() => {});
  onProgress?.({ phase: 'quality' });
  await runQualityChecks({
    root,
    directory,
    signal,
    env,
    checkpoint,
    onStage: (qualityCheck) => onProgress?.({ phase: 'quality', qualityCheck }),
  });
  onProgress?.({ phase: 'static-ledger' });
  const selection = await prepareChangedVerification({
    root,
    prefix: `test-results/verification/${id}`,
    deferRunnerSelection: true,
    onPhase: (phase) => onProgress?.({ phase }),
    env,
    signal,
  });
  if (
    !isDeepStrictEqual(selection.eventPolicy, context.eventPolicy) ||
    selection.capture.snapshot.digest !== initial.snapshot.digest ||
    selection.prepared.inputs.digest !== initial.inputs.digest
  )
    throw new Error('CI選択の由来が品質前段と一致しません。');
  const endSnapshot = await selection.checkpoint('ci-plan');
  if (
    context.eventPolicy.event === 'pull_request' &&
    selection.decision.mode === 'docs-only'
  )
    assertNoOpDecision({
      ...selection,
      snapshot: selection.capture.snapshot,
      endSnapshot,
      fullPlan: selection.prepared.plan,
      legacy: selection.prepared.legacy,
    });
  onProgress?.({ phase: 'manifest' });
  const binding = {
    workflow: context.workflow,
    snapshotDigest: initial.snapshot.digest,
    inputsDigest: initial.inputs.digest,
  };
  const staticReport = { ...selection.staticReport, ...binding };
  const partitionInput = {
    ...context,
    ...(await readCiLedgers(root, context.eventPolicy, staticReport, binding)),
    snapshotDigest: initial.snapshot.digest,
    inputsDigest: initial.inputs.digest,
    fullCollectionDigest: digestCiFullCollection(
      selection.prepared.discoveries,
      selection.prepared.integrationCollection,
    ),
    fullPlan: selection.prepared.plan,
    changeDecision:
      context.eventPolicy.event === 'pull_request' ? selection.decision : null,
  };
  const validateRunnerSelection = (
    partition: ReturnType<typeof createCiPartitionManifest>,
  ) =>
    selectedPreparation(
      selection.prepared,
      { plan: partition.plans.required },
      { shouldAllowFullProfile: true },
    );
  let partition = createCiPartitionManifest(partitionInput);
  try {
    validateRunnerSelection(partition);
  } catch (error) {
    if (!(error instanceof PlaywrightSelectionRepresentationError)) throw error;
    partition = createCiPartitionManifest({
      ...partitionInput,
      runnerSelectionFallback: true,
    });
    validateRunnerSelection(partition);
  }
  const { manifest } = partition;
  await checkpoint();
  signal.throwIfAborted();
  onProgress?.({ phase: 'artifacts' });
  writeCiArtifact(root, 'plan/manifest.json', manifest);
  writeCiArtifact(root, 'plan/static.json', staticReport);
  return {
    status: 'passed' as const,
    phase: 'plan',
    workflow: context.workflow,
    head: context.eventPolicy.head,
  };
};
