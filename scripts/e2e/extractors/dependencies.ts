import ts from 'typescript';

import { createDatabaseResolver } from './database';
import { createDependencyProvenance } from './dependencyProvenance';

import type {
  InventoryDiagnostic,
  InventoryEdge,
  InventoryNode,
} from '../inventorySchema';
import type { SourceContext } from '../source';
import type { SourceIndex } from '../sourceIndex';

type DependencyExtraction = {
  nodes: InventoryNode[];
  edges: InventoryEdge[];
  diagnostics: InventoryDiagnostic[];
};
type Call = ts.CallExpression | ts.NewExpression;

const compare = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;
const literal = (node: ts.Node | undefined) =>
  node && ts.isStringLiteralLike(node) ? node.text : undefined;
/** importの型専用specifierを除き、実行時に残るmodule依存だけを扱う。 */
const hasValueImport = (node: ts.ImportDeclaration) => {
  const clause = node.importClause;
  if (!clause) return true;
  if (clause.isTypeOnly) return false;
  if (clause.name) return true;
  const bindings = clause.namedBindings;
  return (
    !bindings ||
    ts.isNamespaceImport(bindings) ||
    bindings.elements.length === 0 ||
    bindings.elements.some((element) => !element.isTypeOnly)
  );
};
const hasValueExport = (node: ts.ExportDeclaration) =>
  !node.isTypeOnly &&
  (!node.exportClause ||
    ts.isNamespaceExport(node.exportClause) ||
    node.exportClause.elements.some((element) => !element.isTypeOnly));

/** symbolで確定できる依存を抽出し、動的呼出は診断とmodule依存を残す。 */
export const extractDependencies = (
  context: SourceContext,
  index: SourceIndex,
): DependencyExtraction => {
  const nodes = new Map<string, InventoryNode>();
  const edges = new Map<string, InventoryEdge>();
  const diagnostics = new Map<string, InventoryDiagnostic>();
  const provenance = createDependencyProvenance(context, index);
  const database = createDatabaseResolver(context, index, provenance);
  const addEdge = (
    from: string,
    to: string,
    kind: InventoryEdge['kind'],
    node: ts.Node,
  ) => {
    const edge = { from, to, kind, source: index.location(node) };
    edges.set(JSON.stringify(edge), edge);
  };
  const moduleId = (node: ts.Node) => {
    const generated = provenance.generatedPath(node);
    if (generated) {
      const id = `module:${generated}`;
      if (!nodes.has(id))
        nodes.set(id, {
          id,
          kind: 'module',
          source: { file: generated, line: 1, column: 1 },
          slots: [],
        });
      return id;
    }
    const id = index.moduleId(node);
    if (!id) throw new Error('抽出対象外のmoduleは依存先へ登録できません。');
    return id;
  };
  const owner = (node: ts.Node) =>
    index.enclosingFunction(node)?.id ?? moduleId(node);
  const warn = (node: ts.Node, code: string, message: string) => {
    const diagnostic: InventoryDiagnostic = {
      code,
      message,
      severity: 'warning',
      source: index.location(node),
    };
    diagnostics.set(JSON.stringify(diagnostic), diagnostic);
  };
  const isLocalSpecifier = (specifier: string) => {
    if (specifier.startsWith('.') || specifier.startsWith('/')) return true;
    return Object.keys(context.program.getCompilerOptions().paths ?? {}).some(
      (pattern) => {
        const [prefix = '', suffix = ''] = pattern.split('*');
        return pattern.includes('*')
          ? specifier.startsWith(prefix) && specifier.endsWith(suffix)
          : specifier === pattern;
      },
    );
  };

  /** 動的呼出を黙って捨てず、所属moduleと解決可能な参照moduleへ接続する。 */
  const unresolved = (node: ts.Node, code: string, message: string) => {
    warn(node, code, message);
    const from = owner(node);
    addEdge(from, moduleId(node), 'unresolved', node);
    const visitReference = (child: ts.Node) => {
      if (ts.isIdentifier(child)) {
        for (const declaration of provenance.declarations(child)) {
          if (
            index.filePath(declaration) ||
            provenance.generatedPath(declaration)
          )
            addEdge(from, moduleId(declaration), 'unresolved', node);
        }
      }
      ts.forEachChild(child, visitReference);
    };
    visitReference(node);
  };

  const importModule = (
    node: ts.Node,
    specifier: ts.Expression,
    kind: 'imports' | 'exports',
  ) => {
    const target = provenance.declarations(specifier).find(ts.isSourceFile);
    if (
      target &&
      (index.filePath(target) || provenance.generatedPath(target))
    ) {
      addEdge(moduleId(node), moduleId(target), kind, node);
    } else if (
      (target && !provenance.isExternal(target)) ||
      (!target && isLocalSpecifier(literal(specifier) ?? ''))
    ) {
      unresolved(
        node,
        'UNRESOLVED_IMPORT',
        '内部moduleの参照先を解決できません。',
      );
    }
  };

  const inspectCall = (call: Call) => {
    if (call.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const specifier = call.arguments?.[0];
      if (specifier && literal(specifier) !== undefined) {
        importModule(call, specifier, 'imports');
      } else {
        unresolved(
          call,
          'UNRESOLVED_IMPORT',
          '動的importの参照先を確定できません。',
        );
      }
      return;
    }
    const target = index.resolveFunction(call.expression);
    if (target) {
      addEdge(owner(call), target.id, 'calls', call);
      return;
    }
    const connection = database(call);
    if (connection) {
      const { kind } = connection;
      if (!connection.hasKnownClient) {
        unresolved(
          call,
          'UNRESOLVED_CALL',
          'Supabase型の呼出ですがclientの実装由来を確定できません。',
        );
        return;
      }
      if (!connection.hasPublicSchema) {
        unresolved(
          call,
          'UNRESOLVED_DB_SCHEMA',
          'public以外または動的なschemaのDB依存は未対応です。',
        );
        return;
      }
      const name = literal(call.arguments?.[0]);
      if (name === undefined) {
        unresolved(
          call,
          'UNRESOLVED_DB_TARGET',
          'Supabaseのtable/RPC名がliteralではないため依存先を確定できません。',
        );
      } else {
        const id = `${kind}:${name}`;
        if (!nodes.has(id))
          nodes.set(id, {
            id,
            kind,
            symbol: name,
            source: index.location(call),
            slots: [],
          });
        addEdge(owner(call), id, 'uses', call);
      }
      return;
    }

    const declaration = context.checker.getResolvedSignature(call)?.declaration;
    if (declaration) {
      const targetConstructor = ts.isNewExpression(call)
        ? index.getFunction(declaration)
        : undefined;
      if (targetConstructor) {
        addEdge(owner(call), targetConstructor.id, 'calls', call);
        return;
      }
    }
    if (provenance.externalImplementation(call.expression)) {
      const reference = ts.isPropertyAccessExpression(call.expression)
        ? call.expression.name
        : call.expression;
      for (const origin of [
        ...(declaration ? [declaration] : []),
        ...provenance.declarations(reference),
      ]) {
        if (provenance.generatedPath(origin))
          addEdge(owner(call), moduleId(origin), 'uses', call);
      }
      return;
    }
    unresolved(
      call,
      'UNRESOLVED_CALL',
      '呼出先の実装を単一の関数へ解決できません。',
    );
  };

  for (const file of context.files) {
    const id = moduleId(file.sourceFile);
    nodes.set(id, {
      id,
      kind: 'module',
      source: index.location(file.sourceFile),
      slots: [],
    });
  }
  for (const fn of index.functions) {
    nodes.set(fn.id, {
      id: fn.id,
      kind: 'function',
      symbol: fn.name,
      source: fn.source,
      slots: [],
    });
    addEdge(moduleId(fn.node), fn.id, 'contains', fn.node);
    const enclosing = index.enclosingFunction(fn.node.parent);
    if (enclosing) addEdge(enclosing.id, fn.id, 'contains', fn.node);
  }

  for (const file of [...context.files].sort((a, b) =>
    compare(a.path, b.path),
  )) {
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && hasValueImport(node)) {
        importModule(node, node.moduleSpecifier, 'imports');
      } else if (
        ts.isImportEqualsDeclaration(node) &&
        !node.isTypeOnly &&
        ts.isExternalModuleReference(node.moduleReference) &&
        node.moduleReference.expression
      ) {
        importModule(node, node.moduleReference.expression, 'imports');
      } else if (ts.isExportDeclaration(node) && hasValueExport(node)) {
        if (node.moduleSpecifier)
          importModule(node, node.moduleSpecifier, 'exports');
        else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const element of node.exportClause.elements) {
            if (element.isTypeOnly) continue;
            const target = index.resolveFunction(element.name);
            if (target) addEdge(moduleId(node), target.id, 'exports', element);
          }
        }
      } else if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        inspectCall(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(file.sourceFile);
  }
  return {
    nodes: [...nodes.values()].sort((a, b) => compare(a.id, b.id)),
    edges: [...edges.values()].sort((a, b) =>
      compare(JSON.stringify(a), JSON.stringify(b)),
    ),
    diagnostics: [...diagnostics.values()].sort((a, b) =>
      compare(JSON.stringify(a), JSON.stringify(b)),
    ),
  };
};

export type { DependencyExtraction };
