import { loadStorySurfaceContext } from './extractors/surfaceRoots';
import { assertGitFilePaths } from './gitRecords';
import {
  type GitSnapshotCapture,
  type GitSnapshotRevision,
  getSnapshotFiles,
} from './gitSnapshot';
import { buildInventory } from './inventory';
import { loadSource } from './source';
import { isGeneratedLibraryPath } from './sourceFiles';
import { createStablePackageSystem } from './sourceSnapshotSystem';

const decodeSource = (bytes: Buffer) => {
  if (bytes[0] === 0xff && bytes[1] === 0xfe)
    return bytes.toString('utf16le', 2);
  if (bytes[0] === 0xfe && bytes[1] === 0xff)
    return Buffer.from(bytes.subarray(2)).swap16().toString('utf16le');
  return bytes.toString('utf8').replace(/^\uFEFF/, '');
};

/** 各時点の既存extractorを動かし、旧aliasや削除された依存を別々に保つ。 */
export const buildSnapshotInventories = (
  capture: GitSnapshotCapture,
  provenRuntimeInputPaths: readonly string[] = [],
) => {
  if (
    capture.snapshot.reasons.some(
      ({ code }) => code === 'DEPENDENCY_INPUT_CHANGED',
    )
  )
    throw new Error(
      '依存が変わった時点のgraphは現在のnode_modulesで構築できません',
    );
  const unversioned = new Set(
    capture.snapshot.reasons
      .filter(({ code }) => code === 'UNVERSIONED_RUNTIME_INPUT')
      .flatMap(({ paths }) => paths),
  );
  const working = getSnapshotFiles(capture, 'working');
  const generated = new Map<string, Buffer>();
  // 呼び出し元で由来を照合できた生成物だけを、旧graphの型解決にも見せる。
  for (const path of provenRuntimeInputPaths) {
    const bytes = working.read(path);
    if (!isGeneratedLibraryPath(path) || !unversioned.has(path) || !bytes)
      throw new Error('生成物が固定済みの追跡外入力と一致しません');
    generated.set(path, bytes);
  }
  const packages = createStablePackageSystem();
  const build = (revision: GitSnapshotRevision) => {
    const input = getSnapshotFiles(capture, revision);
    input.preload?.();
    const files = new Set([...input.files, ...generated.keys()]);
    if (generated.size) assertGitFilePaths(files);
    const snapshot = {
      files,
      packages: packages.system,
      read: (path: string) => {
        const bytes = input.read(path) ?? generated.get(path);
        return bytes === undefined ? undefined : decodeSource(bytes);
      },
    };
    return buildInventory(
      loadSource(input.root, snapshot),
      loadStorySurfaceContext(input.root, snapshot),
    );
  };
  const inventories = {
    base: build('base'),
    head: build('head'),
    index: build('index'),
    working: build('working'),
  };
  packages.assertUnchanged();
  return inventories;
};
