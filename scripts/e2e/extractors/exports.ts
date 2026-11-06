import ts from 'typescript';

import type { InventoryDiagnostic } from '../inventorySchema';
import type { SourceContext } from '../source';
import type { SourceIndex } from '../sourceIndex';

const isTypeOnlySymbol = (
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  seen = new Set<ts.Symbol>(),
): boolean => {
  if (seen.has(symbol)) return false;
  seen.add(symbol);
  return (symbol.declarations ?? []).some((declaration) => {
    if (ts.isTypeOnlyImportOrExportDeclaration(declaration)) return true;
    if (!ts.isExportSpecifier(declaration)) return false;
    const parent = declaration.parent.parent;
    const target = parent.moduleSpecifier
      ? checker.getSymbolAtLocation(parent.moduleSpecifier)
      : checker.getExportSpecifierLocalTargetSymbol(declaration);
    if (!target) return false;
    const referenced = parent.moduleSpecifier
      ? checker
          .getExportsOfModule(target)
          .find(
            (candidate) =>
              candidate.name ===
              (declaration.propertyName ?? declaration.name).text,
          )
      : target;
    return referenced ? isTypeOnlySymbol(referenced, checker, seen) : false;
  });
};

/** type-onlyを除き、再export元ではなく公開元の名前と位置を保持する。 */
export const runtimeExports = (
  sourceFile: ts.SourceFile,
  context: SourceContext,
  index: SourceIndex,
  visited = new Set<ts.SourceFile>(),
) => {
  const diagnostics: InventoryDiagnostic[] = [];
  const names = new Map<string, ts.Node>();
  const collect = (file: ts.SourceFile) => {
    if (visited.has(file)) return new Map<string, ts.Node>();
    visited.add(file);
    const result = new Map<string, ts.Node>();
    const addBinding = (name: ts.BindingName, node: ts.Node) => {
      if (ts.isIdentifier(name)) result.set(name.text, node);
      else
        for (const part of name.elements) {
          if (ts.isBindingElement(part)) addBinding(part.name, node);
        }
    };
    for (const statement of file.statements) {
      if (ts.isExportDeclaration(statement)) {
        if (statement.isTypeOnly) continue;
        const clause = statement.exportClause;
        if (clause && ts.isNamedExports(clause)) {
          for (const specifier of clause.elements) {
            if (!specifier.isTypeOnly)
              result.set(specifier.name.text, specifier);
          }
        } else if (clause && ts.isNamespaceExport(clause)) {
          result.set(clause.name.text, clause);
        } else if (statement.moduleSpecifier) {
          const target = context.checker.getSymbolAtLocation(
            statement.moduleSpecifier,
          );
          const targetFile = target?.declarations?.find(ts.isSourceFile);
          if (targetFile && index.filePath(targetFile)) {
            for (const name of collect(targetFile).keys()) {
              if (name !== 'default' && !result.has(name))
                result.set(name, statement);
            }
          } else
            diagnostics.push({
              code: 'EXPORT_UNRESOLVED_STAR',
              severity: 'error',
              message: 'export *の参照先を解決できません。',
              source: index.location(statement),
            });
        }
      } else if (ts.isExportAssignment(statement)) {
        result.set('default', statement);
      } else if (
        ts.canHaveModifiers(statement) &&
        ts
          .getModifiers(statement)
          ?.some(({ kind }) => kind === ts.SyntaxKind.ExportKeyword)
      ) {
        if (
          ts.isInterfaceDeclaration(statement) ||
          ts.isTypeAliasDeclaration(statement)
        )
          continue;
        const isDefault = ts
          .getModifiers(statement)
          ?.some(({ kind }) => kind === ts.SyntaxKind.DefaultKeyword);
        if (isDefault) result.set('default', statement);
        else if (ts.isVariableStatement(statement)) {
          for (const declaration of statement.declarationList.declarations)
            addBinding(declaration.name, declaration);
        } else if (
          (ts.isFunctionDeclaration(statement) ||
            ts.isClassDeclaration(statement) ||
            ts.isEnumDeclaration(statement) ||
            ts.isModuleDeclaration(statement)) &&
          statement.name &&
          ts.isIdentifier(statement.name)
        ) {
          result.set(statement.name.text, statement);
        }
      }
    }
    return result;
  };
  for (const [name, node] of collect(sourceFile)) names.set(name, node);
  const module = context.checker.getSymbolAtLocation(sourceFile);
  const symbols = new Map(
    (module ? context.checker.getExportsOfModule(module) : []).map((symbol) => [
      symbol.name,
      symbol,
    ]),
  );
  const exports = [...names].flatMap(([name, node]) => {
    const symbol = symbols.get(name);
    if (!symbol) {
      diagnostics.push({
        code: 'EXPORT_UNRESOLVED',
        severity: 'error',
        message: `export ${name}を解決できません。`,
        source: index.location(node),
      });
      return [];
    }
    if (isTypeOnlySymbol(symbol, context.checker)) return [];
    const target =
      symbol.flags & ts.SymbolFlags.Alias
        ? context.checker.getAliasedSymbol(symbol)
        : symbol;
    if (
      !(target.flags & ts.SymbolFlags.Value) &&
      target.flags & ts.SymbolFlags.Type
    )
      return [];
    return [{ name, symbol, node }];
  });
  return { exports, diagnostics };
};
