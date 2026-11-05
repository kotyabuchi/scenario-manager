import { isNil } from 'ramda';

import {
  localCommandEnvironment,
  runLocalCommand,
} from './environmentCommands';
import { captureInputs } from './fingerprint';
import { resolveStorybookVerificationCli } from './storybookVerificationCli';
import { createStorybookVerificationWorkspace } from './storybookVerificationWorkspace';
import {
  readVerificationContext,
  verificationEnvironment,
  verificationStagePath,
} from './verificationContext';

import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * build/previewを直列実行する。通常停止はPlaywrightの所有process-tree/group killに委ねる。
 * WindowsではgracefulShutdownが使えないため、親の実closeと6007解放を完了証拠にする。
 * wrapper handlerの実行やpreview private logの最終保存は成功条件にしない。
 */
export const runStorybookVerificationServer = async (
  root: string,
  signal: AbortSignal,
) => {
  const context = readVerificationContext();
  if (isNil(context))
    throw new Error('Storybook verification contextが必要です。');
  signal.throwIfAborted();
  const workspace = createStorybookVerificationWorkspace(root, context);
  const storybookCli = resolveStorybookVerificationCli(root, 'storybook');
  const viteCli = resolveStorybookVerificationCli(root, 'vite');
  const env: NodeJS.ProcessEnv = {
    ...localCommandEnvironment(process.env),
    ...verificationEnvironment(context),
    NODE_ENV: 'production',
    STORYBOOK_PROJECT_ROOT: root,
    STORYBOOK_DISABLE_TELEMETRY: '1',
    // 元repoのNext設定を使っても、dotenv値をprocess.envへ再反映させない。
    __NEXT_PROCESSED_ENV: 'true',
  };
  await runLocalCommand(
    'node',
    [
      storybookCli,
      'build',
      '--config-dir',
      join(root, '.storybook'),
      '--output-dir',
      workspace.outputDir,
      '--disable-telemetry',
    ],
    {
      cwd: workspace.cwd,
      env,
      signal,
      log: verificationStagePath(root, context, 'storybook-build-private.log'),
    },
  );
  signal.throwIfAborted();
  if ((await captureInputs(root)).digest !== context.inputDigest)
    throw new Error('Storybook build中に検証入力が変化しました。');
  await runLocalCommand(
    'node',
    [
      viteCli,
      'preview',
      '--config',
      workspace.previewConfig,
      '--outDir',
      workspace.outputDir,
      '--host',
      '127.0.0.1',
      '--port',
      '6007',
      '--strictPort',
    ],
    {
      cwd: workspace.cwd,
      env,
      signal,
      shouldAllowAbort: true,
      log: verificationStagePath(
        root,
        context,
        'storybook-preview-private.log',
      ),
    },
  );
};

const entry = process.argv[1];
if (!isNil(entry) && resolve(entry) === fileURLToPath(import.meta.url)) {
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    await runStorybookVerificationServer(process.cwd(), controller.signal);
  } catch {
    // 生のSDK/環境値は出さず、private runner logには固定文言だけを残す。
    process.stderr.write('Storybook verification serverが失敗しました。\n');
    process.exitCode = 1;
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
}
