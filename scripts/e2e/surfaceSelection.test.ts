import { describe, expect, it } from 'vitest';

import { createSourceFixture } from './fixtures/createSource';
import { impactFixture, snapshotFixture } from './fixtures/selection';
import { mergeImpactGraphs } from './impactGraph';
import { buildInventory } from './inventory';
import { loadImpactRules } from './loadImpactRules';
import { selectImpacts } from './select';
import {
  buildSurfacePending,
  surfaceSelectionBaseline,
} from './surfacePending';

const PAGE = 'src/app/sessions/page.tsx';
const ACTION = 'src/app/sessions/actions.ts';

const selectionInput = (handler = 'save') => {
  const fixture = impactFixture();
  const inventory = buildInventory(
    createSourceFixture({
      [PAGE]: `import {save} from './actions'; declare const registry: { handler: () => Promise<void> };
      export default function Page(){return <button onClick={${handler}}>保存</button>}`,
      [ACTION]: "'use server'; export async function save() {}",
    }),
  );
  const binding = inventory.surfaceAnalysis.bindings[0];
  const scheduleCase = fixture.ledger.scenarios
    .flatMap(({ cases }) => cases)
    .find(({ caseId }) => caseId === 'schedule');
  if (!binding || !scheduleCase) throw new Error('surfaceとcaseが必要です');
  scheduleCase.checks = [
    { target: binding.id, aspect: 'render', layer: 'browser' },
  ];
  fixture.ledger.contracts.push({
    target: binding.id,
    classification: 'support',
    requirements: [],
    notApplicable: [],
  });
  const rawRules = JSON.stringify({
    schemaVersion: 1,
    features: [
      {
        id: 'sessions',
        reason: 'UIの依存抽出と独立した既存機能規則',
        paths: [{ kind: 'directory', path: 'src/app/sessions' }],
        caseIds: ['calendar-a'],
        targets: [],
        legacyPaths: [],
      },
    ],
    alwaysFull: [],
    databaseWide: [],
    docsOnly: [],
  });
  return {
    ...fixture,
    binding,
    inventory,
    rules: loadImpactRules({
      current: rawRules,
      base: rawRules,
      ledger: fixture.ledger,
    }),
    graph: mergeImpactGraphs({
      base: inventory,
      head: inventory,
      index: inventory,
      working: inventory,
    }),
    snapshot: snapshotFixture([
      { status: 'M', origin: 'unstaged', newPath: ACTION },
    ]),
  };
};

describe('UI依存と既存機能規則の選択境界', () => {
  it('Action変更をUI契約へ逆伝播し、独立した機能caseも残す', () => {
    const input = selectionInput();
    const decision = selectImpacts(input);
    expect(decision.mode).toBe('partial');
    expect(decision.caseIds).toEqual(['calendar-a', 'schedule']);
    expect(decision.targetIds).toContain(input.binding.id);
    expect(decision.reasons.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['FEATURE_RULE', 'GRAPH_TARGET']),
    );
  });

  it('UI不足をcoreと分けて保存しても、関連変更の全件fallbackから落とさない', () => {
    const input = selectionInput();
    const before = structuredClone(input.baseline);
    const pending = buildSurfacePending(input.inventory, [
      {
        target: input.binding.id,
        aspect: 'contract',
        layer: null,
        caseId: null,
        profile: null,
        project: null,
        runtime: null,
        variant: null,
        actorBindings: null,
      },
    ]);
    const decision = selectImpacts({
      ...input,
      baseline: surfaceSelectionBaseline(input.baseline, pending),
    });
    expect(decision.mode).toBe('full-required');
    expect(decision.coverageGaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'BASELINE_RELATED',
          viaNodes: [input.binding.id],
        }),
      ]),
    );
    expect(input.baseline).toEqual(before);
  });

  it('未解決callbackの呼出先が分からないとき、別fileのAction変更も全件へ広げる', () => {
    const input = selectionInput('registry.handler');
    const pending = buildSurfacePending(input.inventory, []);
    const decision = selectImpacts({
      ...input,
      baseline: surfaceSelectionBaseline(input.baseline, pending),
    });
    expect(decision.mode).toBe('full-required');
    expect(decision.reasons.map(({ code }) => code)).toContain(
      'UNKNOWN_DEPENDENCY',
    );
    expect(decision.coverageStatus).toBe('insufficient');
  });
});
