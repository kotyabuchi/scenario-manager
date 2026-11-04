import ts from 'typescript';
import { z } from 'zod';

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const TEST_FILE_PATTERN = /\.test\.tsx?$/;
const UNIT_DOM_PATTERN =
  /^src\/components\/blocks\/SpeedDialFAB\/__tests__\/[^/]+\.test\.ts$/;
const DB_MODULES = new Set([
  '@supabase/supabase-js',
  '@supabase/ssr',
  '@/lib/supabase/server',
]);
const DB_HELPERS = new Set([
  'src/__tests__/helpers/testClient.ts',
  'src/__tests__/helpers/fixtures.ts',
]);
const manifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    files: z.array(
      z
        .object({
          path: z.string().regex(/^src\/.*\.test\.tsx?$/),
          reason: z.string().trim().min(1),
          legacyRisks: z.array(z.string().trim().min(1)),
        })
        .strict(),
    ),
    mockedFiles: z.array(
      z
        .object({
          path: z.string().regex(/^src\/.*\.test\.tsx?$/),
          reason: z.string().trim().min(1),
        })
        .strict(),
    ),
  })
  .strict();

type TestProjects = {
  unit: string[];
  'unit-dom': string[];
  component: string[];
  integration: string[];
};

const toPosix = (value: string) => value.replaceAll('\\', '/');

const findTestFiles = (root: string, directory = 'src'): string[] =>
  readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(
    (entry) => {
      const relativePath = `${directory}/${entry.name}`;
      if (entry.isSymbolicLink()) {
        throw new Error(`テスト分類ではsymlinkを扱えません: ${relativePath}`);
      }
      if (entry.isDirectory()) return findTestFiles(root, relativePath);
      return TEST_FILE_PATTERN.test(entry.name) ? [relativePath] : [];
    },
  );

const readDbFiles = (root: string, tests: Set<string>) => {
  const manifest = manifestSchema.parse(
    JSON.parse(
      readFileSync(path.join(root, 'scripts/e2e/db-test-files.json'), 'utf8'),
    ),
  );
  const registered = new Set<string>();
  for (const entry of manifest.files) {
    if (registered.has(entry.path)) {
      throw new Error(`DBテストの登録が重複しています: ${entry.path}`);
    }
    if (!tests.has(entry.path)) {
      throw new Error(`登録されたDBテストが存在しません: ${entry.path}`);
    }
    registered.add(entry.path);
  }
  const mockedFiles = new Set<string>();
  for (const entry of manifest.mockedFiles) {
    if (mockedFiles.has(entry.path) || registered.has(entry.path)) {
      throw new Error(`mock境界テストの登録が重複しています: ${entry.path}`);
    }
    if (!tests.has(entry.path)) {
      throw new Error(`登録されたmock境界テストが存在しません: ${entry.path}`);
    }
    mockedFiles.add(entry.path);
  }
  return { dbFiles: registered, mockedFiles };
};

const resolveTestImport = (root: string, file: string, specifier: string) => {
  const relativePath = specifier.startsWith('@/')
    ? `src/${specifier.slice(2)}`
    : specifier.startsWith('.')
      ? toPosix(path.join(path.dirname(file), specifier))
      : undefined;
  if (!relativePath?.startsWith('src/')) return undefined;
  return [
    relativePath,
    `${relativePath}.ts`,
    `${relativePath}.tsx`,
    `${relativePath}/index.ts`,
    `${relativePath}/index.tsx`,
  ].find(
    (candidate) =>
      /\.tsx?$/.test(candidate) && existsSync(path.join(root, candidate)),
  );
};

/** テストとその補助コードを解析し、実DB用clientの混入を検出する。 */
const findDbDependency = (
  root: string,
  file: string,
  visited: Set<string>,
): string | undefined => {
  if (DB_HELPERS.has(file)) return file;
  if (visited.has(file)) return undefined;
  visited.add(file);
  const source = ts.createSourceFile(
    file,
    readFileSync(path.join(root, file), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const imports: string[] = [];
  let directCall: string | undefined;
  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      !node.importClause?.isTypeOnly &&
      (!node.importClause?.namedBindings ||
        node.importClause.name ||
        ts.isNamespaceImport(node.importClause.namedBindings) ||
        node.importClause.namedBindings.elements.some(
          (element) => !element.isTypeOnly,
        )) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    }
    if (
      ts.isExportDeclaration(node) &&
      !node.isTypeOnly &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node)) {
      if (
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'getTestClient'
      ) {
        directCall = `${file}: getTestClient()`;
      }
      const argument = node.arguments[0];
      if (
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === 'require')) &&
        argument &&
        ts.isStringLiteral(argument)
      ) {
        imports.push(argument.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (directCall) return directCall;
  for (const specifier of imports) {
    if (DB_MODULES.has(specifier)) return `${file}: ${specifier}`;
    const dependency = resolveTestImport(root, file, specifier);
    if (!dependency) continue;
    if (DB_HELPERS.has(dependency)) return dependency;
    // アプリの未実行関数までDB利用と判定しない。補助コード内の依存だけを追う。
    if (dependency.includes('/__tests__/')) {
      const reason = findDbDependency(root, dependency, visited);
      if (reason) return reason;
    }
  }
  return undefined;
};

/** 全srcテストを一意に分類し、未登録の実DB依存と登録の不整合を拒否する。 */
export const getTestProjects = (root: string): TestProjects => {
  const tests = findTestFiles(root).sort();
  const { dbFiles, mockedFiles } = readDbFiles(root, new Set(tests));
  const projects: TestProjects = {
    unit: [],
    'unit-dom': [],
    component: [],
    integration: [],
  };
  for (const file of tests) {
    if (dbFiles.has(file)) {
      projects.integration.push(file);
      continue;
    }
    // 明示登録は分類だけに影響する。pure setupの実client拒否は常に維持する。
    const dependency = mockedFiles.has(file)
      ? undefined
      : findDbDependency(root, file, new Set());
    if (dependency) {
      throw new Error(
        `未登録のDB依存テストです: ${file} → ${dependency}。db-test-files.jsonのfiles（実DB）またはmockedFiles（mock境界）へ理由付きで登録してください。`,
      );
    }
    if (UNIT_DOM_PATTERN.test(file)) projects['unit-dom'].push(file);
    else if (file.endsWith('.test.tsx') && !file.includes('/__tests__/')) {
      projects.component.push(file);
    } else projects.unit.push(file);
  }
  return projects;
};

/** Nextの[id]や(main)をglob構文として解釈させず、実ファイル名へ一致させる。 */
export const escapeTestPathForGlob = (file: string): string =>
  toPosix(file).replace(/[*?[\]{}()!+@]/g, (character) => `[${character}]`);

export type { TestProjects };
