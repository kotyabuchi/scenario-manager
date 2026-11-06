import { isNil } from 'ramda';

import { writeArtifact } from './ledgerArtifacts';
import { prepareChangedVerification } from './prepareChangedVerification';
import { selectedPreparation } from './selectedPreparation';
import { assertNoOpDecision } from './selectionNoOp';
import { observeSelectionRun } from './selectionObservation';
import {
  compareSelectionShadow,
  shadowObservationSchema,
} from './selectionShadow';
import { prepareVerificationDirectory } from './verificationContext';
import { digestVerificationPlan } from './verificationPlanDigest';
import { hasReleasedStageResources } from './verificationRelease';
import { runVerification } from './verificationRun';

import { createHash, randomBytes } from 'node:crypto';
import { realpath } from 'node:fs/promises';

import type { SelectionProgress } from './selectionProgress';
import type { SelectionDecision } from './selectionSchema';
import type { ShadowObservation, ShadowResult } from './selectionShadow';

const digest = (value: unknown) =>
  createHash('sha256')
    .update(`${JSON.stringify(value)}\n`)
    .digest('hex');
const summary = (run: Awaited<ReturnType<typeof runVerification>>) => ({
  verificationId: run.verificationId,
  status: run.status,
  counts: run.verification?.counts ?? null,
});

/** 同じ固定snapshotで部分実行と全件実行を比較し、選択結果を独立receiptへ保存する。 */
export const runChangedVerification = async (
  root: string,
  options: {
    base?: string;
    env?: NodeJS.ProcessEnv;
    forceFull?: boolean;
    shadow?: boolean;
    signal?: AbortSignal;
    onReceipt?: (progress: SelectionProgress) => undefined;
    onProgress?: (progress: SelectionProgress) => void | Promise<void>;
  } = {},
) => {
  const worktreeRoot = await realpath(root);
  const selectionId = randomBytes(6).toString('hex');
  const prefix = `test-results/verification/${selectionId}`;
  const receiptPath = `${prefix}/selection-receipt.json`;
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  const state: {
    schemaVersion: 1;
    selectionId: string;
    status: 'running' | 'passed' | 'failed';
    phase: SelectionProgress['phase'] | 'final-snapshot-check' | 'complete';
    decision: SelectionDecision | null;
    effectiveSelectionDigest: string | null;
    partial: ReturnType<typeof summary> | null;
    full: ReturnType<typeof summary> | null;
    shadow: ShadowResult | null;
    shadowRequested: boolean;
    noOp: boolean;
    failure: string | null;
  } = {
    schemaVersion: 1,
    selectionId,
    status: 'running',
    phase: 'preparation',
    decision: null,
    effectiveSelectionDigest: null,
    partial: null,
    full: null,
    shadow: null,
    shadowRequested: options.shadow !== false,
    noOp: false,
    failure: null,
  };
  let hasDirectory = false;
  const save = () => {
    const contents = `${JSON.stringify(state, null, 2)}\n`;
    if (hasDirectory) writeArtifact(worktreeRoot, receiptPath, contents);
    writeArtifact(
      worktreeRoot,
      'test-results/quality/selection.json',
      contents,
    );
  };
  const publish = (phase: SelectionProgress['phase']) => {
    state.phase = phase;
    save();
    const progress = { phase, selectionId, receiptPath };
    // 親receiptの保存は必須。任意表示の失敗とは分けて扱う。
    options.onReceipt?.(progress);
    try {
      void Promise.resolve(options.onProgress?.(progress)).catch(
        () => undefined,
      );
    } catch {
      // 表示先の失敗で検証や所有資源の解放を中断しない。
    }
  };
  options.signal?.addEventListener('abort', interrupt, { once: true });
  if (options.signal?.aborted) interrupt();
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    save();
    prepareVerificationDirectory(worktreeRoot, selectionId);
    hasDirectory = true;
    publish('preparation');
    controller.signal.throwIfAborted();
    const selection = await prepareChangedVerification({
      root: worktreeRoot,
      prefix,
      ...(isNil(options.base) ? {} : { base: options.base }),
      ...(isNil(options.env) ? {} : { env: options.env }),
      ...(isNil(options.forceFull) ? {} : { forceFull: options.forceFull }),
      signal: controller.signal,
      onPhase: publish,
    });
    const {
      prepared,
      capture,
      graph,
      rules,
      decision,
      effective,
      provenUnversionedPaths,
    } = selection;
    state.decision = decision;
    state.effectiveSelectionDigest = effective?.selectionDigest ?? null;
    const provenance = {
      snapshotDigest: capture.snapshot.digest,
      inputDigest: prepared.inputs.digest,
      collectionDigest: digest([
        prepared.discoveries,
        prepared.integrationCollection,
      ]),
      rulesDigest: rules.digest,
      fullPlanDigest: digestVerificationPlan(prepared.plan),
    };
    const checkpoint = async (phase: string) => {
      await selection.checkpoint(phase);
    };
    const metadata = {
      snapshotDigest: provenance.snapshotDigest,
      fullPlanDigest: provenance.fullPlanDigest,
      decisionDigest: digest(decision),
    };
    let partialObservation: ShadowObservation;
    if (isNil(effective)) {
      publish('no-op');
      const endSnapshot = await selection.checkpoint('no-op');
      assertNoOpDecision({
        decision,
        snapshot: capture.snapshot,
        endSnapshot,
        graph,
        rules,
        fullPlan: prepared.plan,
        legacy: prepared.legacy,
        provenUnversionedPaths,
      });
      state.noOp = true;
      // 0件はrunner成功を捏造せず、検査済みNoOpとしてshadowの空集合を表す。
      partialObservation = shadowObservationSchema.parse({
        verificationId: selectionId,
        ...provenance,
        selectionDigest: digestVerificationPlan({
          schemaVersion: 1,
          requirements: [],
          allowedExtraTests: [],
        }),
        requiredKeys: [],
        failedRequiredKeys: [],
        status: 'complete',
      });
    } else {
      publish(decision.mode === 'full-required' ? 'full-required' : 'partial');
      if (
        decision.mode === 'full-required' &&
        effective.selectionDigest !== provenance.fullPlanDigest
      )
        throw new Error('全件fallbackの実行集合が欠落しています。');
      const narrowed =
        decision.mode === 'full-required'
          ? { prepared }
          : selectedPreparation(prepared, effective);
      const run = await runVerification(worktreeRoot, {
        ...narrowed,
        mode: decision.mode === 'full-required' ? 'full-required' : 'partial',
        selection: metadata,
        checkpoint,
        signal: controller.signal,
        continueAfterFailure:
          decision.mode !== 'full-required' && state.shadowRequested,
      });
      state.partial = summary(run);
      controller.signal.throwIfAborted();
      publish('partial-cleanup-check');
      if (
        !isNil(run.failure) ||
        isNil(run.execution) ||
        run.execution.stages.length === 0 ||
        run.execution.stages.some((stage) => !hasReleasedStageResources(stage))
      )
        throw new Error('部分実行の所有資源の解放を確認できません。');
      partialObservation = observeSelectionRun({
        run,
        plan: effective.plan,
        provenance,
      });
      if (decision.mode === 'full-required') {
        // 全件へ拡大した選択を、同じ全件でもう一度実行しない。
        state.full = state.partial;
        state.status = run.status === 'passed' ? 'passed' : 'failed';
      } else if (run.status !== 'passed') state.status = 'failed';
    }
    if (decision.mode !== 'full-required' && state.shadowRequested) {
      publish('shadow-full');
      await checkpoint('before-shadow');
      const full = await runVerification(worktreeRoot, {
        prepared,
        mode: 'full-required',
        selection: metadata,
        checkpoint,
        signal: controller.signal,
        continueAfterFailure: true,
      });
      state.full = summary(full);
      controller.signal.throwIfAborted();
      const fullObservation = observeSelectionRun({
        run: full,
        plan: prepared.plan,
        provenance,
      });
      state.shadow = compareSelectionShadow({
        fullPlan: prepared.plan,
        executionGroups: prepared.ledger.executionGroups,
        partial: partialObservation,
        full: fullObservation,
      });
      writeArtifact(
        worktreeRoot,
        `${prefix}/shadow-observations.json`,
        `${JSON.stringify({ partial: partialObservation, full: fullObservation }, null, 2)}\n`,
      );
      state.status =
        state.status !== 'failed' &&
        full.status === 'passed' &&
        state.shadow.status === 'matched'
          ? 'passed'
          : 'failed';
    } else if (state.status === 'running') state.status = 'passed';
    state.phase = 'final-snapshot-check';
    await checkpoint(state.phase);
    if (controller.signal.aborted) throw new Error('検証が中断されました。');
    state.phase = 'complete';
  } catch {
    state.status = 'failed';
    state.failure = controller.signal.aborted
      ? 'INTERRUPTED'
      : 'SELECTION_VERIFICATION_FAILED';
  } finally {
    options.signal?.removeEventListener('abort', interrupt);
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
  save();
  return { ...state, runReceiptPath: hasDirectory ? receiptPath : null };
};
