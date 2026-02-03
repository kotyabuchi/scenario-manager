# React コンポーネントルール

## 定義スタイル

- **一般コンポーネント**: アロー関数 + `export const` で定義
- **Next.js固有ファイル** (`page.tsx`, `layout.tsx`等): `export default function` で定義

```typescript
// 一般コンポーネント（アロー関数）
export const Button = ({ variant, onClick }: ButtonProps) => {
  return <button onClick={onClick}>{/* ... */}</button>
}

// Next.js固有ファイル（function宣言）
export default function HomePage() {
  return <main>...</main>
}
```

## ディレクトリ構造

```
src/components/elements/Button/
├── Button.tsx           # コンポーネント本体
├── styles.ts            # スタイル定義
├── Button.stories.tsx   # Storybook
├── Button.test.tsx      # テスト（必要な場合）
└── index.ts             # エクスポート
```

**index.ts**:
```typescript
export { Button } from './Button'
export type { ButtonProps } from './Button'
```

## エクスポート形式

- **ファイル末尾での`export default`は禁止**
- Next.js固有ファイル: `export default function 関数名()` で直接定義
- その他のファイル: `export const` で直接定義

```typescript
// NG - ファイル末尾でのexport default
const MyComponent = () => { ... }
export default MyComponent  // ❌

// OK - 定義時に直接export
export const MyComponent = () => { ... }  // ✅
export default function PageComponent() { ... }  // ✅（page.tsx等のみ）
```

## コンポーネントの分離

- **1ファイル1コンポーネントを原則とする**
- 複数のコンポーネントを同一ファイルに定義しない
- 関連するコンポーネントは`_components/`ディレクトリに分離

```
src/app/(auth)/login/
├── page.tsx              # メインのページコンポーネントのみ
├── styles.ts             # ページのスタイル定義
└── _components/
    ├── LoginContent.tsx  # ログインフォーム本体
    ├── LoginFallback.tsx # ローディング表示
    └── DiscordIcon.tsx   # アイコンコンポーネント
```

## Server Components / Client Components

- デフォルトはServer Component
- Client Componentには`'use client'`をファイル先頭に記述
- ファイル名での区別はしない

```typescript
// Client Component
'use client'

import { useState } from 'react'

export const Counter = () => {
  const [count, setCount] = useState(0)
  // ...
}
```

## Propsの受け取り

```typescript
// 分割代入で受け取る
export const Button = ({ variant, size = 'md', children }: ButtonProps) => {
  // ...
}

// children を含む場合
type ButtonProps = {
  variant: 'primary' | 'secondary'
} & React.PropsWithChildren
```

## 楽観的更新（Optimistic Updates）

**すべての更新系操作で楽観的更新を使用する。**

```typescript
import { useOptimistic, useTransition } from 'react';

const MyComponent = ({ value, onUpdate }: Props) => {
  const [, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);

  const handleClick = () => {
    setOptimisticValue(!optimisticValue);  // 即座にUIを更新
    startTransition(async () => {
      await onUpdate();  // バックグラウンドでServer Action実行
    });
  };

  return <button onClick={handleClick}>{optimisticValue ? 'ON' : 'OFF'}</button>;
};
```

**理由**: ユーザーは操作の結果を即座に確認でき、UXが向上する。サーバーエラー時は自動的にロールバックされる。
