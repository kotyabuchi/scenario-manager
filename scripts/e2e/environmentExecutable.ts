import { isNil } from 'ramda';

import { constants } from 'node:fs';
import { access, open, readFile, realpath, stat } from 'node:fs/promises';
import { delimiter, isAbsolute, join } from 'node:path';

const MAX_SHIM_BYTES = 4_096;
const MAX_SHIM_DEPTH = 8;
const MACH_HEADERS = new Set([
  'feedface',
  'cefaedfe',
  'feedfacf',
  'cffaedfe',
  'cafebabe',
  'bebafeca',
  'cafebabf',
  'bfbafeca',
]);
const isMissing = (error: unknown) =>
  error instanceof Error &&
  'code' in error &&
  (error.code === 'ENOENT' || error.code === 'ENOTDIR');

const resolveNative = async (file: string, platform: NodeJS.Platform) => {
  const visited = new Set<string>();
  let current = file;
  for (let depth = 0; depth < MAX_SHIM_DEPTH; depth++) {
    const physical = await realpath(current);
    if (visited.has(physical))
      throw new Error('実行fileのshimが循環しています。');
    visited.add(physical);
    if (!(await stat(physical)).isFile())
      throw new Error('通常の実行fileが必要です。');
    if (platform === 'win32') {
      const shim = physical.replace(/\.exe$/i, '.shim');
      let metadata: string | undefined;
      try {
        const details = await stat(shim);
        if (!details.isFile() || details.size > MAX_SHIM_BYTES)
          throw new Error('shimの定義が不正です。');
        metadata = await readFile(shim, 'utf8');
      } catch (error) {
        if (!isMissing(error)) throw error;
      }
      if (!isNil(metadata)) {
        // Scoopのpath-only shimだけを透過する。args付きや未知wrapperは推測しない。
        const target = /^\s*path\s*=\s*"([^"\r\n]+)"\s*$/.exec(metadata)?.[1];
        if (isNil(target) || !isAbsolute(target) || !/\.exe$/i.test(target))
          throw new Error('path-onlyの絶対exe shimだけを使用できます。');
        current = target;
        continue;
      }
    }
    const handle = await open(physical, 'r');
    const header = Buffer.alloc(4);
    try {
      await handle.read(header, 0, header.length, 0);
    } finally {
      await handle.close();
    }
    const isNative =
      platform === 'win32'
        ? header.subarray(0, 2).toString('ascii') === 'MZ'
        : header.toString('hex') === '7f454c46' ||
          MACH_HEADERS.has(header.toString('hex'));
    if (!isNative) throw new Error('script wrapperは実行できません。');
    if (platform !== 'win32') await access(physical, constants.X_OK);
    return physical;
  }
  throw new Error('shimの参照段数が上限を超えました。');
};

/** PATH上のnative実体を解決し、所有childのcloseが実CLI終了を示すようにする。 */
export const resolveLocalExecutable = async (
  tool: 'supabase' | 'docker' | 'git',
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform = process.platform,
): Promise<string> => {
  const key =
    platform === 'win32'
      ? Object.keys(env)
          .sort()
          .find((name) => name.toUpperCase() === 'PATH')
      : 'PATH';
  const path = isNil(key) ? '' : (env[key] ?? '');
  for (const directory of path.split(platform === 'win32' ? ';' : delimiter)) {
    if (!isAbsolute(directory)) continue;
    const file = join(directory, platform === 'win32' ? `${tool}.exe` : tool);
    try {
      await stat(file);
    } catch (error) {
      if (isMissing(error)) continue;
      throw error;
    }
    return resolveNative(file, platform);
  }
  throw new Error(`${tool}のnative実行fileがPATHにありません。`);
};
