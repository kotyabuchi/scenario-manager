import { isNil } from 'ramda';

import { runLocalCommand } from './environmentCommands';
import { environmentManifestSchema } from './environmentSchema';

import {
  lstat,
  mkdir,
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

export const SUPABASE_CLI_VERSION =
  environmentManifestSchema.shape.cliVersion.value;
const PROBE_PREFIX = 'scenario-manager-supabase-cli-';

const ensureCacheDirectory = async (directory: string) => {
  try {
    await mkdir(directory);
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST'))
      throw new Error('Supabase CLIのcache directoryを作成できませんでした。');
  }
  const status = await lstat(directory);
  if (status.isSymbolicLink() || !status.isDirectory())
    throw new Error('Supabase CLIのcache directoryが不正です。');
};

/** 所有する新規projectだけに固定Go版の10時間更新cacheを用意する。 */
export const seedSupabaseUpdateCache = async (
  ownedRoot: string,
): Promise<void> => {
  const root = await realpath(ownedRoot);
  const supabase = join(root, 'supabase');
  const cache = join(supabase, '.temp');
  await ensureCacheDirectory(supabase);
  await ensureCacheDirectory(cache);
  await writeFile(join(cache, 'cli-latest'), `v${SUPABASE_CLI_VERSION}`, {
    flag: 'wx',
    mode: 0o600,
  });
};

const removeProbeDirectory = async (ownedRoot: string, parent: string) => {
  // 自分が生成したtemp直下の実path以外へ再帰削除を拡張しない。
  if (
    dirname(resolve(ownedRoot)) !== parent ||
    !basename(ownedRoot).startsWith(PROBE_PREFIX) ||
    (await realpath(ownedRoot)) !== ownedRoot
  )
    throw new Error('Supabase CLIの確認directoryを安全に削除できません。');
  await rm(ownedRoot, { recursive: true });
};

/** 固定版のhelp先頭行と正常終了を所有cwdで確認し、更新通信を避ける。 */
export const verifySupabaseCli = async (
  env: NodeJS.ProcessEnv,
  signal?: AbortSignal,
): Promise<void> => {
  signal?.throwIfAborted();
  const parent = await realpath(tmpdir());
  const ownedRoot = await mkdtemp(join(parent, PROBE_PREFIX));
  try {
    if (
      dirname(resolve(ownedRoot)) !== parent ||
      !basename(ownedRoot).startsWith(PROBE_PREFIX) ||
      (await realpath(ownedRoot)) !== ownedRoot
    )
      throw new Error('Supabase CLIの確認directoryが不正です。');
    await seedSupabaseUpdateCache(ownedRoot);
    signal?.throwIfAborted();
    const output = await runLocalCommand('supabase', ['--help'], {
      cwd: ownedRoot,
      env,
      ...(isNil(signal) ? {} : { signal }),
    });
    signal?.throwIfAborted();
    if (output.split(/\r?\n/, 1)[0] !== `Supabase CLI ${SUPABASE_CLI_VERSION}`)
      throw new Error(`Supabase CLI ${SUPABASE_CLI_VERSION}が必要です。`);
  } finally {
    await removeProbeDirectory(ownedRoot, parent);
  }
  signal?.throwIfAborted();
};
