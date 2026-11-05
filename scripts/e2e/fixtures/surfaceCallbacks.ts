import ts from 'typescript';

import { extractActions } from '../extractors/actions';
import { resolveSurfaceCallbacks } from '../extractors/callbacks';
import { createSourceIndex } from '../sourceIndex';
import { createSourceFixture } from './createSource';

import type {
  BoundValue,
  Candidate,
  Frame,
  ReadProp,
} from '../extractors/surfaceTypes';
import type { InventoryNode } from '../inventorySchema';
import type { SurfaceEvent } from '../surfaceSchema';

const HANDLERS = 'src/handlers.tsx';
export const SAVE = 'action:src/actions.ts#save';
export const INVALID = 'action:src/actions.ts#invalid';
export const SETTINGS = 'page:src/app/settings/page.tsx';
const libraries = {
  'lib.d.ts': `/// <reference no-default-lib="true"/>
interface Function { bind(this: Function, value: unknown, ...rest: unknown[]): Function }
interface CallableFunction extends Function {}`,
  'node_modules/react/index.d.ts': `
export declare function useTransition(): [boolean, (callback: () => void) => void];
export declare function useState<T>(value: T): [T, (value: T) => void];
export declare function useOptimistic<T>(value: T): [T, (value: T) => void];
export declare function startTransition(callback: () => void): void;`,
  'node_modules/react-hook-form/index.d.ts': `
export declare function useForm(): {
  handleSubmit(valid: () => void, invalid?: () => void): (event?: unknown) => void
};`,
  'node_modules/next/navigation.d.ts': `
export declare function useRouter(): { push(path: string): void, replace(path: string): void };`,
};

export const createSurfaceCallbackFixture = (
  source: string,
  extra: Record<string, string> = {},
) => {
  const context = createSourceFixture({
    ...libraries,
    [HANDLERS]: source,
    'src/actions.ts': `'use server';
export async function save() {}
export async function invalid() {}`,
    'src/second-actions.ts': `'use server'; export { save as second } from './actions';`,
    'src/app/settings/page.tsx':
      'export default function Page() { return null }',
    ...extra,
  });
  const index = createSourceIndex(context);
  const file = context.files.find(({ path }) => path === HANDLERS)?.sourceFile;
  if (!file) throw new Error('callback fixtureがありません。');
  const find = <T extends ts.Node>(match: (node: ts.Node) => node is T) => {
    let result: T | undefined;
    const visit = (node: ts.Node) => {
      if (match(node)) result = node;
      else if (!result) ts.forEachChild(node, visit);
    };
    visit(file);
    if (!result) throw new Error('callback fixtureの対象がありません。');
    return result;
  };
  const observed = find(
    (node): node is ts.ArrayLiteralExpression =>
      ts.isArrayLiteralExpression(node) &&
      ts.isVariableDeclaration(node.parent) &&
      ts.isIdentifier(node.parent.name) &&
      node.parent.name.text === 'observed',
  );
  const ownerId =
    index.functions.find(({ name }) => name === 'Owner')?.id ??
    `module:${HANDLERS}`;
  const owner: Frame = { ownerId, mountSiteIds: [] };
  const value = (expression: ts.Expression, frame = owner): BoundValue => ({
    kind: 'bound',
    expression,
    frame,
    source: index.location(expression),
  });
  const candidate = (
    position: number,
    options: {
      frame?: Frame;
      event?: SurfaceEvent;
      entryKind?: Candidate['entry']['kind'];
      siteId?: string;
    } = {},
  ): Candidate => {
    const expression = observed.elements[position];
    if (!expression) throw new Error('callback fixtureの式がありません。');
    const frame = options.frame ?? owner;
    return {
      entry: { kind: options.entryKind ?? 'product', id: SETTINGS },
      frame,
      site: {
        id: options.siteId ?? `surface-site:test-${position}`,
        ownerId,
        kind: 'interaction',
        tag: 'button',
        event: options.event ?? 'click',
        source: index.location(expression),
        locator: [`slot-${position}`],
      },
      value: value(expression, frame),
      renderFlow: [],
    };
  };
  const actions = extractActions(context, index);
  const nodes: InventoryNode[] = [
    ...actions.nodes,
    ...index.functions.map(({ id, source }) => ({
      id,
      source,
      kind: 'function' as const,
      slots: [],
    })),
    {
      id: SETTINGS,
      source: index.location(file),
      kind: 'page',
      url: '/settings',
      slots: [],
    },
  ];
  const resolve = (
    candidates: Candidate[],
    readProp: ReadProp = () => undefined,
  ) =>
    resolveSurfaceCallbacks({
      context,
      index,
      candidates,
      readProp,
      nodes,
      edges: actions.edges,
    });
  return { context, find, index, candidate, owner, resolve };
};
