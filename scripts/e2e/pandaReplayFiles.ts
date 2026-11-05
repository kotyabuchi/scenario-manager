import { assertInputPath } from './fingerprintPaths';

import { createHash } from 'node:crypto';
import { lstat, readdir, readFile, realpath } from 'node:fs/promises';
import { join } from 'node:path';

/** 再生成がコピー済み入力や予定外の場所を書き換えていないことを照合する。 */
export const assertPandaReplayTree = async (input: {
  root: string;
  nodeModules: string;
  files: { path: string; sha256: string }[];
}) => {
  const expected = new Map(input.files.map((file) => [file.path, file.sha256]));
  if (expected.size !== input.files.length)
    throw new Error('再生成入力が重複しています。');
  let hasModules = false;
  const seen = new Set<string>();
  const visit = async (directory: string, prefix: string) => {
    for (const name of (await readdir(directory)).sort()) {
      const path = prefix ? `${prefix}/${name}` : name;
      assertInputPath(path);
      const absolute = join(directory, name);
      const stat = await lstat(absolute);
      if (path === 'node_modules') {
        if (
          !stat.isSymbolicLink() ||
          (await realpath(absolute)) !== input.nodeModules
        )
          throw new Error('再生成依存の参照先が変化しました。');
        hasModules = true;
        continue;
      }
      if (stat.isSymbolicLink())
        throw new Error('再生成に予定外のlinkがあります。');
      const isTemporary = path === '.tmp' || path.startsWith('.tmp/');
      if (stat.isDirectory()) {
        if (
          !isTemporary &&
          ![...expected.keys()].some((file) => file.startsWith(`${path}/`))
        )
          throw new Error('再生成に予定外のdirectoryがあります。');
        await visit(absolute, path);
      } else if (stat.isFile()) {
        if (isTemporary) continue;
        const digest = createHash('sha256')
          .update(await readFile(absolute))
          .digest('hex');
        if (expected.get(path) !== digest)
          throw new Error('再生成の入力または出力が一致しません。');
        seen.add(path);
      } else throw new Error('再生成が通常fileではありません。');
    }
  };
  await visit(input.root, '');
  if (!hasModules || seen.size !== expected.size)
    throw new Error('再生成のfile集合が一致しません。');
};
