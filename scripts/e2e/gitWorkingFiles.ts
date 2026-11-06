import { inputStamp } from './fingerprintPaths';
import {
  type GitObjectFormat,
  gitRead,
  hashGitBlob,
  MAX_GIT_FILE_BYTES,
} from './gitObjects';
import { assertUniqueGitPaths, gitTokens } from './gitRecords';
import {
  assertGitPath,
  type GitChangedPath,
  type GitIndexEntry,
} from './gitSnapshotSchema';

import { createHash } from 'node:crypto';
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  realpathSync,
} from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const MAX_WORKING_BYTES = 128 * 1024 * 1024;
const EXCLUDED_ROOTS = new Set([
  '.netlify',
  '.next',
  '.next-e2e',
  '.open-next',
  '.vercel',
  '.wrangler',
  'coverage',
  'playwright-report',
  'storybook-static',
  'test-results',
]);
export const isPrivateGitPath = (path: string) =>
  path.toLowerCase().startsWith('supabase/.temp/') ||
  EXCLUDED_ROOTS.has(path.split('/')[0]?.toLowerCase() ?? '') ||
  path
    .split('/')
    .some(
      (name) =>
        [
          '.auth',
          '.git',
          '.mcp.json',
          '.npmrc',
          '.netrc',
          'node_modules',
        ].includes(name.toLowerCase()) ||
        /^\.env/i.test(name) ||
        /\.(?:pem|key|log|tsbuildinfo)$/i.test(name),
    );

const samePath = (left: string, right: string) => relative(left, right) === '';
export const assertWorkingRoot = (root: string) => {
  const gitRoot = gitRead(root, ['rev-parse', '--show-toplevel'])
    .toString('utf8')
    .trimEnd();
  if (
    !samePath(resolve(gitRoot), root) ||
    !samePath(realpathSync(root), root) ||
    !lstatSync(root).isDirectory()
  )
    throw new Error('Git snapshotには物理checkout rootが必要です');
};

const workingStat = (root: string, path: string) => {
  const parts = path.split('/');
  let absolute = root;
  for (const [index, part] of parts.entries()) {
    absolute = join(absolute, part);
    const stat = lstatSync(absolute, { bigint: true, throwIfNoEntry: false });
    if (!stat) return undefined;
    if (stat.isSymbolicLink())
      throw new Error('Git snapshotではsymlinkを読み込めません');
    if (index < parts.length - 1) {
      if (!stat.isDirectory()) return undefined;
    } else if (!stat.isDirectory()) return stat;
  }
  return undefined;
};

const readWorkingFile = (root: string, path: string, limit: number) => {
  const before = workingStat(root, path);
  if (!before) return undefined;
  if (!before.isFile() || before.size > Math.min(MAX_GIT_FILE_BYTES, limit))
    throw new Error(
      'Git snapshotのworking fileが通常ファイルではないか、サイズ上限を超えています',
    );
  const absolute = join(root, path);
  const physical = realpathSync.native(absolute);
  if (
    !samePath(absolute, physical) ||
    relative(root, physical).split(sep).join('/') !== path
  )
    throw new Error('Git snapshotのworking fileが物理pathと一致しません');
  const fd = openSync(
    absolute,
    constants.O_RDONLY |
      (constants.O_NOFOLLOW ?? 0) |
      (constants.O_NONBLOCK ?? 0),
  );
  try {
    const stamp = inputStamp(before);
    if (inputStamp(fstatSync(fd, { bigint: true })) !== stamp)
      throw new Error('Git snapshot採取中にworking fileが変化しました');
    const bytes = Buffer.allocUnsafe(Number(before.size));
    let offset = 0;
    while (offset < bytes.length) {
      const count = readSync(fd, bytes, offset, bytes.length - offset, offset);
      if (count === 0)
        throw new Error('Git snapshot採取中にworking fileが短くなりました');
      offset += count;
    }
    const after = workingStat(root, path);
    if (
      !after ||
      inputStamp(after) !== stamp ||
      inputStamp(fstatSync(fd, { bigint: true })) !== stamp
    )
      throw new Error('Git snapshot採取中にworking fileが変化しました');
    return { bytes, isExecutable: (Number(before.mode) & 0o100) !== 0 };
  } finally {
    closeSync(fd);
  }
};

export const readWorkingFiles = (
  root: string,
  format: GitObjectFormat,
  index: readonly GitIndexEntry[],
  runtimeInputPaths: readonly string[],
  retainContents = true,
) => {
  const untracked = gitTokens(
    gitRead(root, ['ls-files', '--others', '--exclude-standard', '-z', '--']),
  );
  const gitPaths = new Set([...index.map(({ path }) => path), ...untracked]);
  const runtimePaths = runtimeInputPaths.filter(
    (path) => path !== 'next-env.d.ts',
  );
  if (runtimePaths.some(isPrivateGitPath))
    throw new Error('公開対象外のpathが実行入力に含まれています');
  const paths = [...new Set([...gitPaths, ...runtimePaths])]
    .filter((path) => !isPrivateGitPath(path))
    .sort();
  for (const path of paths) assertGitPath(path);
  assertUniqueGitPaths(paths);
  const changes: GitChangedPath[] = [];
  const contents = new Map<string, Buffer>();
  const byPath = new Map(index.map((entry) => [entry.path, entry]));
  let remaining = MAX_WORKING_BYTES;
  const workingFiles = paths.map((path) => {
    const entry = byPath.get(path);
    const working = readWorkingFile(root, path, remaining);
    if (!working) {
      if (!entry)
        throw new Error(
          'Git snapshot採取中にuntrackedまたはruntime fileが消えました',
        );
      changes.push({ origin: 'unstaged', status: 'D', oldPath: path });
      return { path, sha256: null, mode: null };
    }
    const { bytes, isExecutable } = working;
    remaining -= bytes.length;
    if (retainContents) contents.set(path, bytes);
    if (entry) {
      if (
        hashGitBlob(format, bytes) !== entry.oid ||
        (process.platform !== 'win32' &&
          isExecutable !== (entry.mode === '100755'))
      )
        changes.push({ origin: 'unstaged', status: 'M', newPath: path });
    } else if (gitPaths.has(path)) {
      changes.push({ origin: 'untracked', status: 'A', newPath: path });
    }
    const isExecutableMode =
      process.platform === 'win32' ? entry?.mode === '100755' : isExecutable;
    const mode = isExecutableMode ? '100755' : '100644';
    return {
      path,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      mode,
    };
  });
  return {
    workingFiles,
    changes,
    contents,
    ignoredInputs: paths.filter((path) => !gitPaths.has(path)),
  };
};
