import { describe, expect, it } from 'vitest';

import fixture from '../fixtures/apis/project.json';
import { createSourceFixture } from '../fixtures/createSource';
import { createSourceIndex } from '../sourceIndex';
import { extractApis } from './apis';

const extract = (files: Record<string, string>) => {
  const context = createSourceFixture(files);
  return extractApis(context, createSourceIndex(context));
};

describe('extractApis', () => {
  it('Route Handlerの公開HTTP名だけをalias・再export込みで抽出する', () => {
    const { nodes, edges, diagnostics } = extract(fixture);
    expect(nodes.map((node) => [node.id, node.url, node.method])).toEqual([
      [
        'api:src/app/(auth)/auth/callback/route.ts#GET',
        '/auth/callback',
        'GET',
      ],
      [
        'api:src/app/api/examples/[id]/route.ts#POST',
        '/api/examples/[id]',
        'POST',
      ],
      [
        'api:src/app/api/examples/[id]/route.ts#GET',
        '/api/examples/[id]',
        'GET',
      ],
      [
        'api:src/app/api/examples/[id]/route.ts#PATCH',
        '/api/examples/[id]',
        'PATCH',
      ],
    ]);
    expect(edges).toContainEqual(
      expect.objectContaining({
        from: 'api:src/app/(auth)/auth/callback/route.ts#GET',
        to: 'function:src/lib/handlers.ts#read',
        kind: 'exports',
      }),
    );
    expect(edges).toContainEqual(
      expect.objectContaining({
        from: 'route:src/app/(auth)/auth/callback/route.ts',
        to: 'api:src/app/(auth)/auth/callback/route.ts#GET',
        kind: 'exports',
      }),
    );
    expect(diagnostics).toEqual([]);
  });

  it('全7methodを保持し、非関数HTTP exportも診断付き入口として残す', () => {
    const { nodes, diagnostics } = extract({
      'src/app/api/all/route.ts':
        'export const GET = 1; export function POST() {} export function PUT() {} export function PATCH() {} export function DELETE() {} export function HEAD() {} export function OPTIONS() {}',
    });
    expect(nodes.map((node) => node.method).sort()).toEqual([
      'DELETE',
      'GET',
      'HEAD',
      'OPTIONS',
      'PATCH',
      'POST',
      'PUT',
    ]);
    expect(diagnostics.map((item) => item.code)).toEqual([
      'API_NON_FUNCTION_EXPORT',
    ]);
  });

  it('constructorをHTTP関数の実体と誤認しない', () => {
    const result = extract({
      'src/app/api/class/route.ts': 'export class GET { constructor() {} }',
    });
    expect(result.edges).toHaveLength(1);
    expect(result.diagnostics.map((item) => item.code)).toEqual([
      'API_NON_FUNCTION_EXPORT',
    ]);
  });

  it('未知の関数実体とexport *を診断し、不在functionへ辺を張らない', () => {
    const result = extract({
      'src/app/api/unknown/route.ts':
        "export { missing as GET } from './absent'; export * from './unknown';",
    });
    expect(result.nodes.map((node) => node.method)).toEqual(['GET']);
    expect(result.edges).toHaveLength(1);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'API_UNRESOLVED_EXPORT',
        'EXPORT_UNRESOLVED_STAR',
      ]),
    );
  });
});
