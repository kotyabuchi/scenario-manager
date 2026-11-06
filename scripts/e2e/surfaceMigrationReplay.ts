import { z } from 'zod';

import { localCommandEnvironment } from './environmentCommands';
import { assertGitCommit, gitRead } from './gitObjects';
import { parseArtifact, readArtifact } from './ledgerArtifacts';
import {
  SURFACE_MIGRATION_INTRODUCTION,
  SURFACE_MIGRATION_V1_ORIGIN,
  surfaceMigrationHistoryProofSchema,
} from './surfaceMigrationHistory';
import {
  runSurfaceReplayProcess,
  UnsettledSurfaceReplayProcess,
} from './surfaceMigrationReplayProcess';
import { readRevisionFile } from './trustedRevision';

import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { devNull, platform, tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { BigIntStats } from 'node:fs';

const INTRODUCTION = SURFACE_MIGRATION_INTRODUCTION;
const ORIGIN = SURFACE_MIGRATION_V1_ORIGIN;
const NODE_VERSION = 'v24.12.0';
const PNPM_VERSION = '10.33.0';
const HISTORICAL_RECEIPT = 'test-results/quality/static-gate.json';
const digest = z.string().regex(/^[a-f0-9]{64}$/u);
const childReceiptSchema = z.object({
  stage: z.literal('M1-static'),
  status: z.literal('passed'),
  mode: z.literal('local'),
  base: z.literal(ORIGIN),
  head: z.literal(INTRODUCTION),
  issues: z.array(z.unknown()).length(0),
  isBootstrap: z.literal(false),
  observationBaseSha: z.literal(ORIGIN),
  surfaceMigrationOrigin: z.strictObject({
    kind: z.literal('static-base'),
    staticBaseSha: z.literal(ORIGIN),
    observationBaseSha: z.literal(ORIGIN),
  }),
  surfaceMigrationSnapshotDigest: digest,
  baselineDigest: digest,
  surfaceMigrationDigest: digest,
  surfacePendingDigest: digest,
});

const contained = (parent: string, path: string) => {
  const nested = relative(parent, path);
  return (
    nested &&
    !isAbsolute(nested) &&
    nested !== '..' &&
    !nested.startsWith(`..${sep}`)
  );
};

const entryExists = async (path: string) => {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return false;
    throw error;
  }
};

const replayTempRoot = async (root: string) => {
  const tempRoot = await realpath(tmpdir());
  if (
    tempRoot === root ||
    contained(root, tempRoot) ||
    !(await lstat(tempRoot)).isDirectory()
  )
    throw new Error(
      '歴史再生の一時directoryはリポジトリ外に限定してください。',
    );
  // TS/Nodeが上位のpackageや現行node_modulesへ解決を広げる場所は使わない。
  for (let path = tempRoot; ; path = dirname(path)) {
    if (
      (await entryExists(join(path, 'package.json'))) ||
      (await entryExists(join(path, 'node_modules')))
    )
      throw new Error('歴史再生の一時directoryに上位packageがあります。');
    if (dirname(path) === path) return tempRoot;
  }
};

const assertCheckoutFile = async (
  checkout: string,
  path: string,
  expected: string,
) => {
  const file = join(checkout, path);
  const stat = await lstat(file);
  if (
    !stat.isFile() ||
    (await realpath(file)) !== file ||
    !(await readFile(file)).equals(Buffer.from(expected))
  )
    throw new Error('歴史再生の固定ファイルが一致しません。');
};

const removeOwnedDirectory = async (path: string, identity: BigIntStats) => {
  const current = await lstat(path, { bigint: true });
  if (
    !current.isDirectory() ||
    current.dev !== identity.dev ||
    current.ino !== identity.ino ||
    (await realpath(path)) !== path
  )
    throw new Error('歴史再生の所有directoryが置換されています。');
  await rm(path, { recursive: true });
};

/** 固定した旧CLIを独立した所有checkoutで再実行し、公開用digestだけを返す。 */
export const replaySurfaceMigration = async (input: {
  root: string;
  directory: string;
  signal?: AbortSignal;
}) => {
  if (platform() !== 'linux')
    throw new Error('歴史再生はLinuxの所有process群で実行してください。');
  if (process.version !== NODE_VERSION)
    throw new Error('歴史再生のNodeの版が一致しません。');
  input.signal?.throwIfAborted();
  const root = await realpath(input.root);
  const logs = resolve(input.directory);
  if (
    !contained(join(root, 'test-results'), logs) ||
    (await realpath(dirname(logs))) !== dirname(logs)
  )
    throw new Error('歴史再生のlog directoryが不正です。');
  const tempRoot = await replayTempRoot(root);
  const old = assertGitCommit(root, ORIGIN);
  const introduction = assertGitCommit(root, INTRODUCTION);
  gitRead(root, ['merge-base', '--is-ancestor', old, introduction]);
  gitRead(root, ['merge-base', '--is-ancestor', introduction, 'HEAD']);
  const donor = await realpath(
    gitRead(root, ['rev-parse', '--path-format=absolute', '--git-common-dir'])
      .toString('utf8')
      .trim(),
  );
  const manifest = readRevisionFile(root, introduction, 'package.json');
  const lock = readRevisionFile(root, introduction, 'pnpm-lock.yaml');
  if (manifest === undefined || lock === undefined)
    throw new Error('歴史再生の固定依存ファイルがありません。');

  await mkdir(logs, { mode: 0o700 });
  const logIdentity = await lstat(logs, { bigint: true });
  const directory = await mkdtemp(join(tempRoot, 'scenario-e2e-surface-'));
  const identity = await lstat(directory, { bigint: true });
  const checkout = join(directory, 'checkout');
  const home = join(directory, 'home');
  const temp = join(directory, 'tmp');
  const env = localCommandEnvironment(process.env);
  for (const key of Object.keys(env))
    if (key !== 'PATH') Reflect.deleteProperty(env, key);
  Object.assign(env, {
    HOME: home,
    XDG_CONFIG_HOME: home,
    TMPDIR: temp,
    LANG: 'C.UTF-8',
    NO_COLOR: '1',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: devNull,
    GIT_ATTR_NOSYSTEM: '1',
    GIT_TERMINAL_PROMPT: '0',
    GIT_NO_LAZY_FETCH: '1',
    GIT_GRAFT_FILE: devNull,
    npm_config_userconfig: devNull,
    npm_config_globalconfig: devNull,
  });
  const run = async (
    label: string,
    executable: string,
    args: string[],
    captureStdout = false,
  ) => {
    const log = join(logs, `${label}.private.log`);
    const stdoutFile = captureStdout
      ? join(logs, `${label}.stdout.private.log`)
      : undefined;
    try {
      await runSurfaceReplayProcess(executable, args, {
        cwd: checkout,
        env,
        log,
        ...(stdoutFile === undefined ? {} : { stdoutFile }),
        ...(input.signal ? { signal: input.signal } : {}),
      });
    } catch (error) {
      if (error instanceof UnsettledSurfaceReplayProcess) throw error;
      throw new Error(`歴史再生の処理に失敗しました: ${label}`, {
        cause: error,
      });
    }
    return stdoutFile ?? log;
  };
  const git = (label: string, args: string[], captureStdout = false) =>
    run(
      label,
      'git',
      [
        '--no-replace-objects',
        '-c',
        `core.hooksPath=${join(directory, 'no-hooks')}`,
        '-c',
        'core.autocrlf=false',
        '-c',
        'core.fsmonitor=false',
        '-c',
        'gc.auto=0',
        '-c',
        'maintenance.auto=false',
        '-c',
        'protocol.allow=never',
        '-c',
        'protocol.file.allow=always',
        ...args,
      ],
      captureStdout,
    );
  const verifyCheckout = async (phase: 'before' | 'after') => {
    const head = await git(`${phase}-head`, ['rev-parse', 'HEAD'], true);
    const status = await git(
      `${phase}-status`,
      ['status', '--porcelain=v1', '--untracked-files=all'],
      true,
    );
    if (
      (await readFile(head, 'utf8')).trim() !== introduction ||
      (await readFile(status, 'utf8')).trim() !== ''
    )
      throw new Error('歴史再生のcheckoutが固定commitと一致しません。');
    await assertCheckoutFile(checkout, 'package.json', manifest);
    await assertCheckoutFile(checkout, 'pnpm-lock.yaml', lock);
  };
  let canRemove = true;
  let succeeded = false;
  try {
    for (const path of [checkout, home, temp])
      await mkdir(path, { mode: 0o700 });
    await git('init', ['init', '--template=', '--object-format=sha1']);
    await git('fetch', [
      'fetch',
      '--no-tags',
      '--no-recurse-submodules',
      '--no-write-fetch-head',
      pathToFileURL(donor).href,
      introduction,
    ]);
    await git('checkout', ['checkout', '--detach', introduction]);
    await git('ancestor', ['merge-base', '--is-ancestor', old, introduction]);
    await verifyCheckout('before');
    const version = await run('pnpm-version', 'pnpm', ['--version'], true);
    if ((await readFile(version, 'utf8')).trim() !== PNPM_VERSION)
      throw new Error('歴史再生のpnpmの版が一致しません。');
    await run('pnpm-install', 'pnpm', [
      'install',
      '--frozen-lockfile',
      '--ignore-scripts',
      '--package-import-method=copy',
      '--verify-store-integrity=true',
      '--store-dir',
      join(directory, 'store'),
    ]);
    await assertCheckoutFile(checkout, 'node_modules/.pnpm/lock.yaml', lock);
    const require = createRequire(join(checkout, 'package.json'));
    const panda = join(
      dirname(require.resolve('@pandacss/dev/package.json')),
      'bin.js',
    );
    await run('panda', process.execPath, [
      panda,
      'codegen',
      '--cwd',
      checkout,
      '--config',
      'panda.config.ts',
      '--silent',
    ]);
    await run('static-gate', process.execPath, [
      require.resolve('tsx/cli'),
      'scripts/e2e/ledgerCheck.ts',
      '--base',
      old,
    ]);
    await verifyCheckout('after');
    await assertCheckoutFile(checkout, 'node_modules/.pnpm/lock.yaml', lock);
    const receipt = childReceiptSchema.parse(
      parseArtifact(
        readArtifact(checkout, HISTORICAL_RECEIPT),
        HISTORICAL_RECEIPT,
      ),
    );
    input.signal?.throwIfAborted();
    const proof = surfaceMigrationHistoryProofSchema.parse({
      schemaVersion: 1,
      observationBaseSha: receipt.base,
      introductionSha: receipt.head,
      snapshotDigest: receipt.surfaceMigrationSnapshotDigest,
      baselineDigest: receipt.baselineDigest,
      surfaceMigrationDigest: receipt.surfaceMigrationDigest,
      surfacePendingDigest: receipt.surfacePendingDigest,
    });
    succeeded = true;
    return proof;
  } catch (error) {
    canRemove = !(error instanceof UnsettledSurfaceReplayProcess);
    if (!canRemove)
      await writeFile(
        join(logs, 'retained-workspace.private.log'),
        `${directory}\n`,
        { mode: 0o600, flag: 'wx' },
      ).catch(() => {});
    throw error;
  } finally {
    if (canRemove) await removeOwnedDirectory(directory, identity);
    if (succeeded) await removeOwnedDirectory(logs, logIdentity);
  }
};
