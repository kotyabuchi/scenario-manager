import { isNil } from 'ramda';

import { verificationContextSchema } from './verificationSchema';

import { lstatSync, mkdirSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';

import type { ReporterDescription } from '@playwright/test';
import type { VerificationContext } from './verificationSchema';

const ENVIRONMENT_KEYS = {
  verificationId: 'SCENARIO_E2E_VERIFICATION_ID',
  stageId: 'SCENARIO_E2E_STAGE_ID',
  selectionDigest: 'SCENARIO_E2E_SELECTION_DIGEST',
  inputDigest: 'SCENARIO_E2E_INPUT_DIGEST',
} as const;

/** 通常の個別runner起動は未設定を許し、一部だけのcontextは拒否する。 */
export const readVerificationContext = (
  env: Partial<NodeJS.ProcessEnv> = process.env,
) => {
  const values = Object.fromEntries(
    Object.entries(ENVIRONMENT_KEYS).map(([key, variable]) => [
      key,
      env[variable],
    ]),
  );
  if (Object.values(values).every(isNil)) return null;
  return verificationContextSchema.parse(values);
};

/** 子runnerへ渡す値はこのrunの固定contextだけから作る。 */
export const verificationEnvironment = (context: VerificationContext) => {
  const parsed = verificationContextSchema.parse(context);
  return Object.fromEntries(
    Object.entries(ENVIRONMENT_KEYS).map(([key, variable]) => [
      variable,
      Reflect.get(parsed, key) as string,
    ]),
  );
};

const assertDirectory = (path: string) => {
  const stat = lstatSync(path);
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    realpathSync(path) !== path
  )
    throw new Error('verification出力directoryが不正です。');
};

const directories = (root: string, verificationId: string) => {
  if (!/^[a-f0-9]{12}$/.test(verificationId))
    throw new Error('verification IDが不正です。');
  const base = resolve(root);
  assertDirectory(base);
  return [
    join(base, 'test-results'),
    join(base, 'test-results', 'verification'),
    join(base, 'test-results', 'verification', verificationId),
  ];
};

/** 新しい最上位runだけを作成し、以前のreceiptを再使用しない。 */
export const prepareVerificationDirectory = (root: string, id: string) => {
  const paths = directories(root, id);
  for (const [index, path] of paths.entries()) {
    try {
      mkdirSync(path, { mode: 0o700 });
    } catch (error) {
      if (index === paths.length - 1) throw error;
      if (
        !(error instanceof Error) ||
        !('code' in error) ||
        error.code !== 'EEXIST'
      )
        throw error;
    }
    assertDirectory(path);
  }
  return join(resolve(root), 'test-results', 'verification', id);
};

/** 子stageも一度だけ作成する。共有directoryの再帰作成はしない。 */
export const prepareVerificationStage = (
  root: string,
  context: VerificationContext,
) => {
  const parsed = verificationContextSchema.parse(context);
  for (const path of directories(root, parsed.verificationId))
    assertDirectory(path);
  const path = join(
    resolve(root),
    'test-results',
    'verification',
    parsed.verificationId,
    parsed.stageId,
  );
  mkdirSync(path, { mode: 0o700 });
  assertDirectory(path);
  return path;
};

/** reporterとreaderは親が準備した物理directory内だけを使用する。 */
export const verificationStagePath = (
  root: string,
  context: VerificationContext,
  filename: string,
) => {
  const parsed = verificationContextSchema.parse(context);
  if (!/^[a-z][a-z0-9-]*\.(json|log)$/.test(filename))
    throw new Error('verification出力名が不正です。');
  for (const path of directories(root, parsed.verificationId))
    assertDirectory(path);
  const parent = join(
    resolve(root),
    'test-results',
    'verification',
    parsed.verificationId,
    parsed.stageId,
  );
  assertDirectory(parent);
  return join(parent, filename);
};

/** standalone実行の既存reporterを維持し、統合runだけ標準証跡を追加する。 */
export const playwrightVerificationReporter = (
  path: string,
  profile: string,
): ReporterDescription[] =>
  isNil(readVerificationContext()) ? [] : [[path, { profile }]];

type VerificationStageHooks = {
  context: VerificationContext;
  signal: AbortSignal;
  checkpoint: (phase: string) => Promise<void>;
  onExit: (result: { exitCode: number | null; signal: string | null }) => void;
};

export type { VerificationStageHooks };
