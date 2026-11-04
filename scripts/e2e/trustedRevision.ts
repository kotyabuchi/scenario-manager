import { isNil } from 'ramda';
import { z } from 'zod';

import { parseLedger } from './ledger';

import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const SHA = /^(?:[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$/;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TREE_BYTES = 16 * 1024 * 1024;
const shaSchema = z
  .string()
  .regex(SHA)
  .transform((value) => value.toLowerCase());
const eventSchema = z.object({
  pull_request: z.object({
    base: z.object({ sha: shaSchema }),
    head: z.object({ sha: shaSchema }),
  }),
});
const approvalSchema = z.strictObject({
  base: shaSchema,
  head: shaSchema,
  digest: z.string().regex(/^[a-f0-9]{64}$/),
});

const git = (root: string, args: string[], maxBuffer = MAX_TREE_BYTES) => {
  const env = { ...process.env };
  for (const name of Object.keys(env))
    if (name.toUpperCase().startsWith('GIT_'))
      Reflect.deleteProperty(env, name);
  return execFileSync('git', ['--no-replace-objects', '-C', root, ...args], {
    env,
    encoding: 'utf8',
    maxBuffer,
    timeout: 30_000,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
};

const resolveCommit = (root: string, revision: string) => {
  if (!revision.trim() || /[\r\n\0]/.test(revision))
    throw new Error('比較元のrevisionが不正です');
  return shaSchema.parse(
    git(root, [
      'rev-parse',
      '--verify',
      '--end-of-options',
      `${revision}^{commit}`,
    ]).trim(),
  );
};

const assertCommit = (root: string, revision: string) => {
  const sha = shaSchema.parse(revision);
  if (resolveCommit(root, sha) !== sha)
    throw new Error('revisionはcommit自体のSHAで指定してください');
  return sha;
};

/** CIはイベントだけを比較元にし、ローカルでは明示されたrefをcommitへ固定する。 */
export const resolveRevisions = async ({
  root,
  env,
  base,
}: {
  root: string;
  env: NodeJS.ProcessEnv;
  base?: string;
}) => {
  if (env.CI) {
    if (!isNil(base)) throw new Error('CIではbaseの上書きを許可しません');
    if (env.GITHUB_EVENT_NAME !== 'pull_request' || !env.GITHUB_EVENT_PATH)
      throw new Error('CIにはpull_requestイベントが必要です');
    const event = eventSchema.parse(
      JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8')),
    );
    const revisions = event.pull_request;
    const expectedHead = assertCommit(root, revisions.head.sha);
    const expectedBase = assertCommit(root, revisions.base.sha);
    if (resolveCommit(root, 'HEAD') !== expectedHead)
      throw new Error('checkout HEADがPR head SHAと一致しません');
    return { base: expectedBase, head: expectedHead, mode: 'ci' as const };
  }
  if (isNil(base)) throw new Error('ローカル検査にはbaseを明示してください');
  return {
    base: resolveCommit(root, base),
    head: resolveCommit(root, 'HEAD'),
    mode: 'local' as const,
  };
};

const assertPath = (file: string) => {
  if (
    !file ||
    /[\\\0\r\n:]/.test(file) ||
    file.split('/').some((part) => !part || part === '.' || part === '..')
  )
    throw new Error('Git内の相対ファイルpathが不正です');
};

const readTree = (root: string, revision: string) => {
  const commit = assertCommit(root, revision);
  return git(root, ['ls-tree', '-r', '-z', '-l', '--full-tree', commit])
    .split('\0')
    .filter(Boolean)
    .map((line) => {
      const match = /^(\d{6}) (blob|commit) ([a-f0-9]+) +([\d-]+)\t(.+)$/.exec(
        line,
      );
      if (!match) throw new Error('Git treeを解析できません');
      const [, mode, type, oid, size, file] = match;
      if (
        isNil(mode) ||
        isNil(type) ||
        isNil(oid) ||
        isNil(size) ||
        isNil(file)
      )
        throw new Error('Git treeの必須項目が欠落しています');
      return { mode, type, oid, size: Number(size), file };
    });
};

const readBlob = (
  root: string,
  tree: ReturnType<typeof readTree>,
  file: string,
) => {
  assertPath(file);
  for (const entry of tree) {
    if (file.startsWith(`${entry.file}/`))
      throw new Error(`${file}: symlinkまたはsubmoduleを辿れません`);
  }
  const entry = tree.find((item) => item.file === file);
  if (isNil(entry)) {
    if (tree.some((item) => item.file.startsWith(`${file}/`)))
      throw new Error(`${file}: ファイルではありません`);
    return undefined;
  }
  if (!['100644', '100755'].includes(entry.mode) || entry.type !== 'blob')
    throw new Error(`${file}: 通常ファイルだけを読み込めます`);
  if (
    !Number.isSafeInteger(entry.size) ||
    entry.size < 0 ||
    entry.size > MAX_FILE_BYTES
  )
    throw new Error(`${file}: ファイルサイズが上限を超えています`);
  return git(root, ['cat-file', 'blob', entry.oid], MAX_FILE_BYTES);
};

/** 存在するcommitの通常blobだけを読み、pathの不存在だけをundefinedとする。 */
export const readRevisionFile = (
  root: string,
  revision: string,
  file: string,
) => readBlob(root, readTree(root, revision), file);

/** 比較元の台帳をGit objectから再構成し、部分欠落を未導入扱いにしない。 */
export const readRevisionLedger = async (root: string, revision: string) => {
  const tree = readTree(root, revision);
  const prefix = 'e2e/ledger/';
  if (
    !tree.some(
      (entry) => entry.file === 'e2e/ledger' || entry.file.startsWith(prefix),
    )
  ) {
    readBlob(root, tree, `${prefix}profiles.json`);
    return undefined;
  }
  const read = (file: string): unknown => {
    const contents = readBlob(root, tree, `${prefix}${file}`);
    if (isNil(contents))
      throw new Error(`${prefix}${file}: 比較元台帳が部分欠落しています`);
    try {
      return JSON.parse(contents);
    } catch (cause) {
      throw new Error(`${prefix}${file} (${revision}): JSONを解析できません`, {
        cause,
      });
    }
  };
  const collection = (folder: string) => {
    const files = tree.filter((entry) => {
      const relative = entry.file.slice(`${prefix}${folder}/`.length);
      return (
        entry.file.startsWith(`${prefix}${folder}/`) &&
        !relative.includes('/') &&
        relative.endsWith('.json')
      );
    });
    if (!files.length)
      throw new Error(`${folder}: 比較元台帳collectionが欠落しています`);
    return files.flatMap((entry) => {
      const value = read(entry.file.slice(prefix.length));
      if (!Array.isArray(value))
        throw new Error(`${entry.file}: JSON配列が必要です`);
      const items: unknown[] = value;
      return items;
    });
  };
  return parseLedger({
    schemaVersion: 1,
    profiles: read('profiles.json'),
    fixtures: read('fixtures.json'),
    executionGroups: read('execution-groups.json'),
    exceptions: read('exceptions.json'),
    contracts: collection('contracts'),
    scenarios: collection('scenarios'),
  });
};

/** PR内flagではなく管理者が別途承認した、現在のbase/head/内容digestへ限定する。 */
export const verifyBootstrapApproval = (
  input: z.input<typeof approvalSchema>,
  raw: string | undefined,
) => {
  if (isNil(raw) || !raw.trim())
    throw new Error('初回baselineの外部承認が必要です');
  const expected = approvalSchema.parse(input);
  const approved = approvalSchema.parse(JSON.parse(raw));
  if (
    expected.base !== approved.base ||
    expected.head !== approved.head ||
    expected.digest !== approved.digest
  )
    throw new Error('初回baselineの承認とbase/head/digestが一致しません');
};
