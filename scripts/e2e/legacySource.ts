import { isNil } from 'ramda';
import ts from 'typescript';

import { createHash } from 'node:crypto';

import type { DiscoveredTest } from './discoverySchema';

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const printer = ts.createPrinter({
  removeComments: true,
  newLine: ts.NewLineKind.LineFeed,
});

// printerで文構造を固定し、token値によって空白・コメント・引用符差を除く。
const normalize = (node: ts.Node, source: ts.SourceFile) => {
  const text = printer.printNode(ts.EmitHint.Unspecified, node, source);
  const printed = ts.createSourceFile(
    source.fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const literals = new Map<
    number,
    { kind: ts.SyntaxKind; text: string; end: number }
  >();
  const visit = (child: ts.Node) => {
    if (
      ts.isLiteralExpression(child) ||
      ts.isTemplateHead(child) ||
      ts.isTemplateMiddle(child) ||
      ts.isTemplateTail(child)
    )
      literals.set(child.getStart(printed), {
        kind: child.kind,
        text: child.text,
        end: child.end,
      });
    ts.forEachChild(child, visit);
  };
  visit(printed);
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true,
    ts.LanguageVariant.Standard,
    text,
  );
  const tokens: [number, string][] = [];
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const literal = literals.get(scanner.getTokenPos());
    if (!isNil(literal)) {
      tokens.push([literal.kind, literal.text]);
      scanner.setTextPos(literal.end);
    } else tokens.push([token, scanner.getTokenText()]);
    token = scanner.scan();
  }
  return JSON.stringify(tokens);
};

const callPath = (expression: ts.Expression): string[] => {
  if (ts.isIdentifier(expression)) return [expression.text];
  if (ts.isPropertyAccessExpression(expression))
    return [...callPath(expression.expression), expression.name.text];
  return [];
};

/** 実登録位置からtest定義と共有contextを静的に読み、意味を変えない整形を除外する。 */
export const createLegacySource = (file: string, text: string) => {
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const testNames = new Set(['test']);
  const calls: ts.CallExpression[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isImportSpecifier(node) &&
      (node.propertyName?.text ?? node.name.text) === 'test'
    )
      testNames.add(node.name.text);
    if (ts.isCallExpression(node)) calls.push(node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  const isSuite = (call: ts.CallExpression) => {
    const [root, method, modifier] = callPath(call.expression);
    return (
      !isNil(root) &&
      testNames.has(root) &&
      method === 'describe' &&
      modifier !== 'configure'
    );
  };
  const isTest = (call: ts.CallExpression) => {
    const [root, method] = callPath(call.expression);
    const body = call.arguments.at(-1);
    return (
      !isNil(root) &&
      testNames.has(root) &&
      (isNil(method) || ['skip', 'fixme', 'only', 'fail'].includes(method)) &&
      call.arguments.length >= 2 &&
      !isNil(body) &&
      (ts.isArrowFunction(body) ||
        ts.isFunctionExpression(body) ||
        ts.isIdentifier(body))
    );
  };
  // skip/fixme/failの第二引数が識別子の場合は、runtimeの理由かもしれない。
  // 登録から特定した対象以外は推測で取り除かず、contextへ保守的に残す。
  const canPruneTest = (call: ts.CallExpression) => {
    const method = callPath(call.expression)[1];
    const body = call.arguments.at(-1);
    return (
      isTest(call) &&
      !isNil(body) &&
      (!ts.isIdentifier(body) || isNil(method) || method === 'only')
    );
  };
  const suiteCallbacks = new Set<ts.Node | undefined>(
    calls.filter(isSuite).map((call) => call.arguments.at(-1)),
  );
  const hasSerialConfig = (block: ts.Block | ts.SourceFile) =>
    block.statements.some((statement) => {
      if (
        !ts.isExpressionStatement(statement) ||
        !ts.isCallExpression(statement.expression)
      )
        return false;
      const call = statement.expression;
      const [root, method, modifier] = callPath(call.expression);
      if (
        isNil(root) ||
        !testNames.has(root) ||
        method !== 'describe' ||
        modifier !== 'configure'
      )
        return false;
      const options = call.arguments[0];
      return (
        !isNil(options) &&
        ts.isObjectLiteralExpression(options) &&
        options.properties.some(
          (property) =>
            ts.isPropertyAssignment(property) &&
            (ts.isIdentifier(property.name) ||
              ts.isStringLiteral(property.name)) &&
            property.name.text === 'mode' &&
            ts.isStringLiteral(property.initializer) &&
            property.initializer.text === 'serial',
        )
      );
    });
  return (test: Pick<DiscoveredTest, 'line' | 'column'>) => {
    const lineStart = source.getLineStarts()[test.line - 1];
    const lineEnd = source.getLineStarts()[test.line] ?? source.end;
    const position = isNil(lineStart) ? -1 : lineStart + test.column - 1;
    const matches = calls.filter((call) => {
      const openParen = call
        .getChildren(source)
        .find((child) => child.kind === ts.SyntaxKind.OpenParenToken);
      // ESMはcallee先頭、CJSはcallee内部/開き括弧を返す。引数・bodyは候補に含めない。
      return (
        position >= 0 &&
        position < lineEnd &&
        !isNil(openParen) &&
        position >= call.expression.getStart(source) &&
        position <= openParen.getStart(source)
      );
    });
    if (matches.length !== 1)
      throw new Error(
        `${file}:${test.line}:${test.column}: test呼出を一意に特定できません`,
      );
    const target = matches[0];
    if (isNil(target) || !isTest(target))
      throw new Error(`${file}:${test.line}: 対応していないtest定義です`);
    const containsTarget = (node: ts.Node) =>
      node.pos <= target.pos && node.end >= target.end;
    const transformed = ts.transform(source, [
      (context) => {
        const visitor: ts.Visitor = (node) => {
          // 対象test本体と参照helper/hook内のruntime呼出は全文を保持する。
          if (
            node === target ||
            (ts.isFunctionLike(node) &&
              !suiteCallbacks.has(node) &&
              !containsTarget(node))
          )
            return node;
          if (
            ts.isExpressionStatement(node) &&
            ts.isCallExpression(node.expression) &&
            (canPruneTest(node.expression) || isSuite(node.expression)) &&
            !containsTarget(node)
          )
            return undefined;
          return ts.visitEachChild(node, visitor, context);
        };
        return (root) => ts.visitNode(root, visitor, ts.isSourceFile) ?? root;
      },
    ]);
    const root = transformed.transformed[0];
    if (isNil(root)) throw new Error(`${file}: 正規化したsourceがありません`);
    const fingerprint = hash(normalize(root, source));
    transformed.dispose();
    const suites: ts.CallExpression[] = [];
    let ancestor: ts.Node | undefined = target.parent;
    while (!isNil(ancestor)) {
      if (ts.isCallExpression(ancestor) && isSuite(ancestor))
        suites.unshift(ancestor);
      ancestor = ancestor.parent;
    }
    let serialScope: string | null = hasSerialConfig(source) ? 'file' : null;
    const titles: string[] = [];
    for (const suite of suites) {
      const title = suite.arguments[0];
      titles.push(isNil(title) ? '' : normalize(title, source));
      const body = suite.arguments.at(-1);
      const isSerial =
        callPath(suite.expression).at(-1) === 'serial' ||
        (!isNil(body) &&
          (ts.isArrowFunction(body) || ts.isFunctionExpression(body)) &&
          ts.isBlock(body.body) &&
          hasSerialConfig(body.body));
      if (isNil(serialScope) && isSerial) serialScope = JSON.stringify(titles);
    }
    return { fingerprint, serialScope };
  };
};
