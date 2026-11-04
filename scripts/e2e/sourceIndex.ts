import ts from 'typescript';

import type { SourceLocation } from './inventorySchema';
import type { SourceContext } from './source';

type FunctionNode = (
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration
  | ts.ConstructorDeclaration
) & { body: ts.ConciseBody };

type FunctionRecord = {
  id: string;
  name: string;
  node: FunctionNode;
  source: SourceLocation;
};

const isFunction = (node: ts.Node): node is FunctionNode =>
  (ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isConstructorDeclaration(node)) &&
  node.body !== undefined;

const staticName = (node: ts.Node | undefined): string | undefined => {
  if (!node) return undefined;
  if (
    ts.isIdentifier(node) ||
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node) ||
    ts.isPrivateIdentifier(node)
  )
    return node.text;
  if (
    ts.isComputedPropertyName(node) &&
    (ts.isStringLiteral(node.expression) ||
      ts.isNumericLiteral(node.expression))
  )
    return node.expression.text;
  return undefined;
};

const isWrapper = (node: ts.Node) =>
  ts.isParenthesizedExpression(node) ||
  ts.isAsExpression(node) ||
  ts.isTypeAssertionExpression(node) ||
  ts.isSatisfiesExpression(node) ||
  ts.isNonNullExpression(node);

type ActionAnnotation =
  | { valid: true; token: string }
  | { valid: false; tokens: string[] };

/** 所有宣言までの注釈を集め、トークン全体と注釈の一意性を検証する。 */
export const parseActionAnnotation = (
  node: ts.Node,
): ActionAnnotation | undefined => {
  const source = node.getSourceFile();
  const ranges = new Map<number, ts.CommentRange>();
  for (let current: ts.Node | undefined = node; current; ) {
    // JSXや引数の同一行コメントはTypeScriptではtrailingとして返される。
    const comments = [
      ...(ts.getLeadingCommentRanges(source.text, current.getFullStart()) ??
        []),
      ...(ts.getTrailingCommentRanges(source.text, current.getFullStart()) ??
        []),
    ];
    for (const comment of comments) ranges.set(comment.pos, comment);
    const parent: ts.Node | undefined = current.parent;
    current =
      parent &&
      (isWrapper(parent) ||
        ts.isVariableDeclaration(parent) ||
        ts.isVariableDeclarationList(parent) ||
        ts.isVariableStatement(parent) ||
        ts.isPropertyAssignment(parent) ||
        ts.isPropertyDeclaration(parent) ||
        ts.isJsxExpression(parent) ||
        ts.isJsxAttribute(parent))
        ? parent
        : undefined;
  }
  const tokens = [...ranges.values()]
    .sort((left, right) => left.pos - right.pos)
    .flatMap((comment) => {
      const text = source.text
        .slice(comment.pos, comment.end)
        .replace(/\*\/$/, '');
      return [...text.matchAll(/@e2e-action\b/g)].map(
        (match) =>
          text
            .slice(match.index + match[0].length)
            .match(/^[\t ]+([^\s]+)/)?.[1] ?? '',
      );
    });
  if (tokens.length === 0) return undefined;
  const token = tokens[0];
  return tokens.length === 1 &&
    token !== undefined &&
    /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(token)
    ? { valid: true, token }
    : { valid: false, tokens };
};

/** 有効かつ1件だけ指定されたAction注釈を返す。 */
export const getActionAnnotation = (node: ts.Node): string | undefined => {
  const annotation = parseActionAnnotation(node);
  return annotation?.valid ? annotation.token : undefined;
};

const bindingName = (node: ts.Node): string | undefined => {
  let current = node;
  while (current.parent && isWrapper(current.parent)) current = current.parent;
  const parent = current.parent;
  if (!parent) return undefined;
  if (
    (ts.isVariableDeclaration(parent) ||
      ts.isPropertyAssignment(parent) ||
      ts.isPropertyDeclaration(parent)) &&
    parent.initializer === current
  )
    return staticName(parent.name);
  if (ts.isExportAssignment(parent) && !parent.isExportEquals) return 'default';
  return undefined;
};

const localName = (
  node: FunctionNode | ts.ClassLikeDeclaration,
): string | undefined => {
  if (ts.isConstructorDeclaration(node)) return 'constructor';
  const bound = bindingName(node);
  if (bound) return bound;
  if ('name' in node && node.name) return staticName(node.name);
  if (
    ts.canHaveModifiers(node) &&
    ts
      .getModifiers(node)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)
  )
    return 'default';
  return undefined;
};

const functionSegment = (node: FunctionNode, name: string) => {
  const kind = ts.isGetAccessorDeclaration(node)
    ? 'get:'
    : ts.isSetAccessorDeclaration(node)
      ? 'set:'
      : '';
  let owner: ts.Node = node;
  while (owner.parent && isWrapper(owner.parent)) owner = owner.parent;
  if (owner.parent && ts.isPropertyDeclaration(owner.parent))
    owner = owner.parent;
  const isStatic =
    ts.canHaveModifiers(owner) &&
    ts
      .getModifiers(owner)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword);
  return `${isStatic ? 'static:' : ''}${kind}${name}`;
};

/** 匿名の関数・class境界や動的property名には安定IDを推測しない。 */
const lexicalNames = (node: FunctionNode): string[] | undefined => {
  const name = localName(node);
  if (name === undefined) return undefined;
  const names = [functionSegment(node, name)];
  for (
    let parent = node.parent;
    parent && !ts.isSourceFile(parent);
    parent = parent.parent
  ) {
    if (
      isFunction(parent) ||
      ts.isClassDeclaration(parent) ||
      ts.isClassExpression(parent)
    ) {
      const parentName = localName(parent);
      if (parentName === undefined) return undefined;
      names.unshift(
        isFunction(parent) ? functionSegment(parent, parentName) : parentName,
      );
    } else if (ts.isObjectLiteralExpression(parent)) {
      const objectName = bindingName(parent);
      if (objectName !== undefined) names.unshift(objectName);
    } else if (ts.isModuleDeclaration(parent)) names.unshift(parent.name.text);
  }
  return names;
};

/** source objectを正本に関数を索引化し、同じCheckerで別名を解決する。 */
export const createSourceIndex = (context: SourceContext) => {
  const paths = new Map(
    context.files.map((file) => [file.sourceFile, file.path]),
  );
  const filePath = (node: ts.Node) => paths.get(node.getSourceFile());
  const moduleId = (node: ts.Node) => {
    const file = filePath(node);
    return file === undefined ? undefined : `module:${file}`;
  };
  const location = (node: ts.Node): SourceLocation => {
    const file = filePath(node);
    if (file === undefined)
      throw new Error('抽出対象外のsource位置は取得できません。');
    const position = node
      .getSourceFile()
      .getLineAndCharacterOfPosition(node.getStart());
    return { file, line: position.line + 1, column: position.character + 1 };
  };
  const candidates = new Map<string, FunctionRecord[]>();
  const visit = (node: ts.Node) => {
    if (isFunction(node)) {
      const annotation = getActionAnnotation(node);
      const names = lexicalNames(node);
      const name = annotation ? `annotation:${annotation}` : localName(node);
      if ((annotation || names) && name !== undefined) {
        const source = location(node);
        const id = `function:${source.file}#${annotation ? `annotation:${annotation}` : names?.map(encodeURIComponent).join('/')}`;
        const record = { id, name, node, source };
        candidates.set(id, [...(candidates.get(id) ?? []), record]);
      }
    }
    ts.forEachChild(node, visit);
  };
  for (const file of context.files) visit(file.sourceFile);
  // 同じlexical名がblock等で重複する場合も、行番号で区別せず未解決にする。
  const functions = [...candidates.values()]
    .flatMap((records) => (records.length === 1 ? records : []))
    .sort((left, right) =>
      left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
    );
  const records = new Map<ts.Node, FunctionRecord>(
    functions.map((record) => [record.node, record]),
  );
  const getFunction = (node: ts.Node) => records.get(node);
  const enclosingFunction = (node: ts.Node) => {
    for (
      let current: ts.Node | undefined = node;
      current;
      current = current.parent
    ) {
      if (isFunction(current)) return getFunction(current);
    }
    return undefined;
  };
  const resolveNode = (
    node: ts.Node,
    seen: Set<ts.Symbol>,
  ): FunctionRecord | undefined => {
    // property/method/accessorは再代入やgetter評価があるためcalleeを確定しない。
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node)
    )
      return getFunction(node);
    if (ts.isVariableDeclaration(node)) {
      if (
        ts.isVariableDeclarationList(node.parent) &&
        node.parent.flags & ts.NodeFlags.Const &&
        node.initializer
      )
        return resolveExpression(node.initializer, seen);
      return undefined;
    }
    if (ts.isExportAssignment(node))
      return resolveExpression(node.expression, seen);
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      const implementation = node.members.find(
        (member) => ts.isConstructorDeclaration(member) && member.body,
      );
      return implementation ? getFunction(implementation) : undefined;
    }
    return undefined;
  };
  const resolve = (
    symbol: ts.Symbol,
    seen: Set<ts.Symbol>,
  ): FunctionRecord | undefined => {
    if (seen.has(symbol)) return undefined;
    seen.add(symbol);
    if (symbol.flags & ts.SymbolFlags.Alias)
      return resolve(context.checker.getAliasedSymbol(symbol), seen);
    const matches = new Set(
      (symbol.declarations ?? []).flatMap((declaration) => {
        const record = resolveNode(declaration, new Set(seen));
        return record ? [record] : [];
      }),
    );
    return matches.size === 1 ? [...matches][0] : undefined;
  };
  const resolveExpression = (
    expression: ts.Expression,
    seen: Set<ts.Symbol>,
  ): FunctionRecord | undefined => {
    if (isFunction(expression)) return getFunction(expression);
    if (isWrapper(expression) && 'expression' in expression)
      return resolveExpression(expression.expression, seen);
    const symbol = context.checker.getSymbolAtLocation(expression);
    return symbol ? resolve(symbol, seen) : undefined;
  };
  return {
    functions,
    location,
    filePath,
    moduleId,
    getFunction,
    enclosingFunction,
    resolveFunction: (expression: ts.Expression) =>
      resolveExpression(expression, new Set()),
    resolveSymbol: (symbol: ts.Symbol) => resolve(symbol, new Set()),
  };
};

type SourceIndex = ReturnType<typeof createSourceIndex>;
export type { ActionAnnotation, FunctionNode, FunctionRecord, SourceIndex };
