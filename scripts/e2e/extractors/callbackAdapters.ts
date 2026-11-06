import { isNil } from 'ramda';
import ts from 'typescript';

import {
  createDependencyProvenance,
  unwrapExpression,
} from './dependencyProvenance';

import type { InventoryNode } from '../inventorySchema';
import type { SourceContext } from '../source';
import type { FunctionRecord, SourceIndex } from '../sourceIndex';

const MAX_ALIAS_DEPTH = 24;

const sole = <T>(values: readonly T[] | undefined) =>
  values?.length === 1 ? values[0] : undefined;

const constValue = (node: ts.Node | undefined) =>
  !isNil(node) &&
  ts.isVariableDeclaration(node) &&
  ts.isVariableDeclarationList(node.parent) &&
  (node.parent.flags & ts.NodeFlags.Const) !== 0
    ? node.initializer
    : undefined;

const staticName = (name: ts.Node | undefined) =>
  !isNil(name) && (ts.isIdentifier(name) || ts.isStringLiteral(name))
    ? name.text
    : undefined;

const packages = {
  react: /\/node_modules\/(?:react|@types\/react)\//u,
  'react-hook-form': /\/node_modules\/react-hook-form\//u,
  'next/navigation': /\/node_modules\/next\//u,
};

/** 正規importとCheckerの実宣言が両方一致する限定adapterだけを認定する。 */
export const createCallbackAdapters = (
  context: SourceContext,
  index: SourceIndex,
) => {
  const { checker, program } = context;
  const { declarations } = createDependencyProvenance(context, index);
  const rawDeclaration = (node: ts.Node) =>
    sole(checker.getSymbolAtLocation(node)?.declarations);
  const alias = (value: ts.Expression) =>
    ts.isIdentifier(value) ? constValue(rawDeclaration(value)) : undefined;
  const isTypeOnlyReference = (value: ts.Expression) => {
    const symbols = ts.isPropertyAccessExpression(value)
      ? [
          checker.getSymbolAtLocation(value.expression),
          checker.getSymbolAtLocation(value.name),
        ]
      : [checker.getSymbolAtLocation(value)];
    for (let symbol of symbols) {
      const seen = new Set<ts.Symbol>();
      while (!isNil(symbol) && !seen.has(symbol)) {
        seen.add(symbol);
        if (symbol.declarations?.some(ts.isTypeOnlyImportOrExportDeclaration))
          return true;
        symbol =
          (symbol.flags & ts.SymbolFlags.Alias) !== 0
            ? checker.getImmediateAliasedSymbol(symbol)
            : undefined;
      }
    }
    return false;
  };
  const followAliases = (input: ts.Expression) => {
    const seen = new Set<ts.Node>();
    let value = unwrapExpression(input);
    for (let depth = 0; depth < MAX_ALIAS_DEPTH; depth++) {
      if (seen.has(value)) return undefined;
      seen.add(value);
      const next = alias(value);
      if (isNil(next)) return value;
      value = unwrapExpression(next);
    }
    return undefined;
  };
  const writes = new WeakMap<
    ts.SourceFile,
    {
      receiver: ts.Expression;
      name: string | undefined;
    }[]
  >();
  const hasPropertyWrite = (receiver: ts.Expression, name: string) => {
    const source = receiver.getSourceFile();
    let known = writes.get(source);
    if (isNil(known)) {
      known = [];
      const record = known;
      const visit = (node: ts.Node) => {
        const written =
          ts.isBinaryExpression(node) &&
          node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
          node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
            ? node.left
            : ts.isDeleteExpression(node)
              ? node.expression
              : undefined;
        if (ts.isCallExpression(node)) {
          for (const argument of node.arguments) {
            if (!ts.isSpreadElement(argument))
              record.push({ receiver: argument, name: undefined });
          }
        }
        if (!isNil(written)) {
          const target = unwrapExpression(written);
          if (ts.isPropertyAccessExpression(target))
            record.push({
              receiver: target.expression,
              name: target.name.text,
            });
          if (ts.isElementAccessExpression(target))
            record.push({
              receiver: target.expression,
              name: ts.isStringLiteralLike(target.argumentExpression)
                ? target.argumentExpression.text
                : undefined,
            });
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
      writes.set(source, known);
    }
    const identity = (value: ts.Expression) => {
      const origin = followAliases(value);
      return !isNil(origin) && ts.isIdentifier(origin)
        ? checker.getSymbolAtLocation(origin)
        : origin;
    };
    const target = identity(receiver);
    return (
      !isNil(target) &&
      known.some(
        (write) =>
          (isNil(write.name) || write.name === name) &&
          identity(write.receiver) === target,
      )
    );
  };
  const isReassigned = (value: ts.Expression) => {
    const reference = checker.getSymbolAtLocation(value);
    if (isNil(reference)) return false;
    const symbol =
      (reference.flags & ts.SymbolFlags.Alias) !== 0
        ? checker.getAliasedSymbol(reference)
        : reference;
    const source =
      symbol.declarations?.[0]?.getSourceFile() ?? value.getSourceFile();
    let changed = false;
    const visit = (node: ts.Node) => {
      if (changed) return;
      if (
        (ts.isBinaryExpression(node) &&
          node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
          node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
          ts.isIdentifier(node.left) &&
          checker.getSymbolAtLocation(node.left) === symbol) ||
        (ts.isPrefixUnaryExpression(node) &&
          [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(
            node.operator,
          ) &&
          ts.isIdentifier(node.operand) &&
          checker.getSymbolAtLocation(node.operand) === symbol) ||
        (ts.isPostfixUnaryExpression(node) &&
          ts.isIdentifier(node.operand) &&
          checker.getSymbolAtLocation(node.operand) === symbol)
      )
        changed = true;
      else ts.forEachChild(node, visit);
    };
    visit(source);
    return changed;
  };
  const importOrigin = (value: ts.Expression) => {
    let declaration: ts.ImportDeclaration | ts.JSDocImportTag | undefined;
    let exportName: string | undefined;
    if (ts.isIdentifier(value)) {
      const binding = rawDeclaration(value);
      if (
        !isNil(binding) &&
        ts.isImportSpecifier(binding) &&
        !binding.isTypeOnly &&
        !binding.parent.parent.isTypeOnly
      ) {
        declaration = binding.parent.parent.parent;
        exportName = (binding.propertyName ?? binding.name).text;
      } else if (
        !isNil(binding) &&
        ts.isImportClause(binding) &&
        !binding.isTypeOnly
      ) {
        declaration = binding.parent;
        exportName = 'default';
      }
    } else if (
      ts.isPropertyAccessExpression(value) &&
      !value.questionDotToken &&
      ts.isIdentifier(value.expression)
    ) {
      const binding = rawDeclaration(value.expression);
      if (
        !isNil(binding) &&
        ts.isNamespaceImport(binding) &&
        !binding.parent.isTypeOnly
      ) {
        declaration = binding.parent.parent;
        exportName = value.name.text;
      }
    }
    if (
      isNil(declaration) ||
      isNil(exportName) ||
      !ts.isImportDeclaration(declaration) ||
      !ts.isStringLiteral(declaration.moduleSpecifier)
    )
      return undefined;
    const specifier = declaration.moduleSpecifier;
    const moduleSymbol = checker.getSymbolAtLocation(specifier);
    const member =
      moduleSymbol &&
      checker
        .getExportsOfModule(moduleSymbol)
        .find(({ name }) => name === exportName);
    const reference = checker.getSymbolAtLocation(
      ts.isPropertyAccessExpression(value) ? value.name : value,
    );
    const unwrapSymbol = (symbol: ts.Symbol | undefined) =>
      !isNil(symbol) && (symbol.flags & ts.SymbolFlags.Alias) !== 0
        ? checker.getAliasedSymbol(symbol)
        : symbol;
    if (isNil(member) || unwrapSymbol(member) !== unwrapSymbol(reference))
      return undefined;
    return {
      moduleName: specifier.text,
      exportName,
      sourceFile: moduleSymbol?.declarations?.find(ts.isSourceFile),
      moduleSymbol,
    };
  };
  const isPackageExport = (
    value: ts.Expression,
    moduleName: keyof typeof packages,
    exportName: string,
  ) => {
    const origin = importOrigin(value);
    const reference = ts.isPropertyAccessExpression(value) ? value.name : value;
    const origins = declarations(reference);
    return (
      origin?.moduleName === moduleName &&
      origin.exportName === exportName &&
      origins.length > 0 &&
      origins.every((node) =>
        packages[moduleName].test(
          node.getSourceFile().fileName.replaceAll('\\', '/'),
        ),
      )
    );
  };
  const actionTarget = (
    value: ts.Expression,
    fn: FunctionRecord,
    ids: readonly string[],
    nodes: ReadonlyMap<string, InventoryNode>,
  ) => {
    const matching = (path: string | undefined, name: string | undefined) =>
      sole(
        ids.filter((id) => {
          const node = nodes.get(id);
          return (
            !isNil(node) && node.source.file === path && node.symbol === name
          );
        }),
      );
    const imported = importOrigin(value);
    if (!isNil(imported)) {
      let moduleSymbol = imported.moduleSymbol;
      let exportName = imported.exportName;
      const seen = new Set<ts.Symbol>();
      for (let depth = 0; depth < MAX_ALIAS_DEPTH && moduleSymbol; depth++) {
        if (seen.has(moduleSymbol)) return undefined;
        seen.add(moduleSymbol);
        const source = moduleSymbol.declarations?.find(ts.isSourceFile);
        const target = matching(source && index.filePath(source), exportName);
        if (!isNil(target)) return target;
        const member = checker
          .getExportsOfModule(moduleSymbol)
          .find(({ name }) => name === exportName);
        const exported = member?.declarations?.find(ts.isExportSpecifier);
        const declaration = exported?.parent.parent;
        if (
          isNil(exported) ||
          isNil(declaration) ||
          !ts.isExportDeclaration(declaration) ||
          isNil(declaration.moduleSpecifier) ||
          !ts.isStringLiteral(declaration.moduleSpecifier)
        )
          break;
        moduleSymbol = checker.getSymbolAtLocation(declaration.moduleSpecifier);
        exportName = (exported.propertyName ?? exported.name).text;
      }
      return undefined;
    }
    return sole(ids) ?? matching(fn.source.file, fn.name);
  };
  const callsPackageExport = (
    value: ts.Expression,
    moduleName: keyof typeof packages,
    exportName: string,
  ) => {
    const initialized = followAliases(value);
    if (
      isNil(initialized) ||
      !ts.isCallExpression(initialized) ||
      initialized.questionDotToken ||
      initialized.arguments.some(ts.isSpreadElement)
    )
      return false;
    const callee = followAliases(initialized.expression);
    return !isNil(callee) && isPackageExport(callee, moduleName, exportName);
  };
  const bindingInfo = (value: ts.Expression) => {
    if (!ts.isIdentifier(value)) return undefined;
    const binding = rawDeclaration(value);
    if (
      isNil(binding) ||
      !ts.isBindingElement(binding) ||
      binding.dotDotDotToken ||
      binding.initializer
    )
      return undefined;
    const initialized = constValue(binding.parent.parent);
    return isNil(initialized) ? undefined : { binding, initialized };
  };
  const callKind = (input: ts.Expression) => {
    const value = followAliases(input);
    if (isNil(value)) return undefined;
    if (isPackageExport(value, 'react', 'startTransition')) return 'transition';
    const binding = bindingInfo(value);
    if (!isNil(binding)) {
      const pattern = binding.binding.parent;
      if (
        ts.isArrayBindingPattern(pattern) &&
        pattern.elements[1] === binding.binding
      ) {
        if (callsPackageExport(binding.initialized, 'react', 'useTransition'))
          return 'transition';
        if (
          callsPackageExport(binding.initialized, 'react', 'useState') ||
          callsPackageExport(binding.initialized, 'react', 'useOptimistic')
        )
          return 'local-state';
      }
      if (
        ts.isObjectBindingPattern(pattern) &&
        staticName(binding.binding.propertyName ?? binding.binding.name) ===
          'handleSubmit' &&
        callsPackageExport(binding.initialized, 'react-hook-form', 'useForm')
      )
        return 'rhf';
    }
    if (ts.isPropertyAccessExpression(value) && !value.questionDotToken) {
      const receiver = ts.isIdentifier(value.expression)
        ? alias(value.expression)
        : undefined;
      if (isNil(receiver)) return undefined;
      if (
        value.name.text === 'handleSubmit' &&
        callsPackageExport(receiver, 'react-hook-form', 'useForm') &&
        !hasPropertyWrite(value.expression, value.name.text)
      )
        return 'rhf';
      if (
        ['push', 'replace'].includes(value.name.text) &&
        callsPackageExport(receiver, 'next/navigation', 'useRouter') &&
        !hasPropertyWrite(value.expression, value.name.text)
      )
        return 'navigation';
    }
    return undefined;
  };
  const bindReceiver = (call: ts.CallExpression) => {
    const callee = unwrapExpression(call.expression);
    if (
      call.questionDotToken ||
      !ts.isPropertyAccessExpression(callee) ||
      callee.questionDotToken ||
      callee.name.text !== 'bind' ||
      call.arguments[0]?.kind !== ts.SyntaxKind.NullKeyword ||
      call.arguments.some(ts.isSpreadElement) ||
      hasPropertyWrite(callee.expression, 'bind')
    )
      return undefined;
    const origins = declarations(callee.name);
    if (
      !origins.length ||
      !origins.every(
        (node) =>
          ts.isMethodSignature(node) &&
          ts.isInterfaceDeclaration(node.parent) &&
          ['Function', 'CallableFunction'].includes(node.parent.name.text) &&
          program.isSourceFileDefaultLibrary(node.getSourceFile()),
      )
    )
      return undefined;
    return callee.expression;
  };
  const propName = (value: ts.Expression) => {
    if (ts.isPropertyAccessExpression(value)) return value.name.text;
    const binding = rawDeclaration(value);
    return !isNil(binding) && ts.isBindingElement(binding)
      ? staticName(binding.propertyName ?? binding.name)
      : undefined;
  };
  return {
    alias,
    actionTarget,
    callKind,
    bindReceiver,
    propName,
    isReassigned,
    isTypeOnlyReference,
  };
};
