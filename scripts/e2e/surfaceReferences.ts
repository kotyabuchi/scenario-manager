import type { InventoryNode } from './inventorySchema';
import type {
  SurfaceAnalysis,
  SurfaceEndpoint,
  SurfaceEntry,
} from './surfaceSchema';

/** 保存済み観測の参照切れ・entry混線を解析器とは独立に検査する。 */
export const validateSurfaceReferences = ({
  nodes,
  surfaceAnalysis: analysis,
}: {
  nodes: InventoryNode[];
  surfaceAnalysis: SurfaceAnalysis;
}) => {
  const issues: { path: (string | number)[]; message: string }[] = [];
  const fail = (message: string) =>
    issues.push({ path: ['surfaceAnalysis'], message });
  const core = new Set(nodes.map(({ id }) => id));
  const productKinds = new Set([
    'page',
    'layout',
    'default',
    'loading',
    'error',
    'template',
    'not-found',
    'global-error',
  ]);
  const productEntries = new Set(
    nodes.filter(({ kind }) => productKinds.has(kind)).map(({ id }) => id),
  );
  const storyEntries = new Set(
    analysis.storyReferences
      .filter(({ kind }) => kind === 'entry')
      .map(({ id }) => id),
  );
  const story = new Set(analysis.storyReferences.map(({ id }) => id));
  const sites = new Map(analysis.sites.map((site) => [site.id, site]));
  const bindings = new Set<string>();
  const exists = (entry: SurfaceEntry, id: string) =>
    core.has(id) || (entry.kind === 'storybook' && story.has(id));
  const isEntry = (entry: SurfaceEntry) =>
    (entry.kind === 'product' ? productEntries : storyEntries).has(entry.id);
  const entryKey = (entry: SurfaceEntry) =>
    JSON.stringify([entry.kind, entry.id]);
  const diagnosticKey = (diagnostic: {
    code: string;
    anchor: unknown;
    entry: SurfaceEntry;
    mountSiteIds: string[];
    siteId?: string | undefined;
  }) =>
    JSON.stringify([
      entryKey(diagnostic.entry),
      diagnostic.siteId ?? null,
      diagnostic.mountSiteIds,
      diagnostic.code,
      diagnostic.anchor,
    ]);
  const diagnostics = new Set(analysis.diagnostics.map(diagnosticKey));
  if (sites.size !== analysis.sites.length)
    fail('surface site IDが重複しています');
  if (story.size !== analysis.storyReferences.length)
    fail('story参照IDが重複しています');
  for (const diagnostic of analysis.diagnostics) {
    if (!isEntry(diagnostic.entry)) fail('診断のentryが存在しません');
    if (diagnostic.siteId && !sites.has(diagnostic.siteId))
      fail('診断のsiteが存在しません');
    if (
      diagnostic.siteId &&
      !exists(diagnostic.entry, sites.get(diagnostic.siteId)?.ownerId ?? '')
    )
      fail('診断のsiteが別contextに属しています');
    for (const mount of diagnostic.mountSiteIds)
      if (
        sites.get(mount)?.kind !== 'mount' ||
        !exists(diagnostic.entry, sites.get(mount)?.ownerId ?? '')
      )
        fail('診断のmountが存在しません');
  }
  const checkEndpoint = (entry: SurfaceEntry, endpoint: SurfaceEndpoint) => {
    if (endpoint.kind === 'node' && !exists(entry, endpoint.nodeId))
      fail('flowのnode参照が存在しません');
    if (
      (endpoint.kind === 'site' || endpoint.kind === 'handler') &&
      (!sites.has(endpoint.siteId) ||
        !exists(entry, sites.get(endpoint.siteId)?.ownerId ?? ''))
    )
      fail('flowのsite参照が存在しません');
    if (endpoint.kind === 'prop' && !exists(entry, endpoint.ownerId))
      fail('flowのprops所有者が存在しません');
  };
  for (const binding of analysis.bindings) {
    if (bindings.has(binding.id)) fail('surface binding IDが重複しています');
    bindings.add(binding.id);
    const site = sites.get(binding.siteId);
    if (site?.kind !== 'interaction') fail('bindingの操作siteが存在しません');
    if (!isEntry(binding.entry)) fail('bindingのentryが存在しません');
    if (site && !exists(binding.entry, site.ownerId))
      fail('操作siteの所有者が存在しません');
    for (const mount of binding.mountSiteIds)
      if (
        sites.get(mount)?.kind !== 'mount' ||
        !exists(binding.entry, sites.get(mount)?.ownerId ?? '')
      )
        fail('bindingのmountが存在しません');
    const roles = new Set(binding.branches.map(({ role }) => role));
    if (roles.size !== binding.branches.length)
      fail('branch roleが重複しています');
    for (const branch of binding.branches) {
      for (const step of branch.flow) {
        checkEndpoint(binding.entry, step.from);
        checkEndpoint(binding.entry, step.to);
      }
      if ('targetIds' in branch.resolution) {
        if (
          new Set(branch.resolution.targetIds).size !==
          branch.resolution.targetIds.length
        )
          fail('target IDが重複しています');
        for (const target of branch.resolution.targetIds)
          if (!exists(binding.entry, target))
            fail('bindingのtargetが存在しません');
      }
      if (branch.resolution.kind === 'unresolved')
        for (const diagnostic of branch.resolution.diagnostics)
          if (
            !diagnostics.has(
              diagnosticKey({
                ...diagnostic,
                entry: binding.entry,
                siteId: binding.siteId,
                mountSiteIds: binding.mountSiteIds,
              }),
            )
          )
            fail('未解決branchの診断がありません');
    }
  }
  return issues;
};
