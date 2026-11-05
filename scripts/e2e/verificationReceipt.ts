import { isNil } from 'ramda';

import { compareInputs, inputFingerprintSchema } from './fingerprint';
import { parseArtifact, readArtifact } from './ledgerArtifacts';
import { digestVerificationPlan } from './verificationPlanDigest';
import { verificationReceiptSchema } from './verificationReceiptSchema';
import {
  verificationContextSchema,
  verificationPlanSchema,
} from './verificationSchema';
import { verifyResults } from './verifyResults';

import { isDeepStrictEqual } from 'node:util';

/** 保存された成功表示を信用せず、計画・入力・全runner結果を独立に再照合する。 */
export const validateVerificationArtifacts = (input: {
  plan: unknown;
  receipt: unknown;
  inputsStart: unknown;
  inputsEnd: unknown;
}) => {
  const plan = verificationPlanSchema.parse(input.plan);
  const receipt = verificationReceiptSchema.parse(input.receipt);
  const inputsStart = inputFingerprintSchema.parse(input.inputsStart);
  const inputsEnd = inputFingerprintSchema.parse(input.inputsEnd);
  const changes = compareInputs(inputsStart, inputsEnd);
  if (
    receipt.status !== 'passed' ||
    receipt.phase !== 'complete' ||
    !isNil(receipt.failure) ||
    isNil(receipt.execution) ||
    isNil(receipt.verification) ||
    receipt.selectionDigest !== digestVerificationPlan(plan) ||
    receipt.inputDigestBefore !== inputsStart.digest ||
    receipt.inputDigestAfter !== inputsEnd.digest ||
    Object.values(changes).some((paths) => paths.length > 0) ||
    !receipt.checkpoints.some(({ phase }) => phase === 'before-stages') ||
    receipt.checkpoints.some(
      ({ digest, changes: checkpointChanges }) =>
        digest !== inputsStart.digest ||
        Object.values(checkpointChanges).some((paths) => paths.length > 0),
    ) ||
    receipt.legacyLocalRequested !==
      [...plan.requirements, ...plan.allowedExtraTests].some(
        ({ profile }) => profile === 'app',
      ) ||
    (receipt.mode === 'partial' && isNil(receipt.selection))
  )
    throw new Error('検証artifactの完了状態・計画・入力が一致しません。');

  const { stages, runs } = receipt.execution;
  const phases = receipt.checkpoints.map(({ phase }) => phase);
  const requiredPhases = [
    'before-stages',
    ...stages.flatMap(({ context, evidence }) =>
      [
        ...(evidence.kind === 'storybook' ? [] : ['before-environment']),
        'before-tests',
        'after-tests',
        'after-cleanup',
      ].map((phase) => `${context.stageId}:${phase}`),
    ),
  ];
  let previous = -1;
  if (
    phases[0] !== 'before-stages' ||
    new Set(phases).size !== phases.length ||
    requiredPhases.some((phase) => {
      const index = phases.indexOf(phase);
      if (index <= previous) return true;
      previous = index;
      return false;
    })
  )
    throw new Error('検証artifactの必須checkpointが欠落・重複・順序不正です。');
  const owners = runs.map(({ runId }) => runId).filter((id) => !isNil(id));
  if (
    runs.length !== stages.length ||
    new Set(owners).size !== owners.length ||
    new Set(runs.map(({ stageId }) => stageId)).size !== runs.length ||
    stages.some(
      ({ context, evidence }) =>
        !runs.some(
          ({ stageId, runId, status }) =>
            stageId === context.stageId &&
            status === 'passed' &&
            (evidence.kind === 'storybook' ? isNil(runId) : !isNil(runId)),
        ),
    )
  )
    throw new Error('検証artifactのrunner実行記録が一致しません。');

  const verification = verifyResults({
    plan,
    verificationId: receipt.verificationId,
    selectionDigest: receipt.selectionDigest,
    inputDigestBefore: inputsStart.digest,
    inputDigestAfter: inputsEnd.digest,
    stages,
  });
  if (
    verification.issues.length > 0 ||
    !isDeepStrictEqual(verification, receipt.verification)
  )
    throw new Error('検証artifactのrunner結果・集計・cleanupが一致しません。');
  return { plan, receipt, inputsStart, inputsEnd };
};

/** unique IDの4成果物のみ読む。latest receiptへのフォールバックは禁止する。 */
export const loadVerificationArtifacts = (
  root: string,
  verificationId: string,
) => {
  const id =
    verificationContextSchema.shape.verificationId.parse(verificationId);
  const prefix = `test-results/verification/${id}`;
  const read = (file: string) =>
    parseArtifact(readArtifact(root, `${prefix}/${file}`), file);
  const validated = validateVerificationArtifacts({
    plan: read('plan.json'),
    receipt: read('receipt.json'),
    inputsStart: read('inputs-start.json'),
    inputsEnd: read('inputs-end.json'),
  });
  if (validated.receipt.verificationId !== id)
    throw new Error('検証artifactの保存先とverification IDが一致しません。');
  return validated;
};
