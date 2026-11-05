import { verificationStagePath } from './verificationContext';

import { lstatSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { VerificationContext } from './verificationSchema';

const paths = (root: string, context: VerificationContext) => {
  const stage = dirname(
    verificationStagePath(root, context, 'playwright.json'),
  );
  const directory = join(stage, 'storybook-server');
  return {
    directory,
    cwd: join(directory, 'cwd'),
    envDir: join(directory, 'env'),
    outputDir: join(directory, 'build'),
    previewConfig: join(directory, 'preview.config.mjs'),
  };
};

/** StorybookとViteが参照する空directoryを、親が準備したstage内だけに限定する。 */
export const readStorybookVerificationWorkspace = (
  root: string,
  context: VerificationContext,
) => {
  const workspace = paths(root, context);
  for (const directory of [
    workspace.directory,
    workspace.cwd,
    workspace.envDir,
    workspace.outputDir,
  ]) {
    const stat = lstatSync(directory);
    if (
      !stat.isDirectory() ||
      stat.isSymbolicLink() ||
      realpathSync(directory) !== directory
    )
      throw new Error('Storybook所有directoryが不正です。');
  }
  return workspace;
};

/** rootの環境fileを動かさず、新規stage専用の読込根とpreview設定を作る。 */
export const createStorybookVerificationWorkspace = (
  root: string,
  context: VerificationContext,
) => {
  const workspace = paths(root, context);
  for (const directory of [
    workspace.directory,
    workspace.cwd,
    workspace.envDir,
    workspace.outputDir,
  ])
    mkdirSync(directory, { mode: 0o700 });
  writeFileSync(
    join(workspace.cwd, 'package.json'),
    '{"private":true,"type":"module"}\n',
    { flag: 'wx', mode: 0o600 },
  );
  writeFileSync(
    workspace.previewConfig,
    `export default ${JSON.stringify({
      root: workspace.cwd,
      envDir: workspace.envDir,
      build: { outDir: workspace.outputDir },
      preview: { host: '127.0.0.1', port: 6007, strictPort: true, open: false },
    })}\n`,
    { flag: 'wx', mode: 0o600 },
  );
  return readStorybookVerificationWorkspace(root, context);
};
