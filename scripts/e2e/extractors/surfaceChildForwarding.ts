import { isNil } from 'ramda';
import ts from 'typescript';

import { unwrapExpression } from './dependencyProvenance';

/** 既知Buttonのreturn JSXにあるchildren由来のslotを保守的に検出する。 */
export const createChildSlotVerifier = (
  checker: ts.TypeChecker,
  childSymbol: ts.Symbol,
  owner: ts.SourceFile,
  loadingSymbol?: ts.Symbol,
) => {
  const derivesChild = (
    input: ts.Expression,
    active: ReadonlySet<ts.Symbol> = new Set(),
  ): boolean => {
    const expression = unwrapExpression(input);
    if (ts.isIdentifier(expression)) {
      const symbol = checker.getSymbolAtLocation(expression);
      if (symbol === childSymbol) return true;
      const declaration = symbol?.valueDeclaration;
      if (
        isNil(symbol) ||
        active.has(symbol) ||
        isNil(declaration) ||
        !ts.isVariableDeclaration(declaration) ||
        !ts.isVariableDeclarationList(declaration.parent) ||
        !(declaration.parent.flags & ts.NodeFlags.Const) ||
        isNil(declaration.initializer) ||
        declaration.getSourceFile() !== owner
      )
        return false;
      return derivesChild(
        declaration.initializer,
        new Set([...active, symbol]),
      );
    }
    if (ts.isConditionalExpression(expression)) {
      const condition = unwrapExpression(expression.condition);
      if (
        !isNil(loadingSymbol) &&
        ts.isIdentifier(condition) &&
        checker.getSymbolAtLocation(condition) === loadingSymbol
      )
        return derivesChild(expression.whenFalse, active);
      return (
        derivesChild(expression.whenTrue, active) &&
        derivesChild(expression.whenFalse, active)
      );
    }
    if (ts.isJsxElement(expression) || ts.isJsxFragment(expression)) {
      if (
        ts.isJsxElement(expression) &&
        (!ts.isIdentifier(expression.openingElement.tagName) ||
          !/^[a-z]/u.test(expression.openingElement.tagName.text))
      )
        return false;
      return expression.children.some(
        (child) =>
          ts.isJsxExpression(child) &&
          !isNil(child.expression) &&
          derivesChild(child.expression, active),
      );
    }
    return false;
  };
  const hasChildSlot = (node: ts.Node): boolean => {
    if (ts.isJsxExpression(node))
      return !isNil(node.expression) && derivesChild(node.expression);
    if (ts.isJsxElement(node) || ts.isJsxFragment(node))
      return node.children.some(
        (child) => ts.isJsxExpression(child) && hasChildSlot(child),
      );
    return false;
  };
  return hasChildSlot;
};
