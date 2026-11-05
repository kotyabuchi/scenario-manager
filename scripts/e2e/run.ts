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
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { InputChanges, InputFingerprint } from './fingerprint';

const LATEST_RECEIPT = 'test-results/quality/verification.json';

/** 差分選択導入前は両commandとも全必須caseとlegacy-localを保守的に実行する。 */
export const runVerification = async (root: string) => {
  const worktreeRoot = await realpath(root);
  const verificationId = randomBytes(6).toString('hex');
  const prefix = `test-results/verification/${verificationId}`;
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  const state: {
    schemaVersion: 1;
    verificationId: string;
    mode: 'full-required';
    status: 'running' | 'passed' | 'failed';
    phase: string;
    selectionDigest: string | null;
    inputDigestBefore: string | null;
    inputDigestAfter: string | null;
    checkpoints: { phase: string; digest: string; changes: InputChanges }[];
    execution: Awaited<ReturnType<typeof runVerificationStages>> | null;
    verification: ReturnType<typeof verifyResults> | null;
    failure: string | null;
    legacyLocalRequested: true;
    integrationLegacyExecuted: false;
  } = {
    schemaVersion: 1,
    verificationId,
    mode: 'full-required',
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
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    save();
    prepareVerificationDirectory(worktreeRoot, verificationId);
    hasDirectory = true;
    const prepared = await prepareVerification(worktreeRoot);
    inputs = prepared.inputs;
    state.inputDigestBefore = inputs.digest;
    const planContent = serializeVerificationPlan(prepared.plan);
    const selectionDigest = digestVerificationPlan(prepared.plan);
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
      controller.signal.throwIfAborted();
    };
    await checkpoint('before-stages');
    state.execution = await runVerificationStages({
      root: worktreeRoot,
      prepared,
      context: { verificationId, selectionDigest, inputDigest: inputs.digest },
      signal: controller.signal,
      checkpoint,
    });
    state.phase = 'final-input-check';
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
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
  save();
  return state;
};

const entry = process.argv[1];
if (!isNil(entry) && import.meta.url === pathToFileURL(resolve(entry)).href) {
  if (
    process.argv.slice(2).some((value) => value !== '--all') ||
    process.argv.slice(2).length > 1
  )
    throw new Error('使用法: run.ts [--all]');
  const result = await runVerification(process.cwd());
  process.stdout.write(
    `${JSON.stringify({ status: result.status, phase: result.phase, verificationId: result.verificationId, counts: result.verification?.counts, issueCount: result.verification?.issues.length })}\n`,
  );
  if (result.status !== 'passed') process.exitCode = 1;
}
