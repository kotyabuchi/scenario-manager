import { digestVerificationPlan } from '../verificationPlanDigest';
import { verificationFixture } from './verification';

import type { VerificationReceipt } from '../verificationReceiptSchema';
import type { VerificationRunOptions } from '../verificationRun';

/** 差分rootの制御だけを検査するowner mock。receiptの実証には使用しない。 */
export const createVerificationRunResult = (
  options: VerificationRunOptions | undefined,
  verificationId: string,
  status: 'passed' | 'failed' = 'passed',
): VerificationReceipt => {
  const { prepared } = options ?? {};
  if (prepared === undefined) throw new Error('fixtureの実行plan不足');
  return {
    schemaVersion: 1,
    verificationId,
    mode: options?.mode ?? 'full-required',
    selection: options?.selection ?? null,
    status,
    phase: status === 'passed' ? 'complete' : 'verification',
    selectionDigest: digestVerificationPlan(prepared.plan),
    inputDigestBefore: prepared.inputs.digest,
    inputDigestAfter: prepared.inputs.digest,
    checkpoints: [],
    execution: { stages: [verificationFixture().stage], runs: [] },
    verification: null,
    failure: null,
    legacyLocalRequested: prepared.plan.requirements.some(
      ({ profile }) => profile === 'app',
    ),
    integrationLegacyExecuted: false,
  };
};
