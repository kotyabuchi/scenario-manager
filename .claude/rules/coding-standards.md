# コーディング規約

## 1. 基本設定

### フォーマッター・リンター
- **ツール**: Biome
- **インデント**: スペース2つ
- **クォート**: シングルクォート
- **セミコロン**: なし

```bash
pnpm check    # lint + format を一括実行
pnpm lint     # lint のみ
pnpm format   # format のみ
```

---

## 2. 命名規則

### ファイル・フォルダ
| 対象 | 形式 | 例 |
|------|------|-----|
| コンポーネントフォルダ | PascalCase | `Button/`, `SearchForm/` |
| コンポーネントファイル | PascalCase | `Button.tsx`, `SearchForm.tsx` |
| ページディレクトリ | kebab-case | `scenarios/`, `game-sessions/` |
| ユーティリティ | camelCase | `formatDate.ts`, `useAuth.ts` |
| 定数ファイル | camelCase | `constants.ts`, `config.ts` |

### 変数・関数
| 対象 | 形式 | 例 |
|------|------|-----|
| 変数 | camelCase | `userName`, `isLoading` |
| 関数 | camelCase | `handleClick`, `fetchData` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| 型・インターフェース | PascalCase | `User`, `ScenarioFormProps` |
| Enum値 | UPPER_SNAKE_CASE | `UserRole.MEMBER`, `SessionPhase.RECRUITING` |

### 命名のルール
- **Boolean**: `is`, `has`, `can`, `should` プレフィックス
  ```typescript
  const isLoading = true
  const hasError = false
  const canEdit = user.role === 'MODERATOR'
  ```
- **イベントハンドラ**: `handle` プレフィックス + 動詞
  ```typescript
  const handleClick = () => {}
  const handleSubmit = (data: FormData) => {}
  ```
- **カスタムフック**: `use` プレフィックス
  ```typescript
  const useAuth = () => {}
  const useScenarioList = () => {}
  ```

---

## 3. TypeScript

### 厳格さ
- **any禁止**: `any`は一切使用しない。型が不明な場合は`unknown`を使用
- **型アサーション**: `as`は最小限に。型ガードを優先
- **Non-null assertion**: `!`は使用禁止。Optional chainingを使用

```typescript
// NG
const data: any = response
const name = user!.name

// OK
const data: unknown = response
const name = user?.name ?? 'Unknown'
```

### 型定義
- **Props型**: コンポーネント名 + `Props`
  ```typescript
  type ButtonProps = {
    variant: 'primary' | 'secondary'
    onClick: () => void
  }
  ```
- **typeとinterface**: 基本的に`type`を使用。継承が必要な場合のみ`interface`
- **exportする型**: ファイル末尾にまとめてexport
  ```typescript
  // ファイル末尾
  export type { ButtonProps, ButtonVariant }
  ```

---

## 4. Reactコンポーネント

### 定義スタイル
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

### ディレクトリ構造
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

### エクスポート形式
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

### コンポーネントの分離
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

### Server Components / Client Components
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

### Propsの受け取り
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

---

## 5. スタイリング (PandaCSS)

### スタイル定義ファイル
- **CSSスタイルは同階層の`styles.ts`に定義し、インポートして使用する**
- コンポーネントファイル内にスタイル定義を書かない

```
src/components/elements/Button/
├── Button.tsx       # コンポーネント本体
├── styles.ts        # スタイル定義
└── index.ts

src/app/(main)/users/me/
├── page.tsx         # ページコンポーネント
├── styles.ts        # ページのスタイル
└── _components/
```

**styles.ts**:
```typescript
import { css, cva } from '@/styled-system/css'

// 静的スタイル
export const container = css({
  maxW: '800px',
  mx: 'auto',
  px: '4',
})

// バリアント付きスタイル
export const button = cva({
  base: { padding: '4', rounded: 'md' },
  variants: {
    variant: {
      primary: { bg: 'blue.500' },
      secondary: { bg: 'gray.500' },
    },
  },
})
```

**使用側**:
```typescript
import * as styles from './styles'

export const MyComponent = () => {
  return <div className={styles.container}>...</div>
}
```

### レシピの使用
```typescript
import { button } from '@/styled-system/recipes'

<button className={button({ variant: 'primary', size: 'md' })}>
```

### トークンの活用
- 色: `src/styles/tokens/colors.ts` で定義されたものを使用
- スペーシング: 数値トークン (`4`, `8`, `16`) を使用
- マジックナンバー禁止

---

## 6. エラーハンドリング

### Result型パターン
`src/types/result.ts`で定義された共通のResult型を使用する。

```typescript
// src/types/result.ts（共通定義）
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

// ヘルパー関数
export const ok = <T>(data: T): Result<T, never> => ({ success: true, data })
export const err = <E = Error>(error: E): Result<never, E> => ({ success: false, error })

// 型ガード
export const isOk = <T, E>(result: Result<T, E>): result is { success: true; data: T } =>
  result.success
export const isErr = <T, E>(result: Result<T, E>): result is { success: false; error: E } =>
  !result.success
```

### 使用例
```typescript
import { type Result, ok, err } from '@/types/result'

const fetchUser = async (id: string): Promise<Result<User>> => {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, id) })
    if (!user) {
      return err(new Error('User not found'))
    }
    return ok(user)
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'))
  }
}

// 呼び出し側
const result = await fetchUser(id)
if (!result.success) {
  console.error(result.error)
  return
}
const user = result.data
```

### Server Actionsでのエラー
```typescript
'use server'

import { type Result, ok, err } from '@/types/result'

const createScenario = async (data: FormData): Promise<Result<Scenario>> => {
  // バリデーション
  const parsed = scenarioSchema.safeParse(data)
  if (!parsed.success) {
    return err(new Error(parsed.error.message))
  }

  // DB操作
  // ...
}
```

---

## 7. Import順序

Biomeの設定により自動整理される。手動で書く場合は以下の順序:

```typescript
// 1. React関連
import { useState, useEffect } from 'react'

// 2. 外部パッケージ
import { eq } from 'drizzle-orm'

// 3. 内部モジュール（lib）
import { db } from '@/lib/db'

// 4. 相対パス
import { Button } from '../Button'

// 5. 型のみのインポート
import type { User } from '@/db/schema'
```

---

## 8. コメント

### 言語
- コメント、JSDoc、TODO: **日本語**
- 変数名、関数名: **英語**

### JSDoc
公開APIや複雑なロジックには必ず記述:
```typescript
/**
 * シナリオを検索する
 * @param params - 検索条件
 * @returns 検索結果のシナリオ一覧
 */
const searchScenarios = async (params: SearchParams): Promise<Scenario[]> => {
  // ...
}
```

### TODO/FIXME
```typescript
// TODO: ページネーション対応
// FIXME: N+1クエリを修正
```

---

## 9. Gitコミット

### Conventional Commits形式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
| Type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみ |
| `style` | コードの意味に影響しない変更 |
| `refactor` | バグ修正でも機能追加でもないコード変更 |
| `perf` | パフォーマンス改善 |
| `test` | テスト追加・修正 |
| `chore` | ビルドプロセスやツールの変更 |

### 例
```
feat(scenarios): シナリオ検索機能を追加

- システム選択によるフィルタリング
- プレイ人数・時間での絞り込み
- タグによる検索

Closes #123
```

---

## 10. テスト

### ファイル配置
コンポーネントと同階層に配置:
```
Button/
├── Button.tsx
├── Button.test.tsx      # ユニットテスト
└── Button.stories.tsx   # Storybook（ビジュアルテスト）
```

### 命名
```typescript
describe('Button', () => {
  it('クリック時にonClickが呼ばれる', () => {
    // ...
  })

  it('disabled時はクリックできない', () => {
    // ...
  })
})
```

---

## 11. ディレクトリ構造

### 全体構造
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証グループ
│   └── (main)/            # メイングループ
│       └── scenarios/
│           ├── page.tsx       # ページコンポーネント
│           ├── interface.ts   # ページ用型定義
│           ├── adapter.ts     # DB操作（Drizzle）
│           └── _components/   # ページ固有コンポーネント
├── components/
│   ├── elements/          # 基本コンポーネント（Button, Card等）
│   └── blocks/            # 複合コンポーネント（Header, SideMenu等）
├── db/
│   ├── schema.ts          # Drizzleスキーマ
│   └── enum.ts            # Enum定義
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティ
├── types/                 # 共通型定義
│   └── result.ts          # Result型（ok, err, isOk, isErr）
└── styles/
    ├── preset.ts          # PandaCSSプリセット
    ├── recipes/           # コンポーネントレシピ
    └── tokens/            # デザイントークン
```

### ページディレクトリの構成
各ページディレクトリには以下のファイルを配置:

```
src/app/(main)/scenarios/
├── page.tsx           # ページコンポーネント（Server Component）
├── styles.ts          # ページのスタイル定義
├── interface.ts       # ページで扱う型定義
├── adapter.ts         # DB操作関数
├── _components/       # ページ固有のコンポーネント
│   ├── ScenarioCard.tsx
│   └── ScenarioList.tsx
└── [id]/              # 動的ルート
    ├── page.tsx
    ├── styles.ts
    ├── interface.ts
    └── adapter.ts
```

### interface.ts - 型定義ファイル
Drizzleの型出力機能を活用し、DBスキーマとの整合性を保証する。

```typescript
// src/app/(main)/scenarios/interface.ts
import type { InferSelectModel } from 'drizzle-orm'
import type { scenarios, scenarioSystems, tags } from '@/db/schema'

// Drizzleスキーマから型を導出
type Scenario = InferSelectModel<typeof scenarios>
type ScenarioSystem = InferSelectModel<typeof scenarioSystems>
type Tag = InferSelectModel<typeof tags>

// ページ固有の型（リレーション込み）
type ScenarioWithRelations = Scenario & {
  system: ScenarioSystem
  tags: Tag[]
}

// 検索パラメータ
type SearchParams = {
  systemIds?: string[]
  playerCount?: { min: number; max: number }
  playtime?: { min: number; max: number }
  tagIds?: string[]
  scenarioName?: string
}

// Props型
type ScenarioListProps = {
  scenarios: ScenarioWithRelations[]
  isLoading?: boolean
}

export type {
  Scenario,
  ScenarioSystem,
  Tag,
  ScenarioWithRelations,
  SearchParams,
  ScenarioListProps,
}
```

### adapter.ts - DB操作ファイル
Drizzleを使用したDB操作を集約。共通のResult型でエラーハンドリング。

```typescript
// src/app/(main)/scenarios/adapter.ts
import { db } from '@/lib/db'
import { scenarios } from '@/db/schema'
import { eq, and, ilike } from 'drizzle-orm'
import { isNil } from 'ramda'
import { type Result, ok, err } from '@/types/result'
import type { ScenarioWithRelations, SearchParams } from './interface'

/**
 * シナリオを検索する
 */
export const searchScenarios = async (
  params: SearchParams
): Promise<Result<ScenarioWithRelations[]>> => {
  try {
    const conditions = []

    if (!isNil(params.systemIds) && params.systemIds.length > 0) {
      // システムIDでフィルタ
    }

    if (!isNil(params.scenarioName)) {
      conditions.push(ilike(scenarios.name, `%${params.scenarioName}%`))
    }

    const result = await db.query.scenarios.findMany({
      where: and(...conditions),
      with: {
        system: true,
        tags: true,
      },
    })

    return ok(result)
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'))
  }
}

/**
 * シナリオをIDで取得する
 */
export const getScenarioById = async (
  id: string
): Promise<Result<ScenarioWithRelations | null>> => {
  try {
    const result = await db.query.scenarios.findFirst({
      where: eq(scenarios.id, id),
      with: {
        system: true,
        tags: true,
      },
    })

    return ok(result ?? null)
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'))
  }
}
```

### ファイルの責務
| ファイル | 責務 |
|----------|------|
| `page.tsx` | UIレンダリング、Server Component |
| `styles.ts` | スタイル定義（css, cva） |
| `interface.ts` | 型定義（Drizzleから導出） |
| `adapter.ts` | DB操作（クエリ、ミューテーション） |
| `_components/` | ページ固有のUIコンポーネント |
| `actions.ts` | Server Actions（必要な場合） |

---

## 12. Null/Undefinedチェック

### ramdaのisNilを使用
`null`と`undefined`のチェックには`ramda`の`isNil`を使用し、片方の漏れを防ぐ。

```typescript
import { isNil } from 'ramda'

// OK
if (isNil(value)) {
  // null または undefined の場合
}

if (!isNil(value)) {
  // 値が存在する場合
}

// NG - 片方が漏れる可能性
if (value === null) { }
if (value === undefined) { }
if (!value) { }  // 0や空文字もfalseになる
```

### 使い分け
| 関数 | 用途 |
|------|------|
| `isNil(x)` | `x === null \|\| x === undefined` |
| `isEmpty(x)` | 空配列、空オブジェクト、空文字列のチェック |
| `isNotNil(x)` | `!isNil(x)` の代替 |

### Optional Chainingとの併用
```typescript
// 値の取得時はOptional Chaining
const name = user?.profile?.name

// 存在チェックはisNil
if (!isNil(name)) {
  // nameが存在する場合の処理
}
```

---

## 13. 禁止事項

- `any`型の使用
- `!`（Non-null assertion）の使用
- `console.log`の本番コードへの残留
- マジックナンバー・マジックストリング
- インラインスタイル（style属性）
- `var`の使用
- `==`による比較（`===`を使用）
- 未使用のimport・変数（Biomeで自動検出）
