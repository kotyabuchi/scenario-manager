import ts from 'typescript';

import { isGeneratedLibraryPath } from '../sourceFiles';

import { isAbsolute, relative } from 'node:path';

import type { SourceContext } from '../source';
import type { FunctionRecord, SourceIndex } from '../sourceIndex';

/** awaitと型注釈を外し、型アサーション自体を実装由来の証拠にしない。 */
export const unwrapExpression = (input: ts.Expression): ts.Expression => {
  let expression = input;
  while (
    ts.isParenthesizedExpression(expression) ||
    ts.isAwaitExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) ||
    ts.isSatisfiesExpression(expression) ||
    ts.isNonNullExpression(expression)
  )
    expression = expression.expression;
  return expression;
};

/** 内側の関数へ入り込まず、その関数自身のreturn式を集める。 */
export const returnExpressions = (fn: FunctionRecord): ts.Expression[] => {
  if (!ts.isBlock(fn.node.body)) return [fn.node.body];
  const expressions: ts.Expression[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isReturnStatement(node) && node.expression)
      expressions.push(node.expression);
    if (!ts.isFunctionLike(node)) ts.forEachChild(node, visit);
  };
  visit(fn.node.body);
  return expressions;
};

const constantInitializer = (node: ts.Node) =>
  ts.isVariableDeclaration(node) &&
  ts.isVariableDeclarationList(node.parent) &&
  node.parent.flags & ts.NodeFlags.Const
    ? node.initializer
    : undefined;

/** 実装の由来と型宣言の由来を分け、既知生成rootはmanifest内だけを許可する。 */
export const createDependencyProvenance = (
  context: SourceContext,
  index: SourceIndex,
) => {
  const manifest = new Set(context.manifest.files.map((file) => file.path));
  const generatedPath = (node: ts.Node) => {
    const file = relative(
      context.root,
      node.getSourceFile().fileName,
    ).replaceAll('\\', '/');
    return !isAbsolute(file) &&
      isGeneratedLibraryPath(file) &&
      manifest.has(file)
      ? file
      : undefined;
  };
  const isExternal = (node: ts.Node) =>
    node
      .getSourceFile()
      .fileName.replaceAll('\\', '/')
      .includes('/node_modules/') ||
    context.program.isSourceFileDefaultLibrary(node.getSourceFile());
  const declarations = (node: ts.Node) => {
    let symbol = context.checker.getSymbolAtLocation(node);
    const seen = new Set<ts.Symbol>();
    while (symbol && symbol.flags & ts.SymbolFlags.Alias) {
      if (seen.has(symbol)) return [];
      seen.add(symbol);
      symbol = context.checker.getAliasedSymbol(symbol);
    }
    return symbol?.declarations ?? [];
  };
  const externalImplementation = (
    input: ts.Expression,
    seen = new Set<ts.Node>(),
  ): boolean => {
    const expression = unwrapExpression(input);
    if (seen.has(expression)) return false;
    seen.add(expression);
    if (ts.isConditionalExpression(expression))
      return (
        externalImplementation(expression.whenTrue, new Set(seen)) &&
        externalImplementation(expression.whenFalse, new Set(seen))
      );
    if (ts.isCallExpression(expression) || ts.isNewExpression(expression)) {
      const fn = index.resolveFunction(expression.expression);
      if (fn) {
        const returns = returnExpressions(fn);
        return (
          returns.length > 0 &&
          returns.every((value) => externalImplementation(value, new Set(seen)))
        );
      }
      // 外部HOFへ渡したcallbackを、そのlibraryの実装とみなさない。
      if (
        expression.arguments?.some(
          (argument) =>
            context.checker.getTypeAtLocation(argument).getCallSignatures()
              .length > 0,
        )
      )
        return false;
      return externalImplementation(expression.expression, seen);
    }
    if (
      ts.isPropertyAccessExpression(expression) ||
      ts.isElementAccessExpression(expression)
    ) {
      const name = ts.isPropertyAccessExpression(expression)
        ? expression.name.text
        : ts.isStringLiteralLike(expression.argumentExpression)
          ? expression.argumentExpression.text
          : undefined;
      if (
        name &&
        ['bind', 'call', 'apply'].includes(name) &&
        !externalImplementation(expression.expression, new Set(seen))
      )
        return false;
    }
    const reference = ts.isPropertyAccessExpression(expression)
      ? expression.name
      : expression;
    const origins = declarations(reference);
    return (
      origins.length > 0 &&
      origins.every((declaration) => {
        // 標準libのArray/String/Date等には実行時の標準実装がある。
        if (
          context.program.isSourceFileDefaultLibrary(
            declaration.getSourceFile(),
          )
        )
          return true;
        if (isExternal(declaration) || generatedPath(declaration)) {
          if (
            ts.isPropertyAccessExpression(expression) ||
            ts.isElementAccessExpression(expression)
          )
            return externalImplementation(expression.expression, new Set(seen));
          return (
            !ts.isParameter(declaration) &&
            !ts.isTypeParameterDeclaration(declaration)
          );
        }
        const initializer = constantInitializer(declaration);
        if (initializer)
          return externalImplementation(initializer, new Set(seen));
        if (ts.isBindingElement(declaration)) {
          let parent: ts.Node = declaration.parent;
          while (
            parent.parent &&
            !ts.isVariableDeclaration(parent) &&
            !ts.isParameter(parent)
          )
            parent = parent.parent;
          const binding = constantInitializer(parent);
          if (binding) return externalImplementation(binding, new Set(seen));
        }
        return false;
      })
    );
  };
  return { declarations, generatedPath, isExternal, externalImplementation };
};

type DependencyProvenance = ReturnType<typeof createDependencyProvenance>;
export type { DependencyProvenance };
