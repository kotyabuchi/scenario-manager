import ts from 'typescript';

import { getActionAnnotation, parseActionAnnotation } from '../sourceIndex';
import { runtimeExports } from './exports';

import type {
  InventoryDiagnostic,
  InventoryEdge,
  InventoryNode,
} from '../inventorySchema';
import type { SourceContext } from '../source';
import type { SourceIndex } from '../sourceIndex';

const hasServerDirective = (statements: ts.NodeArray<ts.Statement>) => {
  for (const statement of statements) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isStringLiteral(statement.expression)
    )
      return false;
    if (statement.expression.text === 'use server') return true;
  }
  return false;
};

/** file/inline directiveを持つAction入口と、静的に解決できる実体への辺を抽出する。 */
export const extractActions = (context: SourceContext, index: SourceIndex) => {
  const nodes: InventoryNode[] = [];
  const edges: InventoryEdge[] = [];
  const diagnostics: InventoryDiagnostic[] = [];
  const fileActions = new Set<ts.Node>();
  const invalidAnnotations = new Set<ts.Node>();
  const hasInvalidAnnotation = (node: ts.Node) => {
    const annotation = parseActionAnnotation(node);
    if (!annotation || annotation.valid) return false;
    if (!invalidAnnotations.has(node)) {
      invalidAnnotations.add(node);
      diagnostics.push({
        code: 'ACTION_INVALID_ANNOTATION',
        severity: 'error',
        message: `@e2e-actionの指定が不正です: ${annotation.tokens.map((token) => JSON.stringify(token)).join(', ')}。1関数につき1件、[A-Za-z0-9][A-Za-z0-9_.-]*の形式で指定してください。`,
        source: index.location(node),
      });
    }
    return true;
  };
  const add = (
    id: string,
    symbol: string,
    node: ts.Node,
    target?: ReturnType<SourceIndex['getFunction']>,
  ) => {
    if (nodes.some((entry) => entry.id === id)) {
      diagnostics.push({
        code: 'ACTION_DUPLICATE_ID',
        severity: 'error',
        message: `Action IDが重複しています: ${id}`,
        source: index.location(node),
      });
      return;
    }
    nodes.push({
      id,
      kind: 'action',
      symbol,
      source: index.location(node),
      slots: [],
    });
    if (target)
      edges.push({
        from: id,
        to: target.id,
        kind: 'exports',
        source: index.location(node),
      });
  };
  const checkAsync = (node: ts.Node) => {
    if (
      !ts.canHaveModifiers(node) ||
      !ts
        .getModifiers(node)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
    )
      diagnostics.push({
        code: 'ACTION_NOT_ASYNC',
        severity: 'error',
        message: 'Server Actionにはasync関数が必要です。',
        source: index.location(node),
      });
  };

  for (const { path: file, sourceFile } of context.files) {
    if (!hasServerDirective(sourceFile.statements)) continue;
    const exported = runtimeExports(sourceFile, context, index);
    diagnostics.push(...exported.diagnostics);
    for (const { name, symbol, node } of exported.exports) {
      const target = index.resolveSymbol(symbol);
      if (!target || ts.isConstructorDeclaration(target.node)) {
        const resolved =
          symbol.flags & ts.SymbolFlags.Alias
            ? context.checker.getAliasedSymbol(symbol)
            : symbol;
        const declaration = resolved.valueDeclaration;
        const callable =
          context.checker
            .getTypeOfSymbolAtLocation(resolved, declaration ?? node)
            .getCallSignatures().length > 0;
        if (!declaration || callable) add(`action:${file}#${name}`, name, node);
        diagnostics.push({
          code:
            !declaration || callable
              ? 'ACTION_UNRESOLVED_EXPORT'
              : 'ACTION_NON_FUNCTION_EXPORT',
          severity: 'error',
          message: `Action export ${name}の関数実体を解決できません。`,
          source: index.location(node),
        });
        continue;
      }
      if (hasInvalidAnnotation(target.node)) continue;
      add(`action:${file}#${name}`, name, node, target);
      // 同じファイルのfile exportとinlineを二重登録しない。別ファイルの再exportは別入口。
      if (index.filePath(target.node) === file) fileActions.add(target.node);
      checkAsync(target.node);
    }
  }

  for (const { sourceFile } of context.files) {
    const visit = (node: ts.Node) => {
      if (
        (ts.isFunctionDeclaration(node) ||
          ts.isFunctionExpression(node) ||
          ts.isArrowFunction(node) ||
          ts.isMethodDeclaration(node) ||
          ts.isGetAccessor(node) ||
          ts.isSetAccessor(node) ||
          ts.isConstructorDeclaration(node)) &&
        node.body &&
        ts.isBlock(node.body) &&
        hasServerDirective(node.body.statements) &&
        !fileActions.has(node)
      ) {
        const target = index.getFunction(node);
        if (hasInvalidAnnotation(node)) {
          // 不正注釈を通常名や切り詰めたIDへ読み替えない。
        } else if (target)
          add(
            target.id.replace(/^function:/, 'action:'),
            target.name,
            node,
            target,
          );
        else {
          const annotation = getActionAnnotation(node);
          diagnostics.push({
            code: annotation
              ? 'ACTION_DUPLICATE_ANNOTATION'
              : 'ACTION_ANONYMOUS',
            severity: 'error',
            message: annotation
              ? `@e2e-action ${annotation}が重複しています。ファイル内で一意のIDを指定してください。`
              : '安定した名前のないActionには直前コメントで@e2e-action <stable-name>を指定してください。',
            source: index.location(node),
          });
        }
        checkAsync(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return { nodes, edges, diagnostics };
};
