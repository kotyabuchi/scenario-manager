import { isNil } from 'ramda';

import { createHash } from 'node:crypto';

import type {
  Inventory,
  InventoryEdge,
  InventoryNode,
} from './inventorySchema';

const revisions = ['base', 'head', 'index', 'working'] as const;
type Inventories = Record<(typeof revisions)[number], Inventory>;

const append = <T>(map: Map<string, T[]>, key: string, value: T) => {
  const items = map.get(key);
  if (isNil(items)) map.set(key, [value]);
  else items.push(value);
};

/** 版ごとの位置・edgeを保持し、同じIDの旧ファイル位置を失わない。 */
export const mergeImpactGraphs = (inventories: Inventories | null) => {
  const byId = new Map<string, InventoryNode[]>();
  const byPath = new Map<string, InventoryNode[]>();
  const incoming = new Map<string, InventoryEdge[]>();
  const outgoing = new Map<string, InventoryEdge[]>();
  const sourcePaths = new Set<string>();
  const unresolvedPaths = new Set<string>();
  let hasUnlocatedDiagnostic = false;
  let hasErrors = false;
  const hash = createHash('sha256');
  for (const revision of revisions) {
    const inventory = inventories?.[revision];
    if (isNil(inventory)) continue;
    hash.update(`${JSON.stringify([revision, inventory])}\n`);
    for (const { path } of inventory.source.files) sourcePaths.add(path);
    for (const node of inventory.nodes) {
      append(byId, node.id, node);
      append(byPath, node.source.file, node);
    }
    for (const edge of inventory.edges) {
      append(incoming, edge.to, edge);
      append(outgoing, edge.from, edge);
      if (edge.kind === 'unresolved') unresolvedPaths.add(edge.source.file);
    }
    for (const diagnostic of inventory.diagnostics) {
      if (diagnostic.severity === 'error') hasErrors = true;
      if (isNil(diagnostic.source) || isNil(diagnostic.anchor))
        hasUnlocatedDiagnostic = true;
      if (!isNil(diagnostic.source))
        unresolvedPaths.add(diagnostic.source.file);
    }
  }
  return {
    byId,
    byPath,
    incoming,
    outgoing,
    sourcePaths,
    unresolvedPaths,
    hasUnlocatedDiagnostic,
    hasErrors,
    isUnavailable: inventories === null,
    digest: (inventories === null
      ? hash.update('unavailable-v1')
      : hash
    ).digest('hex'),
  };
};

type ImpactGraph = ReturnType<typeof mergeImpactGraphs>;

const walk = (
  starts: Iterable<string>,
  neighbors: (id: string) => string[],
) => {
  const seen = new Set(starts);
  // Setのイテレーターは末尾に追加した要素も訪問する。
  for (const id of seen)
    for (const neighbor of neighbors(id)) seen.add(neighbor);
  return seen;
};

export const traceImpact = (graph: ImpactGraph, path: string) => {
  const starts = (graph.byPath.get(path) ?? []).map(({ id }) => id);
  const impactedNodes = walk(starts, (id) =>
    (graph.incoming.get(id) ?? []).map(({ from }) => from),
  );
  const reachedPaths = new Set([path]);
  for (const id of impactedNodes)
    for (const node of graph.byId.get(id) ?? [])
      reachedPaths.add(node.source.file);

  // 変更元から辿れるDB対象も契約照合へ渡す。
  const dependencies = walk(starts, (id) =>
    (graph.outgoing.get(id) ?? [])
      .filter(
        ({ kind }) =>
          kind === 'contains' || kind === 'uses' || kind === 'calls',
      )
      .map(({ to }) => to),
  );
  for (const id of dependencies) {
    if (
      graph.byId.get(id)?.some(({ kind }) => kind === 'table' || kind === 'rpc')
    )
      impactedNodes.add(id);
  }
  return { impactedNodes, reachedPaths };
};

export type { ImpactGraph, Inventories };
