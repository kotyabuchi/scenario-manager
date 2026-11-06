import { lstat, readdir, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// gitignoreには依存しない。Panda生成物・ignored migrationも実行入力である。
const INPUT_DIRECTORIES = new Set([
  'src',
  'public',
  'styled-system',
  'e2e',
  'scripts',
  '.storybook',
  'supabase',
  'patches',
  '.github',
]);
// nested build/dist等はfixtureや実sourceになり得るので名前だけでは除外しない。
const EXCLUDED_INPUT_DIRECTORIES = new Set(['e2e/.auth', 'supabase/.temp']);
const ROOT_SPECIAL_FILES = new Set([
  '.gitignore',
  '.gitattributes',
  '.nvmrc',
  '.node-version',
  '.browserslistrc',
]);
const ROOT_INPUT_EXTENSION = /\.(?:[cm]?[jt]sx?|jsonc?|ya?ml|toml|lock)$/i;

export const comparePaths = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

// 認証用local configもscope外。依存解決はlockfileを固定する。
const isSecretOrOutput = (name: string) =>
  ['.mcp.json', '.npmrc', '.netrc'].includes(name.toLowerCase()) ||
  /^\.env(?:\.|$)/i.test(name) ||
  /\.(?:pem|key|log|tsbuildinfo)$/i.test(name);

/** 相対pathだけをエラーに含め、資格情報や絶対pathを公開しない。 */
export const assertInputPath = (path: string) => {
  if (
    path.split('/').some((part) => !part || part === '.' || part === '..') ||
    /[\\:]/.test(path) ||
    [...path].some(
      (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
  )
    throw new Error('入力pathに安全でない文字があります');
};

/** stat比較はinodeだけでなく、同inodeへの上書き・timestamp復元も検出する。 */
export const inputStamp = (stat: Awaited<ReturnType<typeof readInputStat>>) =>
  [stat.dev, stat.ino, stat.mode, stat.size, stat.mtimeNs, stat.ctimeNs].join(
    ':',
  );

export const readInputStat = (path: string) => lstat(path, { bigint: true });

/** 外部参照を避けるため、内部向けを含む全symlinkを拒否する。 */
export const scanInputFiles = async (root: string) => {
  const files = new Map<string, string>();
  const names = new Set<string>();
  const visit = async (directory: string, prefix: string) => {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => comparePaths(left.name, right.name));
    for (const entry of entries) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (
        isSecretOrOutput(entry.name) ||
        ['node_modules', '.git'].includes(entry.name.toLowerCase()) ||
        EXCLUDED_INPUT_DIRECTORIES.has(path.toLowerCase())
      )
        continue;
      if (
        !prefix &&
        !INPUT_DIRECTORIES.has(entry.name.toLowerCase()) &&
        !ROOT_SPECIAL_FILES.has(entry.name) &&
        !ROOT_INPUT_EXTENSION.test(entry.name)
      )
        continue;
      assertInputPath(path);
      if (path.toLowerCase() === 'next-env.d.ts' && path !== 'next-env.d.ts')
        throw new Error('next-env.d.tsの大文字小文字が不正です');
      const key = path.normalize('NFC').toLowerCase();
      if (names.has(key))
        throw new Error(`入力pathの大文字小文字が衝突しています: ${path}`);
      names.add(key);
      const absolute = join(directory, entry.name);
      const stat = await readInputStat(absolute);
      if (stat.isSymbolicLink())
        throw new Error(`入力symlinkは許可されません: ${path}`);
      if (stat.isDirectory()) {
        if (!prefix && !INPUT_DIRECTORIES.has(entry.name.toLowerCase()))
          throw new Error(`root設定がdirectoryです: ${path}`);
        await visit(absolute, path);
      } else if (stat.isFile()) {
        files.set(path, inputStamp(stat));
      } else throw new Error(`入力が通常fileではありません: ${path}`);
    }
  };
  const physical = await realpath(root);
  if (
    physical.toLowerCase() !== resolve(root).toLowerCase() ||
    (await readInputStat(root)).isSymbolicLink()
  )
    throw new Error('入力rootは物理directoryで指定してください');
  await visit(root, '');
  return files;
};
