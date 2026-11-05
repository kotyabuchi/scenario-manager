import { describe, expect, it } from 'vitest';

import { createSourceFixture } from './fixtures/createSource';
import { createLedgerFixture } from './fixtures/ledger';
import { mergeImpactGraphs, traceImpact } from './impactGraph';
import { buildInventory, projectInventoryV1 } from './inventory';
import { inventorySchema, inventoryV1Schema } from './inventorySchema';
import { validateLedger } from './requirements';
import { buildSurfaceMigrationRecord } from './surfaceMigration';
import {
  buildOldSurfacePending,
  buildSurfacePending,
  surfaceObservationDigest,
} from './surfacePending';
import {
  projectSurfaceGraph,
  SURFACE_RULE_DIGEST,
  withSurfaceNodes,
} from './surfaceProjection';

const page = 'src/app/page.tsx';
const action = 'src/app/actions.ts';
const makeInventory = (extra = '') =>
  buildInventory(
    createSourceFixture({
      [page]: `import {save} from './actions'; export default function Page(){return <main><button data-testid="save" onClick={save}>Save</button>${extra}</main>}`,
      [action]: `'use server'; export async function save() {}`,
    }),
  );
const emptyLedger = () => ({
  ...createLedgerFixture(),
  contracts: [],
  scenarios: [],
  exceptions: [],
});
const bindingOf = (inventory: ReturnType<typeof makeInventory>) => {
  const binding = inventory.surfaceAnalysis.bindings[0];
  if (!binding) throw new Error('操作bindingが必要です');
  return binding;
};

describe('UI観測の保存・必須化・影響選択の境界', () => {
  it('v1はUI観測を黙って補わず、v2のcoreだけを正確に投影する', () => {
    const inventory = makeInventory();
    const old = projectInventoryV1(inventory);
    expect(inventoryV1Schema.parse(old)).toEqual(old);
    expect(() => inventorySchema.parse(old)).toThrow();
    expect(() => inventoryV1Schema.parse(inventory)).toThrow();
    expect(old.nodes).toEqual(inventory.nodes);
    expect(old.edges).toEqual(inventory.edges);
    expect(old.diagnostics).toEqual(inventory.diagnostics);
    expect(inventory.nodes.some(({ kind }) => kind === 'surface')).toBe(false);
    expect(projectSurfaceGraph(inventory).nodes).toHaveLength(1);
  });

  it.each([
    'target',
    'entry',
    'mount',
    'flow',
    'duplicate',
  ] as const)('%sの不正参照を保存schemaで拒否する', (kind) => {
    const inventory = makeInventory();
    const binding = bindingOf(inventory);
    if (kind === 'target')
      binding.branches = [
        {
          role: 'handler',
          flow: [],
          resolution: { kind: 'resolved', targetIds: ['action:missing'] },
        },
      ];
    if (kind === 'entry')
      binding.entry = { kind: 'product', id: 'page:missing' };
    if (kind === 'mount') binding.mountSiteIds.push('surface-site:missing');
    if (kind === 'flow') {
      inventory.surfaceAnalysis.storyReferences.push({
        id: 'story-only',
        kind: 'symbol',
        source: { file: 'story.tsx', line: 1, column: 1 },
      });
      binding.branches[0]?.flow.push({
        kind: 'invoke-handler',
        source: { file: page, line: 1, column: 1 },
        from: { kind: 'site', siteId: binding.siteId },
        to: { kind: 'node', nodeId: 'story-only' },
      });
    }
    if (kind === 'duplicate')
      inventory.surfaceAnalysis.bindings.push(structuredClone(binding));
    expect(() => inventorySchema.parse(inventory)).toThrow();
  });

  it('表示位置と列挙順でdigestを変えず、flow順序の変更は検知する', () => {
    const inventory = makeInventory();
    const moved = structuredClone(inventory);
    moved.surfaceAnalysis.sites.reverse();
    for (const site of moved.surfaceAnalysis.sites) site.source.line += 10;
    expect(surfaceObservationDigest(moved)).toBe(
      surfaceObservationDigest(inventory),
    );
    const branch = bindingOf(moved).branches[0];
    if (!branch || branch.flow.length < 2)
      throw new Error('順序を持つflowが必要です');
    branch.flow.reverse();
    expect(surfaceObservationDigest(moved)).not.toBe(
      surfaceObservationDigest(inventory),
    );
  });

  it('新しい操作の不足をexceptionで隠して初期移行に混ぜられない', () => {
    const old = makeInventory();
    const current = makeInventory(
      '<button data-testid="extra" onClick={save}>Extra</button>',
    );
    const ledger = emptyLedger();
    const validation = validateLedger({
      inventory: withSurfaceNodes(current),
      ledger,
      registrations: [],
    });
    const oldPending = buildOldSurfacePending(old, ledger);
    const added = validation.deficiencies.find(
      ({ target }) =>
        target.startsWith('surface:') &&
        !oldPending.items.some(
          (item) =>
            item.category === 'deficiency' && item.deficiency.target === target,
        ),
    );
    if (!added) throw new Error('追加操作の不足が必要です');
    const withException = validateLedger({
      inventory: withSurfaceNodes(current),
      ledger: {
        ...ledger,
        exceptions: [
          {
            id: 'hide-new-surface',
            deficiency: added,
            reason: '新しい操作を隠すfixture',
            tracker: 'fixture',
            reviewCondition: 'fixture',
          },
        ],
      },
      registrations: [],
    });
    expect(withException.excepted).toEqual([added]);
    expect(withException.deficiencies).not.toContainEqual(added);
    // 実validatorが例外へ分離した行も、初期UI許容集合の検査では落とさない。
    const currentPending = buildSurfacePending(current, [
      ...withException.deficiencies,
      ...withException.excepted,
    ]);
    expect(() =>
      buildSurfaceMigrationRecord({
        observationBaseSha: 'a'.repeat(40),
        ruleDigest: SURFACE_RULE_DIGEST,
        old: {
          observationDigest: surfaceObservationDigest(old),
          pending: oldPending,
        },
        current: {
          observationDigest: surfaceObservationDigest(current),
          pending: currentPending,
        },
      }),
    ).toThrow('比較元に存在しない');
  });

  it('callback先の変更を操作入口へ逆伝播し、core保存graphを変えない', () => {
    const inventory = makeInventory();
    const before = structuredClone(inventory);
    const graph = mergeImpactGraphs({
      base: inventory,
      head: inventory,
      index: inventory,
      working: inventory,
    });
    const impacted = traceImpact(graph, action).impactedNodes;
    expect(impacted.has(bindingOf(inventory).id)).toBe(true);
    expect(impacted.has(bindingOf(inventory).entry.id)).toBe(true);
    expect(inventory).toEqual(before);
  });
});
