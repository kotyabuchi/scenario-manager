import { isNil } from 'ramda';
import ts from 'typescript';

import { unwrapExpression } from './dependencyProvenance';
import { createChildSlotVerifier } from './surfaceChildForwarding';

import type { SourceContext } from '../source';
import type { SourceIndex } from '../sourceIndex';
import type { SurfaceEvent } from '../surfaceSchema';

const REPO_BUTTON_PATH = 'src/components/elements/button/button.tsx';

type EventProp = { name: string; event: SurfaceEvent };
type Opening = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

const intrinsicEvents: readonly EventProp[] = [
  { name: 'onClick', event: 'click' },
  { name: 'onChange', event: 'change' },
  { name: 'onSelect', event: 'select' },
];
const formEvents: readonly EventProp[] = [
  { name: 'onSubmit', event: 'submit' },
  { name: 'action', event: 'form-action' },
];
const navigationEvents: readonly EventProp[] = [
  { name: 'href', event: 'navigate' },
];
const arkEvents = new Map<string, readonly EventProp[]>([
  ['Dialog.Root', [{ name: 'onOpenChange', event: 'open-change' }]],
  [
    'Combobox.Root',
    [
      { name: 'onValueChange', event: 'change' },
      { name: 'onOpenChange', event: 'open-change' },
    ],
  ],
  [
    'Select.Root',
    [
      { name: 'onValueChange', event: 'select' },
      { name: 'onOpenChange', event: 'open-change' },
    ],
  ],
  ['Tabs.Root', [{ name: 'onValueChange', event: 'select' }]],
]);
const arkSlots = new Set([
  ...arkEvents.keys(),
  'Dialog.Backdrop',
  'Dialog.CloseTrigger',
  'Dialog.Content',
  'Dialog.Description',
  'Dialog.Positioner',
  'Dialog.Title',
  'Dialog.Trigger',
  'Portal',
]);

const checkedQualifiers = new WeakMap<ts.Symbol, boolean>();
const safeQualifier = (
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  declaration: ts.Declaration,
) => {
  const cached = checkedQualifiers.get(symbol);
  if (!isNil(cached)) return cached;
  let safe = true;
  const visit = (node: ts.Node) => {
    if (
      ts.isIdentifier(node) &&
      checker.getSymbolAtLocation(node) === symbol &&
      !ts.isImportClause(node.parent) &&
      !ts.isImportSpecifier(node.parent) &&
      !ts.isNamespaceImport(node.parent)
    ) {
      let access: ts.Node = node;
      while (
        (ts.isPropertyAccessExpression(access.parent) ||
          ts.isElementAccessExpression(access.parent)) &&
        access.parent.expression === access
      )
        access = access.parent;
      const parent = access.parent;
      const assignment =
        ts.isBinaryExpression(parent) &&
        parent.left === access &&
        parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment;
      const update =
        (ts.isPrefixUnaryExpression(parent) ||
          ts.isPostfixUnaryExpression(parent)) &&
        (parent.operator === ts.SyntaxKind.PlusPlusToken ||
          parent.operator === ts.SyntaxKind.MinusMinusToken);
      safe =
        access !== node &&
        !assignment &&
        !update &&
        !ts.isDeleteExpression(parent);
    }
    if (safe) ts.forEachChild(node, visit);
  };
  visit(declaration.getSourceFile());
  checkedQualifiers.set(symbol, safe);
  return safe;
};

const normalizePath = (path: string) => path.replaceAll('\\', '/');

const importIdentity = (context: SourceContext, input: ts.Expression) => {
  const checker = context.checker;
  const seen = new Set<ts.Symbol>();
  const find = (
    expression: ts.Expression,
    members: string[],
  ):
    | {
        moduleName: string;
        name: string;
        packageName: string;
      }
    | undefined => {
    const node = unwrapExpression(expression);
    if (ts.isPropertyAccessExpression(node))
      return find(node.expression, [node.name.text, ...members]);
    if (!ts.isIdentifier(node)) return undefined;
    const symbol = checker.getSymbolAtLocation(node);
    if (isNil(symbol) || seen.has(symbol) || symbol.declarations?.length !== 1)
      return undefined;
    seen.add(symbol);
    const declaration = symbol.declarations[0];
    if (isNil(declaration)) return undefined;
    if (
      ts.isVariableDeclaration(declaration) &&
      ts.isVariableDeclarationList(declaration.parent) &&
      declaration.parent.flags & ts.NodeFlags.Const &&
      !isNil(declaration.initializer)
    )
      return find(declaration.initializer, members);
    const imported = ts.isImportSpecifier(declaration)
      ? {
          name: (declaration.propertyName ?? declaration.name).text,
          statement: declaration.parent.parent.parent,
        }
      : ts.isImportClause(declaration)
        ? { name: 'default', statement: declaration.parent }
        : ts.isNamespaceImport(declaration)
          ? { name: '', statement: declaration.parent.parent }
          : undefined;
    if (
      isNil(imported) ||
      !ts.isImportDeclaration(imported.statement) ||
      !ts.isStringLiteralLike(imported.statement.moduleSpecifier)
    )
      return undefined;
    const specifier = imported.statement.moduleSpecifier;
    const moduleName = specifier.text;
    const packageName = moduleName
      .split('/')
      .slice(0, moduleName.startsWith('@') ? 2 : 1)
      .join('/');
    const module = checker.getSymbolAtLocation(specifier);
    const target =
      symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol;
    const acceptedPaths = [`/node_modules/${packageName}/`];
    if (packageName === 'react' || packageName === 'react-dom')
      acceptedPaths.push(`/node_modules/@types/${packageName}/`);
    const fromPackage = (value: ts.Symbol | undefined) =>
      value?.declarations?.some((item) =>
        acceptedPaths.some((path) =>
          normalizePath(item.getSourceFile().fileName).includes(path),
        ),
      ) === true;
    if (!fromPackage(module) || !fromPackage(target)) return undefined;
    if (
      packageName === '@ark-ui/react' &&
      members.length > 0 &&
      !safeQualifier(checker, symbol, declaration)
    )
      return undefined;
    return {
      moduleName,
      packageName,
      name: [imported.name, ...members].filter(Boolean).join('.'),
    };
  };
  return find(input, []);
};

const functionReturns = (body: ts.ConciseBody) => {
  if (!ts.isBlock(body)) return [body];
  const returns: ts.Expression[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isReturnStatement(node) && !isNil(node.expression))
      returns.push(node.expression);
    if (!ts.isFunctionLike(node)) ts.forEachChild(node, visit);
  };
  visit(body);
  return returns;
};

const openingOf = (expression: ts.Expression): Opening | undefined => {
  const node = unwrapExpression(expression);
  if (ts.isJsxElement(node)) return node.openingElement;
  return ts.isJsxSelfClosingElement(node) ? node : undefined;
};

const isGeneratedStyled = (
  context: SourceContext,
  expression: ts.Expression,
) => {
  const checker = context.checker;
  const symbol = checker.getSymbolAtLocation(expression);
  const source = symbol?.declarations?.[0];
  if (
    isNil(symbol) ||
    isNil(source) ||
    !ts.isImportSpecifier(source) ||
    (source.propertyName ?? source.name).text !== 'styled'
  )
    return false;
  const statement = source.parent.parent.parent;
  if (
    !ts.isImportDeclaration(statement) ||
    !ts.isStringLiteralLike(statement.moduleSpecifier) ||
    statement.moduleSpecifier.text !== 'styled-system/jsx' ||
    !(symbol.flags & ts.SymbolFlags.Alias)
  )
    return false;
  const root = `${normalizePath(context.root)}/`;
  const target = checker.getAliasedSymbol(symbol);
  return (
    target.declarations?.some((item) => {
      const absolute = normalizePath(item.getSourceFile().fileName);
      if (!absolute.startsWith(root)) return false;
      const relative = absolute.slice(root.length);
      return (
        relative.startsWith('styled-system/jsx/') &&
        context.manifest.files.some(({ path }) => path === relative)
      );
    }) === true
  );
};

/** 既知ButtonだけをforwardRef・rest転送・本来のArk要素で検証する。 */
const isForwardedButton = (
  context: SourceContext,
  declaration: ts.VariableDeclaration,
) => {
  const checker = context.checker;
  const initial = declaration.initializer;
  if (isNil(initial) || !ts.isCallExpression(initial)) return false;
  const factory = importIdentity(context, initial.expression);
  const render = initial.arguments[0];
  if (
    factory?.moduleName !== 'react' ||
    factory.name !== 'forwardRef' ||
    isNil(render) ||
    !ts.isArrowFunction(render) ||
    !ts.isBlock(render.body)
  )
    return false;
  const parameter = render.parameters[0];
  if (isNil(parameter) || !ts.isIdentifier(parameter.name)) return false;
  const parameterSymbol = checker.getSymbolAtLocation(parameter.name);
  if (isNil(parameterSymbol)) return false;
  const objects = render.body.statements
    .flatMap((statement) =>
      ts.isVariableStatement(statement)
        ? [...statement.declarationList.declarations]
        : [],
    )
    .filter(
      ({ name, initializer, parent }) =>
        ts.isObjectBindingPattern(name) &&
        ts.isVariableDeclarationList(parent) &&
        (parent.flags & ts.NodeFlags.Const) !== 0 &&
        !isNil(initializer) &&
        checker.getSymbolAtLocation(initializer) === parameterSymbol,
    );
  const object = objects[0];
  if (
    objects.length !== 1 ||
    isNil(object) ||
    !ts.isObjectBindingPattern(object.name)
  )
    return false;
  const allowedExcluded = new Set([
    'loading',
    'loadingText',
    'prefix',
    'suffix',
    'children',
  ]);
  const rest = object.name.elements.find(
    ({ dotDotDotToken }) => !isNil(dotDotDotToken),
  );
  if (
    isNil(rest) ||
    !ts.isIdentifier(rest.name) ||
    object.name.elements.some((element) => {
      if (element === rest) return false;
      const name = element.propertyName ?? element.name;
      return !ts.isIdentifier(name) || !allowedExcluded.has(name.text);
    })
  )
    return false;
  const restSymbol = checker.getSymbolAtLocation(rest.name);
  const children = object.name.elements.find(
    (element) =>
      ts.isIdentifier(element.name) &&
      ts.isIdentifier(element.propertyName ?? element.name) &&
      (element.propertyName ?? element.name).getText() === 'children',
  );
  if (isNil(restSymbol) || isNil(children) || !ts.isIdentifier(children.name))
    return false;
  const childSymbol = checker.getSymbolAtLocation(children.name);
  if (isNil(childSymbol)) return false;
  const loading = object.name.elements.find(
    (element) =>
      ts.isIdentifier(element.name) &&
      ts.isIdentifier(element.propertyName ?? element.name) &&
      (element.propertyName ?? element.name).getText() === 'loading',
  );
  const loadingSymbol =
    !isNil(loading) && ts.isIdentifier(loading.name)
      ? checker.getSymbolAtLocation(loading.name)
      : undefined;
  const hasChildSlot = createChildSlotVerifier(
    checker,
    childSymbol,
    render.getSourceFile(),
    loadingSymbol,
  );

  // 残余を別の処理へ渡す・書き換える場合は既知転送と認定しない。
  let cleanRest = true;
  const inspect = (node: ts.Node) => {
    if (
      ts.isIdentifier(node) &&
      checker.getSymbolAtLocation(node) === parameterSymbol &&
      node !== object.initializer
    )
      cleanRest = false;
    if (
      ts.isIdentifier(node) &&
      node !== rest.name &&
      checker.getSymbolAtLocation(node) === restSymbol
    ) {
      const parent = node.parent;
      const read =
        ts.isPropertyAccessExpression(parent) &&
        parent.expression === node &&
        ((parent.name.text === 'asChild' &&
          ts.isIfStatement(parent.parent) &&
          parent.parent.expression === parent) ||
          (parent.name.text === 'disabled' &&
            ts.isBinaryExpression(parent.parent) &&
            parent.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken));
      if (!read && !ts.isJsxSpreadAttribute(parent)) cleanRest = false;
    }
    if (cleanRest) ts.forEachChild(node, inspect);
  };
  inspect(render.body);
  if (!cleanRest) return false;
  const returns = functionReturns(render.body);
  return (
    returns.length > 0 &&
    returns.every((expression) => {
      const opening = openingOf(expression);
      if (isNil(opening) || !hasChildSlot(unwrapExpression(expression)))
        return false;
      const styled = checker.getSymbolAtLocation(
        opening.tagName,
      )?.valueDeclaration;
      if (
        isNil(styled) ||
        !ts.isVariableDeclaration(styled) ||
        styled.getSourceFile() !== declaration.getSourceFile() ||
        isNil(styled.initializer) ||
        !ts.isCallExpression(styled.initializer) ||
        !isGeneratedStyled(context, styled.initializer.expression)
      )
        return false;
      const target = styled.initializer.arguments[0];
      if (isNil(target)) return false;
      const ark = importIdentity(context, target);
      if (
        ark?.moduleName !== '@ark-ui/react/factory' ||
        ark.name !== 'ark.button'
      )
        return false;
      const [spread, ...restAttributes] = opening.attributes.properties;
      return (
        !isNil(spread) &&
        ts.isJsxSpreadAttribute(spread) &&
        checker.getSymbolAtLocation(spread.expression) === restSymbol &&
        restAttributes.every(
          (attribute) =>
            ts.isJsxAttribute(attribute) &&
            ts.isIdentifier(attribute.name) &&
            ['ref', 'disabled'].includes(attribute.name.text),
        )
      );
    })
  );
};

/** JSXとrender式の既知境界を、文字列だけの一致に頼らず認定する。 */
export const createSurfaceAdapters = (
  context: SourceContext,
  index: SourceIndex,
) => {
  const buttons = new WeakMap<ts.VariableDeclaration, boolean>();
  const tag = (opening: Opening) => {
    const name = opening.tagName;
    if (ts.isIdentifier(name) && /^[a-z]/u.test(name.text)) {
      const events =
        name.text === 'form'
          ? [...intrinsicEvents, ...formEvents]
          : name.text === 'a'
            ? [...intrinsicEvents, ...navigationEvents]
            : intrinsicEvents;
      return { id: `intrinsic:${name.text}`, events, rendersChildren: true };
    }
    if (ts.isJsxNamespacedName(name)) return undefined;
    const checker = context.checker;
    const symbol = checker.getSymbolAtLocation(name);
    const declared =
      !isNil(symbol) && symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol).valueDeclaration
        : symbol?.valueDeclaration;
    if (
      !isNil(declared) &&
      ts.isVariableDeclaration(declared) &&
      index.filePath(declared) === REPO_BUTTON_PATH &&
      ts.isIdentifier(declared.name) &&
      declared.name.text === 'Button'
    ) {
      const known =
        buttons.get(declared) ?? isForwardedButton(context, declared);
      buttons.set(declared, known);
      if (known)
        return {
          id: `export:${REPO_BUTTON_PATH}#Button`,
          events: intrinsicEvents,
          rendersChildren: false,
          isButton: true,
        };
    }
    const imported = importIdentity(context, name);
    if (imported?.moduleName === 'next/link' && imported.name === 'default')
      return {
        id: 'package:next/link#default',
        events: navigationEvents,
        rendersChildren: true,
      };
    if (
      imported?.packageName === '@ark-ui/react' &&
      arkSlots.has(imported.name)
    )
      return {
        id: `package:${imported.moduleName}#${imported.name}`,
        events: arkEvents.get(imported.name) ?? [],
        rendersChildren: true,
      };
    return undefined;
  };
  const portalChild = (call: ts.CallExpression) => {
    const imported = importIdentity(context, call.expression);
    return imported?.moduleName === 'react-dom' &&
      imported.name === 'createPortal'
      ? call.arguments[0]
      : undefined;
  };
  return { tag, portalChild };
};

export { functionReturns };
export type { EventProp, Opening };
