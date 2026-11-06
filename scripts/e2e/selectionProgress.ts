import { writeProgressStderr } from './progressStderr';

import type { prepareChangedVerification } from './prepareChangedVerification';

type PreparationPhase = Parameters<
  NonNullable<Parameters<typeof prepareChangedVerification>[0]['onPhase']>
>[0];

type SelectionProgress = {
  phase:
    | PreparationPhase
    | 'preparation'
    | 'no-op'
    | 'full-required'
    | 'partial'
    | 'partial-cleanup-check'
    | 'shadow-full';
  selectionId: string;
  receiptPath: string;
};

/** 任意のログや例外本文を混ぜず、差分検証の進捗だけを表示する。 */
export const writeSelectionProgress = ({
  phase,
  selectionId,
  receiptPath,
}: SelectionProgress) => {
  writeProgressStderr(
    `[e2e-selection] ${JSON.stringify({ phase, selectionId, receiptPath })}\n`,
  );
};

export type { SelectionProgress };
