import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { createSourceFixture } from './fixtures/createSource';
import { buildInventory } from './inventory';
import {
  createSourceIndex,
  getActionAnnotation,
  parseActionAnnotation,
} from './sourceIndex';

const collect = <T extends ts.Node>(
  root: ts.Node,
  guard: (node: ts.Node) => node is T,
) => {
  const result: T[] = [];
  const visit = (node: ts.Node) => {
    if (guard(node)) result.push(node);
    ts.forEachChild(node, visit);
  };
  visit(root);
  return result;
};

const declarations = `
export function first() { function save() {} return save; }
export function second() { const save = () => {}; return save; }
export const handler = function internal() {};
export const object = { run() {}, 'slash/name': () => {}, nested: { done: () => {} } };
export class Service {
  constructor() {}
  run() {} static run() {}
  get value() { return 1; } set value(next: number) {}
  field = () => {}; static field = () => {};
}
`;

describe('createSourceIndex', () => {
  it('lexical親・property・class memberから名前を作り、行番号をIDへ使わない', () => {
    const index = createSourceIndex(
      createSourceFixture({ 'src/Case.ts': declarations }),
    );
    const ids = index.functions.map((record) => record.id);
    expect(ids).toEqual(
      [
        'Service/constructor',
        'Service/field',
        'Service/get%3Avalue',
        'Service/run',
        'Service/set%3Avalue',
        'Service/static%3Afield',
        'Service/static%3Arun',
        'first',
        'first/save',
        'handler',
        'object/nested/done',
        'object/run',
        'object/slash%2Fname',
        'second',
        'second/save',
      ].map((name) => `function:src/Case.ts#${name}`),
    );
    const shifted = createSourceIndex(
      createSourceFixture({ 'src/Case.ts': `\n\n${declarations}` }),
    );
    expect(shifted.functions.map((record) => record.id)).toEqual(ids);
    expect(
      index.functions.find((record) => record.id.endsWith('#first/save'))?.name,
    ).toBe('save');
    expect(
      index.functions.every(
        (record) => index.getFunction(record.node) === record,
      ),
    ).toBe(true);
  });

  it.each([
    'export default function() {}',
    'export default () => {}',
  ])('匿名default exportにはdefault名を与える: %s', (code) => {
    const index = createSourceIndex(
      createSourceFixture({ 'src/default.ts': code }),
    );
    expect(index.functions.map((record) => record.id)).toEqual([
      'function:src/default.ts#default',
    ]);
  });

  it('import・再export・namespace・const別名を解決し、可変object propertyは未解決にする', () => {
    const context = createSourceFixture({
      'src/core.ts': 'export function save() {}',
      'src/barrel.ts': "export { save as forwarded } from './core';",
      'src/entry.ts': `
        import { forwarded as imported } from '@/barrel';
        import * as core from './core';
        const alias = imported; const alias2 = (alias);
        const object = { run: alias, alias2 };
        imported(); alias2(); core.save(); object.run(); object.alias2();
      `,
    });
    const index = createSourceIndex(context);
    const entry = context.files.find(
      (file) => file.path === 'src/entry.ts',
    )?.sourceFile;
    if (!entry) throw new Error('fixtureの入口がありません。');
    const calls = collect(entry, ts.isCallExpression);
    expect(calls).toHaveLength(5);
    for (const call of calls) {
      // constで固定されるbindingと違い、objectのpropertyは後から変更できる。
      expect(index.resolveFunction(call.expression)?.id).toBe(
        call.expression.getText().startsWith('object.')
          ? undefined
          : 'function:src/core.ts#save',
      );
    }
    const imported = collect(entry, ts.isImportSpecifier)[0];
    const symbol =
      imported && context.checker.getSymbolAtLocation(imported.name);
    if (!symbol) throw new Error('fixtureのimport symbolがありません。');
    expect(index.resolveSymbol(symbol)?.id).toBe('function:src/core.ts#save');
  });

  it.each([
    'const object = { run: first }; object.run = second; function invoke() { object.run(); }',
    'const object = { run: first }; const alias = object; alias.run = second; function invoke() { object.run(); }',
    'const object = { run() {} }; function invoke() { object.run(); }',
    'const object = { first }; object.first = second; function invoke() { object.first(); }',
    'class Service { run = first; } function invoke(service: Service) { service.run(); }',
    'const object = { get run() { return first; } }; function invoke() { object.run(); }',
  ])('可変memberやgetter戻り値を誤ったcallsへ確定しない: %s', (code) => {
    const inventory = buildInventory(
      createSourceFixture({
        'src/mutable.ts': `function first() {} function second() {} ${code}`,
      }),
    );
    const from = 'function:src/mutable.ts#invoke';
    expect(
      inventory.edges.filter(
        (edge) => edge.from === from && edge.kind === 'calls',
      ),
    ).toEqual([]);
    expect(inventory.edges).toContainEqual(
      expect.objectContaining({
        from,
        to: 'module:src/mutable.ts',
        kind: 'unresolved',
      }),
    );
    expect(inventory.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'UNRESOLVED_CALL',
    ]);
    expect(
      inventory.nodes.some(
        (node) => node.id === 'function:src/mutable.ts#first',
      ),
    ).toBe(true);
  });

  it('可変property由来の公開Action/API aliasを確定せず入口の未解決診断を残す', () => {
    const inventory = buildInventory(
      createSourceFixture({
        'src/object.ts': 'export const object = { run: async () => {} };',
        'src/actions.ts':
          "'use server'; import { object } from './object'; export const save = object.run;",
        'src/app/api/example/route.ts':
          "import { object } from '@/object'; export const GET = object.run;",
      }),
    );
    expect(
      inventory.diagnostics.map((diagnostic) => diagnostic.code).sort(),
    ).toEqual(['ACTION_UNRESOLVED_EXPORT', 'API_UNRESOLVED_EXPORT']);
    for (const entry of inventory.nodes.filter(
      (node) => node.kind === 'action' || node.kind === 'api',
    )) {
      expect(
        inventory.edges.filter(
          (edge) => edge.from === entry.id && edge.kind === 'exports',
        ),
      ).toEqual([]);
    }
  });

  it('循環するconst別名・可変binding・動的な関数値を推測しない', () => {
    const context = createSourceFixture({
      'src/cycles.ts': `
      function save() {} function factory() { return save; }
      const one = two; const two = one; let mutable = save;
      one(); mutable(); factory()();
    `,
    });
    const index = createSourceIndex(context);
    const file = context.files[0]?.sourceFile;
    if (!file) throw new Error('fixtureの入口がありません。');
    const calls = collect(file, ts.isCallExpression);
    for (const call of calls.filter(
      (call) => call.expression.getText() !== 'factory',
    )) {
      expect(index.resolveFunction(call.expression)).toBeUndefined();
    }
  });

  it('匿名callback境界を外側関数へ誤帰属せず、衝突する名前を未解決にする', () => {
    const context = createSourceFixture({
      'src/anonymous.ts': `
      function outer() {
        consume(() => { function hidden() {} invoke(); });
        if (flag) { const duplicate = () => {}; } else { const duplicate = () => {}; }
      }
    `,
    });
    const index = createSourceIndex(context);
    expect(index.functions.map((record) => record.name)).toEqual(['outer']);
    const file = context.files[0]?.sourceFile;
    if (!file) throw new Error('fixtureの入口がありません。');
    const call = collect(file, ts.isCallExpression).find(
      (node) => node.expression.getText() === 'invoke',
    );
    if (!call) throw new Error('fixtureの呼出がありません。');
    expect(index.enclosingFunction(call)).toBeUndefined();
    expect(
      collect(file, ts.isArrowFunction).every(
        (node) => index.getFunction(node) === undefined,
      ),
    ).toBe(true);
  });

  it('型解決で読まれた外部・生成物・testの関数を母集団へ加えない', () => {
    const context = createSourceFixture({
      'src/entry.ts':
        "import { generated } from './db/types'; import { tested } from './helper.test'; generated(); tested();",
      'src/db/types.ts': 'export function generated() {}',
      'src/helper.test.ts': 'export function tested() {}',
      'node_modules/example/index.d.ts':
        'export declare function external(): void;',
    });
    const index = createSourceIndex(context);
    expect(index.functions).toEqual([]);
    const generated = context.program.getSourceFile(
      '/source-fixture/src/db/types.ts',
    );
    if (!generated) throw new Error('fixtureの生成物がありません。');
    expect(index.filePath(generated)).toBeUndefined();
    expect(index.moduleId(generated)).toBeUndefined();
    expect(() => index.location(generated)).toThrow('抽出対象外');
  });

  it('SourceFileのobject identityからGit pathと1始まりの位置を返す', () => {
    const context = createSourceFixture({
      'src/Case.ts': '\nexport function save() {}',
    });
    const index = createSourceIndex(context);
    const record = index.functions[0];
    if (!record) throw new Error('fixtureの関数がありません。');
    expect(index.filePath(record.node)).toBe('src/Case.ts');
    expect(index.moduleId(record.node)).toBe('module:src/Case.ts');
    expect(index.location(record.node)).toEqual({
      file: 'src/Case.ts',
      line: 2,
      column: 1,
    });
    const unrelated = ts.createSourceFile(
      record.node.getSourceFile().fileName,
      '',
      ts.ScriptTarget.Latest,
    );
    expect(index.filePath(unrelated)).toBeUndefined();
  });

  it('匿名JSX・匿名親の内側・所有宣言の注釈からfile内固定IDを作る', () => {
    const context = createSourceFixture({
      'src/annotated.tsx': `
      function Page() { return <form action={/** @e2e-action submit-form */ async () => { 'use server'; save(); }} />; }
      consume(() => { consume(/** @e2e-action nested */ async () => { 'use server'; save(); }); });
      /** @e2e-action owned-variable */ const named = async () => { 'use server'; };
      const object = { /** @e2e-action owned-property */ run: async () => { 'use server'; } };
    `,
    });
    const index = createSourceIndex(context);
    for (const annotation of [
      'submit-form',
      'nested',
      'owned-variable',
      'owned-property',
    ]) {
      const record = index.functions.find(
        (record) =>
          record.id === `function:src/annotated.tsx#annotation:${annotation}`,
      );
      expect(record?.name).toBe(`annotation:${annotation}`);
      if (!record) throw new Error('注釈の関数がありません。');
      expect(getActionAnnotation(record.node)).toBe(annotation);
      expect(index.enclosingFunction(record.node.body)).toBe(record);
    }
  });

  it('重複annotationを索引化せず、呼出側が原因を診断できる注釈情報を残す', () => {
    const context = createSourceFixture({
      'src/duplicate.ts': `
      consume(/** @e2e-action same */ async () => { 'use server'; });
      consume(/** @e2e-action same */ async () => { 'use server'; });
    `,
    });
    const index = createSourceIndex(context);
    expect(index.functions).toEqual([]);
    const file = context.files[0]?.sourceFile;
    if (!file) throw new Error('fixtureがありません。');
    for (const node of collect(file, ts.isArrowFunction)) {
      expect(index.getFunction(node)).toBeUndefined();
      expect(getActionAnnotation(node)).toBe('same');
    }
  });

  it.each([
    'end-',
    'end.',
  ])('注釈トークンの合法な末尾を完全保持する: %s', (token) => {
    const context = createSourceFixture({
      'src/annotation.ts': `consume(/** @e2e-action ${token} */ async () => {});`,
    });
    const index = createSourceIndex(context);
    expect(index.functions.map((record) => record.id)).toEqual([
      `function:src/annotation.ts#annotation:${token}`,
    ]);
  });

  it.each([
    'foo/bar',
    'foo:bar',
    '',
    'one @e2e-action two',
  ])('不正または複数の注釈を切り詰めず無効と判定する: %s', (token) => {
    const context = createSourceFixture({
      'src/annotation.ts': `consume(/** @e2e-action ${token} */ async () => {});`,
    });
    const file = context.files[0]?.sourceFile;
    const node = file && collect(file, ts.isArrowFunction)[0];
    if (!node) throw new Error('fixtureの関数がありません。');
    expect(getActionAnnotation(node)).toBeUndefined();
    expect(parseActionAnnotation(node)).toEqual({
      valid: false,
      tokens: token.includes('@e2e-action') ? ['one', 'two'] : [token],
    });
    expect(createSourceIndex(context).functions).toEqual([]);
  });
});
