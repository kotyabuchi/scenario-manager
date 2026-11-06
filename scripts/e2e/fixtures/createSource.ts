import ts from 'typescript';

import { isSourceEntry } from '../sourceFiles';

import { createHash } from 'node:crypto';
import path from 'node:path';

import type { SourceContext } from '../source';

/** Git・一時ファイル・アプリ実行を使わず、抽出器共通の小さいProgramを作る。 */
export const createSourceFixture = (
  input: Record<string, string>,
): SourceContext => {
  const root = '/source-fixture';
  const absolute = (file: string) =>
    path.posix.resolve(root, file.replaceAll('\\', '/'));
  const contents = new Map(
    Object.entries(input).map(([file, text]) => [
      absolute(file),
      text.replace(/\r\n?/g, '\n'),
    ]),
  );
  const host: ts.CompilerHost = {
    getCurrentDirectory: () => root,
    getCanonicalFileName: (file) => absolute(file),
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    getDefaultLibFileName: () => `${root}/lib.d.ts`,
    fileExists: (file) => contents.has(absolute(file)),
    readFile: (file) => contents.get(absolute(file)),
    directoryExists: (directory) =>
      [...contents.keys()].some((file) =>
        file.startsWith(`${absolute(directory)}/`),
      ),
    getSourceFile: (file, languageVersion) => {
      const text = contents.get(absolute(file));
      return text === undefined
        ? undefined
        : ts.createSourceFile(absolute(file), text, languageVersion, true);
    },
    writeFile: () => {
      throw new Error('抽出fixtureはemitしません。');
    },
  };
  const program = ts.createProgram({
    rootNames: [...contents.keys()],
    host,
    options: {
      noLib: true,
      types: [],
      strict: true,
      noEmit: true,
      allowJs: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.Preserve,
      baseUrl: root,
      paths: { '@/*': ['src/*'] },
    },
  });
  const files = [...contents.keys()].sort().flatMap((file) => {
    const relative = path.posix.relative(root, file);
    const sourceFile = program.getSourceFile(file);
    if (!sourceFile || !isSourceEntry(relative)) return [];
    return [{ path: relative, sourceFile }];
  });
  const hash = (text: string) =>
    createHash('sha256').update(text).digest('hex');
  const manifestFiles = [...contents]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([file, text]) => ({
      path: path.posix.relative(root, file),
      hash: hash(text),
    }));
  return {
    root,
    program,
    checker: program.getTypeChecker(),
    files,
    manifest: {
      files: manifestFiles,
      fingerprint: hash(JSON.stringify(manifestFiles)),
    },
    diagnostics: [],
  };
};
