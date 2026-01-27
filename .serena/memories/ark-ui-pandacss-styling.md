# Ark UI + PandaCSS スタイリングパターン

## 概要

Ark UIコンポーネントにPandaCSSでスタイルを適用する際は、**SlotRecipe + createStyleContext**パターンを使用する。
直接`css()`でclassNameを指定すると、Ark UIの内部スタイルと競合する可能性がある。

## 推奨パターン

### 1. SlotRecipeの定義

`src/styles/recipes/`にSlotRecipeを作成する。

```typescript
// src/styles/recipes/select.ts
import { selectAnatomy } from '@ark-ui/react/select';
import { defineSlotRecipe } from '@pandacss/dev';

export const select = defineSlotRecipe({
  className: 'select',
  slots: selectAnatomy.keys(),  // Ark UIのanatomyからスロットを取得
  base: {
    root: { /* ... */ },
    trigger: { /* ... */ },
    positioner: {
      // 重要: Ark UIは内部でz-index: var(--z-index)を使用
      // CSS変数を上書きする必要がある
      '--z-index': 'zIndex.dropdown',
    },
    content: { /* ... */ },
    item: { /* ... */ },
    // ...
  },
  variants: {
    variant: {
      form: { trigger: { bg: 'input.bg' } },
      minimal: { trigger: { bg: 'white' } },
    },
  },
  defaultVariants: {
    variant: 'form',
  },
});
```

### 2. recipes/index.tsへの登録

```typescript
// src/styles/recipes/index.ts
import { select } from './select';

export const slotRecipes = {
  select,
  // 他のSlotRecipe...
};
```

### 3. createStyleContextでコンポーネント作成

```typescript
// src/components/elements/select/select.tsx
'use client';

import { Select as ArkSelect } from '@ark-ui/react/select';
import { Portal } from '@ark-ui/react/portal';
import { createStyleContext } from '@/lib/create-style-context';
import { type SelectVariantProps, select } from '@/styled-system/recipes';

const { withProvider, withContext } = createStyleContext(select);

// RootはwithProvider（StyleContextを提供）
const Root = withProvider<
  HTMLDivElement,
  SelectRootProps<SelectItem> & SelectVariantProps
>(ArkSelect.Root, 'root');

// 子コンポーネントはwithContext（StyleContextを消費）
const Trigger = withContext<HTMLButtonElement, TriggerProps>(
  ArkSelect.Trigger,
  'trigger',
);

const Positioner = withContext<HTMLDivElement, PositionerProps>(
  ArkSelect.Positioner,
  'positioner',
);

const Content = withContext<HTMLDivElement, ContentProps>(
  ArkSelect.Content,
  'content',
);

// 使用例
export const Select = ({ items, variant = 'form', ...props }) => {
  return (
    <Root variant={variant} {...props}>
      <ArkSelect.Control>
        <Trigger>...</Trigger>
      </ArkSelect.Control>
      <Portal>
        <Positioner>
          <Content>...</Content>
        </Positioner>
      </Portal>
    </Root>
  );
};
```

## 重要なポイント

### z-indexの適用場所（重要）

**Ark UIのPositionerは内部で`z-index: var(--z-index)`を使用している。**
そのため、**CSS変数`--z-index`を上書きする必要がある**。

```typescript
// NG: 直接zIndexを設定しても上書きされる
positioner: {
  zIndex: 'dropdown',  // 効かない！Ark UIの内部スタイルに上書きされる
}

// OK: CSS変数を上書き
positioner: {
  '--z-index': 'zIndex.dropdown',  // これが正しい方法
}
```

z-indexトークン（`dropdown`, `modal`, `tooltip`等）は`src/styles/tokens/zIndex.ts`で定義。

### Portalの使用
- ドロップダウン系コンポーネントは`<Portal>`で囲む
- これによりDOMの最上位にレンダリングされ、z-index問題を軽減

### Anatomyの活用
- `@ark-ui/react/<component>` から `<component>Anatomy` をインポート
- `anatomy.keys()` でスロット名の配列を取得

### バリアントの受け渡し
- Rootコンポーネントの型に `& SelectVariantProps` を追加
- `variant` propsを渡すとSlotRecipeのバリアントが適用される

## 避けるべきパターン

```typescript
// NG: 直接css()でclassNameを指定
// Ark UIの内部スタイルと競合する可能性がある
<ArkSelect.Positioner className={css({ zIndex: 'dropdown' })}>

// NG: zIndexプロパティを直接設定
positioner: { zIndex: 'dropdown' }  // CSS変数に上書きされる

// OK: withContextでラップ + CSS変数を上書き
const Positioner = withContext(ArkSelect.Positioner, 'positioner');
// SlotRecipeで '--z-index': 'zIndex.dropdown' を設定
```

## 参考リンク

- [Ark UI Styling Guide](https://ark-ui.com/docs/guides/styling)
- [PandaCSS Slot Recipes](https://panda-css.com/docs/concepts/slot-recipes)
- [Park UI](https://park-ui.com) - Ark UI + PandaCSSの参考実装
