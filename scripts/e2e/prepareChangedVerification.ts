import { isNil } from 'ramda';

import { ciSnapshotOptions } from './ciSnapshotOptions';
import { captureInputs, compareInputs } from './fingerprint';
import { captureGitSnapshot, readSnapshotFile } from './gitSnapshot';
import { mergeImpactGraphs } from './impactGraph';
import { writeArtifact } from './ledgerArtifacts';
import { IMPACT_RULES_PATH, loadImpactRules } from './loadImpactRules';
import { provePandaOutputs } from './pandaProvenance';
import { PlaywrightSelectionRepresentationError } from './playwrightTestList';
import { prepareVerificationDetails } from './prepareVerification';
import { projectSelection, selectImpacts } from './select';
import { selectedPreparation } from './selectedPreparation';
import { selectionReason } from './selectionSchema';
import { buildSnapshotInventories } from './snapshotInventory';
import {
  baselineDigest,
  checkStaticState,
  collectStaticState,
} from './staticGate';
import { resolveRevisions } from './trustedRevision';

import { join } from 'node:path';

/** 全体整合を検査した後で、固定された旧・現ソースから実行集合を選ぶ。 */
export const prepareChangedVerification = async (input: {
  root: string;
  prefix: string;
  base?: string;
  env?: NodeJS.ProcessEnv;
  forceFull?: boolean;
  deferRunnerSelection?: boolean;
  onPhase?: (phase: 'static-ledger' | 'collection' | 'selection') => void;
  signal?: AbortSignal;
}) => {
  const { root, prefix } = input;
  const env = input.env ?? process.env;
  const save = (name: string, value: unknown) =>
    writeArtifact(
      root,
      `${prefix}/${name}.json`,
      `${JSON.stringify(value, null, 2)}\n`,
    );
  const initial = await captureInputs(root);
  input.signal?.throwIfAborted();
  const revisions = await resolveRevisions({
    root,
    env,
    ...(input.base ? { base: input.base } : {}),
  });
  const eventPolicy =
    revisions.mode === 'ci' ? revisions.eventPolicy : undefined;
  const forceFull =
    input.forceFull || eventPolicy?.execution === 'full-required';
  save('static', { status: 'running', ...revisions });
  input.onPhase?.('static-ledger');
  const state = await collectStaticState(root);
  const result = await checkStaticState({
    root,
    state,
    revisions,
    ...(env.E2E_LEDGER_BOOTSTRAP_APPROVAL
      ? { bootstrapApproval: env.E2E_LEDGER_BOOTSTRAP_APPROVAL }
      : {}),
  });
  const staticReport = {
    status: result.issues.length === 0 ? 'passed' : 'failed',
    ...revisions,
    ...result,
    baselineDigest: baselineDigest(state.baseline),
    registrations: state.registrations,
    pendingItems: state.baseline.items.length,
    legacyTests: state.legacy.tests.length,
  };
  save('static', staticReport);
  if (result.issues.length > 0)
    throw new Error('変更選択前の全体静的検査に失敗しました。');
  input.signal?.throwIfAborted();
  input.onPhase?.('collection');
  const prepared = await prepareVerificationDetails(root);
  if (
    Object.values(compareInputs(initial, prepared.inputs)).some(
      (paths) => paths.length > 0,
    )
  )
    throw new Error('静的検査中に実行入力が変化しました。');
  input.onPhase?.('selection');
  const captureOptions = {
    root,
    ...(isNil(eventPolicy)
      ? {
          base: revisions.base,
          expectedHead: revisions.head,
          mode: revisions.mode,
        }
      : ciSnapshotOptions(eventPolicy)),
    runtimeInputPaths: prepared.inputs.files.map(({ path }) => path),
  };
  const capture = captureGitSnapshot(captureOptions);
  save('git-start', capture.snapshot);
  const currentRules = readSnapshotFile(capture, 'working', IMPACT_RULES_PATH);
  if (isNil(currentRules)) throw new Error('変更影響規則がありません。');
  const rules = loadImpactRules({
    current: currentRules.toString('utf8'),
    base:
      readSnapshotFile(capture, 'base', IMPACT_RULES_PATH)?.toString('utf8') ??
      null,
    ledger: prepared.ledger,
  });
  const proof = forceFull
    ? null
    : await provePandaOutputs({
        root,
        directory: join(root, prefix, 'panda'),
        capture,
        inputs: prepared.inputs,
        ...(input.signal ? { signal: input.signal } : {}),
      });
  save('generated-inputs', proof);
  const unversioned = new Set(
    capture.snapshot.reasons
      .filter(({ code }) => code === 'UNVERSIONED_RUNTIME_INPUT')
      .flatMap(({ paths }) => paths),
  );
  const provenUnversionedPaths =
    proof?.status === 'proven'
      ? proof.paths.filter((path) => unversioned.has(path))
      : [];
  let graph: ReturnType<typeof mergeImpactGraphs>;
  try {
    graph = mergeImpactGraphs(
      buildSnapshotInventories(capture, provenUnversionedPaths),
    );
  } catch {
    // 現行依存で旧graphを再現できない場合、由来を偽装せず全件へ戻す。
    graph = mergeImpactGraphs(null);
  }
  const selectionInput = {
    snapshot: capture.snapshot,
    graph,
    rules,
    fullPlan: prepared.plan,
    ledger: prepared.ledger,
    legacy: prepared.legacy,
    baseline: state.baseline,
    provenUnversionedPaths,
    ...(forceFull ? { forceFull: true } : {}),
  };
  let decision = selectImpacts(selectionInput);
  let effective = projectSelection({
    decision,
    fullPlan: prepared.plan,
    ledger: prepared.ledger,
    legacy: prepared.legacy,
  });
  if (
    !input.deferRunnerSelection &&
    decision.mode === 'partial' &&
    !isNil(effective)
  ) {
    try {
      selectedPreparation(prepared, effective);
    } catch (error) {
      if (!(error instanceof PlaywrightSelectionRepresentationError))
        throw error;
      decision = selectImpacts({ ...selectionInput, forceFull: true });
      decision.reasons.push(
        selectionReason('RUNNER_SELECTION_UNREPRESENTABLE'),
      );
      effective = projectSelection({
        decision,
        fullPlan: prepared.plan,
        ledger: prepared.ledger,
        legacy: prepared.legacy,
      });
    }
  }
  save('decision', decision);
  save('effective-selection', effective);
  const checkpoint = async (phase: string) => {
    input.signal?.throwIfAborted();
    const currentInputs = await captureInputs(root);
    if (
      Object.values(compareInputs(initial, currentInputs)).some(
        (paths) => paths.length > 0,
      )
    )
      throw new Error('変更選択後に実行入力が変化しました。');
    const current = captureGitSnapshot({
      ...captureOptions,
      runtimeInputPaths: currentInputs.files.map(({ path }) => path),
    });
    save('git-end', { phase, ...current.snapshot });
    if (current.snapshot.digest !== capture.snapshot.digest)
      throw new Error('変更選択後にGit snapshotが変化しました。');
    return current.snapshot;
  };
  await checkpoint('selection-ready');
  return {
    revisions,
    eventPolicy,
    prepared,
    capture,
    graph,
    rules,
    decision,
    effective,
    proof,
    provenUnversionedPaths,
    staticReport,
    checkpoint,
  };
};
