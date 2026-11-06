import { isNil } from 'ramda';
import ts from 'typescript';

import { diagnosticSyntaxHash } from '../diagnosticAnchors';
import { unwrapExpression } from './dependencyProvenance';

import type { SourceIndex } from '../sourceIndex';
import type { SurfaceBranch, SurfaceEndpoint } from '../surfaceSchema';
import type { Trace } from './callbackResults';
import type { Frame, ReadProp } from './surfaceTypes';

export const nodeEndpoint = (nodeId: string): SurfaceEndpoint => ({
  kind: 'node',
  nodeId,
});

export const externalHref = /^(?:https?:\/\/|\/\/|mailto:|tel:)/iu;

export type Handler = {
  expression: ts.Expression;
  frame: Frame;
  from: SurfaceEndpoint;
};

export const inlineFunction = (
  node: ts.Node,
): node is ts.ArrowFunction | ts.FunctionExpression =>
  ts.isArrowFunction(node) || ts.isFunctionExpression(node);

export const cloneTrace = (trace: Trace): Trace => ({
  ...trace,
  flow: [...trace.flow],
  syntax: [...trace.syntax],
  targets: new Set(trace.targets),
  issues: [...trace.issues],
});

export const branch = (role: SurfaceBranch['role'], trace: Trace) => ({
  role,
  trace,
});

export const createHashSyntax = () => {
  const syntaxHashes = new WeakMap<ts.Node, string>();
  return (node: ts.Node) => {
    const known = syntaxHashes.get(node);
    if (!isNil(known)) return known;
    const hash = diagnosticSyntaxHash(node);
    syntaxHashes.set(node, hash);
    return hash;
  };
};

export const walkLogical = (
  trace: Trace,
  node: ts.BinaryExpression,
  frame: Frame,
  owner: SurfaceEndpoint,
  truth: (
    trace: Trace,
    input: ts.Expression,
    frame: Frame,
  ) => boolean | undefined,
  walk: (
    trace: Trace,
    node: ts.Node,
    frame: Frame,
    owner: SurfaceEndpoint,
  ) => boolean,
) => {
  const operator = node.operatorToken.kind;
  if (
    operator !== ts.SyntaxKind.AmpersandAmpersandToken &&
    operator !== ts.SyntaxKind.BarBarToken &&
    operator !== ts.SyntaxKind.QuestionQuestionToken
  )
    return false;
  const choice = truth(trace, node.left, frame);
  if (isNil(choice)) walk(trace, node.left, frame, owner);
  if (
    operator === ts.SyntaxKind.QuestionQuestionToken
      ? ![ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
          node.left.kind,
        ) &&
        !ts.isStringLiteralLike(node.left) &&
        !ts.isNumericLiteral(node.left)
      : isNil(choice) ||
        (operator === ts.SyntaxKind.AmpersandAmpersandToken && choice) ||
        (operator === ts.SyntaxKind.BarBarToken && !choice)
  )
    walk(trace, node.right, frame, owner);
  return true;
};

export const createCallbackTruth =
  (
    index: SourceIndex,
    readProp: ReadProp,
    syntax: (trace: Trace, node: ts.Node) => void,
  ) =>
  (trace: Trace, input: ts.Expression, frame: Frame): boolean | undefined => {
    let expression = unwrapExpression(input);
    let isNegated = false;
    while (
      ts.isPrefixUnaryExpression(expression) &&
      expression.operator === ts.SyntaxKind.ExclamationToken
    ) {
      isNegated = !isNegated;
      expression = unwrapExpression(expression.operand);
    }
    if (expression.kind === ts.SyntaxKind.TrueKeyword) return !isNegated;
    if (expression.kind === ts.SyntaxKind.FalseKeyword) return isNegated;
    const prop = readProp(frame, expression);
    if (prop?.kind === 'absent') {
      syntax(trace, expression);
      trace.omitted = true;
      return isNegated;
    }
    if (
      prop?.kind === 'bound' &&
      (ts.isArrowFunction(unwrapExpression(prop.expression)) ||
        ts.isFunctionExpression(unwrapExpression(prop.expression)) ||
        !isNil(index.resolveFunction(unwrapExpression(prop.expression))))
    ) {
      syntax(trace, expression);
      return !isNegated;
    }
    return undefined;
  };
