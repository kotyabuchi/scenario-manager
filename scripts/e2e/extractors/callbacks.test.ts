import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
  INVALID,
  SAVE,
  SETTINGS,
  createSurfaceCallbackFixture as setup,
} from '../fixtures/surfaceCallbacks';

import type { Frame } from './surfaceTypes';

describe('操作callbackの静的追跡', () => {
  it('正規のAction export、import alias、const alias、組み込みbindを同じ実体へ解決する', () => {
    const { candidate, resolve } = setup(`
import { save as saveAlias } from './actions';
import { second } from './second-actions';
const wrapped = saveAlias.bind(null, 'id');
const alias = wrapped;
const fake = { bind: () => saveAlias };
const observed = [alias, second, fake.bind(null), saveAlias.bind({})];`);
    const { bindings } = resolve(
      [0, 1, 2, 3].map((position) => candidate(position)),
    );
    expect(bindings.map(({ branches }) => branches[0]?.resolution)).toEqual([
      { kind: 'resolved', targetIds: [SAVE] },
      { kind: 'resolved', targetIds: ['action:src/second-actions.ts#second'] },
      { kind: 'unresolved', targetIds: [], diagnostics: expect.any(Array) },
      { kind: 'unresolved', targetIds: [], diagnostics: expect.any(Array) },
    ]);
  });

  it('実ハンドラーの早期終了とtransitionを供給元のmount単位で分ける', () => {
    const { context, find, index, candidate, owner, resolve } = setup(`
import { save } from './actions';
import { useOptimistic, useState, useTransition as useReactTransition } from 'react';
function Owner({ onConfirm: confirm }: { onConfirm?: () => Promise<void> }) {
  const [, startTransition] = useReactTransition();
  const [, setMessage] = useState('');
  const [, setOptimistic] = useOptimistic(false);
  const handler = () => {
    if (!confirm) { setMessage('story'); return; }
    setOptimistic(true);
    startTransition(async () => { await confirm(); setMessage('saved'); });
  };
  const mock = async () => {};
  const observed = [handler, save, mock];
  return observed;
}`);
    const prop = find(
      (node): node is ts.BindingElement =>
        ts.isBindingElement(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'confirm',
    );
    const symbol = context.checker.getSymbolAtLocation(prop.name);
    if (!symbol) throw new Error('fixtureのprop symbolがありません。');
    const desktop: Frame = {
      ...owner,
      mountSiteIds: ['surface-site:desktop-mount'],
    };
    const mobile: Frame = {
      ...owner,
      mountSiteIds: ['surface-site:mobile-mount'],
    };
    const omitted: Frame = {
      ...owner,
      mountSiteIds: ['surface-site:omitted-mount'],
    };
    const mock: Frame = { ...owner, mountSiteIds: ['surface-site:mock-mount'] };
    const { bindings, diagnostics } = resolve(
      [
        candidate(0, { frame: desktop }),
        candidate(0, { frame: mobile, siteId: 'surface-site:mobile' }),
        candidate(0, { frame: omitted, entryKind: 'storybook' }),
        candidate(0, { frame: mock, entryKind: 'storybook' }),
      ],
      (frame, reference) => {
        if (context.checker.getSymbolAtLocation(reference) !== symbol)
          return undefined;
        if (frame === omitted) return { kind: 'absent' };
        const bound = candidate(frame === mock ? 2 : 1).value;
        if (bound.kind !== 'bound')
          throw new Error('fixtureの供給値がありません。');
        return { ...bound, source: index.location(bound.expression) };
      },
    );
    expect(diagnostics).toEqual([]);
    expect(bindings.map(({ branches }) => branches[0]?.resolution)).toEqual([
      { kind: 'resolved', targetIds: [SAVE] },
      { kind: 'resolved', targetIds: [SAVE] },
      { kind: 'optional-absent' },
      { kind: 'local' },
    ]);
    expect(new Set(bindings.map(({ id }) => id)).size).toBe(4);
    expect(bindings[0]?.branches[0]?.flow).toContainEqual(
      expect.objectContaining({
        kind: 'invoke-prop',
        to: { kind: 'prop', ownerId: owner.ownerId, name: 'onConfirm' },
      }),
    );
  });

  it('RHFのvalidとinvalidを別枝にし、同名のローカル関数をRHFと扱わない', () => {
    const { candidate, resolve } = setup(`
import { save, invalid } from './actions';
import * as rhf from 'react-hook-form';
const form = rhf.useForm();
const { handleSubmit: bindSubmit } = rhf.useForm();
const aliased = form.handleSubmit(save, invalid);
const useForm = () => ({ handleSubmit: (fn: () => void) => fn });
const fake = useForm();
const observed = [aliased, bindSubmit(save), fake.handleSubmit(save)];`);
    const { bindings } = resolve(
      [0, 1, 2].map((position) => candidate(position, { event: 'submit' })),
    );
    expect(
      bindings.map(({ branches }) =>
        branches.map(({ role, resolution }) => [role, resolution]),
      ),
    ).toEqual([
      [
        ['valid', { kind: 'resolved', targetIds: [SAVE] }],
        ['invalid', { kind: 'resolved', targetIds: [INVALID] }],
      ],
      [['valid', { kind: 'resolved', targetIds: [SAVE] }]],
      [
        [
          'handler',
          { kind: 'unresolved', targetIds: [], diagnostics: expect.any(Array) },
        ],
      ],
    ]);
  });

  it('Nextのliteral遷移と未知の呼出を区別し、同居する既知Actionを保持する', () => {
    const { candidate, resolve } = setup(`
import { save } from './actions';
import { useRouter as useNextRouter } from 'next/navigation';
const router = useNextRouter();
declare const runtimePath: string;
declare function unknown(cb: () => void): void;
const only = () => router.push('/settings');
const mixed = () => { save(); unknown(() => router.push('/settings')); router.replace(runtimePath); };
const observed = [only, mixed, 'https://example.test/', '/settings' as string];`);
    const { bindings } = resolve([
      candidate(0),
      candidate(1),
      candidate(2, { event: 'navigate' }),
      candidate(3, { event: 'navigate' }),
    ]);
    expect(bindings.map(({ branches }) => branches[0]?.resolution)).toEqual([
      { kind: 'resolved', targetIds: [SETTINGS] },
      { kind: 'unresolved', targetIds: [SAVE], diagnostics: expect.any(Array) },
      { kind: 'external-navigation' },
      { kind: 'unresolved', targetIds: [], diagnostics: expect.any(Array) },
    ]);
  });

  it('IDは位置と本文から独立し、digestは整形差を無視して意味の変更を記録する', () => {
    const source = `import { save, invalid } from './actions';
const handler = () => { save(); }; const observed = [handler];`;
    const inspect = (source: string) => {
      const { candidate, resolve } = setup(source);
      return resolve([candidate(0)]).bindings[0];
    };
    const original = inspect(source);
    const formatted = inspect(
      `\n\n${source.replace('save();', '\n  save ( ); \n')}`,
    );
    const changed = inspect(source.replace('save();', 'invalid();'));
    expect(original?.id).toBe(formatted?.id);
    expect(original?.id).toBe(changed?.id);
    expect(original?.bindingDigest).toBe(formatted?.bindingDigest);
    expect(original?.bindingDigest).not.toBe(changed?.bindingDigest);
  });

  it('再帰と未知呼出を診断しても、既知Actionを消さない', () => {
    const { candidate, resolve } = setup(`
import { save } from './actions';
declare function unknown(): void;
function loop() { save(); unknown(); loop(); }
const observed = [loop];`);
    const { bindings, diagnostics } = resolve([candidate(0)]);
    expect(bindings[0]?.branches[0]?.resolution).toMatchObject({
      kind: 'unresolved',
      targetIds: [SAVE],
    });
    expect(diagnostics.map(({ code }) => code)).toEqual([
      'SURFACE_CALLBACK_UNKNOWN',
      'SURFACE_CALLBACK_TRUNCATED',
    ]);
  });

  it('型だけのimportや書き換えられたbind・router methodから実体を推測しない', () => {
    const { candidate, resolve } = setup(`
import { save } from './actions';
import type { invalid } from './actions';
import { useRouter } from 'next/navigation';
const alias = save;
alias.bind = () => {};
const router = useRouter();
const other = router;
declare const key: string;
other[key] = () => {};
const navigate = () => router.push('/settings');
const observed = [invalid, save.bind(null), navigate, save];`);
    const { bindings } = resolve(
      [0, 1, 2, 3].map((position) => candidate(position)),
    );
    const unresolved = {
      kind: 'unresolved',
      targetIds: [],
      diagnostics: expect.any(Array),
    };
    expect(bindings.map(({ branches }) => branches[0]?.resolution)).toEqual([
      unresolved,
      unresolved,
      unresolved,
      { kind: 'resolved', targetIds: [SAVE] },
    ]);
  });

  it('再export経由の公開Actionを元の実装と区別する', () => {
    const { candidate, resolve } = setup(
      `import { useSave } from './barrel'; const observed = [useSave];`,
      {
        'src/public-actions.ts': `'use server'; export { save as publicSave } from './actions';`,
        'src/barrel.ts': `export { publicSave as useSave } from './public-actions';`,
      },
    );
    expect(
      resolve([candidate(0)]).bindings[0]?.branches[0]?.resolution,
    ).toEqual({
      kind: 'resolved',
      targetIds: ['action:src/public-actions.ts#publicSave'],
    });
  });

  it('再代入された関数宣言を旧Actionとして認定しない', () => {
    const { candidate, resolve } = setup(
      `import { save } from './actions'; const observed = [save];`,
      {
        'src/actions.ts': `'use server'; export async function save() {}; save = async () => {};`,
      },
    );
    expect(
      resolve([candidate(0)]).bindings[0]?.branches[0]?.resolution,
    ).toMatchObject({
      kind: 'unresolved',
      targetIds: [],
    });
  });

  it('外部呼出へ渡ったreceiverのbind・RHF・router推定を止める', () => {
    const { candidate, resolve } = setup(`
import { save } from './actions';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
declare function mutate(value: unknown): void;
Object.assign(save, { bind: () => () => {} });
const form = useForm(); Object.assign(form, { handleSubmit: () => () => {} });
const router = useRouter(); mutate(router);
const navigate = () => router.push('/settings');
const observed = [save.bind(null), form.handleSubmit(save), navigate];`);
    const result = resolve([
      candidate(0),
      candidate(1, { event: 'submit' }),
      candidate(2),
    ]);
    expect(
      result.bindings.map(({ branches }) => branches[0]?.resolution),
    ).toEqual([
      { kind: 'unresolved', targetIds: [], diagnostics: expect.any(Array) },
      { kind: 'unresolved', targetIds: [], diagnostics: expect.any(Array) },
      { kind: 'unresolved', targetIds: [], diagnostics: expect.any(Array) },
    ]);
  });

  it('定数条件の到達不能枝からActionを収集しない', () => {
    const { candidate, resolve } = setup(`
import { save, invalid } from './actions';
const handler = () => { false && save(); true || save(); false ?? save(); null ?? invalid(); return true ? invalid() : save(); };
const observed = [handler, true ? invalid : save];`);
    expect(
      resolve([candidate(0), candidate(1)]).bindings.map(
        ({ branches }) => branches[0]?.resolution,
      ),
    ).toEqual([
      { kind: 'resolved', targetIds: [INVALID] },
      { kind: 'resolved', targetIds: [INVALID] },
    ]);
  });

  it('省略済みoptional callの引数は評価しない', () => {
    const { context, find, candidate, resolve, owner } = setup(`
import { save } from './actions';
function Owner({ run }: { run?: () => void }) {
  const handler = () => run?.(save());
  const observed = [handler];
  return observed;
}`);
    const prop = find(
      (node): node is ts.Identifier =>
        ts.isIdentifier(node) &&
        node.text === 'run' &&
        ts.isCallExpression(node.parent),
    );
    const symbol = context.checker.getSymbolAtLocation(prop);
    expect(symbol).toBeDefined();
    const result = resolve(
      [candidate(0, { frame: owner })],
      (_frame, reference) =>
        context.checker.getSymbolAtLocation(reference) === symbol
          ? { kind: 'absent' }
          : undefined,
    );
    expect(result.bindings[0]?.branches[0]?.resolution).toEqual({
      kind: 'optional-absent',
    });
  });

  it('optional property receiverの省略時は引数を評価しない', () => {
    const { context, find, candidate, resolve, owner } = setup(`
import { save } from './actions';
function Owner({ run }: { run?: { method: () => void } }) {
  const handler = () => run?.method(save());
  const observed = [handler];
  return observed;
}`);
    const prop = find(
      (node): node is ts.Identifier =>
        ts.isIdentifier(node) &&
        node.text === 'run' &&
        ts.isPropertyAccessExpression(node.parent),
    );
    const symbol = context.checker.getSymbolAtLocation(prop);
    expect(symbol).toBeDefined();
    const result = resolve(
      [candidate(0, { frame: owner })],
      (_frame, reference) =>
        context.checker.getSymbolAtLocation(reference) === symbol
          ? { kind: 'absent' }
          : undefined,
    );
    expect(result.bindings[0]?.branches[0]?.resolution).toEqual({
      kind: 'optional-absent',
    });
  });

  it('class constructorをcallbackとして実行しない', () => {
    const { candidate, resolve } = setup(`
import { save } from './actions';
class Handler { constructor() { save(); } }
const observed = [Handler];`);
    expect(
      resolve([candidate(0)]).bindings[0]?.branches[0]?.resolution,
    ).toMatchObject({
      kind: 'unresolved',
      targetIds: [],
    });
  });

  it('同一entry・同一siteの未解決を別mount同士で合成しない', () => {
    const { candidate, owner, resolve } = setup(`
declare const callback: () => void;
const observed = [callback];`);
    const mountSiteIds = [['surface-site:first'], ['surface-site:second']];
    const { bindings, diagnostics } = resolve(
      mountSiteIds.map((mountSiteIds) =>
        candidate(0, { frame: { ...owner, mountSiteIds } }),
      ),
    );
    expect(bindings.map((binding) => binding.mountSiteIds)).toEqual(
      mountSiteIds,
    );
    expect(diagnostics.map((diagnostic) => diagnostic.mountSiteIds)).toEqual(
      mountSiteIds,
    );
    expect(diagnostics[0]?.anchor).toEqual(diagnostics[1]?.anchor);
  });

  it('未知の関数値を呼ぶ前に評価される既知Actionを保持する', () => {
    const { candidate, resolve } = setup(`
import { save, invalid } from './actions';
declare const unknown: () => void;
const getCallback = () => { save(); return unknown; };
const handler = () => {
  if (false) invalid();
  getCallback()();
};
const observed = [handler];`);
    const { bindings } = resolve([candidate(0)]);
    expect(bindings[0]?.branches[0]?.resolution).toMatchObject({
      kind: 'unresolved',
      targetIds: [SAVE],
    });
  });
});
