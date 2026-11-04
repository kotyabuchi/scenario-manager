import { describe, expect, it } from 'vitest';

import fixture from '../fixtures/actions/project.json';
import { createSourceFixture } from '../fixtures/createSource';
import { createSourceIndex } from '../sourceIndex';
import { extractActions } from './actions';

const extract = (files: Record<string, string>) => {
  const context = createSourceFixture(files);
  return extractActions(context, createSourceIndex(context));
};

describe('extractActions', () => {
  it('共通blockのexport名と実体をalias・再export・export *越しに分離する', () => {
    const result = extract(fixture);
    const prefix = 'action:src/components/blocks/Shared/actions.ts#';
    expect(
      result.nodes
        .filter((node) => node.id.startsWith(prefix))
        .map((node) => node.symbol)
        .sort(),
    ).toEqual([
      'arrow',
      'both',
      'declared',
      'forwarded',
      'renamed',
      'starAction',
    ]);
    expect(result.edges).toContainEqual(
      expect.objectContaining({
        from: `${prefix}renamed`,
        to: 'function:src/lib/implementation.ts#base',
        kind: 'exports',
      }),
    );
    expect(result.edges).toContainEqual(
      expect.objectContaining({
        from: `${prefix}forwarded`,
        to: 'function:src/lib/implementation.ts#base',
      }),
    );
    expect(result.diagnostics).toEqual([]);
  });

  it('関数本文のprologueだけを認識し、親関数や同名の非Actionを登録しない', () => {
    const { nodes } = extract(fixture);
    expect(
      nodes
        .filter((node) => node.source.file === 'src/app/inline/page.tsx')
        .map((node) => node.id)
        .sort(),
    ).toEqual([
      'action:src/app/inline/page.tsx#Page/arrow',
      'action:src/app/inline/page.tsx#Page/confirm',
    ]);
    expect(
      nodes.some((node) => node.source.file === 'src/lib/nonDirective.ts'),
    ).toBe(false);
    expect(nodes.filter((node) => node.symbol === 'both')).toHaveLength(1);
  });

  it('exportされた非関数と非async関数をerrorとして報告する', () => {
    const result = extract({
      'src/actions.ts':
        "'use server'; export const value = 1; export function sync() {}",
    });
    expect(result.nodes.map((node) => node.symbol)).toEqual(['sync']);
    expect(result.diagnostics.map((item) => item.code).sort()).toEqual([
      'ACTION_NON_FUNCTION_EXPORT',
      'ACTION_NOT_ASYNC',
    ]);
  });

  it('import typeとtype-only barrelを経由した公開名を登録しない', () => {
    const result = extract({
      'src/lib.ts': 'export async function save() {}',
      'src/types.ts': "export type { save } from './lib';",
      'src/actions.ts':
        "'use server'; import type { save } from './lib'; export { save }; export { save as forwarded } from './types';",
    });
    expect(result).toEqual({ nodes: [], edges: [], diagnostics: [] });
  });

  it('defaultの匿名関数は公開名をIDにし、classをActionと誤判定しない', () => {
    const result = extract({
      'src/actions.ts':
        "'use server'; export default async () => {}; export class Value { constructor() {} }",
    });
    expect(result.nodes.map((node) => node.id)).toEqual([
      'action:src/actions.ts#default',
    ]);
    expect(result.diagnostics.map((item) => item.code)).toEqual([
      'ACTION_NON_FUNCTION_EXPORT',
    ]);
  });

  it('解決できないexportとexport *を黙って捨てない', () => {
    const result = extract({
      'src/actions.ts':
        "'use server'; export { missing } from './absent'; export * from './unknown';",
    });
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'ACTION_UNRESOLVED_EXPORT',
        'EXPORT_UNRESOLVED_STAR',
      ]),
    );
    expect(result.nodes.map((node) => node.symbol)).toContain('missing');
  });

  it('匿名inlineを診断し、明示注釈がある入口には安定IDを与える', () => {
    const result = extract({
      'src/page.tsx':
        "const first = <form action={async () => { 'use server'; }} />;\nconst second = <form action={/** @e2e-action submit-form */ async () => { 'use server'; }} />;",
    });
    expect(result.diagnostics.map((item) => item.code)).toEqual([
      'ACTION_ANONYMOUS',
    ]);
    expect(result.nodes.map((node) => node.id)).toEqual([
      'action:src/page.tsx#annotation:submit-form',
    ]);
    expect(result.edges).toContainEqual(
      expect.objectContaining({
        to: 'function:src/page.tsx#annotation:submit-form',
        kind: 'exports',
      }),
    );
  });

  it('外部packageのexport *内部を辿らず公開元で未解決を報告する', () => {
    const result = extract({
      'src/actions.ts':
        "'use server'; export * from 'external'; export { save } from 'external';",
      'node_modules/external/index.d.ts':
        "export * from './missing'; export declare function save(): Promise<void>;",
    });
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'EXPORT_UNRESOLVED_STAR',
        source: expect.objectContaining({ file: 'src/actions.ts' }),
      }),
    );
  });

  it('匿名親の中のinline名を一意と推測せず、重複注釈もerrorにする', () => {
    const result = extract({
      'src/page.tsx':
        "register(async () => { async function save() { 'use server'; } });\nconst first = <form action={/** @e2e-action same */ async () => { 'use server'; }} />;\nconst second = <form action={/** @e2e-action same */ async () => { 'use server'; }} />;",
    });
    expect(result.nodes).toEqual([]);
    expect(result.diagnostics.map((item) => item.code).sort()).toEqual([
      'ACTION_ANONYMOUS',
      'ACTION_DUPLICATE_ANNOTATION',
      'ACTION_DUPLICATE_ANNOTATION',
    ]);
  });

  it('行の追加でIDを変えずsource位置だけを更新する', () => {
    const code =
      "export async function Parent() { async function save() { 'use server'; } }";
    const before = extract({ 'src/page.tsx': code });
    const after = extract({ 'src/page.tsx': `\n\n${code}` });
    expect(after.nodes[0]?.id).toBe(before.nodes[0]?.id);
    expect(after.nodes[0]?.source.line).toBe(3);
  });

  it.each([
    'foo/bar',
    'foo:bar',
    '',
    'one @e2e-action two',
  ])('不正注釈の元tokenと許容形式・位置を示し、切り詰めたActionを作らない: %s', (token) => {
    const result = extract({
      'src/page.tsx': `const form = <form action={/** @e2e-action ${token} */ async () => { 'use server'; }} />;`,
    });
    expect(result.nodes).toEqual([]);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'ACTION_INVALID_ANNOTATION',
      severity: 'error',
      source: { file: 'src/page.tsx', line: 1 },
    });
    expect(result.diagnostics[0]?.message).toContain(
      '[A-Za-z0-9][A-Za-z0-9_.-]*',
    );
    expect(result.diagnostics[0]?.message).toContain(
      token.includes('@e2e-action') ? '"one", "two"' : JSON.stringify(token),
    );
  });

  it('functionと所有宣言の複数注釈やfile Actionの不正注釈も診断する', () => {
    const result = extract({
      'src/page.ts':
        '/** @e2e-action owner */ const save = /** @e2e-action own */ async () => { "use server"; };',
      'src/actions.ts':
        "'use server'; /** @e2e-action bad/id */ export const save = async () => {};",
    });
    expect(result.nodes).toEqual([]);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'ACTION_INVALID_ANNOTATION',
      'ACTION_INVALID_ANNOTATION',
    ]);
  });
});
