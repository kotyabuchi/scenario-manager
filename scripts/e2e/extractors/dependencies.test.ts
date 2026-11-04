import { describe, expect, it } from 'vitest';

import { createSourceFixture } from '../fixtures/createSource';
import boundaries from '../fixtures/dependencies/boundaries.json';
import fixture from '../fixtures/dependencies/graph.json';
import { inventorySchema } from '../inventorySchema';
import { createSourceIndex } from '../sourceIndex';
import { extractDependencies } from './dependencies';

const extract = (files: Record<string, string> = fixture) => {
  const context = createSourceFixture(files);
  return {
    context,
    result: extractDependencies(context, createSourceIndex(context)),
  };
};
const hasEdge = (
  edges: ReturnType<typeof extract>['result']['edges'],
  from: string,
  to: string,
  kind: string,
) =>
  edges.some(
    (edge) => edge.from === from && edge.to === to && edge.kind === kind,
  );

describe('extractDependencies', () => {
  it('module・関数・依存先を保持し、全edgeの端点が実在する', () => {
    const { context, result } = extract();
    expect(result.nodes.filter((node) => node.kind === 'module')).toHaveLength(
      context.files.length,
    );
    expect(() =>
      inventorySchema.parse({
        schemaVersion: 1,
        extractorVersion: '1',
        source: context.manifest,
        ...result,
      }),
    ).not.toThrow();
    expect(
      hasEdge(
        result.edges,
        'module:src/entry.ts',
        'function:src/entry.ts#run',
        'contains',
      ),
    ).toBe(true);
    expect(
      hasEdge(
        result.edges,
        'function:src/entry.ts#run',
        'function:src/entry.ts#run/child',
        'contains',
      ),
    ).toBe(true);
  });

  it('value import・re-export・local aliasを解決し、型専用の参照を除く', () => {
    const { result } = extract();
    for (const target of ['mixed', 'impl', 'mixedValue', 'sideEffect'])
      expect(
        hasEdge(
          result.edges,
          'module:src/entry.ts',
          `module:src/${target}.ts`,
          'imports',
        ),
      ).toBe(true);
    expect(
      hasEdge(
        result.edges,
        'module:src/mixed.ts',
        'module:src/impl.ts',
        'exports',
      ),
    ).toBe(true);
    expect(
      hasEdge(
        result.edges,
        'module:src/entry.ts',
        'function:src/entry.ts#local',
        'exports',
      ),
    ).toBe(true);
    expect(result.edges.some((edge) => edge.to === 'module:src/types.ts')).toBe(
      false,
    );
    for (const name of ['first', 'second'])
      expect(
        hasEdge(
          result.edges,
          'function:src/entry.ts#run',
          `function:src/impl.ts#${name}`,
          'calls',
        ),
      ).toBe(true);
    expect(
      hasEdge(
        result.edges,
        'function:src/entry.ts#run/child',
        'function:src/impl.ts#first',
        'calls',
      ),
    ).toBe(true);
  });

  it('SDK宣言からasync wrapper越しのtable/RPCとmethod aliasを識別する', () => {
    const { result } = extract();
    expect(
      result.nodes
        .filter((node) => node.kind === 'table' || node.kind === 'rpc')
        .map((node) => node.id),
    ).toEqual([
      'rpc:alias_rpc',
      'rpc:replace_items',
      'table:public_only',
      'table:users',
    ]);
    expect(
      hasEdge(
        result.edges,
        'function:src/data.ts#fetchData',
        'table:users',
        'uses',
      ),
    ).toBe(true);
    expect(
      hasEdge(
        result.edges,
        'function:src/data.ts#fetchData',
        'rpc:replace_items',
        'uses',
      ),
    ).toBe(true);
    expect(
      hasEdge(
        result.edges,
        'function:src/data.ts#fetchData',
        'function:src/db.ts#createDbClient',
        'calls',
      ),
    ).toBe(true);
  });

  it('Array.fromとlocal同名methodをDB扱いせず、可変propertyは未解決に残す', () => {
    const { result } = extract();
    expect(result.nodes.some((node) => node.id.includes('not_database'))).toBe(
      false,
    );
    expect(
      result.diagnostics
        .filter((item) => item.source?.file === 'src/fake.ts')
        .map((item) => item.code),
    ).toEqual(['UNRESOLVED_CALL', 'UNRESOLVED_CALL']);
    expect(
      result.edges.filter(
        (edge) =>
          edge.from === 'function:src/fake.ts#unrelated' &&
          edge.kind === 'calls',
      ),
    ).toEqual([]);
  });
  it('既知DBの動的targetは診断し、所属moduleへの保守的依存を残す', () => {
    const { result } = extract();
    expect(
      result.diagnostics.filter((item) => item.code === 'UNRESOLVED_DB_TARGET'),
    ).toHaveLength(2);
    expect(
      hasEdge(
        result.edges,
        'function:src/data.ts#fetchData',
        'module:src/data.ts',
        'unresolved',
      ),
    ).toBe(true);
    expect(
      result.nodes.some(
        (node) => node.id === 'table:target' || node.id === 'rpc:target',
      ),
    ).toBe(false);
  });

  it('public以外のschemaをalias・wrapper越しに診断し同名public tableへ統合しない', () => {
    const { result } = extract();
    expect(
      result.diagnostics.filter((item) => item.code === 'UNRESOLVED_DB_SCHEMA'),
    ).toHaveLength(2);
    expect(
      result.nodes.some(
        (node) => node.id === 'table:same' || node.id === 'rpc:other_only',
      ),
    ).toBe(false);
    expect(
      hasEdge(
        result.edges,
        'function:src/schema.ts#schemaAlias',
        'module:src/schema.ts',
        'unresolved',
      ),
    ).toBe(true);
  });

  it('動的local call・外部型のcallback・未解決importを確定扱いしない', () => {
    const { result } = extract();
    const callbacks = result.diagnostics.filter(
      (item) => item.source?.file === 'src/callbacks.ts',
    );
    expect(callbacks).toHaveLength(5);
    expect(callbacks.every((item) => item.code === 'UNRESOLVED_CALL')).toBe(
      true,
    );
    expect(
      result.diagnostics.filter(
        (item) =>
          item.source?.file === 'src/dynamic.ts' &&
          item.code === 'UNRESOLVED_CALL',
      ),
    ).toHaveLength(3);
    expect(
      result.diagnostics.filter(
        (item) =>
          item.source?.file === 'src/dynamic.ts' &&
          item.code === 'UNRESOLVED_IMPORT',
      ),
    ).toHaveLength(2);
    expect(
      result.edges.filter(
        (edge) =>
          edge.from === 'function:src/dynamic.ts#mutable' &&
          edge.kind === 'calls',
      ),
    ).toEqual([]);
  });

  it('repo内の除外generated sourceを外部library扱いせず未解決依存を残す', () => {
    const { result } = extract();
    expect(
      result.diagnostics
        .filter((item) => item.source?.file === 'src/usesGenerated.ts')
        .map((item) => item.code)
        .sort(),
    ).toEqual(['UNRESOLVED_CALL', 'UNRESOLVED_IMPORT']);
    expect(
      hasEdge(
        result.edges,
        'function:src/usesGenerated.ts#useGenerated',
        'module:src/usesGenerated.ts',
        'unresolved',
      ),
    ).toBe(true);
  });

  it('同じsnapshotは入力順と関係なくbyte一致する', () => {
    const first = extract().result;
    const second = extract(
      Object.fromEntries(Object.entries(fixture).reverse()),
    ).result;
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});

describe('依存抽出の実装由来と生成物境界', () => {
  const extractBoundary = () => extract({ ...fixture, ...boundaries });

  it('外部interfaceのmethod/property callbackを同じ未解決として保持する', () => {
    const { result } = extractBoundary();
    expect(
      result.diagnostics
        .filter((item) => item.source?.file === 'src/methodCallbacks.ts')
        .map((item) => item.code),
    ).toEqual(['UNRESOLVED_CALL', 'UNRESOLVED_CALL']);
    expect(
      hasEdge(
        result.edges,
        'function:src/methodCallbacks.ts#invoke',
        'module:src/methodCallbacks.ts',
        'unresolved',
      ),
    ).toBe(true);
  });

  it('factory・constructor・SSR wrapperとoptions aliasの非public/dynamic schemaを診断する', () => {
    const { result } = extractBoundary();
    expect(
      result.diagnostics
        .filter((item) => item.source?.file === 'src/factorySchema.ts')
        .map((item) => item.code),
    ).toEqual([
      'UNRESOLVED_DB_SCHEMA',
      'UNRESOLVED_DB_SCHEMA',
      'UNRESOLVED_DB_SCHEMA',
      'UNRESOLVED_DB_SCHEMA',
      'UNRESOLVED_DB_SCHEMA',
      'UNRESOLVED_DB_SCHEMA',
      'UNRESOLVED_DB_SCHEMA',
    ]);
    expect(
      result.nodes.filter((node) =>
        /(?:factory|constructor|wrapper|dynamic|computed|mutated|wrapper_mutated)_private$/.test(
          node.id,
        ),
      ),
    ).toEqual([]);
    expect(
      hasEdge(
        result.edges,
        'function:src/factorySchema.ts#schemas',
        'table:factory_public',
        'uses',
      ),
    ).toBe(true);
  });

  it('型注釈・as・satisfiesでSDK型を付けたlocal fakeをDB実装と確定しない', () => {
    const { result } = extractBoundary();
    expect(result.nodes.some((node) => node.id.includes('not_database'))).toBe(
      false,
    );
    expect(
      result.diagnostics
        .filter((item) => item.source?.file === 'src/fakeSdk.ts')
        .map((item) => item.code),
    ).toEqual(['UNRESOLVED_CALL', 'UNRESOLVED_CALL', 'UNRESOLVED_CALL']);
  });

  it('local関数のbind/call/applyを標準lib実装として捨てず未解決に残す', () => {
    const { result } = extractBoundary();
    expect(
      result.diagnostics
        .filter((item) => item.source?.file === 'src/bound.ts')
        .map((item) => item.code),
    ).toEqual([
      'UNRESOLVED_CALL',
      'UNRESOLVED_CALL',
      'UNRESOLVED_CALL',
      'UNRESOLVED_CALL',
      'UNRESOLVED_CALL',
      'UNRESOLVED_CALL',
      'UNRESOLVED_CALL',
      'UNRESOLVED_CALL',
    ]);
    expect(
      result.edges.filter(
        (edge) => edge.source.file === 'src/bound.ts' && edge.kind === 'calls',
      ),
    ).toEqual([]);
  });

  it('manifest内のPanda生成moduleとimport/usesを保持し、一般generatedは未解決にする', () => {
    const { context, result } = extractBoundary();
    expect(
      result.diagnostics.filter((item) => item.source?.file === 'src/panda.ts'),
    ).toEqual([]);
    expect(
      hasEdge(
        result.edges,
        'module:src/panda.ts',
        'module:styled-system/css/index.d.ts',
        'imports',
      ),
    ).toBe(true);
    expect(
      hasEdge(
        result.edges,
        'module:src/panda.ts',
        'module:styled-system/css/css.d.ts',
        'uses',
      ),
    ).toBe(true);
    expect(
      result.nodes.find(
        (node) => node.id === 'module:styled-system/css/css.d.ts',
      )?.source,
    ).toEqual({ file: 'styled-system/css/css.d.ts', line: 1, column: 1 });
    expect(
      result.diagnostics
        .filter((item) => item.source?.file === 'src/usesGenerated.ts')
        .map((item) => item.code)
        .sort(),
    ).toEqual(['UNRESOLVED_CALL', 'UNRESOLVED_IMPORT']);
    expect(() =>
      inventorySchema.parse({
        schemaVersion: 1,
        extractorVersion: '1',
        source: context.manifest,
        ...result,
      }),
    ).not.toThrow();
  });

  it('manifestにない同名生成rootをlibrary境界へ昇格しない', () => {
    const context = createSourceFixture({ ...fixture, ...boundaries });
    context.manifest.files = context.manifest.files.filter(
      (file) => !file.path.startsWith('styled-system/'),
    );
    const result = extractDependencies(context, createSourceIndex(context));
    expect(
      result.nodes.some((node) => node.id.startsWith('module:styled-system/')),
    ).toBe(false);
    expect(
      result.diagnostics
        .filter((item) => item.source?.file === 'src/panda.ts')
        .map((item) => item.code),
    ).toContain('UNRESOLVED_IMPORT');
    expect(
      result.diagnostics.filter(
        (item) =>
          item.source?.file === 'src/panda.ts' &&
          item.code === 'UNRESOLVED_CALL',
      ),
    ).toHaveLength(3);
  });
});
