import { createHash } from 'node:crypto';

import type {
  Inventory,
  InventoryEdge,
  InventoryNode,
} from './inventorySchema';

/** 必須化の範囲はproductの操作入口。Storybookのmockに本番義務を移さない。 */
export const SURFACE_RULE_DIGEST = createHash('sha256')
  .update(
    JSON.stringify({
      version: 1,
      entries: ['product'],
      kinds: ['surface'],
      defaultAspects: ['render'],
      diagnostics: 'product-render-and-callback',
      selection: 'union-feature-mapping-with-conservative-fallback',
    }),
  )
  .digest('hex');

/** coreの保存形と分離し、契約・影響選択へ必要なUI node/edgeだけを投影する。 */
export const projectSurfaceGraph = (inventory: Inventory) => {
  const sites = new Map(
    inventory.surfaceAnalysis.sites.map((site) => [site.id, site]),
  );
  const nodes: InventoryNode[] = [];
  const edges: InventoryEdge[] = [];
  for (const binding of inventory.surfaceAnalysis.bindings) {
    if (binding.entry.kind !== 'product') continue;
    const site = sites.get(binding.siteId);
    if (!site) throw new Error('surfaceの操作siteがありません');
    nodes.push({
      id: binding.id,
      kind: 'surface',
      source: site.source,
      slots: [],
    });
    edges.push({
      from: binding.entry.id,
      to: binding.id,
      kind: 'renders',
      source: site.source,
    });
    for (const mountId of binding.mountSiteIds) {
      const mount = sites.get(mountId);
      if (!mount) throw new Error('surfaceのmountがありません');
      // entryからmount内の変更にも到達できるよう、既存moduleへ接続する。
      const moduleId = `module:${mount.source.file}`;
      if (inventory.nodes.some(({ id }) => id === moduleId))
        edges.push({
          from: binding.id,
          to: moduleId,
          kind: 'uses',
          source: mount.source,
        });
    }
    for (const branch of binding.branches) {
      for (const target of 'targetIds' in branch.resolution
        ? branch.resolution.targetIds
        : [])
        edges.push({
          from: binding.id,
          to: target,
          kind: 'calls',
          source: site.source,
        });
      // 中間props/handlerの変更もfeature規則との和集合へ渡す。
      for (const step of branch.flow)
        for (const endpoint of [step.from, step.to])
          if (
            endpoint.kind === 'node' &&
            inventory.nodes.some(({ id }) => id === endpoint.nodeId)
          )
            edges.push({
              from: binding.id,
              to: endpoint.nodeId,
              kind: 'uses',
              source: step.source,
            });
    }
  }
  const uniqueEdges = new Map(
    edges.map((edge) => [JSON.stringify(edge), edge]),
  );
  return { nodes, edges: [...uniqueEdges.values()] };
};

export const withSurfaceNodes = (inventory: Inventory): Inventory => {
  const surface = projectSurfaceGraph(inventory);
  return {
    ...inventory,
    nodes: [...inventory.nodes, ...surface.nodes],
    edges: [...inventory.edges, ...surface.edges],
  };
};
