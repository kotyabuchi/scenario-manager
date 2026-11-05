import { expect, it } from 'vitest';

import { extractActions } from './extractors/actions';
import { extractDependencies } from './extractors/dependencies';
import { extractRoutes } from './extractors/routes';
import {
  CONFIRM_ACTIONS,
  CONFIRM_ADAPTER,
  CONFIRM_PAGE,
  createSurfaceConfirmFixture,
  EXPORT_CONFIRM,
  INLINE_CONFIRM,
  SUBMIT_ACTION,
  SUBMIT_PAGE,
} from './fixtures/surfaceConfirm';
import { createSourceIndex } from './sourceIndex';
import { analyzeSurfaceInventory } from './surfaceInventory';

const analyze = () => {
  const { context, storyContext } = createSurfaceConfirmFixture();
  const index = createSourceIndex(context);
  const { nodes: routes } = extractRoutes(
    context.files.map(({ path }) => path),
  );
  const actions = extractActions(context, index);
  const dependencies = extractDependencies(context, index);
  const nodes = [...routes, ...actions.nodes, ...dependencies.nodes];
  const edges = [...actions.edges, ...dependencies.edges];
  return {
    ...analyzeSurfaceInventory({
      context,
      index,
      routes,
      nodes,
      edges,
      storyContext,
    }),
    edges,
    routes,
  };
};

it('確定の通常位置と固定バーを別siteで観測し、同じinline Actionから既存RPC辺までたどる', () => {
  const { bindings, edges, routes, sites } = analyze();
  const confirm = routes.find(({ source }) => source.file === CONFIRM_PAGE)?.id;
  const surfaceBindings = bindings.filter(
    ({ entry }) => entry.kind === 'product' && entry.id === confirm,
  );
  expect(surfaceBindings).toHaveLength(2);
  expect(new Set(surfaceBindings.map(({ siteId }) => siteId)).size).toBe(2);
  expect(new Set(surfaceBindings.map(({ id }) => id)).size).toBe(2);
  for (const { siteId, branches } of surfaceBindings) {
    expect(sites.find(({ id }) => id === siteId)).toMatchObject({
      kind: 'interaction',
      event: 'click',
    });
    expect(branches[0]?.resolution).toEqual({
      kind: 'resolved',
      targetIds: [INLINE_CONFIRM],
    });
    expect(branches[0]?.flow).toContainEqual(
      expect.objectContaining({
        kind: 'invoke-handler',
        to: { kind: 'node', nodeId: INLINE_CONFIRM },
      }),
    );
  }
  const inlineFn = INLINE_CONFIRM.replace(/^action:/, 'function:');
  const exportedFn = `function:${CONFIRM_ACTIONS}#confirmScheduleTimeBlocksAction`;
  const adapter = `function:${CONFIRM_ADAPTER}#replaceConfirmedScheduleTimeBlocks`;
  const rpc = 'rpc:replace_confirmed_schedule_time_blocks';
  expect(edges).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        from: INLINE_CONFIRM,
        to: inlineFn,
        kind: 'exports',
      }),
      expect.objectContaining({
        from: inlineFn,
        to: exportedFn,
        kind: 'calls',
      }),
      expect.objectContaining({
        from: EXPORT_CONFIRM,
        to: exportedFn,
        kind: 'exports',
      }),
      expect.objectContaining({ from: exportedFn, to: adapter, kind: 'calls' }),
      expect.objectContaining({ from: adapter, to: rpc, kind: 'uses' }),
    ]),
  );
});

it('同じ固定バーの提出mountとStorybookの省略・モックを製品Actionと混ぜない', () => {
  const { bindings, routes } = analyze();
  const submit = routes.find(({ source }) => source.file === SUBMIT_PAGE)?.id;
  const confirm = routes.find(({ source }) => source.file === CONFIRM_PAGE)?.id;
  const submitBindings = bindings.filter(
    ({ entry }) => entry.kind === 'product' && entry.id === submit,
  );
  expect(submitBindings).toHaveLength(1);
  const submitBinding = submitBindings[0];
  expect(submitBinding?.branches[0]?.resolution).toEqual({
    kind: 'resolved',
    targetIds: [SUBMIT_ACTION],
  });
  const confirmSticky = bindings.find(
    ({ entry, siteId }) =>
      entry.kind === 'product' &&
      entry.id === confirm &&
      siteId === submitBinding?.siteId,
  );
  expect(confirmSticky).toBeDefined();
  expect(confirmSticky?.id).not.toBe(submitBinding?.id);
  expect(confirmSticky?.mountSiteIds).not.toEqual(submitBinding?.mountSiteIds);
  const storyBindings = (story: string) =>
    bindings.filter(
      ({ entry }) =>
        entry.kind === 'storybook' && entry.id.endsWith(`#${story}`),
    );
  expect(storyBindings('Omitted')).toHaveLength(2);
  expect(storyBindings('Mock')).toHaveLength(2);
  for (const { branches } of storyBindings('Omitted'))
    expect(branches[0]?.resolution).toEqual({ kind: 'optional-absent' });
  for (const { branches } of storyBindings('Mock'))
    expect(branches[0]?.resolution).toEqual({ kind: 'local' });
});
