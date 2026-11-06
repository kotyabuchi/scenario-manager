import { createDiagnosticAnchors } from '../diagnosticAnchors';
import { createSurfaceLocator } from './surfaceLocator';

import { createHash } from 'node:crypto';

import type ts from 'typescript';
import type { SourceIndex } from '../sourceIndex';
import type {
  SurfaceDiagnostic,
  SurfaceEntry,
  SurfaceEvent,
  SurfaceSite,
} from '../surfaceSchema';
import type { Opening } from './surfaceAdapters';
import type { Frame } from './surfaceTypes';

type Scope = { entry: SurfaceEntry; frame: Frame };
type Encounter = { scope: Scope; node: ts.Node; code: string; message: string };

const compare = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;
const scopeKey = (scope: Scope) =>
  JSON.stringify([scope.entry, scope.frame.mountSiteIds]);

/** siteの同形衝突とmount単位の診断を、構文位置の証拠とともに保存する。 */
export const createSurfaceSites = (
  index: SourceIndex,
  tagId: (opening: Opening) => string,
) => {
  const { locator, tagLocator } = createSurfaceLocator(tagId);
  const sites = new Map<
    string,
    { site: SurfaceSite; occurrences: Map<ts.Node, Map<string, Scope>> }
  >();
  const pending = new Map<ts.Node, Map<string, Encounter>>();

  const diagnose = (
    scope: Scope,
    node: ts.Node,
    code: string,
    message: string,
  ) => {
    const previous = pending.get(node) ?? new Map<string, Encounter>();
    previous.set(JSON.stringify([scopeKey(scope), code]), {
      scope,
      node,
      code,
      message,
    });
    pending.set(node, previous);
  };
  const registerSite = (
    scope: Scope,
    node: ts.Node,
    tag: string,
    details: { kind: 'mount' } | { kind: 'interaction'; event: SurfaceEvent },
    position = node,
    keys: string[] = [],
  ) => {
    const ownerId = scope.frame.ownerId;
    const path = [...locator(node), ...keys];
    const digest = createHash('sha256')
      .update(JSON.stringify([ownerId, tag, path, details]))
      .digest('hex');
    const id = `surface-site:${digest}`;
    const site: SurfaceSite = {
      id,
      ownerId,
      tag,
      locator: path,
      source: index.location(position),
      ...details,
    };
    const existing = sites.get(id) ?? {
      site,
      occurrences: new Map<ts.Node, Map<string, Scope>>(),
    };
    const scopes = existing.occurrences.get(node) ?? new Map<string, Scope>();
    scopes.set(scopeKey(scope), scope);
    existing.occurrences.set(node, scopes);
    sites.set(id, existing);
    return site;
  };
  const finish = () => {
    const ambiguous = new Set<string>();
    for (const [id, { occurrences }] of sites) {
      if (occurrences.size === 1) continue;
      ambiguous.add(id);
      for (const [node, scopes] of occurrences)
        for (const scope of scopes.values())
          diagnose(
            scope,
            node,
            'SURFACE_SITE_AMBIGUOUS',
            '同じ描画位置を区別できる安定識別子がありません。',
          );
    }
    const anchor = createDiagnosticAnchors(index);
    const encounters = [...pending.values()]
      .flatMap((values) => [...values.values()])
      .map((item) => ({ ...item, source: index.location(item.node) }))
      .sort(
        (a, b) =>
          compare(a.source.file, b.source.file) ||
          a.source.line - b.source.line ||
          a.source.column - b.source.column ||
          compare(a.code, b.code),
      );
    const diagnostics = new Map<string, SurfaceDiagnostic>();
    for (const { scope, node, source, code, message } of encounters) {
      const mounts = scope.frame.mountSiteIds;
      const boundary = mounts.findIndex((id) => ambiguous.has(id));
      // 不確かなmount以後のIDは証拠にせず、確定済みprefixと発生箇所を残す。
      const mountSiteIds =
        boundary < 0 ? [...mounts] : mounts.slice(0, boundary);
      const item = {
        entry: scope.entry,
        source,
        code,
        message,
        anchor: anchor(node, code),
        mountSiteIds,
      };
      diagnostics.set(
        JSON.stringify([item.entry, mountSiteIds, code, item.anchor]),
        item,
      );
    }
    return {
      sites: [...sites.values()]
        .map(({ site }) => site)
        .filter(({ id }) => !ambiguous.has(id)),
      diagnostics: [...diagnostics.values()],
      ambiguous,
    };
  };
  return { diagnose, registerSite, tagLocator, finish };
};
