import { isNil } from 'ramda';
import ts from 'typescript';

import type { Opening } from './surfaceAdapters';

export const logicalRenderOperators = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
]);
const IDENTIFYING_ATTRIBUTES = new Set(['id', 'key', 'name', 'data-testid']);

/** JSX namespace属性は通常のprops名へ読み替えない。 */
export const jsxAttributeName = (node: ts.JsxAttributeName) =>
  ts.isIdentifier(node) ? node.text : undefined;

/** 行・属性順・handler本文から独立した構造上の位置を作る。 */
export const createSurfaceLocator = (tagId: (opening: Opening) => string) => {
  const tagLocator = (opening: Opening) => {
    const keys = opening.attributes.properties.flatMap((attribute) => {
      if (!ts.isJsxAttribute(attribute)) return [];
      const name = jsxAttributeName(attribute.name);
      const value = attribute.initializer;
      if (isNil(name) || !IDENTIFYING_ATTRIBUTES.has(name) || isNil(value))
        return [];
      const literal = ts.isJsxExpression(value) ? value.expression : value;
      return !isNil(literal) &&
        (ts.isStringLiteralLike(literal) || ts.isNumericLiteral(literal))
        ? [`${name}=${literal.text}`]
        : [];
    });
    return [tagId(opening), ...keys.sort()];
  };
  const locator = (node: ts.Node) => {
    const pieces: string[] = [];
    for (
      let child = node, parent = node.parent;
      !isNil(parent) && !ts.isFunctionLike(parent);
      child = parent, parent = parent.parent
    ) {
      if (ts.isJsxElement(parent) && parent.openingElement !== child)
        pieces.unshift(...tagLocator(parent.openingElement));
      if (ts.isJsxAttribute(parent))
        pieces.unshift(`slot:${parent.name.getText()}`);
      if (ts.isConditionalExpression(parent)) {
        if (parent.whenTrue === child) pieces.unshift('when:true');
        if (parent.whenFalse === child) pieces.unshift('when:false');
      }
      if (
        ts.isBinaryExpression(parent) &&
        logicalRenderOperators.has(parent.operatorToken.kind)
      )
        pieces.unshift(
          parent.left === child ? 'logical:left' : 'logical:right',
        );
      if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name))
        pieces.unshift(`value:${parent.name.text}`);
    }
    return ['render', ...pieces];
  };
  return { locator, tagLocator };
};
