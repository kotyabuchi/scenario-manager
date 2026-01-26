# Ark UI + PandaCSS スタイリングパターン

## 概要

Ark UIコンポーネントにPandaCSSでスタイルを適用する際の正しいパターン。

## 推奨パターン: SlotRecipe + createStyleContext

### 1. SlotRecipeの定義

`src/styles/recipes/` にSlotRecipeを作成：

```typescript
// src/styles/recipes/select.ts
import { selectAnatomy } from '@ark-ui/react/select';
import { defineSlotRecipe } from '@pandacss/dev';

export const select = defineSlotRecipe({
  className: 'select',
  slots: selectAnatomy.keys(),  // Ark UIのanatomyからスロットキーを取得
  base: {
    root: { /* styles */ },
    trigger: { /* styles */ },
    content: { /* styles */ },
    item: { /* styles */ },
    // ...
  },
  variants: {
    variant: {
      form: { /* styles */ },
      minimal: { /* styles */ },
    },
  },
  defaultVariants: {
    variant: 'form',
  },
});
```

### 2. createStyleContextの使用

```typescript
// src/components/elements/select/select.tsx
import { Select as ArkSelect } from '@ark-ui/react/select';
import { createStyleContext } from '@/lib/create-style-context';
import { select } from '@/styled-system/recipes';

const { withProvider, withContext } = createStyleContext(select);

// Root（Provider）
const Root = withProvider<HTMLDivElement, SelectRootProps & SelectVariantProps>(
  ArkSelect.Root,
  'root'
);

// その他のスロット（Context）
const Trigger = withContext<HTMLButtonElement, TriggerProps>(
  ArkSelect.Trigger,
  'trigger'
);

const Content = withContext<HTMLDivElement, ContentProps>(
  ArkSelect.Content,
  'content'
);
```

### 3. recipesのエクスポート

```typescript
// src/styles/recipes/index.ts
import { select } from './select';
import { combobox } from './combobox';

export const slotRecipes = {
  select,
  combobox,
  // ...
};
```

## 重要: z-indexの適用

### 問題

Ark UIのPositionerはインラインスタイルで以下を設定する：
```
style="z-index: var(--z-index); --z-index: auto;"
```

このため、SlotRecipeでpositionerに`--z-index`を設定しても、インラインスタイルに上書きされる。

### 解決策

**z-indexはpositionerではなくcontentスロットに適用する**

```typescript
// ❌ NG - positionerへの適用（インラインスタイルに上書きされる）
positioner: {
  '--z-index': 'zIndex.dropdown',
},

// ✅ OK - contentへの適用
positioner: {},  // 空にする
content: {
  zIndex: 'dropdown',  // ← ここにz-indexを適用
  bg: 'white',
  borderRadius: '8px',
  // ...
},
```

### z-indexトークン

`src/styles/tokens/zIndex.ts` で定義済み：

| トークン | 値 | 用途 |
|---------|-----|------|
| dropdown | 1000 | Select, Combobox, Menu等のドロップダウン |
| modal | 1300 | モーダルダイアログ |
| toast | 1400 | トースト通知 |
| tooltip | 1500 | ツールチップ |

## 参考ファイル

- `src/styles/recipes/select.ts` - Selectのレシピ
- `src/styles/recipes/combobox.ts` - Comboboxのレシピ
- `src/styles/recipes/menu.ts` - Menuのレシピ
- `src/lib/create-style-context.tsx` - スタイルコンテキストユーティリティ
- `src/styles/tokens/zIndex.ts` - z-indexトークン定義
