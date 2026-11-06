import type { runChangedVerification } from './runChangedVerification';

/** 実行結果と登録・移行範囲を、端末やCIが個別に判定できる形で返す。 */
export const selectionConsoleSummary = (
  result: Awaited<ReturnType<typeof runChangedVerification>>,
) => ({
  status: result.status,
  phase: result.phase,
  selectionId: result.selectionId,
  receiptPath: 'test-results/quality/selection.json',
  runReceiptPath: result.runReceiptPath,
  mode: result.decision?.mode ?? null,
  coverageStatus: result.decision?.coverageStatus ?? null,
  coverageGapCodes: [
    ...new Set(result.decision?.coverageGaps.map(({ code }) => code)),
  ].sort(),
  noOp: result.noOp,
  // この方針は差分選択時の値。shadowで実行した事実とは区別する。
  selectedLegacyPolicy: result.decision?.legacyPolicy ?? null,
  scope: {
    required: 'registered-cases',
    integrationLegacy: 'not-executed',
  },
  integrationLegacyExecuted: false,
  shadowRequested: result.shadowRequested,
  shadowFailureClassification: {
    attributable: 'storybook-assertions',
    otherRunnerFailures: 'inconclusive',
  },
  partial: result.partial,
  full: result.full,
  shadow: result.shadow?.status ?? null,
  failure: result.failure,
});
