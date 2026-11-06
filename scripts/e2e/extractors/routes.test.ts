import { describe, expect, it } from 'vitest';

import cases from '../fixtures/routes/cases.json';
import { inventoryNodeSchema } from '../inventorySchema';
import { extractRoutes } from './routes';

describe('extractRoutes', () => {
  it.each(cases.valid)('$fileをURL・slot・navigationへ分離する', (fixture) => {
    const result = extractRoutes([fixture.file]);
    expect(result.diagnostics).toEqual([]);
    expect(result.nodes).toEqual([
      {
        id: `${fixture.kind}:${fixture.file}`,
        kind: fixture.kind,
        source: { file: fixture.file, line: 1, column: 1 },
        url: fixture.url,
        slots: fixture.slots,
        navigation: fixture.navigation,
      },
    ]);
    expect(inventoryNodeSchema.safeParse(result.nodes[0]).success).toBe(true);
  });

  it.each(
    cases.invalid,
  )('$fileの解釈不能を診断しURLを確定しない', (fixture) => {
    const result = extractRoutes([fixture.file]);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]).not.toHaveProperty('url');
    expect(result.diagnostics).toContainEqual({
      code: fixture.code,
      message: expect.any(String),
      severity: 'error',
      source: { file: fixture.file, line: 1, column: 1 },
    });
  });

  it('private folder・metadata・通常モジュールを入口にしない', () => {
    expect(extractRoutes(cases.ignored)).toEqual({
      nodes: [],
      diagnostics: [],
    });
  });

  it('dotを含むgroupとcatch-allの後のgroupはURL segmentとして数えない', () => {
    const { nodes, diagnostics } = extractRoutes([
      'src/app/(.archive)/docs/[...slug]/(group)/page.tsx',
    ]);
    expect(diagnostics).toEqual([]);
    expect(nodes[0]?.url).toBe('/docs/[...slug]');
  });

  it('同じURLのstandaloneとinterceptedを別IDで保持する', () => {
    const files = [
      'src/app/(main)/scenarios/[id]/page.tsx',
      'src/app/(main)/scenarios/@detail/(.)[id]/page.tsx',
    ];
    const { nodes } = extractRoutes(files);
    expect(nodes).toHaveLength(2);
    expect(new Set(nodes.map(({ id }) => id)).size).toBe(2);
    expect(nodes.map(({ url }) => url)).toEqual([
      '/scenarios/[id]',
      '/scenarios/[id]',
    ]);
    expect(nodes.map(({ navigation }) => navigation).sort()).toEqual([
      'direct',
      'intercepted',
    ]);
  });

  it('入力順序・重複に依存せずbyte一致し、入力一覧を変更しない', () => {
    const files = [...cases.valid, ...cases.invalid].map(({ file }) => file);
    const original = [...files];
    const first = extractRoutes(files);
    const second = extractRoutes([...files, ...files].reverse());
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(files).toEqual(original);
    expect(
      first.nodes.map(
        ({ id, kind, source }) => id === `${kind}:${source.file}`,
      ),
    ).not.toContain(false);
  });
});
