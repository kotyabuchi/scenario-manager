import { isNil } from 'ramda';

import type { VerificationStageResult } from './verificationSchema';

/** 次の所有環境を起動してよいのは、前stageの実終了と全資源解放が確定した場合だけ。 */
export const hasReleasedStageResources = (stage: VerificationStageResult) => {
  if (
    !stage.processCleanup.exited ||
    stage.processCleanup.errorCount !== 0 ||
    isNil(stage.exitCode) ||
    !isNil(stage.signal)
  )
    return false;
  if (stage.evidence.kind === 'storybook')
    return isNil(stage.cleanup) && stage.processCleanup.errorCount === 0;
  return (
    !isNil(stage.cleanup) &&
    stage.cleanup.status === 'complete' &&
    stage.cleanup.issues.length === 0 &&
    Object.values(stage.cleanup.remaining).every(
      (resources) => resources.length === 0,
    )
  );
};
