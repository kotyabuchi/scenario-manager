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

### CSS関数の命名規則
- **camelCaseを使用する**
- 複数の要素がある場合は `コンポーネント名_要素名` の形式でアンダースコア区切り

```typescript
// OK - camelCase + アンダースコア区切り
export const editForm_container = css({ ... })
export const editForm_title = css({ ... })
export const editForm_submitButton = css({ ... })
export const card_header = css({ ... })

// NG - kebab-case
export const edit_form_container = css({ ... })
export const editFormContainer = css({ ... })  // 要素の区切りが不明瞭
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

## 13. フォーム

### フォームライブラリ
- **React Hook Form**を使用してフォームの状態管理を行う
- 標準のReact state (`useState`) でフォームを管理しない

### バリデーション
- **必ずZodでバリデーションスキーマを定義する**
- `@hookform/resolvers/zod`を使用してReact Hook Formと連携する
- バリデーションスキーマはフォームコンポーネントと同階層に配置

### ファイル構成
- **Zodスキーマは必ず別ファイル（`schema.ts`）に分離する**
- スキーマファイルはフォームコンポーネントと同階層に配置

```
src/app/(main)/users/me/
├── page.tsx
├── _components/
│   ├── ProfileEditForm.tsx    # フォームコンポーネント
│   └── schema.ts              # Zodスキーマ定義
```

### 実装例

**schema.ts**:
```typescript
import { z } from 'zod'

export const profileFormSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  age: z.number().min(0, '年齢は0以上で入力してください').optional(),
})

// スキーマから型を導出してエクスポート
export type ProfileFormValues = z.infer<typeof profileFormSchema>
```

**ProfileEditForm.tsx**:
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileFormSchema, type ProfileFormValues } from './schema'

export const ProfileEditForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  })

  const onSubmit = async (data: ProfileFormValues) => {
    // フォーム送信処理
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        送信
      </button>
    </form>
  )
}
```

### 注意事項
- フォームの型は`z.infer<typeof schema>`でスキーマから導出する
- スキーマと型は`schema.ts`からエクスポートして使用する
- Server Actionsと組み合わせる場合も、クライアント側でZodバリデーションを行う
- エラーメッセージは日本語で記述する

---

## 14. セマンティックHTML

### 原則
**見た目ではなく意味に基づいてHTML要素を選択する。** CSSで見た目を変えられるからといって、意味的に不適切な要素を使わない。

### 適切な要素の選択

| 目的 | 正しい要素 | 誤った実装 |
|------|-----------|-----------|
| セクション区切り | `<hr>` | `border-top`を持つ`<div>` |
| ナビゲーション | `<nav>` | `<div>` |
| メインコンテンツ | `<main>` | `<div>` |
| 記事・投稿 | `<article>` | `<div>` |
| 補足情報 | `<aside>` | `<div>` |
| ヘッダー | `<header>` | `<div>` |
| フッター | `<footer>` | `<div>` |
| リスト | `<ul>`, `<ol>` | `<div>`の繰り返し |
| ボタン | `<button>` | クリック可能な`<div>` |
| リンク | `<a>` | クリック可能な`<span>` |

### 具体例

```tsx
// NG - border-topで視覚的に区切り線を表現
<div className={css({ borderTop: '1px solid gray' })}>
  <Button>送信</Button>
</div>

// OK - hrで意味的に区切りを表現
<hr className={dividerStyle} />
<div>
  <Button>送信</Button>
</div>
```

```tsx
// NG - divにonClickを付けてボタン風に
<div onClick={handleClick} className={buttonStyle}>
  クリック
</div>

// OK - button要素を使用
<button type="button" onClick={handleClick} className={buttonStyle}>
  クリック
</button>
```

### 見出しの階層
- `<h1>`〜`<h6>`は階層構造を守る
- `<h1>`の後に`<h3>`を置かない（`<h2>`を飛ばさない）
- 見た目のサイズはCSSで調整

---

## 15. URL状態管理（nuqs）

### 概要
検索・フィルタリング画面など、URLクエリパラメータと状態を同期させる場合は**nuqs**を使用する。
`useState`でURLと状態を別々に管理しない。

### 使用場面
| 場面 | nuqs使用 | 備考 |
|------|----------|------|
| 検索条件 | ○ | URLで共有・ブックマーク可能にする |
| フィルタ | ○ | ページリロードで状態を維持 |
| ソート順 | ○ | URLで状態を表現 |
| ページネーション | ○ | ページ番号をURLに反映 |
| モーダル開閉 | △ | 必要に応じて |
| フォーム入力中 | ✕ | 送信後にURLに反映する場合のみ |

### ファイル構成
ページディレクトリに`searchParams.ts`を作成してパーサーを定義する。

```
src/app/(main)/scenarios/
├── page.tsx              # Server Component
├── searchParams.ts       # nuqsパーサー定義
└── _components/
    └── ScenariosContent.tsx  # Client Component（useQueryStates使用）
```

### パーサー定義

**searchParams.ts**:
```typescript
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

// ソートオプションの型
const sortOptions = ['newest', 'rating', 'playtime_asc', 'playtime_desc'] as const
type SortOption = (typeof sortOptions)[number]

// パーサー定義（Server/Client共通で使用）
export const searchParamsParsers = {
  systems: parseAsArrayOf(parseAsString).withDefault([]),
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  minPlayer: parseAsInteger,
  maxPlayer: parseAsInteger,
  minPlaytime: parseAsInteger,
  maxPlaytime: parseAsInteger,
  q: parseAsString.withDefault(''),
  sort: parseAsStringLiteral(sortOptions).withDefault('newest'),
}

// Server Component用キャッシュ
export const searchParamsCache = createSearchParamsCache(searchParamsParsers)

export type { SortOption }
```

### Server Componentでの使用

```typescript
// page.tsx
import { searchParamsCache } from './searchParams'

export default async function ScenariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Server側でURLパラメータをパース
  const params = await searchParamsCache.parse(searchParams)

  // パースされた型安全な値を使用
  const { systems, tags, minPlayer, sort } = params

  // データ取得...
}
```

### Client Componentでの使用

```typescript
'use client'

import { useQueryStates } from 'nuqs'
import { useTransition } from 'react'
import { searchParamsParsers } from '../searchParams'

export const SearchContent = () => {
  const [isPending, startTransition] = useTransition()

  const [queryParams, setQueryParams] = useQueryStates(searchParamsParsers, {
    history: 'push',        // ブラウザ履歴に追加
    scroll: false,          // スクロール位置を維持
    shallow: false,         // Server Componentを再実行
    startTransition,        // トランジションでラップ
  })

  const handleSearch = async (systems: string[]) => {
    await setQueryParams({ systems })
  }

  // ...
}
```

### NuqsAdapterの設定
`layout.tsx`で`NuqsAdapter`をラップする必要がある。

```typescript
// src/app/layout.tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  )
}
```

### Zodとの連携時の注意
フォームでnuqsと連携する場合、数値フィールドの空文字列処理に注意する。

```typescript
// NG - 空文字列がNaNに変換されてバリデーション失敗
const schema = z.object({
  minPlayer: z.coerce.number().min(1).max(20).optional(),
})

// OK - 空文字列をundefinedに変換してから処理
const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : val),
    z.coerce.number().min(min).max(max).optional(),
  )

const schema = z.object({
  minPlayer: optionalNumber(1, 20),
})
```

### パーサーの種類
| パーサー | 用途 | 例 |
|----------|------|-----|
| `parseAsString` | 文字列 | 検索キーワード |
| `parseAsInteger` | 整数 | ページ番号、件数 |
| `parseAsBoolean` | 真偽値 | フラグ |
| `parseAsArrayOf(...)` | 配列 | 複数選択フィルタ |
| `parseAsStringLiteral([...])` | リテラル型 | ソート順 |
| `parseAsJson<T>()` | JSON | 複雑なオブジェクト |

### 注意事項
- パーサーは`nuqs/server`からインポート（Server/Client両方で使用可能）
- `useQueryStates`は`nuqs`からインポート（Client専用）
- `shallow: false`を指定するとServer Componentが再実行される
- デフォルト値は`.withDefault()`で設定

---

## 16. 禁止事項

- `any`型の使用
- `!`（Non-null assertion）の使用
- `console.log`の本番コードへの残留
- マジックナンバー・マジックストリング
- インラインスタイル（style属性）
- `var`の使用
- `==`による比較（`===`を使用）
- 未使用のimport・変数（Biomeで自動検出）
- フォームの状態管理に`useState`を使用すること（React Hook Formを使用）
- Zodを使用しないフォームバリデーション
- セマンティックHTMLを無視した実装（`<div>`の乱用、border-topで区切り線等）
- URLと同期すべき状態を`useState`で管理すること（nuqsを使用）