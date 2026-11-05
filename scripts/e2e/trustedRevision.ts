import { isNil } from 'ramda';
import { z } from 'zod';

import {
  assertGitCommit,
  gitObjectFormat,
  gitShaSchema,
  readGitBlobs,
  resolveGitCommit,
} from './gitObjects';
import { readGitTree } from './gitRecords';
import { assertGitPath } from './gitSnapshotSchema';
import { parseLedger } from './ledger';

import { readFile } from 'node:fs/promises';

const eventSchema = z.object({
  pull_request: z.object({
    base: z.object({ sha: gitShaSchema }),
    head: z.object({ sha: gitShaSchema }),
  }),
});
const approvalSchema = z.strictObject({
  base: gitShaSchema,
  head: gitShaSchema,
  digest: z.string().regex(/^[a-f0-9]{64}$/),
});

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
    const expectedHead = assertGitCommit(root, revisions.head.sha);
    const expectedBase = assertGitCommit(root, revisions.base.sha);
    if (resolveGitCommit(root, 'HEAD') !== expectedHead)
      throw new Error('checkout HEADがPR head SHAと一致しません');
    return { base: expectedBase, head: expectedHead, mode: 'ci' as const };
  }
  if (isNil(base)) throw new Error('ローカル検査にはbaseを明示してください');
  return {
    base: resolveGitCommit(root, base),
    head: resolveGitCommit(root, 'HEAD'),
    mode: 'local' as const,
  };
};

const readTree = (root: string, revision: string) => {
  const commit = assertGitCommit(root, revision);
  const format = gitObjectFormat(root);
  return { format, entries: readGitTree(root, format, commit) };
};

const findBlob = (
  entries: ReturnType<typeof readTree>['entries'],
  file: string,
) => {
  assertGitPath(file);
  for (const entry of entries) {
    if (file.startsWith(`${entry.path}/`))
      throw new Error(`${file}: symlinkまたはsubmoduleを辿れません`);
  }
  const entry = entries.find((item) => item.path === file);
  if (isNil(entry)) {
    if (entries.some((item) => item.path.startsWith(`${file}/`)))
      throw new Error(`${file}: ファイルではありません`);
    return undefined;
  }
  if (entry.mode !== '100644' && entry.mode !== '100755')
    throw new Error(`${file}: 通常ファイルだけを読み込めます`);
  return entry;
};

/** 存在するcommitの通常blobだけを読み、pathの不存在だけをundefinedとする。 */
export const readRevisionFile = (
  root: string,
  revision: string,
  file: string,
) => {
  const { entries, format } = readTree(root, revision);
  const entry = findBlob(entries, file);
  if (isNil(entry)) return undefined;
  return readGitBlobs(root, format, [entry.oid])
    .get(entry.oid)
    ?.toString('utf8');
};

/** 比較元の台帳をGit objectから再構成し、部分欠落を未導入扱いにしない。 */
export const readRevisionLedger = async (root: string, revision: string) => {
  const { entries, format } = readTree(root, revision);
  const prefix = 'e2e/ledger/';
  if (
    !entries.some(
      ({ path }) => path === 'e2e/ledger' || path.startsWith(prefix),
    )
  ) {
    findBlob(entries, `${prefix}profiles.json`);
    return undefined;
  }
  const requireBlob = (file: string) => {
    const entry = findBlob(entries, file);
    if (isNil(entry))
      throw new Error(`${file}: 比較元台帳が部分欠落しています`);
    return entry;
  };
  const config = {
    profiles: requireBlob(`${prefix}profiles.json`),
    fixtures: requireBlob(`${prefix}fixtures.json`),
    executionGroups: requireBlob(`${prefix}execution-groups.json`),
    exceptions: requireBlob(`${prefix}exceptions.json`),
  };
  const collection = (folder: string) => {
    const directory = `${prefix}${folder}/`;
    const files = entries
      .map(({ path }) => path)
      .filter(
        (path) =>
          path.startsWith(directory) &&
          !path.slice(directory.length).includes('/') &&
          path.endsWith('.json'),
      );
    if (!files.length)
      throw new Error(`${folder}: 比較元台帳collectionが欠落しています`);
    return files.map(requireBlob);
  };
  const contracts = collection('contracts');
  const scenarios = collection('scenarios');
  const blobs = readGitBlobs(
    root,
    format,
    [...Object.values(config), ...contracts, ...scenarios].map(
      ({ oid }) => oid,
    ),
  );
  const read = (entry: typeof config.profiles): unknown => {
    const contents = blobs.get(entry.oid);
    if (isNil(contents))
      throw new Error(`${entry.path}: 比較元台帳のblobが欠落しています`);
    try {
      return JSON.parse(contents.toString('utf8'));
    } catch (cause) {
      throw new Error(`${entry.path} (${revision}): JSONを解析できません`, {
        cause,
      });
    }
  };
  const readCollection = (files: typeof contracts) =>
    files.flatMap((entry) => {
      const value = read(entry);
      if (!Array.isArray(value))
        throw new Error(`${entry.path}: JSON配列が必要です`);
      const items: unknown[] = value;
      return items;
    });
  return parseLedger({
    schemaVersion: 1,
    profiles: read(config.profiles),
    fixtures: read(config.fixtures),
    executionGroups: read(config.executionGroups),
    exceptions: read(config.exceptions),
    contracts: readCollection(contracts),
    scenarios: readCollection(scenarios),
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
