import { isNil } from 'ramda';

import { loadStorySurfaceContext } from './extractors/surfaceRoots';
import { assertGitFilePaths } from './gitRecords';
import {
  type GitSnapshotCapture,
  type GitSnapshotRevision,
  getSnapshotFiles,
} from './gitSnapshot';
import { buildInventory } from './inventory';
import {
  measurePreparationSync,
  type PreparationTimingObserver,
} from './preparationTiming';
import { loadSource } from './source';
import { isGeneratedLibraryPath } from './sourceFiles';
import { createStablePackageSystem } from './sourceSnapshotSystem';

import { createHash } from 'node:crypto';

const decodeSource = (bytes: Buffer) => {
  if (bytes[0] === 0xff && bytes[1] === 0xfe)
    return bytes.toString('utf16le', 2);
  if (bytes[0] === 0xfe && bytes[1] === 0xff)
    return Buffer.from(bytes.subarray(2)).swap16().toString('utf16le');
  return bytes.toString('utf8').replace(/^\uFEFF/, '');
};

const snapshotInputDigest = (
  root: string,
  files: ReadonlySet<string>,
  read: (path: string) => Buffer | undefined,
) => {
  const hash = createHash('sha256');
  const length = Buffer.alloc(4);
  const append = (bytes: Buffer) => {
    length.writeUInt32BE(bytes.length);
    hash.update(length).update(bytes);
  };
  append(Buffer.from(root));
  for (const path of [...files].sort()) {
    const bytes = read(path);
    if (isNil(bytes)) return undefined;
    append(Buffer.from(path));
    append(bytes);
  }
  return hash.digest('hex');
};

/**
 * 各時点の既存extractorを動かし、旧aliasや削除された依存を別々に保つ。
 * 同一入力の結果は共有されるため、返却Inventoryは読み取り専用として扱う。
 */
export const buildSnapshotInventories = (
  capture: GitSnapshotCapture,
  provenRuntimeInputPaths: readonly string[] = [],
  onTiming?: PreparationTimingObserver,
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
  const inventoriesByInput = new Map<
    string,
    ReturnType<typeof buildInventory>
  >();
  const build = (revision: GitSnapshotRevision) => {
    const { input, files, readBytes } = measurePreparationSync(
      { phase: 'selection', operation: 'revision-inputs', revision },
      onTiming,
      () => {
        const input = getSnapshotFiles(capture, revision);
        input.preload?.();
        const files = new Set([...input.files, ...generated.keys()]);
        if (generated.size) assertGitFilePaths(files);
        const readBytes = (path: string) =>
          input.read(path) ?? generated.get(path);
        return { input, files, readBytes };
      },
    );
    const digest = measurePreparationSync(
      { phase: 'selection', operation: 'inventory-digest', revision },
      onTiming,
      () => snapshotInputDigest(input.root, files, readBytes),
    );
    // 参照先の欠落を空ファイルと同一視せず、従来の解析に委ねる。
    if (!isNil(digest)) {
      const cached = inventoriesByInput.get(digest);
      if (!isNil(cached))
        return measurePreparationSync(
          {
            phase: 'selection',
            operation: 'inventory',
            revision,
            reused: true,
          },
          onTiming,
          () => cached,
        );
    }
    const snapshot = {
      files,
      packages: packages.system,
      read: (path: string) => {
        const bytes = readBytes(path);
        return bytes === undefined ? undefined : decodeSource(bytes);
      },
    };
    const inventory = measurePreparationSync(
      { phase: 'selection', operation: 'inventory', revision, reused: false },
      onTiming,
      () =>
        buildInventory(
          measurePreparationSync(
            { phase: 'selection', operation: 'product-source', revision },
            onTiming,
            () => loadSource(input.root, snapshot),
          ),
          measurePreparationSync(
            { phase: 'selection', operation: 'story-source', revision },
            onTiming,
            () => loadStorySurfaceContext(input.root, snapshot),
          ),
        ),
    );
    if (!isNil(digest)) inventoriesByInput.set(digest, inventory);
    return inventory;
  };
  const inventories = {
    base: build('base'),
    head: build('head'),
    index: build('index'),
    working: build('working'),
  };
  measurePreparationSync(
    { phase: 'selection', operation: 'package-check' },
    onTiming,
    () => packages.assertUnchanged(),
  );
  return inventories;
};
