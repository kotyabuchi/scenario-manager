import ts from 'typescript';
import { z } from 'zod';

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const TEST_FILE_PATTERN = /\.test\.tsx?$/;
const UNIT_DOM_PATTERN =
  /^src\/components\/blocks\/SpeedDialFAB\/__tests__\/[^/]+\.test\.ts$/;
// Storybook注釈を使わないことを監査済みの直接描画テストだけを明示する。
export const DIRECT_DOM_TEST_FILES: readonly string[] = [
  'src/app/(main)/scenarios/_components/ScenarioFilters/ScenarioFilters.test.tsx',
  'src/app/(main)/scenarios/[id]/_components/ScenarioDetailPanel/ScenarioDetailHead.test.tsx',
  'src/app/(main)/scenarios/[id]/_components/ScenarioDetailPanel/ScenarioDetailPanel.test.tsx',
  'src/app/(main)/sessions/_components/SessionTabs.test.tsx',
  'src/app/(main)/sessions/[id]/_components/ParticipantsSection/ParticipantsSection.test.tsx',
  'src/app/(main)/sessions/new/_components/ParticipantsSection/MemberSearchInput.test.tsx',
  'src/app/(main)/sessions/new/_components/ScenarioSelectSection/ScenarioSearchModal.test.tsx',
  'src/components/blocks/AuthPrompt/AuthPromptDialog.test.tsx',
  'src/components/blocks/FilterPanel/FilterPanel.test.tsx',
  'src/components/blocks/GlobalHeader/GlobalHeader.test.tsx',
  'src/components/blocks/SideMenu/SideMenu.test.tsx',
  'src/components/elements/combobox/combobox.test.tsx',
  'src/components/elements/date-picker/date-picker.test.tsx',
  'src/components/elements/Divider/Divider.test.tsx',
  'src/components/elements/file-upload/file-upload.test.tsx',
  'src/components/elements/number-input/number-input.test.tsx',
  'src/components/elements/radio-group/radio-group.test.tsx',
  'src/components/elements/select/select.test.tsx',
  'src/components/elements/slider/slider.test.tsx',
];
const DB_MODULES = new Set([
  '@supabase/supabase-js',
  '@supabase/ssr',
  '@/lib/supabase/server',
  '@/lib/supabase/client',
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
    verifiedFiles: z
      .array(
        z.strictObject({
          path: z.string().regex(/^src\/.*\.test\.tsx?$/),
          reason: z.string().trim().min(1),
        }),
      )
      .default([]),
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
  'integration-verified': string[];
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
  const seen = new Set<string>();
  const collect = (entries: { path: string }[]) => {
    const files = new Set<string>();
    for (const entry of entries) {
      if (seen.has(entry.path))
        throw new Error(`DBテストの所属が重複しています: ${entry.path}`);
      if (!tests.has(entry.path))
        throw new Error(`登録されたDBテストが存在しません: ${entry.path}`);
      seen.add(entry.path);
      files.add(entry.path);
    }
    return files;
  };
  return {
    dbFiles: collect(manifest.files),
    verifiedFiles: collect(manifest.verifiedFiles),
    mockedFiles: collect(manifest.mockedFiles),
  };
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

/** 軽量DOM対象の直接Story参照と不明な動的読込を拒否する。間接依存は監査対象とする。 */
const assertDirectDomImports = (root: string, file: string) => {
  const source = ts.createSourceFile(
    file,
    readFileSync(path.join(root, file), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const check = (specifier: string) => {
    if (
      /\.stories(?:[./?#]|$)/.test(specifier) ||
      specifier.startsWith('@storybook/') ||
      specifier === 'storybook' ||
      specifier.startsWith('storybook/')
    )
      throw new Error(`軽量DOM対象にStorybookの実行時参照があります: ${file}`);
  };
  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const clause = node.importClause;
      if (
        !clause?.isTypeOnly &&
        (!clause ||
          clause.name ||
          !clause.namedBindings ||
          ts.isNamespaceImport(clause.namedBindings) ||
          clause.namedBindings.elements.length === 0 ||
          clause.namedBindings.elements.some((element) => !element.isTypeOnly))
      )
        check(node.moduleSpecifier.text);
    }
    if (
      ts.isExportDeclaration(node) &&
      !node.isTypeOnly &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const clause = node.exportClause;
      if (
        !clause ||
        ts.isNamespaceExport(clause) ||
        clause.elements.length === 0 ||
        clause.elements.some((element) => !element.isTypeOnly)
      )
        check(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require'))
    ) {
      const specifier = node.arguments[0];
      if (!specifier || !ts.isStringLiteralLike(specifier))
        throw new Error(`軽量DOM対象の動的読込先が不明です: ${file}`);
      check(specifier.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
};

/** 全srcテストを一意に分類し、未登録の実DB依存と登録の不整合を拒否する。 */
export const getTestProjects = (root: string): TestProjects => {
  const tests = findTestFiles(root).sort();
  const { dbFiles, verifiedFiles, mockedFiles } = readDbFiles(
    root,
    new Set(tests),
  );
  const directDomFiles = new Set(DIRECT_DOM_TEST_FILES);
  if (directDomFiles.size !== DIRECT_DOM_TEST_FILES.length)
    throw new Error('軽量DOM対象の登録が重複しています');
  for (const file of directDomFiles) {
    // 小さい検査fixtureも扱う。基準repoでの登録対象の存在は分類回帰で検査する。
    if (!tests.includes(file)) continue;
    if (dbFiles.has(file) || verifiedFiles.has(file))
      throw new Error(`軽量DOM対象と実DB対象の所属が重複しています: ${file}`);
    assertDirectDomImports(root, file);
  }
  const projects: TestProjects = {
    unit: [],
    'unit-dom': [],
    component: [],
    integration: [],
    'integration-verified': [],
  };
  for (const file of tests) {
    if (verifiedFiles.has(file)) {
      projects['integration-verified'].push(file);
      continue;
    }
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
        `未登録のDB依存テストです: ${file} → ${dependency}。db-test-files.jsonのfiles（legacy実DB）、verifiedFiles（case別実DB）またはmockedFiles（mock境界）へ理由付きで登録してください。`,
      );
    }
    if (UNIT_DOM_PATTERN.test(file) || directDomFiles.has(file))
      projects['unit-dom'].push(file);
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
