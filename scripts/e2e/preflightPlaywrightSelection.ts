import { isNil } from 'ramda';

import { discover } from './discover';
import { emitPlaywrightTestList } from './runnerSelection';
import { verificationStagePath } from './verificationContext';

import { writeFile } from 'node:fs/promises';

import type { PlaywrightRunnerSelection } from './runnerSelection';
import type { VerificationStageHooks } from './verificationContext';

/** 実行と同じtest-listでguarded再収集し、所有stage専用のCLI引数を返す。 */
export const preflightPlaywrightSelection = async (input: {
  root: string;
  config: string;
  profile: string;
  selection: PlaywrightRunnerSelection | undefined;
  verification: VerificationStageHooks | undefined;
}) => {
  const { root, config, profile, selection, verification } = input;
  if (isNil(selection)) return [];
  if (isNil(verification))
    throw new Error('runnerの絞り込みには所有verification stageが必要です。');
  verification.signal.throwIfAborted();
  await verification.checkpoint('before-filtered-discovery');
  await discover({ root, config, profile, selection });
  await verification.checkpoint('after-filtered-discovery');
  verification.signal.throwIfAborted();
  const path = verificationStagePath(
    root,
    verification.context,
    'runner-test-list.log',
  );
  await writeFile(path, emitPlaywrightTestList(selection), { flag: 'wx' });
  return ['--test-list', path];
};
