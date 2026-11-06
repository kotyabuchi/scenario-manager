import { describe, expect, it } from 'vitest';

import { createSourceFixture } from './fixtures/createSource';
import { buildInventory, serializeInventory } from './inventory';
import { inventorySchema } from './inventorySchema';

const sample = {
  'src/app/(main)/schedule/page.tsx': `
import { save } from './actions'
export default function SchedulePage() {
  async function confirm() {
    'use server'
    return save()
  }
  return confirm
}`,
  'src/app/(main)/schedule/actions.ts': `
'use server'
import { persist } from './adapter'
export const save = async () => persist()`,
  'src/app/(main)/schedule/adapter.ts': 'export const persist = async () => 1',
  'src/app/auth/callback/route.ts': `
export const GET = async () => new Response('ok')`,
};

describe('入口と依存graphの統合', () => {
  it('inline Actionからexport Actionの実体とadapterまで接続する', () => {
    const inventory = buildInventory(createSourceFixture(sample));
    const inline = inventory.nodes.find(
      (node) => node.kind === 'action' && node.source.file.endsWith('page.tsx'),
    );
    const exported = inventory.nodes.find(
      (node) => node.kind === 'action' && node.symbol === 'save',
    );
    const persist = inventory.nodes.find(
      (node) => node.kind === 'function' && node.symbol === 'persist',
    );
    expect(inline).toBeDefined();
    expect(exported).toBeDefined();
    expect(persist).toBeDefined();
    const reachable = new Set([inline?.id]);
    let previousSize = -1;
    while (previousSize !== reachable.size) {
      previousSize = reachable.size;
      for (const edge of inventory.edges) {
        if (reachable.has(edge.from)) reachable.add(edge.to);
      }
    }
    expect(reachable.has(persist?.id)).toBe(true);
    const method = inventory.nodes.find((node) => node.kind === 'api');
    expect(method).toMatchObject({ method: 'GET', url: '/auth/callback' });
    expect(
      inventory.diagnostics.filter((item) => item.severity === 'error'),
    ).toEqual([]);
  });

  it('空行の追加でもIDを保ち、別のsource位置として記録する', () => {
    const original = buildInventory(createSourceFixture(sample));
    const shifted = buildInventory(
      createSourceFixture(
        Object.fromEntries(
          Object.entries(sample).map(([file, source]) => [
            file,
            `\n\n${source}`,
          ]),
        ),
      ),
    );
    expect(shifted.nodes.map((node) => node.id)).toEqual(
      original.nodes.map((node) => node.id),
    );
    expect(serializeInventory(shifted)).not.toEqual(
      serializeInventory(original),
    );
  });

  it('可変propertyとgetterの戻り値を固定呼出先として登録しない', () => {
    const inventory = buildInventory(
      createSourceFixture({
        'src/mutable.ts': `
export const first = () => 1
export const second = () => 2
const object = { run: first, get callback() { return first } }
const alias = object
alias.run = second
export const invoke = () => { object.run(); object.callback() }
`,
      }),
    );
    const caller = inventory.nodes.find(
      (node) => node.kind === 'function' && node.symbol === 'invoke',
    );
    expect(caller).toBeDefined();
    expect(
      inventory.edges.filter(
        (edge) => edge.from === caller?.id && edge.kind === 'calls',
      ),
    ).toEqual([]);
    expect(
      inventory.edges.some(
        (edge) => edge.from === caller?.id && edge.kind === 'unresolved',
      ),
    ).toBe(true);
    expect(
      inventory.diagnostics.filter((item) => item.code === 'UNRESOLVED_CALL'),
    ).toHaveLength(2);
  });

  it('重複IDと存在しないedgeの参照先を拒否する', () => {
    const inventory = buildInventory(createSourceFixture(sample));
    const node = inventory.nodes[0];
    if (!node) throw new Error('fixtureの入口が必要です');
    expect(() =>
      inventorySchema.parse({
        ...inventory,
        nodes: [...inventory.nodes, node],
      }),
    ).toThrow('重複');
    expect(() =>
      inventorySchema.parse({
        ...inventory,
        edges: [
          {
            from: node.id,
            to: 'function:missing',
            kind: 'calls',
            source: node.source,
          },
        ],
      }),
    ).toThrow('参照先');
  });
});
