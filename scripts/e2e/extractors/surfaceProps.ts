import { isNil } from 'ramda';
import ts from 'typescript';

import { unwrapExpression } from './dependencyProvenance';

import type { FunctionNode, SourceIndex } from '../sourceIndex';
import type { Opening } from './surfaceAdapters';
import type { BoundValue, Frame, ReadProp } from './surfaceTypes';

type BoundExpression = Extract<BoundValue, { kind: 'bound' }>;
type SuppliedProps = {
  attributes: Map<string, BoundValue>;
  unknownSource?: ts.Node;
  children: BoundExpression[];
  hasChildren?: boolean;
};
type PropBinding = { name: string; initializer?: ts.Expression };
type FrameProps = {
  supply: SuppliedProps;
  object?: ts.Symbol;
  bindings: Map<ts.Symbol, PropBinding>;
  unsafe: Map<ts.Symbol, ts.Node>;
};

const possibleWrites = (
  checker: ts.TypeChecker,
  body: ts.ConciseBody,
  object: ts.Symbol | undefined,
  bindings: FrameProps['bindings'],
) => {
  const unsafe: FrameProps['unsafe'] = new Map();
  const write = (target: ts.Node, cause: ts.Node) => {
    const symbol = ts.isIdentifier(target)
      ? checker.getSymbolAtLocation(target)
      : ts.isShorthandPropertyAssignment(target)
        ? checker.getShorthandAssignmentValueSymbol(target)
        : undefined;
    if (!isNil(symbol) && (symbol === object || bindings.has(symbol)))
      unsafe.set(symbol, cause);
    ts.forEachChild(target, (child) => write(child, cause));
  };
  const visit = (node: ts.Node) => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    )
      write(node.left, node);
    if (ts.isDeleteExpression(node)) write(node.expression, node);
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken ||
        node.operator === ts.SyntaxKind.MinusMinusToken)
    )
      write(node.operand, node);
    if (
      !isNil(object) &&
      ts.isIdentifier(node) &&
      checker.getSymbolAtLocation(node) === object
    ) {
      const parent = node.parent;
      const isMember =
        (ts.isPropertyAccessExpression(parent) ||
          ts.isElementAccessExpression(parent)) &&
        parent.expression === node;
      if (!isMember) unsafe.set(object, node);
    }
    ts.forEachChild(node, visit);
  };
  visit(body);
  return unsafe;
};

/** JSX属性の出現順を保ち、spreadより後ろの明示属性だけで上書きを確定する。 */
export const suppliedProps = (
  opening: Opening,
  children: readonly ts.JsxChild[],
  frame: Frame,
  index: SourceIndex,
): SuppliedProps => {
  const bind = (expression: ts.Expression, node: ts.Node): BoundExpression => ({
    kind: 'bound',
    expression,
    frame,
    source: index.location(node),
  });
  const attributes = new Map<string, BoundValue>();
  let lastSpread: ts.JsxSpreadAttribute | undefined;
  for (const property of opening.attributes.properties) {
    if (ts.isJsxSpreadAttribute(property)) {
      attributes.clear();
      lastSpread = property;
      continue;
    }
    if (!ts.isIdentifier(property.name)) continue;
    const value = property.initializer;
    const expression =
      !isNil(value) && ts.isJsxExpression(value) ? value.expression : value;
    attributes.set(
      property.name.text,
      isNil(expression)
        ? { kind: 'unknown', node: property }
        : bind(expression, property),
    );
  }
  const rendered = children.flatMap((child) => {
    if (ts.isJsxText(child)) return [];
    const expression = ts.isJsxExpression(child) ? child.expression : child;
    return isNil(expression) ? [] : [bind(expression, child)];
  });
  return {
    attributes,
    children: rendered,
    hasChildren: children.some((child) =>
      ts.isJsxText(child)
        ? child.text.trim().length > 0
        : !ts.isJsxExpression(child) || !isNil(child.expression),
    ),
    ...(isNil(lastSpread) ? {} : { unknownSource: lastSpread }),
  };
};

/** 省略・不明・明示値を分離し、単一の子式だけをcallback参照へ公開する。 */
export const suppliedValue = (
  supply: SuppliedProps,
  name: string,
): BoundValue => {
  if (name === 'children') {
    const child = supply.children[0];
    if (!isNil(child))
      return supply.children.length === 1
        ? child
        : { kind: 'unknown', node: child.expression };
    if (supply.hasChildren) return { kind: 'absent' };
  }
  return (
    supply.attributes.get(name) ??
    (isNil(supply.unknownSource)
      ? { kind: 'absent' }
      : { kind: 'unknown', node: supply.unknownSource })
  );
};

/** prop参照は第1引数の実symbolだけを読む。供給側のframeを保つ。 */
export const createSurfaceProps = (
  checker: ts.TypeChecker,
  index: SourceIndex,
) => {
  const frames = new WeakMap<Frame, FrameProps>();
  const templates = new WeakMap<FunctionNode, Omit<FrameProps, 'supply'>>();
  const templateFor = (node: FunctionNode) => {
    const cached = templates.get(node);
    if (!isNil(cached)) return cached;
    const bindings: FrameProps['bindings'] = new Map();
    const name = node.parameters[0]?.name;
    const object =
      !isNil(name) && ts.isIdentifier(name)
        ? checker.getSymbolAtLocation(name)
        : undefined;
    if (!isNil(name) && ts.isObjectBindingPattern(name)) {
      for (const item of name.elements) {
        if (!ts.isIdentifier(item.name) || !isNil(item.dotDotDotToken))
          continue;
        const property = item.propertyName ?? item.name;
        if (!ts.isIdentifier(property) && !ts.isStringLiteralLike(property))
          continue;
        const symbol = checker.getSymbolAtLocation(item.name);
        if (!isNil(symbol))
          bindings.set(symbol, {
            name: property.text,
            ...(isNil(item.initializer)
              ? {}
              : { initializer: item.initializer }),
          });
      }
    }
    const template = {
      bindings,
      unsafe: possibleWrites(checker, node.body, object, bindings),
      ...(isNil(object) ? {} : { object }),
    };
    templates.set(node, template);
    return template;
  };
  const register = (
    frame: Frame,
    node: FunctionNode,
    supply: SuppliedProps,
  ) => {
    frames.set(frame, { ...templateFor(node), supply });
  };
  const reference = (
    frame: Frame,
    input: ts.Expression,
  ):
    | { state: FrameProps; property: PropBinding; symbol: ts.Symbol }
    | undefined => {
    const state = frames.get(frame);
    if (isNil(state)) return undefined;
    const expression = unwrapExpression(input);
    if (
      ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      !isNil(state.object) &&
      checker.getSymbolAtLocation(expression.expression) === state.object
    )
      return {
        state,
        property: { name: expression.name.text },
        symbol: state.object,
      };
    const symbol = ts.isIdentifier(expression)
      ? checker.getSymbolAtLocation(expression)
      : undefined;
    const property = isNil(symbol) ? undefined : state.bindings.get(symbol);
    return isNil(property) || isNil(symbol)
      ? undefined
      : { state, property, symbol };
  };
  const readProp: ReadProp = (frame, expression) => {
    const match = reference(frame, expression);
    if (isNil(match)) return undefined;
    const { state, property, symbol } = match;
    const unsafe = state.unsafe.get(symbol);
    if (!isNil(unsafe)) return { kind: 'unknown', node: unsafe };
    const value = suppliedValue(state.supply, property.name);
    if (isNil(property.initializer) || value.kind === 'unknown') return value;
    if (value.kind === 'bound') {
      const supplied = unwrapExpression(value.expression);
      const isUndefined =
        ts.isVoidExpression(supplied) ||
        (ts.isIdentifier(supplied) &&
          supplied.text === 'undefined' &&
          isNil(checker.getSymbolAtLocation(supplied)?.valueDeclaration));
      if (!isUndefined) {
        const type = checker.getTypeAtLocation(supplied);
        const possibilities = type.isUnion() ? type.types : [type];
        const uncertain = possibilities.some(
          (item) =>
            (item.flags &
              (ts.TypeFlags.Any |
                ts.TypeFlags.Unknown |
                ts.TypeFlags.Undefined |
                ts.TypeFlags.Void)) !==
            0,
        );
        return uncertain ? { kind: 'unknown', node: supplied } : value;
      }
    }
    return {
      kind: 'bound',
      expression: property.initializer,
      frame,
      source: index.location(property.initializer),
    };
  };
  const readChildren = (frame: Frame, expression: ts.Expression) => {
    const match = reference(frame, expression);
    return match?.property.name === 'children' &&
      !match.state.unsafe.has(match.symbol) &&
      match.state.supply.children.length > 0
      ? match.state.supply.children
      : undefined;
  };
  const propName = (frame: Frame, expression: ts.Expression) =>
    reference(frame, expression)?.property.name;
  const withMounts = (frame: Frame, mountSiteIds: readonly string[]): Frame => {
    const next = { ...frame, mountSiteIds };
    const state = frames.get(frame);
    if (!isNil(state)) frames.set(next, state);
    return next;
  };
  return { register, readProp, readChildren, propName, withMounts };
};

export type { BoundExpression, SuppliedProps };
