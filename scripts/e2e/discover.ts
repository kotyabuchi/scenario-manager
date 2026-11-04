import { discoverySchema } from './discoverySchema';

import { spawn } from 'node:child_process';
import { closeSync, openSync } from 'node:fs';
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_TIMEOUT_MS = 60_000;
const ENVIRONMENT_NAMES = new Set([
  'PATH',
  'SYSTEMROOT',
  'WINDIR',
  'COMSPEC',
  'PATHEXT',
  'TEMP',
  'TMP',
  'TMPDIR',
  'LANG',
  'LC_ALL',
  'TZ',
]);

const contained = (root: string, file: string) => {
  const path = relative(root, file);
  if (isAbsolute(path) || path === '..' || path.startsWith(`..${sep}`))
    throw new Error('列挙の設定・出力先はプロジェクト内に限定してください');
  return file;
};

/** DB・ブラウザを起動せず、隔離した子プロセスでPlaywrightの登録だけを取得する。 */
export const discover = async ({
  root,
  profile,
  config,
  setupProjects = profile === 'app' ? ['auth-setup'] : [],
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  root: string;
  profile: string;
  config: string;
  setupProjects?: string[];
  timeoutMs?: number;
}) => {
  if (!profile.trim() || !Number.isFinite(timeoutMs) || timeoutMs <= 0)
    throw new Error('profileと正のtimeoutMsが必要です');
  const physicalRoot = await realpath(root);
  const configuration = contained(
    physicalRoot,
    await realpath(resolve(root, config)),
  );
  let outputRoot = physicalRoot;
  for (const segment of ['test-results', 'discovery']) {
    outputRoot = join(outputRoot, segment);
    await mkdir(outputRoot).catch((error: unknown) => {
      if (
        !(error instanceof Error && 'code' in error && error.code === 'EEXIST')
      )
        throw error;
    });
    contained(physicalRoot, await realpath(outputRoot));
  }
  const directory = await mkdtemp(join(outputRoot, 'run-'));
  await mkdir(join(directory, 'cache'));
  await writeFile(join(directory, 'empty.env'), '');
  // アプリのProcessEnv拡張には必須secret名もあるため、型を保った複製から実値を除去する。
  const environment = { ...process.env };
  for (const name of Object.keys(environment)) {
    if (!ENVIRONMENT_NAMES.has(name.toUpperCase()))
      Reflect.deleteProperty(environment, name);
  }
  Object.assign(environment, {
    CI: '1',
    FORCE_COLOR: '0',
    NO_COLOR: '1',
    E2E_DISCOVERY_DIRECTORY: directory,
    E2E_DISCOVERY_ROOT: physicalRoot,
    E2E_DISCOVERY_PROFILE: profile,
    E2E_DISCOVERY_SETUP_PROJECTS: JSON.stringify(setupProjects),
    PWTEST_CACHE_DIR: join(directory, 'cache'),
    DOTENV_CONFIG_PATH: join(directory, 'empty.env'),
  });
  const toolDirectory = dirname(fileURLToPath(import.meta.url));
  const cli = createRequire(join(physicalRoot, 'package.json')).resolve(
    '@playwright/test/cli',
  );
  environment.E2E_DISCOVERY_PLAYWRIGHT_PACKAGE = await realpath(
    createRequire(cli).resolve('playwright/package.json'),
  );
  const args = [
    '--enable-source-maps',
    '--require',
    join(toolDirectory, 'discoveryGuard.cjs'),
    '--require',
    join(toolDirectory, 'discoverySourceMaps.cjs'),
    cli,
    'test',
    '--list',
    '--config',
    configuration,
    '--reporter',
    join(toolDirectory, 'reporters/discovery.ts'),
  ];
  const stdout = openSync(join(directory, 'stdout.log'), 'wx');
  const stderr = openSync(join(directory, 'stderr.log'), 'wx');
  let didTimeout = false;
  try {
    const completion = await new Promise<{
      code: number | null;
      signal: NodeJS.Signals | null;
    }>((fulfill, reject) => {
      const child = spawn(process.execPath, args, {
        cwd: physicalRoot,
        env: environment,
        stdio: ['ignore', stdout, stderr],
        windowsHide: true,
      });
      const timeout = setTimeout(() => {
        didTimeout = true;
        child.kill();
      }, timeoutMs);
      child.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.once('close', (code, signal) => {
        clearTimeout(timeout);
        fulfill({ code, signal });
      });
    });
    const violations = await readFile(
      join(directory, 'violations.jsonl'),
      'utf8',
    ).catch((error: unknown) => {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
        return '';
      throw error;
    });
    if (violations.trim())
      throw new Error(
        `列挙中の副作用を検出しました: code=${completion.code}, signal=${completion.signal}; ${directory}/violations.jsonl`,
      );
    if (didTimeout || completion.code !== 0 || completion.signal)
      throw new Error(
        `Playwright列挙に失敗しました: code=${completion.code}, signal=${completion.signal}, timeout=${didTimeout}; logs=${directory}`,
      );
    let report: unknown;
    try {
      report = JSON.parse(
        await readFile(join(directory, 'discovery.json'), 'utf8'),
      );
    } catch (cause) {
      throw new Error(
        `列挙reportが欠落または不正です: ${directory}/discovery.json`,
        { cause },
      );
    }
    const discovery = discoverySchema.parse(report);
    if (discovery.profile !== profile || discovery.errors.length > 0)
      throw new Error(
        `列挙reportが失敗を記録しています: ${JSON.stringify(discovery.errors)}; logs=${directory}`,
      );
    return discovery;
  } finally {
    closeSync(stdout);
    closeSync(stderr);
  }
};
