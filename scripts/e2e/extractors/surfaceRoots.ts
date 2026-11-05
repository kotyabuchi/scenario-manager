import { isNil } from 'ramda';
import ts from 'typescript';

import { createDiagnosticAnchors } from '../diagnosticAnchors';
import { loadSource } from '../source';
import { isStorySourceEntry } from '../sourceFiles';
import { unwrapExpression } from './dependencyProvenance';
import { runtimeExports } from './exports';

import type { InventoryNode } from '../inventorySchema';
import type { SourceContext } from '../source';
import type { SourceIndex } from '../sourceIndex';
import type { SurfaceDiagnostic, SurfaceEntry } from '../surfaceSchema';
import type { EntryRoot } from './surfaceTypes';

/** productと別Programを、同じGit/VFS入力から組み立てる。 */
export const loadStorySurfaceContext = (
  root: string,
  snapshot?: Parameters<typeof loadSource>[1],
) => loadSource(root, snapshot, { entryMode: 'storybook' });

const rootDiagnostics = (index: SourceIndex) => {
  const anchor = createDiagnosticAnchors(index);
  return (
    entry: SurfaceEntry,
    node: ts.Node,
    code: string,
    message: string,
  ): SurfaceDiagnostic => ({
    entry,
    code,
    message,
    source: index.location(node),
    anchor: anchor(node, code),
    mountSiteIds: [],
  });
};

const UI_ROOT_KINDS = new Set<InventoryNode['kind']>([
  'page',
  'layout',
  'default',
  'loading',
  'error',
  'template',
  'not-found',
  'global-error',
]);

/** 同じファイル内の補助関数を含めず、ルートの実default exportだけから始める。 */
export const productSurfaceRoots = (
  context: SourceContext,
  index: SourceIndex,
  routes: InventoryNode[],
) => {
  const roots: EntryRoot[] = [];
  const diagnostics: SurfaceDiagnostic[] = [];
  const diagnose = rootDiagnostics(index);
  const byPath = new Map(
    context.files.map(({ path, sourceFile }) => [path, sourceFile]),
  );
  for (const route of routes) {
    if (!UI_ROOT_KINDS.has(route.kind)) continue;
    const file = byPath.get(route.source.file);
    if (isNil(file)) throw new Error('UIルートのsourceが見つかりません。');
    const entry = { kind: 'product', id: route.id } as const;
    const exported = runtimeExports(file, context, index).exports.find(
      ({ name }) => name === 'default',
    );
    const fn = isNil(exported)
      ? undefined
      : index.resolveSymbol(exported.symbol);
    if (isNil(fn) || ts.isConstructorDeclaration(fn.node)) {
      diagnostics.push(
        diagnose(
          entry,
          exported?.node ?? file,
          'SURFACE_UNRESOLVED_PRODUCT_ROOT',
          '描画ルートのdefault exportを解決できません。',
        ),
      );
    } else roots.push({ entry, node: fn.node });
  }
  return { roots, diagnostics };
};

const hasMethodBody = (
  node: ts.Node,
): node is ts.MethodDeclaration & { body: ts.Block } =>
  ts.isMethodDeclaration(node) && !isNil(node.body);

const staticPropertyName = (name: ts.PropertyName) => {
  if (ts.isIdentifier(name)) return name.text;
  const token = ts.isComputedPropertyName(name) ? name.expression : name;
  return ts.isStringLiteralLike(token) || ts.isNumericLiteral(token)
    ? token.text
    : undefined;
};

const exportedObject = (
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  visited = new Set<ts.Symbol>(),
): ts.ObjectLiteralExpression | undefined => {
  const target =
    symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  const declaration = target.valueDeclaration;
  if (isNil(declaration) || visited.has(target)) return undefined;
  visited.add(target);
  const value = ts.isExportAssignment(declaration)
    ? declaration.expression
    : ts.isVariableDeclaration(declaration) &&
        ts.isVariableDeclarationList(declaration.parent) &&
        declaration.parent.flags & ts.NodeFlags.Const
      ? declaration.initializer
      : undefined;
  if (isNil(value)) return undefined;
  const expression = unwrapExpression(value);
  if (ts.isObjectLiteralExpression(expression)) return expression;
  const alias = ts.isIdentifier(expression)
    ? checker.getSymbolAtLocation(expression)
    : undefined;
  return isNil(alias) ? undefined : exportedObject(alias, checker, visited);
};

/** CSFの名前付きobjectの明示renderだけを、独立したstory entryとして扱う。 */
export const storySurfaceRoots = (
  context: SourceContext,
  index: SourceIndex,
) => {
  if (context.diagnostics.some(({ severity }) => severity === 'error'))
    throw new Error('Storybook観測用sourceの構築に失敗しました。');
  const roots: EntryRoot[] = [];
  const diagnostics: SurfaceDiagnostic[] = [];
  const diagnose = rootDiagnostics(index);
  for (const { path, sourceFile } of context.files) {
    if (!isStorySourceEntry(path)) continue;
    const { exports } = runtimeExports(sourceFile, context, index);
    const metadata = exports.find(({ name }) => name === 'default');
    if (
      isNil(metadata) ||
      isNil(exportedObject(metadata.symbol, context.checker))
    ) {
      diagnostics.push(
        diagnose(
          { kind: 'storybook', id: path },
          metadata?.node ?? sourceFile,
          'SURFACE_UNRESOLVED_STORY_META',
          'CSFのdefault exportを解決できません。',
        ),
      );
      continue;
    }
    for (const { name, symbol, node } of exports) {
      if (name === 'default' || name === '__namedExportsOrder') continue;
      const entry = { kind: 'storybook', id: `${path}#${name}` } as const;
      const object = exportedObject(symbol, context.checker);
      const render = object?.properties.findLast(
        (property) =>
          ts.isSpreadAssignment(property) ||
          staticPropertyName(property.name) === 'render' ||
          (ts.isComputedPropertyName(property.name) &&
            isNil(staticPropertyName(property.name))),
      );
      if (
        !isNil(render) &&
        ts.isPropertyAssignment(render) &&
        staticPropertyName(render.name) === 'render'
      ) {
        const expression = unwrapExpression(render.initializer);
        const implementation = ts.isArrowFunction(expression)
          ? expression
          : ts.isFunctionExpression(expression)
            ? expression
            : index.resolveFunction(expression)?.node;
        if (!isNil(implementation) && !isNil(index.filePath(implementation))) {
          roots.push({ entry, node: implementation });
          continue;
        }
      }
      if (
        !isNil(render) &&
        hasMethodBody(render) &&
        staticPropertyName(render.name) === 'render'
      ) {
        roots.push({ entry, node: render });
        continue;
      }
      diagnostics.push(
        diagnose(
          entry,
          render ?? node,
          'SURFACE_UNRESOLVED_STORY_RENDER',
          'CSFの明示renderを解決できません。',
        ),
      );
    }
  }
  return { roots, diagnostics };
};
