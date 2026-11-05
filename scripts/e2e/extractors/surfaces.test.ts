import { describe, expect, it } from 'vitest';

import { createSourceFixture } from '../fixtures/createSource';
import { createSourceIndex } from '../sourceIndex';
import { extractRoutes } from './routes';
import { productSurfaceRoots, storySurfaceRoots } from './surfaceRoots';
import { extractSurfaces } from './surfaces';

import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { Candidate } from './surfaceTypes';

const PAGE = 'src/app/page.tsx';
const analyze = (input: Record<string, string>) => {
  const context = createSourceFixture(input);
  const index = createSourceIndex(context);
  const routes = extractRoutes(context.files.map(({ path }) => path));
  const entries = productSurfaceRoots(context, index, routes.nodes);
  const surfaces = extractSurfaces({ context, index, roots: entries.roots });
  return { ...surfaces, rootDiagnostics: entries.diagnostics };
};

const bound = (candidate: Candidate | undefined) => {
  if (candidate?.value.kind !== 'bound')
    throw new Error('fixtureの値がありません。');
  return candidate.value;
};

describe('描画箇所をentryとmountへ結び付ける', () => {
  it('ReactNode slot内の同じ子を、供給側の別々のmountから追う', () => {
    const result = analyze({
      [PAGE]: `type Props = { run?: () => void };
const Child = ({run: invoke}: Props) => <button onClick={invoke} />;
const Layout = ({ desktop, sticky }: { desktop: unknown; sticky: unknown }) => <>{desktop}{sticky}</>;
const dead = () => <button id="dead" onClick={() => {}} />;
function desktopAction() {}
function stickyAction() {}
export default function Page() {
  return <Layout desktop={<Child run={desktopAction} />} sticky={<Child run={stickyAction} />} />;
}`,
    });
    expect(result.diagnostics).toEqual([]);
    expect(result.candidates).toHaveLength(2);
    const values = result.candidates.map((candidate) => {
      const initial = bound(candidate);
      return result.readProp(initial.frame, initial.expression);
    });
    expect(
      values.map((value) =>
        value?.kind === 'bound' ? value.expression.getText() : value?.kind,
      ),
    ).toEqual(['desktopAction', 'stickyAction']);
    expect(result.candidates[0]?.site.id).toBe(result.candidates[1]?.site.id);
    expect(result.candidates[0]?.frame.mountSiteIds).not.toEqual(
      result.candidates[1]?.frame.mountSiteIds,
    );
    expect(
      result.candidates.every(({ renderFlow }) =>
        renderFlow.some(({ kind }) => kind === 'pass-prop'),
      ),
    ).toBe(true);
  });

  it('同じslot値の描画参照を分け、props識別子の有無を判定する', () => {
    const result = analyze({
      [PAGE]: `const Child = (props: { run?: () => void }) => <button onClick={props.run} />;
const Layout = ({ children }: { children: unknown }) => <section>{children}</section>;
export default function Page() { return <Layout><Child id="missing"/><Child id="provided" run={() => {}}/></Layout>; }`,
    });
    expect(result.candidates).toHaveLength(2);
    const values = result.candidates.map((candidate) => {
      const initial = bound(candidate);
      return result.readProp(initial.frame, initial.expression)?.kind;
    });
    expect(values).toEqual(['absent', 'bound']);
  });

  it('明示属性の後のspreadを未確定とし、後続属性なら上書きを確定する', () => {
    const result = analyze({
      [PAGE]: `declare const dynamic: object;
function known() {}
export default function Page() { return <>
  <button onClick={known} {...dynamic} id="unknown" />
  <button {...dynamic} onClick={known} id="known" />
</>; }`,
    });
    const clicks = result.candidates.filter(
      ({ site }) => site.kind === 'interaction' && site.event === 'click',
    );
    expect(clicks.map(({ value }) => value.kind)).toEqual(['unknown', 'bound']);
    expect(bound(clicks[1]).expression.getText()).toBe('known');
  });

  it('同形の兄弟を位置で識別せず診断し、操作本文の変更でsite IDを変えない', () => {
    const one = (body: string) =>
      analyze({
        [PAGE]: `export default function Page() { return <button onClick={() => ${body}} />; }`,
      });
    const original = one('first()');
    const changed = one('/* note */ second()');
    expect(original.candidates).toHaveLength(1);
    expect(changed.candidates[0]?.site.id).toBe(
      original.candidates[0]?.site.id,
    );
    const collision = analyze({
      [PAGE]: `export default function Page() { return <><button onClick={first}/><button onClick={second}/></>; }`,
    });
    expect(collision.candidates).toEqual([]);
    expect(collision.diagnostics.map(({ code }) => code)).toEqual([
      'SURFACE_SITE_AMBIGUOUS',
      'SURFACE_SITE_AMBIGUOUS',
    ]);
  });

  it('未観測の同一JSXを別mountごとに保持し、内側の操作追加でanchorを変える', () => {
    const get = (inner: string, second = '') =>
      analyze({
        [PAGE]: `declare const Registry: { Item: () => unknown };
const Panel = () => <Registry.Item>${inner}</Registry.Item>;
export default function Page() { return <><Panel id="first" />${second}</>; }`,
      }).diagnostics.filter(
        ({ code }) => code === 'SURFACE_UNRESOLVED_COMPONENT',
      );
    const one = get('');
    const two = get('', '<Panel id="second" />');
    expect(one).toHaveLength(1);
    expect(two).toHaveLength(2);
    expect(two[0]?.anchor).toEqual(two[1]?.anchor);
    expect(two[0]?.mountSiteIds).not.toEqual(two[1]?.mountSiteIds);
    expect(get('<button onClick={save}/>')[0]?.anchor.syntaxHash).not.toBe(
      one[0]?.anchor.syntaxHash,
    );
    expect(get('', '<Panel id="first" />')[0]?.mountSiteIds).toEqual([]);
  });

  it('propsの再代入や引数経由の変更があり得る場合は供給値を確定しない', () => {
    const result = analyze({
      [PAGE]: `function original() {}
function replacement() {}
declare function change(input: unknown): void;
const Reassign = ({ run }: { run: () => void }) => { run = replacement; return <button onClick={run}/>; };
const Escape = (props: { run: () => void }) => { change(props); return <button onClick={props.run}/>; };
const Alias = (props: { run: () => void }) => { const alias = props; alias.run = replacement; return <button onClick={props.run}/>; };
export default function Page() { return <><Reassign run={original}/><Escape run={original}/><Alias run={original}/></>; }`,
    });
    expect(result.candidates).toHaveLength(3);
    expect(
      result.candidates.map((candidate) => {
        const initial = bound(candidate);
        return result.readProp(initial.frame, initial.expression)?.kind;
      }),
    ).toEqual(['unknown', 'unknown', 'unknown']);
  });

  it('children属性、undefinedの既定slot、定数の別々の利用箇所を追う', () => {
    const result = analyze({
      [PAGE]: `const Panel = ({slot = <button id="default" onClick={save}/>} : {slot?: unknown}) => <div>{slot}</div>;
const panel = <Panel slot={undefined}/>;
export default function Page() { return <>
  <header children={<button id="children" onClick={save}/>} />
  <main>{panel}</main><aside>{panel}</aside>
</>; }`,
    });
    expect(result.diagnostics).toEqual([]);
    expect(result.candidates).toHaveLength(3);
    expect(result.candidates[0]?.site.locator).toContain('id=children');
    expect(result.candidates[1]?.site.locator).toContain('id=default');
    expect(result.candidates[1]?.site.id).toBe(result.candidates[2]?.site.id);
    expect(result.candidates[1]?.frame.mountSiteIds).not.toEqual(
      result.candidates[2]?.frame.mountSiteIds,
    );
  });

  it('classのconstructorをrenderへ読み替えず、awaitした動的描画を診断する', () => {
    const result = analyze({
      [PAGE]: `interface Element { props: unknown; type: unknown; key: unknown }
declare function getElement(): Promise<Element>;
class Component { constructor(){} render(){ return <button onClick={hidden}/>; } }
export default async function Page() { return <><Component/>{await getElement()}</>; }`,
      'src/app/loading.tsx':
        'export default class Loading { constructor(){} render(){return <button onClick={hidden}/>;} }',
    });
    expect(result.candidates).toEqual([]);
    expect(result.rootDiagnostics.map(({ code }) => code)).toContain(
      'SURFACE_UNRESOLVED_PRODUCT_ROOT',
    );
    expect(result.diagnostics.map(({ code }) => code)).toEqual([
      'SURFACE_UNRESOLVED_COMPONENT',
      'SURFACE_UNRESOLVED_RENDER_VALUE',
    ]);
  });

  it('任意Ark exportや変更可能なmemberをchildren転送扱いにしない', () => {
    const packageSource =
      'export const Dialog = { Root: (_props: unknown) => null }; export const Unknown = (_props: unknown) => null;';
    const run = (body: string) =>
      analyze({
        'node_modules/@ark-ui/react/index.ts': packageSource,
        [PAGE]: `import { Dialog, Unknown } from '@ark-ui/react';${body}`,
      });
    const known = run(
      'export default function Page(){return <Dialog.Root><button onClick={save}/></Dialog.Root>;}',
    );
    expect(known.candidates).toHaveLength(1);
    const unknown = run(`const alias = Dialog; alias.Root = () => null;
export default function Page(){return <><Dialog.Root><button onClick={hidden}/></Dialog.Root><Unknown><button onClick={hidden}/></Unknown></>;}`);
    expect(unknown.candidates).toEqual([]);
    expect(unknown.diagnostics.map(({ code }) => code)).toEqual([
      'SURFACE_UNRESOLVED_COMPONENT',
      'SURFACE_UNRESOLVED_COMPONENT',
    ]);
  });

  it('ButtonのforwardRefを既知形でだけ認定し、転送前のprops変更を拒否する', () => {
    const check = (body: string) =>
      analyze({
        'node_modules/react/index.d.ts':
          'export declare function forwardRef(render: (props: any, ref: unknown) => unknown): any;',
        'node_modules/@ark-ui/react/factory/index.d.ts':
          'export declare const ark: {button: unknown};',
        'styled-system/jsx/index.d.ts':
          'export declare function styled(tag: unknown, recipe: unknown): any;',
        'src/components/elements/button/button.tsx': `import {forwardRef} from 'react';
import {ark} from '@ark-ui/react/factory';
import {styled} from 'styled-system/jsx';
const StyledButton = styled(ark.button, null);
export const Button = forwardRef((props, ref) => { ${body} const {children, ...rest} = props; return <StyledButton {...rest} ref={ref}>{children}</StyledButton>; });`,
        [PAGE]:
          'import {Button} from "@/components/elements/button/button"; export default function Page() { return <Button onClick={save}/>; }',
      });
    expect(check('').candidates).toHaveLength(1);
    const changed = check('props.onClick = replacement;');
    expect(changed.candidates).toEqual([]);
    expect(changed.diagnostics.map(({ code }) => code)).toEqual([
      'SURFACE_UNRESOLVED_COMPONENT',
    ]);
  });

  it('既知Buttonのchildren属性にある操作を追う', () => {
    const result = analyze({
      'node_modules/react/index.d.ts':
        'export declare function forwardRef(render: (props: any, ref: unknown) => unknown): any;',
      'node_modules/@ark-ui/react/factory/index.d.ts':
        'export declare const ark: {button: unknown};',
      'styled-system/jsx/index.d.ts':
        'export declare function styled(tag: unknown, recipe: unknown): any;',
      'src/components/elements/button/button.tsx': `import {forwardRef} from 'react';
import {ark} from '@ark-ui/react/factory';
import {styled} from 'styled-system/jsx';
const StyledButton = styled(ark.button, null);
export const Button = forwardRef((props, ref) => { const {children, ...rest} = props; return <StyledButton {...rest} ref={ref}>{children}</StyledButton>; });`,
      [PAGE]: `import {Button} from "@/components/elements/button/button";
const Child = ({run}: {run: () => void}) => <span id="component" onClick={run}/>;
export default function Page() { return <>
  <Button children={<span id="intrinsic" onClick={save}/>} />
  <Button><Child run={save}/></Button>
</>; }`,
    });
    expect(result.diagnostics).toEqual([]);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates.map(({ site }) => site.locator.at(-1))).toEqual([
      'id=intrinsic',
      'id=component',
    ]);
  });

  it('実Buttonのreturn括弧付きJSXからchildren操作を観測する', () => {
    const buttonSource = readFileSync(
      path.join(process.cwd(), 'src/components/elements/button/button.tsx'),
      'utf8',
    );
    const result = analyze({
      'node_modules/react/index.d.ts':
        'export type ReactNode = unknown; export declare function forwardRef<T, P>(render: (props: P, ref: unknown) => unknown): any;',
      'node_modules/@ark-ui/react/factory/index.d.ts':
        'export declare const ark: {button: unknown};',
      'styled-system/jsx/index.d.ts':
        'export declare function styled(tag: unknown, recipe: unknown): any;',
      'styled-system/types/index.d.ts':
        'export type ComponentProps<T> = {children?: unknown};',
      'src/components/elements/button/button.tsx': buttonSource,
      [PAGE]: `import {Button} from "@/components/elements/button/button";
const Child = ({run}: {run: () => void}) => <span id="component" onClick={run}/>;
export default function Page() { return <>
  <Button children={<span id="intrinsic" onClick={save}/>} />
  <Button><Child run={save}/></Button>
</>; }`,
    });
    expect(result.diagnostics).toEqual([]);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates.map(({ site }) => site.locator.at(-1))).toEqual([
      'id=intrinsic',
      'id=component',
    ]);
  });

  it('loading分岐の非loading側だけでchildrenを確定する', () => {
    const result = analyze({
      'node_modules/react/index.d.ts':
        'export declare function forwardRef(render: (props: any, ref: unknown) => unknown): any;',
      'node_modules/@ark-ui/react/factory/index.d.ts':
        'export declare const ark: {button: unknown};',
      'styled-system/jsx/index.d.ts':
        'export declare function styled(tag: unknown, recipe: unknown): any;',
      'src/components/elements/button/button.tsx': `import {forwardRef} from 'react';
import {ark} from '@ark-ui/react/factory';
import {styled} from 'styled-system/jsx';
const StyledButton = styled(ark.button, null);
export const Button = forwardRef((props, ref) => {
  const {loading, loadingText, children, ...rest} = props;
  const label = typeof children === 'string' ? <span>{children}</span> : children;
  if (rest.asChild) return <StyledButton {...rest} ref={ref}>{children}</StyledButton>;
  return <StyledButton {...rest} ref={ref}>{loading ? loadingText : label}</StyledButton>;
});`,
      [PAGE]: `import {Button} from "@/components/elements/button/button";
export default function Page() { return <>
  <Button><span id="shown" onClick={save}/></Button>
  <Button loading={true} loadingText="待機中"><span id="hidden" onClick={save}/></Button>
</>; }`,
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.site.locator).toContain('id=shown');
    expect(result.diagnostics.map(({ code }) => code)).toEqual([
      'SURFACE_UNRESOLVED_CHILDREN',
    ]);
  });

  it('Buttonの非表示childrenとasChildを確定描画にしない', () => {
    const result = analyze({
      'node_modules/react/index.d.ts':
        'export declare function forwardRef(render: (props: any, ref: unknown) => unknown): any;',
      'node_modules/@ark-ui/react/factory/index.d.ts':
        'export declare const ark: {button: unknown};',
      'styled-system/jsx/index.d.ts':
        'export declare function styled(tag: unknown, recipe: unknown): any;',
      'src/components/elements/button/button.tsx': `import {forwardRef} from 'react';
import {ark} from '@ark-ui/react/factory';
import {styled} from 'styled-system/jsx';
const StyledButton = styled(ark.button, null);
export const Button = forwardRef((props, ref) => { const {children, ...rest} = props; return <StyledButton {...rest} ref={ref}>{children}</StyledButton>; });`,
      [PAGE]: `import {Button} from "@/components/elements/button/button";
export default function Page() { return <>
  <Button loading={true} loadingText="待機中"><span onClick={hidden}/></Button>
  <Button asChild={true}><span onClick={hidden}/></Button>
</>; }`,
    });
    expect(result.candidates).toEqual([]);
    expect(result.diagnostics.map(({ code }) => code)).toEqual([
      'SURFACE_UNRESOLVED_CHILDREN',
      'SURFACE_UNRESOLVED_BUTTON_SLOT',
    ]);
  });

  it('Button内の不透明componentや片側だけのchildrenを転送確定しない', () => {
    const run = (children: string, declaration = 'const', mutation = '') =>
      analyze({
        'node_modules/react/index.d.ts':
          'export declare function forwardRef(render: (props: any, ref: unknown) => unknown): any;',
        'node_modules/@ark-ui/react/factory/index.d.ts':
          'export declare const ark: {button: unknown};',
        'styled-system/jsx/index.d.ts':
          'export declare function styled(tag: unknown, recipe: unknown): any;',
        'src/components/elements/button/button.tsx': `import {forwardRef} from 'react';
import {ark} from '@ark-ui/react/factory';
import {styled} from 'styled-system/jsx';
const StyledButton = styled(ark.button, null);
const Unknown = (_props) => null;
export const Button = forwardRef((props, ref) => {
  ${declaration} {children, ...rest} = props;
  ${mutation}
  return <StyledButton {...rest} ref={ref}>{${children}}</StyledButton>;
});`,
        [PAGE]:
          'import {Button} from "@/components/elements/button/button"; export default function Page() { return <Button><span onClick={save}/></Button>; }',
      });
    for (const expression of [
      '<Unknown>{children}</Unknown>',
      'flag ? children : null',
    ]) {
      const result = run(expression);
      expect(result.candidates).toEqual([]);
      expect(result.diagnostics.map(({ code }) => code)).toEqual([
        'SURFACE_UNRESOLVED_COMPONENT',
      ]);
    }
    const reassigned = run('children', 'let', 'children = <span/>;');
    expect(reassigned.candidates).toEqual([]);
    expect(reassigned.diagnostics.map(({ code }) => code)).toEqual([
      'SURFACE_UNRESOLVED_COMPONENT',
    ]);
  });

  it('別名importでPortalの子を描画し、同名ローカル関数の子を結ばない', () => {
    const result = analyze({
      'node_modules/react-dom/index.d.ts':
        'export declare function createPortal(children: unknown, target: unknown): unknown;',
      [PAGE]: `import { createPortal as portal } from 'react-dom';
const createPortal = (_children: unknown) => null;
const Real = ({ children }: {children: unknown}) => portal(children, null);
const Fake = ({ children }: {children: unknown}) => createPortal(children);
export default function Page() { return <>
  <Real><button id="real" onClick={() => {}} /></Real>
  <Fake><button id="fake" onClick={() => {}} /></Fake>
</>; }`,
    });
    expect(
      result.candidates.map(({ site }) => site.locator.includes('id=real')),
    ).toEqual([true]);
  });

  it('通常画面以外の表示ルートも採り、defaultが未解決なら診断する', () => {
    const result = analyze({
      [PAGE]: 'export const helper = () => <button onClick={missing} />;',
      'src/app/loading.tsx':
        'export default function Loading() { return <button onClick={retry} />; }',
      'src/app/not-found.tsx':
        'export default function NotFound() { return <a href="/" />; }',
    });
    expect(result.rootDiagnostics).toEqual([
      expect.objectContaining({ code: 'SURFACE_UNRESOLVED_PRODUCT_ROOT' }),
    ]);
    expect(result.candidates.map(({ entry }) => entry.id)).toEqual([
      'loading:src/app/loading.tsx',
      'not-found:src/app/not-found.tsx',
    ]);
  });
});

describe('CSF root', () => {
  it('明示renderだけをstory entryへ結び、その他を診断する', () => {
    const path = 'src/Fixture.stories.tsx';
    const context = createSourceFixture({
      [path]: `export default {title: 'Fixture'};
export const Rendered = { render() { return <button onClick={() => {}}/>; } };
export const PropsOnly = { args: {} };
declare const property: string;
export const UnknownOverride = { render: () => <button onClick={() => {}}/>, [property]: null };`,
    });
    const file = context.program
      .getSourceFiles()
      .find(({ fileName }) => fileName.endsWith(path));
    if (!file) throw new Error('story fixtureがありません。');
    context.files.push({ path, sourceFile: file });
    const index = createSourceIndex(context);
    const { roots, diagnostics } = storySurfaceRoots(context, index);
    const result = extractSurfaces({ context, index, roots });
    expect(result.candidates.map(({ entry }) => entry)).toEqual([
      { kind: 'storybook', id: `${path}#Rendered` },
    ]);
    expect(diagnostics.map(({ entry, code }) => [entry.id, code])).toEqual([
      [`${path}#PropsOnly`, 'SURFACE_UNRESOLVED_STORY_RENDER'],
      [`${path}#UnknownOverride`, 'SURFACE_UNRESOLVED_STORY_RENDER'],
    ]);
  });
});
