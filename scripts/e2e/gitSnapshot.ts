import {
  assertGitCommit,
  gitObjectFormat,
  gitOid,
  readGitBlobs,
  resolveGitCommit,
} from './gitObjects';
import { readGitChanges, readGitIndex, readGitTree } from './gitRecords';
import {
  type GitIndexEntry,
  type GitSnapshot,
  gitSnapshotSchema,
} from './gitSnapshotSchema';
import {
  assertWorkingRoot,
  isPrivateGitPath,
  readWorkingFiles,
} from './gitWorkingFiles';

import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

export type GitSnapshotRevision = 'base' | 'head' | 'index' | 'working';
export type GitSnapshotCapture = { snapshot: GitSnapshot };

type CaptureOptions = {
  root: string;
  base: string;
  expectedHead?: string;
  eventBase?: string;
  mode: GitSnapshot['mode'];
  runtimeInputPaths?: readonly string[];
};

type PrivateCapture = {
  root: string;
  trees: Record<
    Exclude<GitSnapshotRevision, 'working'>,
    ReadonlyMap<string, string>
  >;
  contents: Map<string, Buffer>;
  objectFormat: GitSnapshot['objectFormat'];
  blobs: Map<string, Buffer>;
};

const capturedFiles = new WeakMap<GitSnapshotCapture, PrivateCapture>();

const assertUsableEntries = (entries: readonly GitIndexEntry[]) => {
  for (const { path, mode } of entries) {
    if (mode !== '100644' && mode !== '100755')
      throw new Error('Git snapshotではsymlinkやsubmoduleを利用できません');
    if (isPrivateGitPath(path))
      throw new Error(
        'Git snapshotに機密または実行出力の管理対象pathが含まれています',
      );
  }
};

const isDependencyInput = (path: string) =>
  /(?:^|\/)(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|(?:package-lock|npm-shrinkwrap)\.json|yarn\.lock|bun\.lockb?|\.yarnrc\.yml)$/.test(
    path,
  ) || /^(?:patches|\.yarn\/patches)\//.test(path);

/** Gitとworking bytesを両端で照合し、本文を公開snapshotから分離する。 */
export const captureGitSnapshot = ({
  root: directory,
  base: requestedBase,
  expectedHead,
  eventBase,
  mode,
  runtimeInputPaths = [],
}: CaptureOptions): GitSnapshotCapture => {
  const root = resolve(directory);
  assertWorkingRoot(root);
  const objectFormat = gitObjectFormat(root);
  const head = resolveGitCommit(root, 'HEAD');
  if (
    (mode === 'ci' && !expectedHead) ||
    (expectedHead && gitOid(objectFormat, expectedHead) !== head)
  )
    throw new Error('checkout HEADが要求されたhead SHAと一致しません');
  const base =
    mode === 'ci'
      ? assertGitCommit(root, requestedBase)
      : resolveGitCommit(root, requestedBase);
  if (mode === 'local' && eventBase !== undefined)
    throw new Error('イベントbaseはCIのGit snapshotでだけ指定できます');
  const resolvedEventBase =
    eventBase === undefined ? undefined : assertGitCommit(root, eventBase);
  const indexEntries = readGitIndex(root, objectFormat);
  const trees = {
    base: readGitTree(root, objectFormat, base),
    head: base === head ? [] : readGitTree(root, objectFormat, head),
    index: indexEntries,
  };
  if (base === head) trees.head = trees.base;
  for (const entries of Object.values(trees)) assertUsableEntries(entries);
  const gitChanges = readGitChanges(root, base, head);
  const working = readWorkingFiles(
    root,
    objectFormat,
    indexEntries,
    runtimeInputPaths,
  );
  const after = readWorkingFiles(
    root,
    objectFormat,
    indexEntries,
    runtimeInputPaths,
    false,
  );
  if (
    JSON.stringify(working.workingFiles) !==
      JSON.stringify(after.workingFiles) ||
    JSON.stringify(working.changes) !== JSON.stringify(after.changes) ||
    JSON.stringify(working.ignoredInputs) !==
      JSON.stringify(after.ignoredInputs) ||
    JSON.stringify(indexEntries) !==
      JSON.stringify(readGitIndex(root, objectFormat)) ||
    JSON.stringify(gitChanges) !==
      JSON.stringify(readGitChanges(root, base, head)) ||
    head !== resolveGitCommit(root, 'HEAD')
  )
    throw new Error(
      '採取中にGit snapshotのHEAD、index、差分またはworking fileが変化しました',
    );
  const changedPaths = [...gitChanges, ...working.changes];
  const dependencyPaths = [
    ...new Set(
      changedPaths.flatMap(({ oldPath, newPath }) =>
        [oldPath, newPath].filter(
          (path): path is string =>
            path !== undefined && isDependencyInput(path),
        ),
      ),
    ),
  ].sort();
  const reasons: GitSnapshot['reasons'] = [];
  if (working.ignoredInputs.length)
    reasons.push({
      code: 'UNVERSIONED_RUNTIME_INPUT',
      paths: working.ignoredInputs,
    });
  if (dependencyPaths.length)
    reasons.push({ code: 'DEPENDENCY_INPUT_CHANGED', paths: dependencyPaths });
  const body = {
    schemaVersion: 1,
    mode,
    base,
    head,
    ...(resolvedEventBase !== undefined && { eventBase: resolvedEventBase }),
    objectFormat,
    indexEntries,
    changedPaths,
    workingFiles: working.workingFiles,
    reasons,
  };
  const digest = createHash('sha256')
    .update(`${JSON.stringify(body)}\n`)
    .digest('hex');
  const capture = { snapshot: gitSnapshotSchema.parse({ ...body, digest }) };
  for (const reason of capture.snapshot.reasons) Object.freeze(reason.paths);
  for (const list of [
    capture.snapshot.indexEntries,
    capture.snapshot.changedPaths,
    capture.snapshot.workingFiles,
    capture.snapshot.reasons,
  ]) {
    for (const value of list) Object.freeze(value);
    Object.freeze(list);
  }
  Object.freeze(capture.snapshot);
  Object.freeze(capture);
  const toObjectIds = (entries: readonly GitIndexEntry[]) =>
    new Map(entries.map(({ path, oid }) => [path, oid]));
  capturedFiles.set(capture, {
    root,
    trees: {
      base: toObjectIds(trees.base),
      head: toObjectIds(trees.head),
      index: toObjectIds(trees.index),
    },
    contents: working.contents,
    objectFormat,
    blobs: new Map(),
  });
  return capture;
};

/** checkoutの更新後も固定したproject bytesだけを解決する。 */
export const getSnapshotFiles = (
  capture: GitSnapshotCapture,
  revision: GitSnapshotRevision,
) => {
  const data = capturedFiles.get(capture);
  if (!data) throw new Error('Git snapshotの固定ファイルを利用できません');
  const copy = (bytes: Buffer | undefined) => bytes && Buffer.from(bytes);
  if (revision === 'working')
    return {
      root: data.root,
      files: data.contents.keys(),
      read: (path: string) => copy(data.contents.get(path)),
    };
  const tree = data.trees[revision];
  return {
    root: data.root,
    files: tree.keys(),
    read: (path: string) => {
      const oid = tree.get(path);
      if (!oid) return undefined;
      if (!data.blobs.has(oid)) {
        for (const [key, bytes] of readGitBlobs(data.root, data.objectFormat, [
          oid,
        ]))
          data.blobs.set(key, bytes);
      }
      return copy(data.blobs.get(oid));
    },
    preload: (paths: Iterable<string> = tree.keys()) => {
      const missing = [...paths].flatMap((path) => {
        const oid = tree.get(path);
        return oid && !data.blobs.has(oid) ? [oid] : [];
      });
      for (const [key, bytes] of readGitBlobs(
        data.root,
        data.objectFormat,
        missing,
      ))
        data.blobs.set(key, bytes);
    },
  };
};

export const listSnapshotFiles = (
  capture: GitSnapshotCapture,
  revision: GitSnapshotRevision,
) => [...getSnapshotFiles(capture, revision).files].sort();

export const readSnapshotFile = (
  capture: GitSnapshotCapture,
  revision: GitSnapshotRevision,
  path: string,
) => getSnapshotFiles(capture, revision).read(path);

/** 固定revisionの指定ファイルをまとめて読み込む。 */
export const readSnapshotFiles = (
  capture: GitSnapshotCapture,
  revision: GitSnapshotRevision,
  paths: readonly string[],
) => {
  const provider = getSnapshotFiles(capture, revision);
  provider.preload?.(paths);
  return new Map(paths.map((path) => [path, provider.read(path)]));
};
