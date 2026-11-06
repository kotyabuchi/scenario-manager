import { describe, expect, it } from 'vitest';

import {
  buildSurfacePendingDiagnostic,
  SurfacePendingSubsetError,
} from './surfacePendingDiagnostic';

import type { SurfacePendingItem } from './surfaceMigrationSchema';
import type { SurfaceBinding } from './surfaceSchema';

const surfaceId = `surface:${'a'.repeat(64)}`;
const entry = { kind: 'product', id: 'page:src/app/page.tsx' } as const;
const siteId = `surface-site:${'b'.repeat(64)}`;
const binding = {
  id: surfaceId,
  entry,
  siteId,
  bindingDigest: 'c'.repeat(64),
  mountSiteIds: [],
  branches: [{ role: 'handler', flow: [], resolution: { kind: 'local' } }],
} satisfies SurfaceBinding;
const anchor = {
  ownerId: 'private-anchor-owner',
  syntaxHash: 'd'.repeat(64),
  occurrence: 0,
};
const render = {
  category: 'render-diagnostic',
  entry,
  code: 'SURFACE_PRIVATE_ARBITRARY_CODE',
  mountSiteIds: ['private-mount-site'],
  anchor,
} satisfies SurfacePendingItem;
const unresolved = {
  ...render,
  category: 'unresolved-binding',
  surfaceId,
  bindingDigest: binding.bindingDigest,
} satisfies SurfacePendingItem;
const deficiency = {
  category: 'deficiency',
  deficiency: {
    target: surfaceId,
    aspect: 'render',
    layer: null,
    caseId: 'private-case-id',
    variant: null,
    actorBindings: null,
    profile: null,
    project: null,
    runtime: null,
  },
} satisfies SurfacePendingItem;

describe('UI不足の安全な診断', () => {
  it('種類別の固定コードと識別子だけを返す', () => {
    const error = new SurfacePendingSubsetError([
      deficiency,
      unresolved,
      { ...render, siteId },
      render,
    ]);
    error.message = 'private-source-fragment';
    const diagnostic = buildSurfacePendingDiagnostic(error, [binding]);
    expect(diagnostic.details).toEqual([
      {
        entry: entry.id,
        site: siteId,
        code: 'UI_SURFACE_DEFICIENCY',
        target: surfaceId,
        aspect: 'render',
      },
      { entry: entry.id, site: siteId, code: 'UI_SURFACE_UNRESOLVED_BINDING' },
      { entry: entry.id, site: siteId, code: 'UI_SURFACE_RENDER_DIAGNOSTIC' },
      { entry: entry.id, site: null, code: 'UI_SURFACE_RENDER_DIAGNOSTIC' },
    ]);
    expect(JSON.stringify(diagnostic)).not.toMatch(/private|PRIVATE/u);
    expect(JSON.stringify(error)).not.toContain('private-anchor-owner');
  });

  it('bindingがなくても未解決項目のentryを保持する', () => {
    const { details } = buildSurfacePendingDiagnostic(
      new SurfacePendingSubsetError([deficiency, unresolved]),
    );
    expect(details).toEqual([
      {
        entry: null,
        site: null,
        code: 'UI_SURFACE_DEFICIENCY',
        target: surfaceId,
        aspect: 'render',
      },
      { entry: entry.id, site: null, code: 'UI_SURFACE_UNRESOLVED_BINDING' },
    ]);
  });

  it('同じentryとsiteの既知の抽出原因を区別する', () => {
    const { details, summary } = buildSurfacePendingDiagnostic(
      new SurfacePendingSubsetError([
        { ...render, siteId, code: 'SURFACE_RENDER_LIMIT' },
        { ...render, siteId, code: 'SURFACE_RENDER_CYCLE' },
        { ...unresolved, code: 'SURFACE_CALLBACK_CALL_UNKNOWN' },
        { ...unresolved, code: 'SURFACE_CALLBACK_NAVIGATION_UNKNOWN' },
      ]),
      [binding],
    );

    expect(details).toEqual([
      {
        entry: entry.id,
        site: siteId,
        code: 'UI_SURFACE_RENDER_DIAGNOSTIC',
        diagnosticCode: 'SURFACE_RENDER_LIMIT',
      },
      {
        entry: entry.id,
        site: siteId,
        code: 'UI_SURFACE_RENDER_DIAGNOSTIC',
        diagnosticCode: 'SURFACE_RENDER_CYCLE',
      },
      {
        entry: entry.id,
        site: siteId,
        code: 'UI_SURFACE_UNRESOLVED_BINDING',
        diagnosticCode: 'SURFACE_CALLBACK_CALL_UNKNOWN',
      },
      {
        entry: entry.id,
        site: siteId,
        code: 'UI_SURFACE_UNRESOLVED_BINDING',
        diagnosticCode: 'SURFACE_CALLBACK_NAVIGATION_UNKNOWN',
      },
    ]);
    expect(summary.items).toEqual(details);
  });

  it('識別子の長さと制御文字を制限し、公開要約は10件までにする', () => {
    const diagnostic = buildSurfacePendingDiagnostic(
      new SurfacePendingSubsetError(
        Array.from({ length: 13 }, () => ({
          ...render,
          entry: { ...entry, id: `page:\n\u001b\u202e${'a'.repeat(200)}` },
          siteId: `surface-site:${'b'.repeat(200)}`,
        })),
      ),
    );
    expect(diagnostic.summary).toEqual({
      total: 13,
      omitted: 3,
      items: diagnostic.details.slice(0, 10),
    });
    expect(diagnostic.details).toHaveLength(13);
    expect(diagnostic.details[0]).toMatchObject({
      entry: `page:���${'a'.repeat(151)}…`,
      site: `surface-site:${'b'.repeat(146)}…`,
    });
  });
});
