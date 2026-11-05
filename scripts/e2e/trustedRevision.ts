import { isNil } from 'ramda';
import { z } from 'zod';

import { parseGithubEvent, resolveGithubEventPolicy } from './githubEvent';
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

import type { GithubEventPolicy } from './githubEventSchema';

const approvalSchema = z.strictObject({
  base: gitShaSchema,
  head: gitShaSchema,
  digest: z.string().regex(/^[a-f0-9]{64}$/),
});

type ResolvedRevisions =
  | { base: string; head: string; mode: 'local' }
  | { base: string; head: string; mode: 'ci'; eventPolicy: GithubEventPolicy };

/** CIはイベントだけを比較元にし、ローカルでは明示されたrefをcommitへ固定する。 */
export const resolveRevisions = async ({
  root,
  env,
  base,
}: {
  root: string;
  env: NodeJS.ProcessEnv;
  base?: string;
}): Promise<ResolvedRevisions> => {
  if (env.CI || env.GITHUB_ACTIONS === 'true') {
    if (!isNil(base)) throw new Error('CIではbaseの上書きを許可しません');
    if (!env.GITHUB_EVENT_PATH)
      throw new Error('CIにはGitHub Actionsイベントが必要です');
    const event = parseGithubEvent({
      name: env.GITHUB_EVENT_NAME,
      payload: JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8')),
      context: {
        sha: env.GITHUB_SHA,
        ref: env.GITHUB_REF,
        repository: env.GITHUB_REPOSITORY,
      },
    });
    const eventPolicy = resolveGithubEventPolicy({ root, event });
    const { head, staticBase } = eventPolicy;
    return {
      base: staticBase.kind === 'push-bootstrap' ? head : staticBase.sha,
      head,
      mode: 'ci' as const,
      eventPolicy,
    };
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
