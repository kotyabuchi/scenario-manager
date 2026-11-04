import ts from 'typescript';

import { returnExpressions, unwrapExpression } from './dependencyProvenance';

import type { SourceContext } from '../source';
import type { SourceIndex } from '../sourceIndex';
import type { DependencyProvenance } from './dependencyProvenance';

type Call = ts.CallExpression | ts.NewExpression;
type Bindings = Map<ts.Symbol, ts.Expression>;
const literal = (node: ts.Node | undefined) =>
  node && ts.isStringLiteralLike(node) ? node.text : undefined;
const sdkFile = (node: ts.Node, includeSsr = false) => {
  const file = node.getSourceFile().fileName.replaceAll('\\', '/');
  return (
    /\/node_modules\/@supabase\/(?:supabase-js|postgrest-js)\//.test(file) ||
    (includeSsr && /\/node_modules\/@supabase\/ssr\//.test(file))
  );
};
const memberName = (node: ts.Node) =>
  (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) &&
  (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))
    ? node.name.text
    : undefined;

/** SDKの実宣言・receiver生成元・schema設定を独立に検証する。 */
export const createDatabaseResolver = (
  context: SourceContext,
  index: SourceIndex,
  provenance: DependencyProvenance,
) => {
  const method = (call: Call): 'table' | 'rpc' | undefined => {
    const signature = context.checker.getResolvedSignature(call)?.declaration;
    const expression = call.expression;
    const reference = ts.isPropertyAccessExpression(expression)
      ? expression.name
      : expression;
    const candidates = [
      ...(signature ? [signature] : []),
      ...provenance.declarations(reference),
    ].filter((node) => memberName(node));
    if (candidates.length === 0 || candidates.some((node) => !sdkFile(node)))
      return undefined;
    const name = candidates[0] && memberName(candidates[0]);
    return name === 'from' ? 'table' : name === 'rpc' ? 'rpc' : undefined;
  };
  const value = (
    input: ts.Expression,
    bindings: Bindings,
    seen = new Set<ts.Node>(),
  ): ts.Expression => {
    const expression = unwrapExpression(input);
    if (seen.has(expression)) return expression;
    seen.add(expression);
    const symbol = context.checker.getSymbolAtLocation(expression);
    const parameter = symbol && bindings.get(symbol);
    if (parameter) return value(parameter, bindings, seen);
    for (const declaration of provenance.declarations(expression)) {
      if (
        ts.isVariableDeclaration(declaration) &&
        ts.isVariableDeclarationList(declaration.parent) &&
        declaration.parent.flags & ts.NodeFlags.Const &&
        declaration.initializer
      )
        return value(declaration.initializer, bindings, seen);
    }
    return expression;
  };
  // object aliasはconstでもpropertyを書換えられるため、publicの証拠にしない。
  const optionValue = (
    input: ts.Expression,
    bindings: Bindings,
    seen = new Set<ts.Node>(),
  ): ts.Expression => {
    const expression = unwrapExpression(input);
    if (seen.has(expression)) return expression;
    seen.add(expression);
    const symbol = context.checker.getSymbolAtLocation(expression);
    const argument = symbol && bindings.get(symbol);
    return argument ? optionValue(argument, bindings, seen) : expression;
  };
  // undefinedは省略による既定値、nullは動的・未対応を表す。
  const property = (
    input: ts.Expression,
    name: string,
    bindings: Bindings,
  ): ts.Expression | null | undefined => {
    const expression = optionValue(input, bindings);
    if (
      !ts.isObjectLiteralExpression(expression) ||
      expression.properties.some(
        (entry) =>
          ts.isSpreadAssignment(entry) ||
          (entry.name && ts.isComputedPropertyName(entry.name)),
      )
    )
      return null;
    const found = expression.properties.findLast(
      (entry) =>
        entry.name &&
        (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name)) &&
        entry.name.text === name,
    );
    if (!found) return undefined;
    if (ts.isPropertyAssignment(found)) return found.initializer;
    if (ts.isShorthandPropertyAssignment(found)) return found.name;
    return null;
  };
  const publicOptions = (
    options: ts.Expression | undefined,
    bindings: Bindings,
  ) => {
    if (!options) return true;
    const db = property(options, 'db', bindings);
    if (db === undefined) return true;
    if (db === null) return false;
    const schema = property(db, 'schema', bindings);
    return (
      schema === undefined ||
      (schema !== null && literal(value(schema, bindings)) === 'public')
    );
  };
  const isFactory = (
    call: Call,
    declaration: ts.SignatureDeclaration | ts.JSDocSignature,
  ) => {
    if (!sdkFile(declaration, true)) return false;
    if (ts.isNewExpression(call) && ts.isConstructorDeclaration(declaration))
      return (
        ts.isClassDeclaration(declaration.parent) &&
        declaration.parent.name?.text === 'SupabaseClient'
      );
    return (
      ts.isFunctionDeclaration(declaration) &&
      declaration.name &&
      ['createClient', 'createServerClient', 'createBrowserClient'].includes(
        declaration.name.text,
      )
    );
  };
  const publicSchema = (
    input: ts.Expression,
    bindings = new Map<ts.Symbol, ts.Expression>(),
    seen = new Set<ts.Node>(),
  ): boolean => {
    const expression = value(input, bindings);
    if (seen.has(expression)) return false;
    seen.add(expression);
    if (
      ts.isPropertyAccessExpression(expression) ||
      ts.isElementAccessExpression(expression)
    )
      return publicSchema(expression.expression, bindings, seen);
    if (ts.isConditionalExpression(expression))
      return (
        publicSchema(expression.whenTrue, bindings, new Set(seen)) &&
        publicSchema(expression.whenFalse, bindings, new Set(seen))
      );
    if (ts.isCallExpression(expression) || ts.isNewExpression(expression)) {
      const declaration =
        context.checker.getResolvedSignature(expression)?.declaration;
      if (
        declaration &&
        sdkFile(declaration) &&
        memberName(declaration) === 'schema'
      )
        return literal(expression.arguments?.[0]) === 'public';
      if (declaration && isFactory(expression, declaration))
        return publicOptions(expression.arguments?.[2], bindings);
      const fn = index.resolveFunction(expression.expression);
      if (fn) {
        // parameterへ渡すobjectはwrapper内で変異し得るため、副作用statementを許可しない。
        if (
          fn.node.parameters.length > 0 &&
          ts.isBlock(fn.node.body) &&
          (fn.node.body.statements.length !== 1 ||
            !fn.node.body.statements.every(ts.isReturnStatement))
        )
          return false;
        const argumentsByParameter = new Map(bindings);
        fn.node.parameters.forEach((parameter, position) => {
          const argument =
            expression.arguments?.[position] ?? parameter.initializer;
          const symbol = context.checker.getSymbolAtLocation(parameter.name);
          if (symbol && argument) argumentsByParameter.set(symbol, argument);
        });
        const returns = returnExpressions(fn);
        return (
          returns.length > 0 &&
          returns.every((returned) =>
            publicSchema(returned, argumentsByParameter, new Set(seen)),
          )
        );
      }
    }
    return false;
  };
  return (call: Call) => {
    const kind = method(call);
    if (!kind) return undefined;
    return {
      kind,
      hasKnownClient: provenance.externalImplementation(call.expression),
      hasPublicSchema: publicSchema(call.expression),
    };
  };
};
