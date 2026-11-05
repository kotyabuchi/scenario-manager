import { isNil } from 'ramda';
import ts from 'typescript';

import { unwrapExpression } from './dependencyProvenance';
import { createSurfaceAdapters, functionReturns } from './surfaceAdapters';
import { jsxAttributeName, logicalRenderOperators } from './surfaceLocator';
import {
  createSurfaceProps,
  suppliedProps,
  suppliedValue,
} from './surfaceProps';
import { createSurfaceSites } from './surfaceSites';

import type { FunctionNode } from '../sourceIndex';
import type {
  SurfaceEndpoint,
  SurfaceEntry,
  SurfaceFlowStep,
  SurfaceSite,
} from '../surfaceSchema';
import type { Opening } from './surfaceAdapters';
import type { BoundExpression, SuppliedProps } from './surfaceProps';
import type {
  Candidate,
  Frame,
  SurfaceExtraction,
  SurfaceExtractionInput,
} from './surfaceTypes';

const MAX_RENDER_DEPTH = 40;
const MAX_RENDER_VISITS = 8_000;
type Visit = {
  entry: SurfaceEntry;
  frame: Frame;
  flow: readonly SurfaceFlowStep[];
  components: ReadonlySet<FunctionNode>;
};

const siteEndpoint = (site: SurfaceSite): SurfaceEndpoint => ({
  kind: 'site',
  siteId: site.id,
});

const emptyRender = (node: ts.Expression) =>
  ts.isStringLiteralLike(node) ||
  ts.isNumericLiteral(node) ||
  node.kind === ts.SyntaxKind.FalseKeyword ||
  node.kind === ts.SyntaxKind.TrueKeyword ||
  node.kind === ts.SyntaxKind.NullKeyword;

/** ASTと供給側のframeを分け、描画が到達した操作だけをcallback解決へ渡す。 */
export const extractSurfaces = ({
  context,
  index,
  roots,
}: SurfaceExtractionInput): SurfaceExtraction => {
  const props = createSurfaceProps(context.checker, index);
  const adapters = createSurfaceAdapters(context, index);
  const candidates = new Map<string, Candidate>();
  const component = (opening: Opening) => {
    if (ts.isJsxNamespacedName(opening.tagName)) return undefined;
    const target = index.resolveFunction(opening.tagName);
    return !isNil(target) && !ts.isConstructorDeclaration(target.node)
      ? target
      : undefined;
  };
  const tagId = (opening: Opening) =>
    adapters.tag(opening)?.id ??
    component(opening)?.id ??
    `unknown:${opening.tagName.getText()}`;
  const { tagLocator, registerSite, diagnose, finish } = createSurfaceSites(
    index,
    tagId,
  );

  const append = (
    visit: Visit,
    site: SurfaceSite,
    kind: 'render' | 'pass-prop',
  ): SurfaceFlowStep[] => [
    ...visit.flow,
    {
      kind,
      source: site.source,
      from: visit.flow.at(-1)?.to ?? { kind: 'node', nodeId: visit.entry.id },
      to: siteEndpoint(site),
    },
  ];
  const mount = (
    visit: Visit,
    site: SurfaceSite,
    kind: 'render' | 'pass-prop',
  ) => ({
    ...visit,
    frame: props.withMounts(visit.frame, [
      ...visit.frame.mountSiteIds,
      site.id,
    ]),
    flow: append(visit, site, kind),
  });

  const constValue = (expression: ts.Expression) => {
    if (!ts.isIdentifier(expression)) return undefined;
    const declaration =
      context.checker.getSymbolAtLocation(expression)?.valueDeclaration;
    if (
      isNil(declaration) ||
      !ts.isVariableDeclaration(declaration) ||
      !ts.isVariableDeclarationList(declaration.parent) ||
      !(declaration.parent.flags & ts.NodeFlags.Const) ||
      isNil(index.filePath(declaration))
    )
      return undefined;
    return declaration.initializer;
  };

  const renderable = new WeakMap<ts.Expression, boolean>();
  const mayRender = (expression: ts.Expression) => {
    const cached = renderable.get(expression);
    if (!isNil(cached)) return cached;
    const type = context.checker.getTypeAtLocation(expression);
    const seen = new Set<ts.Type>();
    const includesElement = (part: ts.Type): boolean => {
      if (seen.has(part)) return false;
      seen.add(part);
      if (part.isUnionOrIntersection()) return part.types.some(includesElement);
      if (
        context.checker.isArrayType(part) ||
        context.checker.isTupleType(part)
      ) {
        const element = context.checker.getIndexTypeOfType(
          part,
          ts.IndexKind.Number,
        );
        return !isNil(element) && includesElement(element);
      }
      const awaited = context.checker.getAwaitedType(part);
      if (!isNil(awaited) && awaited !== part) return includesElement(awaited);
      return (
        (part.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0 ||
        ['ReactNode', 'ReactElement', 'ReactPortal', 'Element'].includes(
          part.aliasSymbol?.name ?? part.getSymbol()?.name ?? '',
        ) ||
        (!isNil(part.getProperty('props')) &&
          !isNil(part.getProperty('type')) &&
          !isNil(part.getProperty('key')))
      );
    };
    const result = includesElement(type);
    renderable.set(expression, result);
    return result;
  };

  let visits = 0;
  let isTruncated = false;
  const inspect = (
    input: ts.Expression,
    state: Visit,
    active: ReadonlySet<ts.Expression>,
  ) => {
    if (isTruncated) return;
    const node = unwrapExpression(input);
    if (++visits > MAX_RENDER_VISITS || active.size > MAX_RENDER_DEPTH) {
      isTruncated = true;
      diagnose(
        state,
        node,
        'SURFACE_RENDER_LIMIT',
        '描画候補の探索上限に達しました。',
      );
      return;
    }
    if (active.has(node)) {
      diagnose(
        state,
        node,
        'SURFACE_RENDER_CYCLE',
        '描画値の参照が循環しています。',
      );
      return;
    }
    const seen = new Set([...active, node]);
    if (emptyRender(node)) return;
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      inspectElement(node, state, seen);
      return;
    }
    if (ts.isJsxFragment(node)) {
      inspectChildren(node.children, state, seen);
      return;
    }
    if (ts.isConditionalExpression(node)) {
      inspect(node.whenTrue, state, seen);
      inspect(node.whenFalse, state, seen);
      return;
    }
    if (
      ts.isBinaryExpression(node) &&
      logicalRenderOperators.has(node.operatorToken.kind)
    ) {
      if (node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken)
        inspect(node.left, state, seen);
      inspect(node.right, state, seen);
      return;
    }
    if (ts.isArrayLiteralExpression(node)) {
      for (const element of node.elements)
        inspect(
          ts.isSpreadElement(element) ? element.expression : element,
          state,
          seen,
        );
      return;
    }
    if (ts.isCallExpression(node)) {
      const child = adapters.portalChild(node);
      if (!isNil(child)) {
        inspect(child, state, seen);
        return;
      }
    }
    const childValues = props.readChildren(state.frame, node);
    const value = props.readProp(state.frame, node);
    if (!isNil(childValues) || value?.kind === 'bound') {
      const name = props.propName(state.frame, node) ?? 'unknown';
      const site = registerSite(state, node, `slot:${name}`, { kind: 'mount' });
      const child = mount(state, site, 'pass-prop');
      for (const bound of childValues ??
        (value?.kind === 'bound' ? [value] : []))
        inspectBound(bound, child, seen);
      return;
    }
    if (value?.kind === 'absent') return;
    const initialized = constValue(node);
    if (!isNil(initialized)) {
      if (mayRender(initialized)) {
        const site = registerSite(state, node, `value:${node.getText()}`, {
          kind: 'mount',
        });
        inspect(initialized, mount(state, site, 'render'), seen);
      } else inspect(initialized, state, seen);
      return;
    }
    if (value?.kind === 'unknown' || mayRender(input))
      diagnose(
        state,
        value?.kind === 'unknown' && ts.isJsxSpreadAttribute(value.node)
          ? value.node
          : node,
        'SURFACE_UNRESOLVED_RENDER_VALUE',
        '描画値を静的に解決できません。',
      );
  };

  const inspectBound = (
    value: BoundExpression,
    state: Visit,
    active: ReadonlySet<ts.Expression>,
  ) =>
    inspect(
      value.expression,
      {
        ...state,
        frame: props.withMounts(value.frame, state.frame.mountSiteIds),
      },
      active,
    );

  const inspectChildren = (
    children: readonly ts.JsxChild[],
    state: Visit,
    active: ReadonlySet<ts.Expression>,
  ) => {
    for (const child of children) {
      if (ts.isJsxText(child)) continue;
      const expression = ts.isJsxExpression(child) ? child.expression : child;
      if (!isNil(expression)) inspect(expression, state, active);
    }
  };

  const inspectElement = (
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    state: Visit,
    active: ReadonlySet<ts.Expression>,
  ) => {
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    const children = ts.isJsxElement(node) ? node.children : [];
    const tag = adapters.tag(opening);
    const supply = suppliedProps(opening, children, state.frame, index);
    if (!isNil(tag)) {
      const asChild = suppliedValue(supply, 'asChild');
      if (
        'isButton' in tag &&
        asChild.kind !== 'absent' &&
        !(
          asChild.kind === 'bound' &&
          asChild.expression.kind === ts.SyntaxKind.FalseKeyword
        )
      ) {
        diagnose(
          state,
          node,
          'SURFACE_UNRESOLVED_BUTTON_SLOT',
          'ButtonのasChild転送は確定できません。',
        );
        return;
      }
      const handled = new Set(tag.events.map(({ name }) => name));
      for (const attribute of opening.attributes.properties) {
        if (!ts.isJsxAttribute(attribute)) continue;
        const name = jsxAttributeName(attribute.name);
        if (!isNil(name) && /^on[A-Z]/u.test(name) && !handled.has(name))
          diagnose(
            state,
            attribute,
            'SURFACE_UNSUPPORTED_EVENT',
            'このJSXイベントの伝達は確定できません。',
          );
      }
      for (const event of tag.events) {
        const value = suppliedValue(supply, event.name);
        if (value.kind === 'absent') continue;
        const attribute = opening.attributes.properties.findLast(
          (item) =>
            ts.isJsxAttribute(item) &&
            jsxAttributeName(item.name) === event.name,
        );
        const site = registerSite(
          state,
          opening,
          tag.id,
          { kind: 'interaction', event: event.event },
          attribute ?? opening,
          tagLocator(opening).slice(1),
        );
        const candidate = {
          entry: state.entry,
          frame: state.frame,
          site,
          value,
          renderFlow: append(state, site, 'render'),
        };
        candidates.set(
          JSON.stringify([state.entry, state.frame.mountSiteIds, site.id]),
          candidate,
        );
      }
      const declaredChildren = supply.hasChildren
        ? undefined
        : suppliedValue(supply, 'children');
      const loading = suppliedValue(supply, 'loading');
      const isLoadingDisabled =
        loading.kind === 'absent' ||
        (loading.kind === 'bound' &&
          unwrapExpression(loading.expression).kind ===
            ts.SyntaxKind.FalseKeyword);
      const rendersChildren =
        tag.rendersChildren || ('isButton' in tag && isLoadingDisabled);
      if (rendersChildren) {
        inspectChildren(children, state, active);
        if (declaredChildren?.kind === 'bound')
          inspect(declaredChildren.expression, state, active);
      }
      if (
        declaredChildren?.kind === 'unknown' ||
        (!rendersChildren &&
          (supply.children.some(({ expression }) => mayRender(expression)) ||
            (declaredChildren?.kind === 'bound' &&
              mayRender(declaredChildren.expression))))
      )
        diagnose(
          state,
          node,
          'SURFACE_UNRESOLVED_CHILDREN',
          '子要素の描画を確定できません。',
        );
      return;
    }
    const target = component(opening);
    if (isNil(target)) {
      diagnose(
        state,
        node,
        'SURFACE_UNRESOLVED_COMPONENT',
        'JSXのコンポーネント実体を確定できません。',
      );
      return;
    }
    if (
      state.components.has(target.node) ||
      state.components.size >= MAX_RENDER_DEPTH
    ) {
      diagnose(
        state,
        node,
        'SURFACE_COMPONENT_RECURSION',
        'コンポーネント描画の循環または探索上限を検出しました。',
      );
      return;
    }
    const site = registerSite(
      state,
      opening,
      target.id,
      { kind: 'mount' },
      opening,
      tagLocator(opening).slice(1),
    );
    const next = mount(state, site, 'render');
    visitComponent(
      target.node,
      { ...next, components: new Set([...state.components, target.node]) },
      supply,
      active,
    );
  };

  const visitComponent = (
    node: FunctionNode,
    visit: Visit,
    supply: SuppliedProps,
    active: ReadonlySet<ts.Expression>,
  ) => {
    const ownerId = index.getFunction(node)?.id ?? index.moduleId(node);
    if (isNil(ownerId))
      throw new Error('描画コンポーネントの所有sourceが不明です。');
    const frame = { ...visit.frame, ownerId };
    props.register(frame, node, supply);
    for (const expression of functionReturns(node.body))
      inspect(expression, { ...visit, frame }, active);
  };

  for (const { entry, node } of roots) {
    visits = 0;
    isTruncated = false;
    const frame = { ownerId: entry.id, mountSiteIds: [] };
    visitComponent(
      node,
      { entry, frame, flow: [], components: new Set([node]) },
      { attributes: new Map(), children: [], unknownSource: node },
      new Set(),
    );
  }

  const { sites, diagnostics, ambiguous } = finish();
  return {
    sites,
    candidates: [...candidates.values()].filter(
      ({ site, frame }) =>
        !ambiguous.has(site.id) &&
        !frame.mountSiteIds.some((id) => ambiguous.has(id)),
    ),
    diagnostics,
    readProp: props.readProp,
  };
};
