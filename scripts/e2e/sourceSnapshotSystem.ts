import ts from 'typescript';

import { basename, dirname, join, relative, resolve } from 'node:path';

export type SnapshotFiles = {
  files: Iterable<string>;
  read: (path: string) => string | undefined;
};

type SourceSystem = Pick<
  ts.System,
  | 'readFile'
  | 'fileExists'
  | 'directoryExists'
  | 'getDirectories'
  | 'readDirectory'
  | 'realpath'
>;

const matchFilesAvailable = (
  api: typeof ts,
): api is typeof ts & {
  matchFiles(
    path: string,
    extensions: readonly string[] | undefined,
    excludes: readonly string[] | undefined,
    includes: readonly string[] | undefined,
    caseSensitive: boolean,
    cwd: string,
    depth: number | undefined,
    getEntries: (path: string) => { files: string[]; directories: string[] },
    realpath: (path: string) => string,
  ): string[];
} => typeof Reflect.get(api, 'matchFiles') === 'function';

/** 同じ解決処理が参照した依存の実体を固定し、graph構築後に再照合する。 */
export const createStablePackageSystem = () => {
  const checks: (() => boolean)[] = [];
  const memoize = <T>(read: (file: string) => T) => {
    const cache = new Map<string, { value: T }>();
    return (file: string): T => {
      const cached = cache.get(file);
      if (cached) return cached.value;
      const value = read(file);
      const initial = JSON.stringify(value);
      cache.set(file, { value });
      checks.push(() => JSON.stringify(read(file)) === initial);
      return value;
    };
  };
  return {
    system: {
      readFile: memoize((file) => ts.sys.readFile(file)),
      fileExists: memoize((file) => ts.sys.fileExists(file)),
      directoryExists: memoize((file) => ts.sys.directoryExists(file)),
      getDirectories: memoize((file) => ts.sys.getDirectories(file).sort()),
      realpath: memoize((file) => ts.sys.realpath?.(file) ?? file),
      readDirectory: ts.sys.readDirectory,
    } satisfies SourceSystem,
    assertUnchanged: () => {
      if (checks.some((check) => !check()))
        throw new Error(
          'graph採取中にnode_modulesまたはTypeScript標準型が変化しました',
        );
    },
  };
};

/** 旧checkoutに存在したprojectファイルだけをTypeScriptのhostに見せる。 */
export const createSnapshotSystem = (
  root: string,
  snapshot: SnapshotFiles,
  packages: SourceSystem,
  isPackage: (file: string) => boolean,
): SourceSystem => {
  const compiler = ts;
  if (!matchFilesAvailable(compiler))
    throw new Error('TypeScriptのsnapshot用glob matcherが利用できません');
  const key = (file: string) => {
    const absolute = resolve(file);
    return ts.sys.useCaseSensitiveFileNames ? absolute : absolute.toLowerCase();
  };
  const files = new Map<string, string>();
  const folders = new Map<string, { files: string[]; directories: string[] }>();
  folders.set(key(root), { files: [], directories: [] });
  const addDirectory = (directory: string) => {
    const name = key(directory);
    const existing = folders.get(name);
    if (existing) return existing;
    const parent = dirname(directory);
    const folder = { files: [], directories: [] };
    folders.set(name, folder);
    addDirectory(parent).directories.push(basename(directory));
    return folder;
  };
  for (const file of snapshot.files) {
    const absolute = join(root, file);
    files.set(key(absolute), file);
    addDirectory(dirname(absolute)).files.push(basename(absolute));
  }
  const realpath = (file: string) => {
    const virtual = files.get(key(file));
    if (virtual) return join(root, virtual);
    return isPackage(file) ? (packages.realpath?.(file) ?? file) : file;
  };
  return {
    fileExists: (file) =>
      files.has(key(file)) || (isPackage(file) && packages.fileExists(file)),
    readFile: (file) => {
      const virtual = files.get(key(file));
      return virtual
        ? snapshot.read(virtual)
        : isPackage(file)
          ? packages.readFile(file)
          : undefined;
    },
    directoryExists: (file) =>
      folders.has(key(file)) ||
      (isPackage(file) && packages.directoryExists(file)),
    getDirectories: (file) => {
      const directories = folders.get(key(file))?.directories ?? [];
      return isPackage(file)
        ? [...directories, ...packages.getDirectories(file)]
        : [...directories];
    },
    readDirectory: (file, extensions, excludes, includes, depth) =>
      compiler.matchFiles(
        file,
        extensions,
        excludes,
        includes,
        ts.sys.useCaseSensitiveFileNames,
        root,
        depth,
        (candidate) =>
          folders.get(key(candidate)) ?? { files: [], directories: [] },
        realpath,
      ),
    realpath,
  };
};

export const isPackageInput = (file: string, manifestPath: string) => {
  const lib = dirname(ts.getDefaultLibFilePath({}));
  const withinLib = relative(lib, resolve(file));
  return (
    manifestPath === 'node_modules' ||
    manifestPath.startsWith('node_modules/') ||
    resolve(file) === lib ||
    (/^lib(?:\.[a-z0-9-]+)*\.d\.ts$/i.test(withinLib) &&
      !withinLib.includes('/'))
  );
};
