import ts from 'typescript';
import { expect, it } from 'vitest';

import { createSourceFixture } from '../fixtures/createSource';
import { createSourceIndex } from '../sourceIndex';
import { extractActions } from './actions';
import { resolveSurfaceCallbacks } from './callbacks';

import type { InventoryNode } from '../inventorySchema';
import type { BoundValue, Candidate, Frame, ReadProp } from './surfaceTypes';

it('optional element accessで省略したcomputed keyを評価しない', () => {
  const context = createSourceFixture({
    'src/actions.ts': "'use server'; export async function save() {}",
    'src/handlers.tsx': `import { save } from './actions';
function Owner({ run }: { run?: Record<string, () => void> }) {
  const first = () => run?.[save()]();
  const second = () => run?.[save()]?.();
  const supplied = { value: () => {} };
  const observed = [first, second, first];
  return observed;
}`,
  });
  const index = createSourceIndex(context);
  const file = context.files.find(
    ({ path }) => path === 'src/handlers.tsx',
  )?.sourceFile;
  if (!file) throw new Error('fixture sourceがありません。');
  let observed: ts.ArrayLiteralExpression | undefined;
  let runSymbol: ts.Symbol | undefined;
  let supplied: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    if (
      ts.isArrayLiteralExpression(node) &&
      ts.isVariableDeclaration(node.parent) &&
      ts.isIdentifier(node.parent.name) &&
      node.parent.name.text === 'observed'
    )
      observed = node;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'supplied'
    )
      supplied = node.initializer;
    if (
      ts.isBindingElement(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'run'
    )
      runSymbol = context.checker.getSymbolAtLocation(node.name);
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (!observed || !runSymbol || !supplied)
    throw new Error('fixture symbolがありません。');
  const suppliedValue = supplied;
  const elements = observed.elements;
  const actions = extractActions(context, index);
  const nodes: InventoryNode[] = [
    ...actions.nodes,
    ...index.functions.map(({ id, source }) => ({
      id,
      source,
      kind: 'function' as const,
      slots: [],
    })),
  ];
  const frames: Frame[] = [
    { ownerId: 'owner', mountSiteIds: ['absent-a'] },
    { ownerId: 'owner', mountSiteIds: ['absent-b'] },
    { ownerId: 'owner', mountSiteIds: ['supplied'] },
  ];
  const candidates: Candidate[] = frames.map((frame, position) => {
    const expression = elements[position];
    if (!expression) throw new Error('fixture callbackがありません。');
    const value: BoundValue = {
      kind: 'bound',
      expression,
      frame,
      source: index.location(expression),
    };
    return {
      entry: { kind: 'product', id: 'page:src/app/page.tsx' },
      frame,
      site: {
        id: `surface-site:optional-${position}`,
        ownerId: frame.ownerId,
        kind: 'interaction',
        tag: 'button',
        event: 'click',
        source: index.location(expression),
        locator: [`optional-${position}`],
      },
      value,
      renderFlow: [],
    };
  });
  const readProp: ReadProp = (frame, expression) => {
    if (context.checker.getSymbolAtLocation(expression) !== runSymbol)
      return undefined;
    return frame.mountSiteIds[0] === 'supplied'
      ? {
          kind: 'bound',
          expression: suppliedValue,
          frame,
          source: index.location(suppliedValue),
        }
      : { kind: 'absent' };
  };
  const result = resolveSurfaceCallbacks({
    context,
    index,
    candidates,
    readProp,
    nodes,
    edges: actions.edges,
  });
  expect(result.bindings[2]?.branches[0]?.resolution).toMatchObject({
    targetIds: ['action:src/actions.ts#save'],
  });
  expect(
    result.bindings.slice(0, 2).map(({ branches }) => branches[0]?.resolution),
  ).toEqual([{ kind: 'optional-absent' }, { kind: 'optional-absent' }]);
});
