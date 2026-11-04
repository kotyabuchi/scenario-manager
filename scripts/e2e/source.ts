import ts from 'typescript';

import { isSourceEntry } from './sourceFiles';

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import path from 'node:path';

import type { InventoryDiagnostic, SourceManifest } from './inventorySchema';

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
      execFileSync(
        'git',
        ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
        {
          cwd: root,
          encoding: 'utf8',
          windowsHide: true,
          maxBuffer: 16 * 1024 * 1024,
        },
      )
        .split('\0')
        .filter(Boolean),
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
) => {
  const physicalRoot = realpathSync(root);
  const nodeModules = path.join(root, 'node_modules');
  const packageRoots = new Set([
    realpathSync(path.dirname(ts.getDefaultLibFilePath({}))),
  ]);
  if (existsSync(nodeModules)) packageRoots.add(realpathSync(nodeModules));
  const packageAliases = new Map<string, string>();
  const isPackageFile = (absolute: string, physical: string) => {
    if (isInside(root, absolute)) {
      if (!isInside(nodeModules, absolute)) return false;
      // 正規のpackage入口から辿った実体だけを、以後の型解決にも許可する。
      const parts = path.relative(nodeModules, absolute).split(path.sep);
      const length = parts[0]?.startsWith('@') ? 2 : 1;
      const packagePath = path.join(nodeModules, ...parts.slice(0, length));
      if (existsSync(packagePath)) {
        const physicalPackage = realpathSync(packagePath);
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
    if (!existsSync(absolute)) return true;
    const physical = realpathSync(absolute);
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
    const content = ts.sys.readFile(file);
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
) => {
  const config = ts.getParsedCommandLineOfConfigFile(
    path.join(root, 'tsconfig.json'),
    {},
    {
      ...ts.sys,
      getCurrentDirectory: () => root,
      fileExists: (file) => access.isAllowed(file) && ts.sys.fileExists(file),
      readFile: (file) => {
        const text = access.readFile(file);
        if (text === undefined) return undefined;
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
export const loadSource = (directory: string) => {
  const root = path.resolve(directory);
  const gitFiles = listGitFiles(root);
  const gitFileSet = new Set(gitFiles);
  const relative = createPaths(root, gitFiles);
  const diagnostics: InventoryDiagnostic[] = [];
  const contents = new Map<string, string>();
  const access = createFileAccess(root, relative, diagnostics);
  const entries = gitFiles
    .filter((file) => file.startsWith('src/'))
    .filter((file) => {
      const absolute = path.join(root, file);
      // cached一覧には未stage削除も残るため、現在のsnapshotからは除く。
      return existsSync(absolute) && access.isAllowed(absolute);
    })
    // Gitはdirectory symlink自体を返すため、範囲検査を入口判定より先に行う。
    .filter(isSourceEntry);
  const config = readConfig(root, relative, diagnostics, contents, access);
  // tsconfigで未許可でも、GitにあるJS入口を黙って落とさず解析する。
  const options = { ...config?.options, allowJs: true };
  const host = ts.createCompilerHost(options, true);
  host.getCurrentDirectory = () => root;
  host.readFile = access.readFile;
  host.fileExists = (file) => access.isAllowed(file) && ts.sys.fileExists(file);
  // 補助型の入口もGitを正本にし、buildが作るambient型を自動追加しない。
  // 実装からimport/referenceで到達する型は、hostで除外せずsnapshotへ残す。
  const declarations = (config?.fileNames ?? []).filter(
    (file) =>
      file.endsWith('.d.ts') &&
      access.isAllowed(file) &&
      gitFileSet.has(relative(file)),
  );
  const program = ts.createProgram({
    rootNames: [
      ...entries.map((file) => path.join(root, file)),
      ...declarations,
    ],
    options,
    host,
  });
  const checker = program.getTypeChecker();
  const files = entries.flatMap((file) => {
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
