import ts from 'typescript';

import { gitRead } from './gitObjects';
import { gitTokens } from './gitRecords';
import { isSourceEntry, isStorySourceEntry } from './sourceFiles';
import {
  createSnapshotSystem,
  type createStablePackageSystem,
  isPackageInput,
  type SnapshotFiles,
} from './sourceSnapshotSystem';

import { createHash } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import path from 'node:path';

import type { InventoryDiagnostic, SourceManifest } from './inventorySchema';
import type { SourceReadObserver, SourceReadQuery } from './sourceReadWitness';

const posix = (value: string) => value.replaceAll('\\', '/');
const normalizeText = (value: string) => value.replace(/\r\n?/g, '\n');
const compare = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const isInside = (root: string, file: string) => {
  const relative = path.relative(root, file);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

/** Gitを母集団の正本にし、ignore対象の未追跡ファイルを入口へ混ぜない。 */
const listGitFiles = (root: string) =>
  [
    ...new Set(
      gitTokens(
        gitRead(root, [
          'ls-files',
          '-z',
          '--cached',
          '--others',
          '--exclude-standard',
          '--',
        ]),
      ),
    ),
  ].sort(compare);

/** マシン固有の絶対pathを出力へ含めず、Gitにある大小文字を保持する。 */
const createPaths = (root: string, gitFiles: string[]) => {
  const canonical = (file: string) =>
    ts.sys.useCaseSensitiveFileNames ? file : file.toLowerCase();
  const gitPaths = new Map(
    gitFiles.map((file) => [canonical(path.resolve(root, file)), file]),
  );
  return (file: string) =>
    gitPaths.get(canonical(path.resolve(file))) ??
    posix(path.relative(root, file));
};

const createDiagnostic = (
  diagnostic: ts.Diagnostic,
  code: string,
  root: string,
  relative: (file: string) => string,
): InventoryDiagnostic => {
  const position = diagnostic.file?.getLineAndCharacterOfPosition(
    diagnostic.start ?? 0,
  );
  return {
    code,
    severity: 'error',
    message: normalizeText(
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    )
      .replaceAll(posix(root), '.')
      .replaceAll(root, '.'),
    ...(diagnostic.file && position
      ? {
          source: {
            file: relative(diagnostic.file.fileName),
            line: position.line + 1,
            column: position.character + 1,
          },
        }
      : {}),
  };
};

/** 外部へのsymlinkと直接の範囲外importを、Compilerの読込前に拒否する。 */
const createFileAccess = (
  root: string,
  relative: (file: string) => string,
  diagnostics: InventoryDiagnostic[],
  observeRead?: SourceReadObserver,
) => {
  const observe = <T>(read: () => T, query: SourceReadQuery): T =>
    observeRead ? observeRead(read, query) : read();
  const physicalRoot = observe(() => realpathSync(root), {
    operation: 'fs.realpath',
    arguments: [root],
  });
  const nodeModules = path.join(root, 'node_modules');
  const packageRoots = new Set([
    observe(() => realpathSync(path.dirname(ts.getDefaultLibFilePath({}))), {
      operation: 'fs.realpath',
      arguments: [path.dirname(ts.getDefaultLibFilePath({}))],
    }),
  ]);
  if (
    observe(() => existsSync(nodeModules), {
      operation: 'fs.exists',
      arguments: [nodeModules],
    })
  )
    packageRoots.add(
      observe(() => realpathSync(nodeModules), {
        operation: 'fs.realpath',
        arguments: [nodeModules],
      }),
    );
  const packageAliases = new Map<string, string>();
  const isPackageFile = (absolute: string, physical: string) => {
    if (isInside(root, absolute)) {
      if (!isInside(nodeModules, absolute)) return false;
      // 正規のpackage入口から辿った実体だけを、以後の型解決にも許可する。
      const parts = path.relative(nodeModules, absolute).split(path.sep);
      const length = parts[0]?.startsWith('@') ? 2 : 1;
      const packagePath = path.join(nodeModules, ...parts.slice(0, length));
      if (
        observe(() => existsSync(packagePath), {
          operation: 'fs.exists',
          arguments: [packagePath],
        })
      ) {
        const physicalPackage = observe(() => realpathSync(packagePath), {
          operation: 'fs.realpath',
          arguments: [packagePath],
        });
        packageRoots.add(physicalPackage);
        packageAliases.set(physicalPackage, packagePath);
      }
      return true;
    }
    return [...packageRoots].some(
      (packageRoot) =>
        isInside(packageRoot, absolute) && isInside(packageRoot, physical),
    );
  };
  const checked = new Map<string, boolean>();
  const isAllowed = (file: string) => {
    const absolute = path.resolve(file);
    const cached = checked.get(absolute);
    if (cached !== undefined) return cached;
    if (
      !observe(() => existsSync(absolute), {
        operation: 'fs.exists',
        arguments: [absolute],
      })
    )
      return true;
    const physical = observe(() => realpathSync(absolute), {
      operation: 'fs.realpath',
      arguments: [absolute],
    });
    const allowed =
      isInside(physicalRoot, physical) || isPackageFile(absolute, physical);
    checked.set(absolute, allowed);
    if (!allowed)
      diagnostics.push({
        code: 'SOURCE_OUTSIDE_ROOT',
        severity: 'error',
        message: `リポジトリ外のsourceは読み込めません: ${relative(absolute)}`,
        source: { file: relative(absolute), line: 1, column: 1 },
      });
    return allowed;
  };
  const readFile = (file: string) => {
    if (!isAllowed(file)) return undefined;
    const content = observe(() => ts.sys.readFile(file), {
      operation: 'ts.readFile',
      arguments: [file],
    });
    return content === undefined ? undefined : normalizeText(content);
  };
  const manifestPath = (file: string) => {
    const alias = [...packageAliases]
      .sort(([left], [right]) => right.length - left.length)
      .find(([physical]) => isInside(physical, file));
    return alias
      ? relative(path.join(alias[1], path.relative(alias[0], file)))
      : relative(file);
  };
  return { isAllowed, readFile, manifestPath };
};

const readConfig = (
  root: string,
  relative: (file: string) => string,
  diagnostics: InventoryDiagnostic[],
  contents: Map<string, string>,
  access: ReturnType<typeof createFileAccess>,
  system: Pick<
    ts.System,
    | 'readFile'
    | 'fileExists'
    | 'readDirectory'
    | 'directoryExists'
    | 'getDirectories'
    | 'realpath'
  >,
) => {
  const config = ts.getParsedCommandLineOfConfigFile(
    path.join(root, 'tsconfig.json'),
    {},
    {
      ...ts.sys,
      ...system,
      getCurrentDirectory: () => root,
      readFile: (file) => {
        const raw = system.readFile(file);
        if (raw === undefined) return undefined;
        const text = normalizeText(raw);
        contents.set(access.manifestPath(file), text);
        return text;
      },
      onUnRecoverableConfigFileDiagnostic: (diagnostic) =>
        diagnostics.push(
          createDiagnostic(diagnostic, 'SOURCE_CONFIG_ERROR', root, relative),
        ),
    },
  );
  for (const diagnostic of config?.errors ?? [])
    diagnostics.push(
      createDiagnostic(diagnostic, 'SOURCE_CONFIG_ERROR', root, relative),
    );
  return config;
};

const createManifest = (contents: Map<string, string>): SourceManifest => {
  const files = [...contents]
    .sort(([left], [right]) => compare(left, right))
    .map(([file, content]) => ({ path: file, hash: hash(content) }));
  return { files, fingerprint: hash(JSON.stringify(files)) };
};

/** アプリを実行せず単一Programを構築し、安定したsource snapshotと診断を返す。 */
export const loadSource = (
  directory: string,
  snapshot?: SnapshotFiles & {
    packages: ReturnType<typeof createStablePackageSystem>['system'];
  },
  options: {
    entryMode?: 'product' | 'storybook';
    observeRead?: SourceReadObserver;
  } = {},
) => {
  const root = path.resolve(directory);
  const gitFiles = snapshot
    ? [...snapshot.files].sort(compare)
    : options.observeRead
      ? options.observeRead(() => listGitFiles(root), {
          operation: 'git.listFiles',
          arguments: [root],
        })
      : listGitFiles(root);
  const gitFileSet = new Set(gitFiles);
  const relative = createPaths(root, gitFiles);
  const diagnostics: InventoryDiagnostic[] = [];
  const contents = new Map<string, string>();
  const access = createFileAccess(
    root,
    relative,
    diagnostics,
    options.observeRead,
  );
  const observe = <T>(read: () => T, query: SourceReadQuery): T =>
    options.observeRead ? options.observeRead(read, query) : read();
  const sysRealpath = ts.sys.realpath;
  const physical = {
    ...ts.sys,
    readFile: access.readFile,
    fileExists: (file: string) =>
      access.isAllowed(file) &&
      observe(() => ts.sys.fileExists(file), {
        operation: 'ts.fileExists',
        arguments: [file],
      }),
    ...(options.observeRead
      ? {
          directoryExists: (directory: string) =>
            observe(() => ts.sys.directoryExists(directory), {
              operation: 'ts.directoryExists',
              arguments: [directory],
            }),
          getDirectories: (directory: string) =>
            observe(() => ts.sys.getDirectories(directory), {
              operation: 'ts.getDirectories',
              arguments: [directory],
            }),
          readDirectory: (...args: Parameters<typeof ts.sys.readDirectory>) => {
            const [directory, extensions, excludes, includes, depth] = args;
            const savedExtensions = extensions?.slice();
            const savedExcludes = excludes?.slice();
            const savedIncludes = includes?.slice();
            return observe(
              () =>
                ts.sys.readDirectory(
                  directory,
                  savedExtensions?.slice(),
                  savedExcludes?.slice(),
                  savedIncludes?.slice(),
                  depth,
                ),
              {
                operation: 'ts.readDirectory',
                arguments: [
                  directory,
                  savedExtensions,
                  savedExcludes,
                  savedIncludes,
                  depth,
                ],
              },
            );
          },
          ...(sysRealpath
            ? {
                realpath: (file: string) =>
                  observe(() => sysRealpath(file), {
                    operation: 'ts.realpath',
                    arguments: [file],
                  }),
              }
            : {}),
        }
      : {}),
  };
  const system = snapshot
    ? createSnapshotSystem(
        root,
        { ...snapshot, files: gitFiles },
        snapshot.packages,
        (file) =>
          isPackageInput(file, access.manifestPath(path.resolve(file))) &&
          access.isAllowed(file),
      )
    : physical;
  const isStorybook = options.entryMode === 'storybook';
  const entries = gitFiles
    .filter((file) => file.startsWith('src/'))
    .filter((file) => {
      const absolute = path.join(root, file);
      // cached一覧には未stage削除も残るため、現在のsnapshotからは除く。
      return system.fileExists(absolute);
    })
    // Gitはdirectory symlink自体を返すため、範囲検査を入口判定より先に行う。
    .filter(isStorybook ? isStorySourceEntry : isSourceEntry);
  const config = readConfig(
    root,
    relative,
    diagnostics,
    contents,
    access,
    system,
  );
  // tsconfigで未許可でも、GitにあるJS入口を黙って落とさず解析する。
  const compilerOptions = { ...config?.options, allowJs: true };
  const host = ts.createCompilerHost(compilerOptions, true);
  host.getCurrentDirectory = () => root;
  host.readFile = (file) => {
    const text = system.readFile(file);
    return text === undefined ? undefined : normalizeText(text);
  };
  host.fileExists = system.fileExists;
  if (snapshot) {
    host.directoryExists = system.directoryExists;
    host.getDirectories = system.getDirectories;
    if (system.realpath) host.realpath = system.realpath;
  } else if (options.observeRead) {
    host.directoryExists = physical.directoryExists;
    host.getDirectories = physical.getDirectories;
    if (physical.realpath) host.realpath = physical.realpath;
    host.readDirectory = physical.readDirectory;
  }
  // 補助型の入口もGitを正本にし、buildが作るambient型を自動追加しない。
  // 実装からimport/referenceで到達する型は、hostで除外せずsnapshotへ残す。
  const declarations = (config?.fileNames ?? []).filter(
    (file) =>
      file.endsWith('.d.ts') &&
      (snapshot ? system.fileExists(file) : access.isAllowed(file)) &&
      gitFileSet.has(relative(file)),
  );
  const program = ts.createProgram({
    rootNames: [
      ...entries.map((file) => path.join(root, file)),
      ...declarations,
    ],
    options: compilerOptions,
    host,
  });
  const checker = program.getTypeChecker();
  const indexedFiles = isStorybook
    ? [
        ...new Set([
          ...entries,
          ...program
            .getSourceFiles()
            .map(({ fileName }) => relative(fileName))
            .filter((file) => gitFileSet.has(file) && isSourceEntry(file)),
        ]),
      ].sort(compare)
    : entries;
  const files = indexedFiles.flatMap((file) => {
    const sourceFile = program.getSourceFile(path.join(root, file));
    return sourceFile ? [{ path: file, sourceFile }] : [];
  });
  for (const sourceFile of program.getSourceFiles()) {
    const file = relative(sourceFile.fileName);
    if (
      !isInside(root, sourceFile.fileName) ||
      file.startsWith('node_modules/')
    )
      continue;
    contents.set(file, normalizeText(sourceFile.text));
    for (const diagnostic of program.getSyntacticDiagnostics(sourceFile))
      diagnostics.push(
        createDiagnostic(diagnostic, 'SOURCE_PARSE_ERROR', root, relative),
      );
  }
  diagnostics.sort((left, right) =>
    compare(JSON.stringify(left), JSON.stringify(right)),
  );
  return {
    root,
    program,
    checker,
    files,
    manifest: createManifest(contents),
    diagnostics,
  };
};

export type SourceContext = ReturnType<typeof loadSource>;
