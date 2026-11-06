import { isNil } from 'ramda';
import ts from 'typescript';

import { createHash } from 'node:crypto';

import type { DiagnosticAnchor } from './inventorySchema';
import type { SourceIndex } from './sourceIndex';

type CanonicalSyntax = [ts.SyntaxKind, string | CanonicalSyntax[]];

/** ASTの構造とtoken値を保持し、コメントとlist末尾の区切りなどの整形差だけを除く。 */
const canonicalSyntax = (node: ts.Node): CanonicalSyntax => {
  if (ts.isTemplateLiteralToken(node))
    return [node.kind, node.rawText ?? node.text];
  if (
    ts.isLiteralExpression(node) ||
    ts.isIdentifier(node) ||
    ts.isPrivateIdentifier(node) ||
    ts.isJsxText(node)
  )
    return [node.kind, node.text];
  return [
    node.kind,
    node
      .getChildren(node.getSourceFile())
      .filter((child) => {
        if (ts.isJSDoc(child)) return false;
        if (
          child.kind >= ts.SyntaxKind.FirstTriviaToken &&
          child.kind <= ts.SyntaxKind.LastTriviaToken
        )
          return false;
        // 配列の穴はOmittedExpressionとして残す。comma演算子は除去しない。
        if (
          node.kind !== ts.SyntaxKind.BinaryExpression &&
          child.kind === ts.SyntaxKind.CommaToken
        )
          return false;
        // forの各節はセミコロンの位置が意味を持つため保持する。
        return (
          node.kind === ts.SyntaxKind.ForStatement ||
          child.kind !== ts.SyntaxKind.SemicolonToken
        );
      })
      .map(canonicalSyntax),
  ];
};

/** 行・コメント・整形に依存せず、callee・引数・import先を含む診断対象をハッシュ化する。 */
export const diagnosticSyntaxHash = (node: ts.Node) =>
  createHash('sha256')
    .update(JSON.stringify(canonicalSyntax(node)))
    .digest('hex');

/** source順の診断通知へ安定anchorを付与し、同じnode/codeの再通知では連番を消費しない。 */
export const createDiagnosticAnchors = (index: SourceIndex) => {
  const anchors = new WeakMap<ts.Node, Map<string, DiagnosticAnchor>>();
  const occurrences = new Map<string, number>();
  const ownerId = (node: ts.Node) => {
    // 未登録の匿名関数を越えて、最寄りの安定した関数IDを探す。
    for (
      let current: ts.Node | undefined = node;
      !isNil(current);
      current = current.parent
    ) {
      const record = index.getFunction(current);
      if (!isNil(record)) return record.id;
    }
    const id = index.moduleId(node);
    if (isNil(id))
      throw new Error('抽出対象外のsourceへ診断anchorは付与できません。');
    return id;
  };
  return (node: ts.Node, code: string): DiagnosticAnchor => {
    const previous = anchors.get(node)?.get(code);
    if (!isNil(previous)) return previous;
    const owner = ownerId(node);
    const syntaxHash = diagnosticSyntaxHash(node);
    const key = JSON.stringify([owner, code, syntaxHash]);
    const occurrence = occurrences.get(key) ?? 0;
    const anchor = { ownerId: owner, syntaxHash, occurrence };
    occurrences.set(key, occurrence + 1);
    const byCode = anchors.get(node) ?? new Map<string, DiagnosticAnchor>();
    byCode.set(code, anchor);
    anchors.set(node, byCode);
    return anchor;
  };
};
