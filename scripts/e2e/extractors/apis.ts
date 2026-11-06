import ts from 'typescript';

import { runtimeExports } from './exports';
import { extractRoutes } from './routes';

import type {
  InventoryDiagnostic,
  InventoryEdge,
  InventoryNode,
} from '../inventorySchema';
import type { SourceContext } from '../source';
import type { SourceIndex } from '../sourceIndex';

const METHODS: ReadonlySet<string> = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] satisfies NonNullable<InventoryNode['method']>[]);
const isMethod = (name: string): name is NonNullable<InventoryNode['method']> =>
  METHODS.has(name);

/** routeのHTTP公開名を実体関数へ結び付ける。自動生成されるmethodは推測しない。 */
export const extractApis = (context: SourceContext, index: SourceIndex) => {
  const nodes: InventoryNode[] = [];
  const edges: InventoryEdge[] = [];
  const diagnostics: InventoryDiagnostic[] = [];
  const routes = new Map(
    extractRoutes(context.files.map((file) => file.path))
      .nodes.filter((node) => node.kind === 'route')
      .map((node) => [node.source.file, node]),
  );
  for (const { path: file, sourceFile } of context.files) {
    const route = routes.get(file);
    if (!route) continue;
    const exported = runtimeExports(sourceFile, context, index);
    diagnostics.push(...exported.diagnostics);
    for (const { name, symbol, node } of exported.exports) {
      if (!isMethod(name)) continue;
      const source = index.location(node);
      const id = `api:${file}#${name}`;
      nodes.push({
        id,
        kind: 'api',
        method: name,
        symbol: name,
        source,
        slots: route.slots,
        ...(route.url ? { url: route.url } : {}),
        ...(route.navigation ? { navigation: route.navigation } : {}),
      });
      edges.push({ from: route.id, to: id, kind: 'exports', source });
      const target = index.resolveSymbol(symbol);
      if (target && !ts.isConstructorDeclaration(target.node))
        edges.push({ from: id, to: target.id, kind: 'exports', source });
      else {
        const resolved =
          symbol.flags & ts.SymbolFlags.Alias
            ? context.checker.getAliasedSymbol(symbol)
            : symbol;
        const declaration = resolved.valueDeclaration;
        const callable =
          context.checker
            .getTypeOfSymbolAtLocation(resolved, declaration ?? node)
            .getCallSignatures().length > 0;
        diagnostics.push({
          code:
            !declaration || callable
              ? 'API_UNRESOLVED_EXPORT'
              : 'API_NON_FUNCTION_EXPORT',
          severity: 'error',
          message: `HTTP ${name}の関数実体を解決できません。`,
          source,
        });
      }
    }
  }
  return { nodes, edges, diagnostics };
};
