import { isNil } from 'ramda';

import { captureInputs, compareInputs } from './fingerprint';
import { writeArtifact } from './ledgerArtifacts';
import { prepareVerification } from './prepareVerification';
import { runVerificationStages } from './runVerificationStages';
import { prepareVerificationDirectory } from './verificationContext';
import {
  digestVerificationPlan,
  serializeVerificationPlan,
} from './verificationPlanDigest';
import { verifyResults } from './verifyResults';

import { randomBytes } from 'node:crypto';
import { realpath } from 'node:fs/promises';

import type { LegacyProject } from '../../e2e/fixtures/legacySchema';
import type { InputFingerprint } from './fingerprint';
import type { RunnerSelection } from './runnerSelection';
import type { VerificationReceipt } from './verificationReceiptSchema';

const LATEST_RECEIPT = 'test-results/quality/verification.json';

export type VerificationRunOptions = {
  prepared?: Pick<
    Awaited<ReturnType<typeof prepareVerification>>,
    'plan' | 'inputs' | 'scheduleExpected' | 'integrationExpected'
  >;
  /** 部分実行の非app profileごとに一つ。appのみなら空配列を渡す。 */
  runnerSelections?: readonly RunnerSelection[];
  /** CIの割当project。省略時は従来の全project実行を使う。 */
  legacyProjects?: readonly LegacyProject[];
  continueAfterFailure?: boolean;
  signal?: AbortSignal;
  mode?: 'full-required' | 'partial';
  selection?: {
    snapshotDigest: string;
    fullPlanDigest: string;
    decisionDigest: string;
  };
  checkpoint?: (phase: string) => Promise<void>;
};

/** 固定planに対して所有runnerを起動し、全結果と入力不変性を照合する。 */
export const runVerification = async (
  root: string,
  options: VerificationRunOptions = {},
) => {
  const worktreeRoot = await realpath(root);
  const verificationId = randomBytes(6).toString('hex');
  const prefix = `test-results/verification/${verificationId}`;
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  const state: VerificationReceipt = {
    schemaVersion: 1,
    verificationId,
    mode: options.mode ?? 'full-required',
    selection: options.selection ?? null,
    status: 'running',
    phase: 'preparation',
    selectionDigest: null,
    inputDigestBefore: null,
    inputDigestAfter: null,
    checkpoints: [],
    execution: null,
    verification: null,
    failure: null,
    legacyLocalRequested: true,
    integrationLegacyExecuted: false,
  };
  let hasDirectory = false;
  let inputs: InputFingerprint | null = null;
  const save = () => {
    const content = `${JSON.stringify(state, null, 2)}\n`;
    if (hasDirectory)
      writeArtifact(worktreeRoot, `${prefix}/receipt.json`, content);
    writeArtifact(worktreeRoot, LATEST_RECEIPT, content);
  };
  options.signal?.addEventListener('abort', interrupt, { once: true });
  if (options.signal?.aborted) interrupt();
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    save();
    prepareVerificationDirectory(worktreeRoot, verificationId);
    hasDirectory = true;
    if (state.mode === 'partial') {
      if (
        isNil(options.prepared) ||
        isNil(options.selection) ||
        !Array.isArray(options.runnerSelections)
      )
        throw new Error(
          '部分実行には固定plan・選択由来・runner選択が必要です。',
        );
      const filters: readonly RunnerSelection[] = options.runnerSelections;
      const selectedProfiles = new Set(
        filters.map(({ expected }) => expected.profile),
      );
      const requiredProfiles = new Set(
        options.prepared.plan.requirements
          .map(({ profile }) => profile)
          .filter((profile) => profile !== 'app'),
      );
      if (
        selectedProfiles.size !== filters.length ||
        selectedProfiles.size !== requiredProfiles.size ||
        [...selectedProfiles].some((profile) => !requiredProfiles.has(profile))
      )
        throw new Error('runner選択のprofileが部分実行planと一致しません。');
    } else if (state.mode !== 'full-required' || 'runnerSelections' in options)
      throw new Error('全件実行ではrunnerを絞り込めません。');
    const prepared =
      options.prepared ?? (await prepareVerification(worktreeRoot));
    const selectionDigest = digestVerificationPlan(prepared.plan);
    if (
      state.mode === 'full-required' &&
      !isNil(options.selection) &&
      options.selection.fullPlanDigest !== selectionDigest
    )
      throw new Error('全件実行のplanが選択由来の全件digestと一致しません。');
    state.legacyLocalRequested = prepared.plan.requirements.some(
      ({ profile }) => profile === 'app',
    );
    inputs = prepared.inputs;
    state.inputDigestBefore = inputs.digest;
    const planContent = serializeVerificationPlan(prepared.plan);
    state.selectionDigest = selectionDigest;
    writeArtifact(worktreeRoot, `${prefix}/plan.json`, planContent);
    writeArtifact(
      worktreeRoot,
      `${prefix}/inputs-start.json`,
      `${JSON.stringify(inputs, null, 2)}\n`,
    );
    const checkpoint = async (phase: string) => {
      if (isNil(inputs)) throw new Error('開始時の入力がありません。');
      const snapshot = await captureInputs(worktreeRoot);
      const changes = compareInputs(inputs, snapshot);
      state.checkpoints.push({ phase, digest: snapshot.digest, changes });
      state.phase = phase;
      save();
      if (Object.values(changes).some((paths) => paths.length > 0))
        throw new Error('実行中に検証入力が変化しました。');
      await options.checkpoint?.(phase);
      controller.signal.throwIfAborted();
    };
    await checkpoint('before-stages');
    state.execution = await runVerificationStages({
      root: worktreeRoot,
      prepared,
      ...(options.runnerSelections
        ? { selections: options.runnerSelections }
        : {}),
      ...(isNil(options.legacyProjects)
        ? {}
        : { legacyProjects: options.legacyProjects }),
      context: { verificationId, selectionDigest, inputDigest: inputs.digest },
      signal: controller.signal,
      ...(options.continueAfterFailure ? { continueAfterFailure: true } : {}),
      checkpoint,
    });
    state.phase = 'final-input-check';
    await options.checkpoint?.('final-input-check');
    const after = await captureInputs(worktreeRoot);
    state.inputDigestAfter = after.digest;
    writeArtifact(
      worktreeRoot,
      `${prefix}/inputs-end.json`,
      `${JSON.stringify(after, null, 2)}\n`,
    );
    state.verification = verifyResults({
      plan: prepared.plan,
      verificationId,
      selectionDigest,
      inputDigestBefore: inputs.digest,
      inputDigestAfter: after.digest,
      stages: state.execution.stages,
    });
    const changed = state.checkpoints.some(({ changes }) =>
      Object.values(changes).some((paths) => paths.length > 0),
    );
    state.status =
      state.verification.issues.length === 0 &&
      !changed &&
      !controller.signal.aborted
        ? 'passed'
        : 'failed';
    state.phase = state.status === 'passed' ? 'complete' : 'verification';
    if (controller.signal.aborted) state.failure = 'INTERRUPTED';
  } catch {
    state.status = 'failed';
    // SDK・runnerの生エラーは個別のprivate logに残し、公開receiptにはphaseだけを残す。
    state.failure = controller.signal.aborted
      ? 'INTERRUPTED'
      : 'VERIFICATION_FAILED';
    if (!isNil(inputs)) {
      try {
        state.inputDigestAfter = (await captureInputs(worktreeRoot)).digest;
      } catch {
        state.inputDigestAfter = null;
      }
    }
  } finally {
    options.signal?.removeEventListener('abort', interrupt);
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
  save();
  return state;
};
