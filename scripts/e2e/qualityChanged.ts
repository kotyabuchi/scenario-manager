import { isNil } from 'ramda';

import { ciSnapshotOptions } from './ciSnapshotOptions';
import { captureInputs } from './fingerprint';
import { captureGitSnapshot } from './gitSnapshot';
import { writeArtifact } from './ledgerArtifacts';
import { runQualityChecks } from './qualityChecks';
import { runChangedVerification } from './runChangedVerification';
import { selectionConsoleSummary } from './selectionConsoleSummary';
import { writeSelectionProgress } from './selectionProgress';
import { resolveRevisions } from './trustedRevision';
import { parseVerificationArguments } from './verificationArguments';
import { prepareVerificationDirectory } from './verificationContext';
import { loadVerificationArtifacts } from './verificationReceipt';

import { createHash, randomBytes } from 'node:crypto';
import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import type { QualityCheck, QualityCheckStatus } from './qualityChecks';
import type { SelectionProgress } from './selectionProgress';

const LATEST_RECEIPT = 'test-results/quality/changed.json';
type Selection = Awaited<ReturnType<typeof runChangedVerification>>;
type Failure =
  | 'PREPARATION_FAILED'
  | 'QUALITY_CHECK_FAILED'
  | 'SELECTION_FAILED'
  | 'RECEIPT_MISMATCH'
  | 'INPUT_UNSTABLE'
  | 'ARTIFACT_WRITE_FAILED'
  | 'INTERRUPTED';

type QualityOptions = {
  base?: string;
  env?: NodeJS.ProcessEnv;
  forceFull?: boolean;
  shadow?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: SelectionProgress) => void | Promise<void>;
};

class InputUnstableError extends Error {}

const reconcileSelection = (
  root: string,
  result: Selection,
  expected: {
    base: string;
    head: string;
    inputDigest: string;
    snapshotDigest: string;
    forceFull: boolean;
    shadow: boolean;
  },
) => {
  const { decision, partial, full, effectiveSelectionDigest } = result;
  if (
    result.status !== 'passed' ||
    result.phase !== 'complete' ||
    result.failure !== null ||
    !decision ||
    decision.base !== expected.base ||
    decision.head !== expected.head ||
    decision.snapshotDigest !== expected.snapshotDigest ||
    result.shadowRequested !== expected.shadow ||
    (expected.forceFull && decision.mode !== 'full-required')
  )
    throw new Error('差分選択の結果と固定入力が一致しません。');

  if (decision.mode === 'full-required') {
    if (
      result.noOp ||
      !partial ||
      !full ||
      !isDeepStrictEqual(partial, full) ||
      effectiveSelectionDigest !== decision.fullPlanDigest ||
      result.shadow !== null
    )
      throw new Error('全件fallbackの実行記録が一致しません。');
  } else {
    const noOp = decision.mode === 'docs-only';
    if (
      result.noOp !== noOp ||
      (noOp
        ? partial !== null ||
          effectiveSelectionDigest !== null ||
          decision.requestedRequiredKeys.length > 0
        : !partial || !effectiveSelectionDigest) ||
      (expected.shadow
        ? !full ||
          full.verificationId === partial?.verificationId ||
          result.shadow?.status !== 'matched'
        : full !== null || result.shadow !== null)
    )
      throw new Error('差分・shadow・NoOpの実行記録が一致しません。');
  }

  const decisionDigest = createHash('sha256')
    .update(`${JSON.stringify(decision)}\n`)
    .digest('hex');
  const children = [
    ...(partial && decision.mode === 'partial'
      ? [{ child: partial, mode: 'partial' as const }]
      : []),
    ...(full ? [{ child: full, mode: 'full-required' as const }] : []),
  ];
  return children.map(({ child, mode }) => {
    const { receipt, plan, inputsStart } = loadVerificationArtifacts(
      root,
      child.verificationId,
    );
    const requiredKeys = new Set(plan.requirements.map(({ key }) => key));
    const expectedDigest =
      mode === 'full-required'
        ? decision.fullPlanDigest
        : effectiveSelectionDigest;
    if (
      child.status !== 'passed' ||
      receipt.mode !== mode ||
      inputsStart.root !== root ||
      inputsStart.digest !== expected.inputDigest ||
      !isDeepStrictEqual(receipt.verification?.counts, child.counts) ||
      !isDeepStrictEqual(receipt.selection, {
        snapshotDigest: expected.snapshotDigest,
        fullPlanDigest: decision.fullPlanDigest,
        decisionDigest,
      }) ||
      receipt.selectionDigest !== expectedDigest ||
      decision.requestedRequiredKeys.some((key) => !requiredKeys.has(key))
    )
      throw new Error('子receiptの実行集合または選択由来が一致しません。');
    return child.verificationId;
  });
};

/** 固定入力の共通検査から差分実行・子receipt照合までを一つのrunにまとめる。 */
export const runQualityChanged = async (
  root: string,
  options: QualityOptions = {},
) => {
  const qualityId = randomBytes(6).toString('hex');
  const receiptPath = `test-results/verification/${qualityId}/quality-receipt.json`;
  const forceFull = options.forceFull === true;
  const shadow = options.shadow !== false;
  const state: {
    schemaVersion: 1;
    qualityId: string;
    receiptPath: string;
    status: 'running' | 'passed' | 'failed';
    phase: string;
    base: string | null;
    head: string | null;
    inputDigest: string | null;
    snapshotDigest: string | null;
    checks: Partial<Record<QualityCheck, QualityCheckStatus>>;
    selection: ReturnType<typeof selectionConsoleSummary> | null;
    selectionReceiptPath: string | null;
    verifiedRunIds: string[];
    failure: Failure | null;
  } = {
    schemaVersion: 1,
    qualityId,
    receiptPath,
    status: 'running',
    phase: 'preparation',
    base: null,
    head: null,
    inputDigest: null,
    snapshotDigest: null,
    checks: {},
    selection: null,
    selectionReceiptPath: null,
    verifiedRunIds: [],
    failure: null,
  };
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  const { signal } = controller;
  let worktreeRoot: string | undefined;
  let hasDirectory = false;
  let failure: Failure = 'PREPARATION_FAILED';
  const save = () => {
    if (!worktreeRoot || !hasDirectory) return;
    const contents = `${JSON.stringify(state, null, 2)}\n`;
    writeArtifact(worktreeRoot, receiptPath, contents);
    writeArtifact(worktreeRoot, LATEST_RECEIPT, contents);
  };
  options.signal?.addEventListener('abort', interrupt, { once: true });
  if (options.signal?.aborted) interrupt();
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    const physicalRoot = await realpath(root);
    worktreeRoot = physicalRoot;
    const directory = prepareVerificationDirectory(physicalRoot, qualityId);
    hasDirectory = true;
    save();
    signal.throwIfAborted();
    const env = { ...(options.env ?? process.env) };
    const revisions = await resolveRevisions({
      root: physicalRoot,
      env,
      ...(!isNil(options.base) ? { base: options.base } : {}),
    });
    const gitOptions =
      revisions.mode === 'ci'
        ? ciSnapshotOptions(revisions.eventPolicy)
        : {
            base: revisions.base,
            expectedHead: revisions.head,
            mode: revisions.mode,
          };
    state.base = gitOptions.base;
    state.head = revisions.head;
    const capture = async () => {
      const inputs = await captureInputs(physicalRoot);
      const { snapshot } = captureGitSnapshot({
        root: physicalRoot,
        ...gitOptions,
        runtimeInputPaths: inputs.files.map(({ path }) => path),
      });
      return { inputDigest: inputs.digest, snapshotDigest: snapshot.digest };
    };
    const initial = await capture();
    state.inputDigest = initial.inputDigest;
    state.snapshotDigest = initial.snapshotDigest;
    const checkpoint = async () => {
      signal.throwIfAborted();
      try {
        const current = await capture();
        if (
          !isDeepStrictEqual(initial, current) ||
          (revisions.mode === 'ci' &&
            !isDeepStrictEqual(
              revisions,
              await resolveRevisions({ root: physicalRoot, env }),
            ))
        )
          throw new Error('品質検査中に固定入力が変化しました。');
      } catch {
        throw new InputUnstableError();
      }
      signal.throwIfAborted();
    };
    state.phase = 'quality-checks';
    failure = 'QUALITY_CHECK_FAILED';
    await runQualityChecks({
      root: physicalRoot,
      directory,
      env,
      signal,
      checkpoint,
      onStage: (name, status) => {
        state.phase = name;
        state.checks[name] = status;
        save();
      },
    });
    state.phase = 'selection';
    failure = 'SELECTION_FAILED';
    save();
    let selection: Selection;
    try {
      selection = await runChangedVerification(physicalRoot, {
        ...(revisions.mode === 'local' ? { base: revisions.base } : {}),
        env,
        forceFull,
        shadow,
        signal,
        onReceipt: ({ phase, receiptPath }) => {
          state.phase = phase;
          state.selectionReceiptPath = receiptPath;
          try {
            save();
          } catch (error) {
            failure = 'ARTIFACT_WRITE_FAILED';
            throw error;
          }
        },
        ...(isNil(options.onProgress)
          ? {}
          : { onProgress: options.onProgress }),
      });
      state.selection = selectionConsoleSummary(selection);
    } finally {
      await checkpoint();
    }
    if (selection.status !== 'passed')
      throw new Error('差分検証に失敗しました。');

    state.phase = 'receipt';
    failure = 'RECEIPT_MISMATCH';
    try {
      state.verifiedRunIds = reconcileSelection(physicalRoot, selection, {
        ...initial,
        base: gitOptions.base,
        head: revisions.head,
        forceFull:
          forceFull ||
          (revisions.mode === 'ci' &&
            revisions.eventPolicy.execution === 'full-required'),
        shadow,
      });
    } finally {
      await checkpoint();
    }
    state.status = 'passed';
    state.phase = 'complete';
  } catch (error) {
    state.status = 'failed';
    state.failure = signal.aborted
      ? 'INTERRUPTED'
      : error instanceof InputUnstableError
        ? 'INPUT_UNSTABLE'
        : failure;
  } finally {
    options.signal?.removeEventListener('abort', interrupt);
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
  try {
    save();
  } catch {
    state.status = 'failed';
    state.phase = 'artifacts';
    state.failure = 'ARTIFACT_WRITE_FAILED';
  }
  return state;
};

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(resolve(entry)).href) {
  let args: ReturnType<typeof parseVerificationArguments> | undefined;
  try {
    args = parseVerificationArguments(['--changed', ...process.argv.slice(2)]);
  } catch {
    // 任意引数や例外本文はコンソールへ出さない。
  }
  const result = args
    ? await runQualityChanged(process.cwd(), {
        ...args,
        onProgress: writeSelectionProgress,
      })
    : { status: 'failed', phase: 'arguments', failure: 'INVALID_ARGUMENTS' };
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status !== 'passed') process.exitCode = 1;
}
