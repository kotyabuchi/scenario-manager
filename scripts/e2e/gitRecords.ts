import {
  type GitObjectFormat,
  gitFileModeSchema,
  gitOid,
  gitRead,
} from './gitObjects';
import {
  assertGitPath,
  type GitChangedPath,
  type GitIndexEntry,
} from './gitSnapshotSchema';

/** NULだけを境界とし、pathをUTF-8へ可逆変換できる場合だけ許可する。 */
export const gitTokens = (bytes: Buffer) => {
  const tokens: string[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    const end = bytes.indexOf(0, offset);
    if (end <= offset) throw new Error('GitのNUL区切り出力が不正です');
    const token = bytes.toString('utf8', offset, end);
    if (!Buffer.from(token).equals(bytes.subarray(offset, end)))
      throw new Error('GitのpathがUTF-8ではありません');
    tokens.push(token);
    offset = end + 1;
  }
  return tokens;
};

export const assertUniqueGitPaths = (paths: Iterable<string>) => {
  const names = new Map<string, string>();
  for (const path of paths) {
    let prefix = '';
    for (const part of path.split('/')) {
      prefix = prefix ? `${prefix}/${part}` : part;
      const key = prefix.normalize('NFC').toLowerCase();
      const existing = names.get(key);
      if (existing !== undefined && existing !== prefix)
        throw new Error(
          'Git pathの大文字小文字またはUnicode正規化が衝突しています',
        );
      names.set(key, prefix);
    }
  }
};

const entryPath = (value: string) => {
  const tab = value.indexOf('\t');
  if (tab < 0) throw new Error('Git entryにpathがありません');
  const path = value.slice(tab + 1);
  assertGitPath(path);
  return { header: value.slice(0, tab).split(' '), path };
};

export const assertGitFilePaths = (files: Iterable<string>) => {
  const paths = [...files];
  const leaves = new Set(paths);
  if (leaves.size !== paths.length)
    throw new Error('Git treeまたはindexに重複したpathがあります');
  for (const path of paths) {
    for (
      let separator = path.indexOf('/');
      separator >= 0;
      separator = path.indexOf('/', separator + 1)
    ) {
      if (leaves.has(path.slice(0, separator)))
        throw new Error(
          'Git treeまたはindexでファイルpathがdirectoryと衝突しています',
        );
    }
  }
  assertUniqueGitPaths(paths);
};

export const readGitTree = (
  root: string,
  format: GitObjectFormat,
  commit: string,
) => {
  const entries = gitTokens(
    gitRead(root, [
      'ls-tree',
      '-r',
      '-z',
      '--full-tree',
      gitOid(format, commit),
    ]),
  ).map((token) => {
    const { header, path } = entryPath(token);
    const [modeText, type, oidText] = header;
    const mode = gitFileModeSchema.parse(modeText);
    if (
      header.length !== 3 ||
      !oidText ||
      type !== (mode === '160000' ? 'commit' : 'blob')
    )
      throw new Error('Git treeのentryが不正です');
    return { mode, path, oid: gitOid(format, oidText) };
  });
  assertGitFilePaths(entries.map(({ path }) => path));
  return entries;
};

export const readGitIndex = (
  root: string,
  format: GitObjectFormat,
): GitIndexEntry[] => {
  const entries = gitTokens(
    gitRead(root, ['ls-files', '--stage', '-z', '--']),
  ).map((token) => {
    const { header, path } = entryPath(token);
    const [mode, oid, stage] = header;
    if (header.length !== 3 || !oid || stage !== '0')
      throw new Error('Git indexに未解決の競合または不正なentryがあります');
    return {
      mode: gitFileModeSchema.parse(mode),
      path,
      oid: gitOid(format, oid),
    };
  });
  assertGitFilePaths(entries.map(({ path }) => path));
  return entries;
};

export const parseGitChanges = (
  bytes: Buffer,
  origin: 'committed' | 'staged',
) => {
  const tokens = gitTokens(bytes);
  const changes: GitChangedPath[] = [];
  const nextPath = (index: number) => {
    const path = tokens[index];
    if (path === undefined) throw new Error('Git差分にpathがありません');
    assertGitPath(path);
    return path;
  };
  for (let i = 0; i < tokens.length; ) {
    const status = tokens[i++];
    const path = nextPath(i++);
    if (status === 'A' || status === 'M' || status === 'T')
      changes.push({ origin, status, newPath: path });
    else if (status === 'D') changes.push({ origin, status, oldPath: path });
    else if (status && /^[RC](?:100|0?[0-9]{1,2})$/.test(status))
      changes.push({
        origin,
        status: status.startsWith('R') ? 'R' : 'C',
        oldPath: path,
        newPath: nextPath(i++),
      });
    else throw new Error('Git差分に未対応のstatusがあります');
  }
  return changes;
};

export const readGitChanges = (root: string, base: string, head: string) => {
  const options = [
    '--name-status',
    '-z',
    '--no-ext-diff',
    '--no-textconv',
    '--find-renames',
  ];
  return [
    ...parseGitChanges(
      gitRead(root, ['diff', ...options, base, head, '--']),
      'committed',
    ),
    ...parseGitChanges(
      gitRead(root, ['diff', ...options, '--cached', head, '--']),
      'staged',
    ),
  ];
};
