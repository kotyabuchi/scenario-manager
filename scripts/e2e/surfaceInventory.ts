import { resolveSurfaceCallbacks } from './extractors/callbacks';
import { extractDependencies } from './extractors/dependencies';
import {
  productSurfaceRoots,
  storySurfaceRoots,
} from './extractors/surfaceRoots';
import { extractSurfaces } from './extractors/surfaces';
import { createSourceIndex } from './sourceIndex';
import { surfaceAnalysisSchema } from './surfaceSchema';

import type {
  InventoryEdge,
  InventoryNode,
  SourceLocation,
} from './inventorySchema';
import type { SourceContext } from './source';
import type { SourceIndex } from './sourceIndex';
import type { SurfaceAnalysis } from './surfaceSchema';

/** productionとstoryのProgram・props環境を分離してから観測結果を結合する。 */
export const analyzeSurfaceInventory = ({
  context,
  index,
  routes,
  nodes,
  edges,
  storyContext,
}: {
  context: SourceContext;
  index: SourceIndex;
  routes: InventoryNode[];
  nodes: InventoryNode[];
  edges: InventoryEdge[];
  storyContext?: SourceContext;
}): SurfaceAnalysis => {
  const roots = productSurfaceRoots(context, index, routes);
  const surfaces = extractSurfaces({ context, index, roots: roots.roots });
  const callbacks = resolveSurfaceCallbacks({
    context,
    index,
    ...surfaces,
    nodes,
    edges,
  });
  const result: SurfaceAnalysis = {
    sites: surfaces.sites,
    bindings: callbacks.bindings,
    diagnostics: [
      ...roots.diagnostics,
      ...surfaces.diagnostics,
      ...callbacks.diagnostics,
    ],
    storyReferences: [],
  };
  if (storyContext) {
    const storyIndex = createSourceIndex(storyContext);
    const storyRoots = storySurfaceRoots(storyContext, storyIndex);
    const storySurfaces = extractSurfaces({
      context: storyContext,
      index: storyIndex,
      roots: storyRoots.roots,
    });
    const storyDependencies = extractDependencies(storyContext, storyIndex);
    const storyCallbacks = resolveSurfaceCallbacks({
      context: storyContext,
      index: storyIndex,
      ...storySurfaces,
      nodes: [...nodes, ...storyDependencies.nodes],
      edges: [...edges, ...storyDependencies.edges],
    });
    result.sites.push(...storySurfaces.sites);
    result.bindings.push(...storyCallbacks.bindings);
    result.diagnostics.push(
      ...storyRoots.diagnostics,
      ...storySurfaces.diagnostics,
      ...storyCallbacks.diagnostics,
    );
    const refs = new Map<string, SourceLocation>();
    for (const { id, source } of storyDependencies.nodes) refs.set(id, source);
    for (const { entry, node } of storyRoots.roots)
      refs.set(entry.id, storyIndex.location(node));
    for (const diagnostic of storyRoots.diagnostics)
      refs.set(diagnostic.entry.id, diagnostic.source);
    const entries = new Set([
      ...storyRoots.roots.map(({ entry }) => entry.id),
      ...storyRoots.diagnostics.map(({ entry }) => entry.id),
    ]);
    result.storyReferences = [...refs].map(([id, source]) => ({
      id,
      source,
      kind: entries.has(id) ? 'entry' : 'symbol',
    }));
  }
  const sites = new Map<string, SurfaceAnalysis['sites'][number]>();
  for (const site of result.sites) {
    const existing = sites.get(site.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(site))
      throw new Error('productとstoryで同じsite IDの定義が一致しません');
    sites.set(site.id, site);
  }
  result.sites = [...sites.values()];
  return surfaceAnalysisSchema.parse(result);
};
