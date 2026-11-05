<!--
  ⚠️ このファイルは自動生成です。直接編集しないこと。
  生成元: .claude/harness/agents-preamble.md + .claude/rules/<whitelist>
  再生成: pnpm gen:agents （scripts/gen-agents-md.mjs）
  規約を変えるときは .claude/rules/*.md または上記プリアンブルを編集し、再生成すること。
  同期は lefthook pre-commit が自動で行う（--check でドリフト検出）。
-->

# AGENTS.md

This file provides guidance to Codex agents working with code in this repository.

## Project Overview

TRPG（テーブルトークRPG）のシナリオとセッションを管理するWebアプリケーション。

## Communication Style

- ユーザーの提案や意見に対して、技術的に問題がある場合は明確に反論すること
- 「その通りです」「良いアイデアですね」等の同調から入らない。まず技術的な評価を述べる
- 間違いを指摘する際は遠慮せず、根拠とともに代替案を提示する
- ユーザーが間違っている場合、同意してから修正するのではなく、最初から正しい方向を示す
- コードレビューでは「問題なし」より「問題の発見」を優先する姿勢で臨む

## Commands

| コマンド | 用途 |
|---------|------|
| `pnpm dev` | 開発サーバー起動（Turbopack、port 3000固定） |
| `pnpm build` | ビルド |
| `pnpm check` | Biome lint + format（編集用） |
| `pnpm quality:changed --base <ref>` | lint・型・unit/tools・全体台帳・関連runner・receiptを共通検査 |
| `pnpm check:ci` | Biome readonly検査 |
| `pnpm e2e:ledger:staged` | index上の台帳schema・ID・参照検査 |
| `pnpm vitest` | Vitest ユニットテスト（`vitest run` のエイリアス） |
| `pnpm storybook` | Storybook（port 6006） |
| `pnpm prepare` | PandaCSS コード生成（トークン変更後は必須） |

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: PostgreSQL (Supabase) — Supabase JS Client
- **Styling**: PandaCSS（`@/styled-system/*`）
- **UI**: Ark UI + 自作コンポーネント
- **Linter/Formatter**: Biome（インデント2スペース、シングルクォート、セミコロンなし）
- **Testing**: Vitest + Storybook + Playwright
- **Hosting**: Cloudflare Pages (via OpenNext)

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証グループ
│   └── (main)/            # メイングループ
│       └── [feature]/
│           ├── page.tsx        # ページ（Server Component）
│           ├── interface.ts    # 型定義
│           ├── adapter.ts      # DB操作
│           ├── styles.ts       # スタイル定義
│           └── _components/    # ページ固有コンポーネント
├── components/
│   ├── elements/          # 基本コンポーネント
│   └── blocks/            # 複合コンポーネント
├── db/                    # Supabase型・ヘルパー（types.ts は生成物）
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティ
├── types/                 # 共通型定義（result.ts 等）
└── styles/                # PandaCSSトークン・レシピ（tokens/, semanticTokens.ts）
```

## Key Patterns

| パターン | 概要 | 詳細（下記ミラー） |
|---------|------|---------|
| DBアクセス | `createClient()` + Supabase生成型（`src/db/types.ts`） | - |
| 型安全ルーティング | `typedRoutes: true` | - |
| パスエイリアス | `@/*` → `src/*` | - |
| Result型 | `ok`, `err` でエラーハンドリング | `error-handling.md` |
| Null/Undefinedチェック | `ramda` の `isNil` を使用 | `error-handling.md` |
| スタイル分離 | 同階層の `styles.ts` に定義 | `styling-rules.md` |
| デザイントークン | colors(base=OKLCH)/semanticTokens(意味)の2層。生値直書き禁止 | `styling-rules.md` |
| 楽観的更新 | `useOptimistic` + `useTransition` | `react-rules.md` |
| フォーム | React Hook Form + Zod。useState でフォーム管理しない | `form-rules.md` |
| アイコン | `@phosphor-icons/react/ssr` を使用（`/ssr` 必須・絵文字禁止） | `icons.md` |
| ログ出力 | LogTape を使用（console 禁止） | `logging.md` |

## Database Schema

主要テーブル: `users`, `scenarios`, `scenario_systems`, `scenario_tags`, `tags`,
`game_sessions`, `session_participants`, `session_availability_time_blocks`,
`game_schedule_time_blocks`, `session_links`, `video_links`, `user_reviews`,
`user_scenario_preferences`, `feedbacks`, `feedback_comments`, `feedback_votes`,
`notifications`

- ID生成: ULID（26文字）
- タイムスタンプ: `created_at`, `updated_at` は自動設定。Supabase REST は `string`(ISO) を返す（`Date` ではない）

## Deployment

- **本番環境**: Cloudflare Pages
- **ビルド**: `pnpm build:cloudflare`
- **デプロイ**: `pnpm deploy`
- **本番URL**: https://scenario-manager.kotyabuchi.workers.dev

---

# コーディング規約（全文ミラー）

> 以下は `.claude/rules/` の各ルールファイルの全文。Codex はこの内容を必ず遵守すること。
> 出典は各セクション冒頭の `source:` コメントを参照。

<!-- source: .claude/rules/coding-standards.md -->

# コーディング規約

このファイルは基本的な規約のインデックスです。詳細な実装ガイドは個別のルールファイルを参照してください。

## ルールファイル一覧

| ファイル | 内容 |
|---------|------|
| `typescript-rules.md` | TypeScript厳格さ、型の導出原則（Single Source of Truth） |
| `react-rules.md` | コンポーネント定義、Server/Client Components、楽観的更新 |
| `styling-rules.md` | PandaCSS、スタイル定義ファイル、UIデザインガイドライン |
| `form-rules.md` | React Hook Form + Zod、URL状態管理（nuqs） |
| `error-handling.md` | Result型パターン、Null/Undefinedチェック |

---

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
- **イベントハンドラ**: `handle` プレフィックス + 動詞
- **カスタムフック**: `use` プレフィックス

---

## 3. Import順序

Biomeの設定により自動整理される。手動で書く場合は以下の順序:

1. React関連
2. 外部パッケージ
3. 内部モジュール（lib）
4. 相対パス
5. 型のみのインポート

---

## 4. コメント

### 言語
- コメント、JSDoc、TODO: **日本語**
- 変数名、関数名: **英語**

### JSDoc
公開APIや複雑なロジックには必ず記述。

### TODO/FIXME
```typescript
// TODO: ページネーション対応
// FIXME: N+1クエリを修正
```

---

## 5. Gitコミット

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

---

## 6. テスト

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
  it('クリック時にonClickが呼ばれる', () => { ... })
  it('disabled時はクリックできない', () => { ... })
})
```

---

## 7. ディレクトリ構造

### ページディレクトリの構成
```
src/app/(main)/scenarios/
├── page.tsx           # ページコンポーネント（Server Component）
├── styles.ts          # ページのスタイル定義
├── interface.ts       # ページで扱う型定義
├── adapter.ts         # DB操作関数
├── _components/       # ページ固有のコンポーネント
└── [id]/              # 動的ルート
```

### ファイルの責務
| ファイル | 責務 |
|----------|------|
| `page.tsx` | UIレンダリング、Server Component |
| `styles.ts` | スタイル定義（css, cva） |
| `interface.ts` | 型定義（Supabase生成型から導出） |
| `adapter.ts` | DB操作（Supabase Client） |
| `_components/` | ページ固有のUIコンポーネント |
| `actions.ts` | Server Actions（必要な場合） |

---

## 8. セマンティックHTML

**見た目ではなく意味に基づいてHTML要素を選択する。**

| 目的 | 正しい要素 | 誤った実装 |
|------|-----------|-----------|
| セクション区切り | `<hr>` | `border-top`を持つ`<div>` |
| ナビゲーション | `<nav>` | `<div>` |
| メインコンテンツ | `<main>` | `<div>` |
| ボタン | `<button>` | クリック可能な`<div>` |
| リンク | `<a>` | クリック可能な`<span>` |

見出しの階層:
- `<h1>`〜`<h6>`は階層構造を守る
- 見た目のサイズはCSSで調整

---

## 9. 禁止事項

- `any`型の使用
- `!`（Non-null assertion）の使用
- `console.log`の本番コードへの残留
- マジックナンバー・マジックストリング
- インラインスタイル（style属性）
- `var`の使用
- `==`による比較（`===`を使用）
- 未使用のimport・変数
- フォームの状態管理に`useState`を使用すること
- Zodを使用しないフォームバリデーション
- セマンティックHTMLを無視した実装
- URLと同期すべき状態を`useState`で管理すること

<!-- source: .claude/rules/typescript-rules.md -->

# TypeScript ルール

## 厳格さ

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

## 型定義

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

## 型の導出原則（Single Source of Truth）

**スキーマ・テーブル定義を Single Source of Truth（単一の信頼できる情報源）とする。**

型定義は以下の優先順位に必ず従うこと：

| 優先度 | 型の取得元 | 例 |
|--------|-----------|-----|
| 1 | ライブラリ公式の型 | `z.infer`, Supabase生成型, `FieldErrors` |
| 2 | 上記から推論された型 | `typeof schema` からの派生 |
| 3 | 最小限の独自型 | やむを得ない場合のみ |

## Supabase 生成型からの型導出

DB行データの型は `src/db/types.ts`（`supabase gen types typescript` で生成）から導出すること。

```typescript
// ✅ OK - Supabase生成型から導出
import type { Database } from '@/db/types'
type User = Database['public']['Tables']['users']['Row']
type NewUser = Database['public']['Tables']['users']['Insert']

// ❌ NG - テーブル定義と同等の独自型を作成
type User = {
  userId: string
  userName: string
  email: string | null
  createdAt: string
}
```

**注意**: Supabase REST APIはタイムスタンプを`string`（ISO形式）で返す。`Date`型ではない。

## Zod スキーマからの型導出

Zod スキーマが存在する場合、型定義は必ず `z.infer<typeof schema>` から取得すること。

```typescript
// schema.ts
export const userFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().optional(),
})

// ✅ OK - スキーマから型を導出
export type UserFormValues = z.infer<typeof userFormSchema>

// ❌ NG - スキーマと型を二重管理
export type UserFormValues = {
  name: string
  email: string
  age?: number
}
```

## React Hook Form との連携

React Hook Form の型もライブラリ提供の型を使用する。

```typescript
import { type FieldErrors, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// ✅ OK - ライブラリの型を使用
type FormProps = {
  errors?: FieldErrors<UserFormValues>
}

// ❌ NG - 独自の簡略化型
type FormProps = {
  errors?: Record<string, string>
}
```

## z.input と z.infer の使い分け

`.default()` や `.transform()` を含むスキーマでは、入力型と出力型が異なる場合がある。

```typescript
const schema = z.object({
  name: z.string(),
  isActive: z.boolean().default(false),  // 入力時は省略可能
})

// 入力型（フォームのdefaultValues用）
type FormInput = z.input<typeof schema>
// { name: string; isActive?: boolean }

// 出力型（パース後のデータ用）
type FormOutput = z.infer<typeof schema>
// { name: string; isActive: boolean }
```

## 禁止パターン

| パターン | 問題点 |
|----------|--------|
| `Record<string, any>` | 型安全性が失われる |
| `Record<string, string>` | ライブラリの型を無視している |
| スキーマと同等の独自型 | 二重管理でズレが生じる |
| プリミティブへの安易な変換 | 型情報が失われる |

```typescript
// ❌ すべて禁止
type Errors = Record<string, string>           // FieldErrors を使う
type User = { id: string; name: string }       // Supabase生成型 を使う
type FormData = { [key: string]: unknown }     // z.infer を使う
```

## まとめ

1. **DBテーブル** → `Database['public']['Tables'][T]['Row']` / `['Insert']`（Supabase生成型）
2. **Zod スキーマ** → `z.infer<typeof schema>` / `z.input<typeof schema>`
3. **React Hook Form** → `FieldErrors<T>`, `UseFormReturn<T>` 等
4. **独自型は最終手段** → 上記で対応できない場合のみ

<!-- source: .claude/rules/react-rules.md -->

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

## Storybook（必須）

**すべてのUIコンポーネントにStorybookを用意する。**

データやアカウントを用意しなくても各状態を確認できるようにするため、コンポーネント作成・リファクタリング時にStoriesファイルも必ず作成する。

### 対象
- `src/components/elements/` 配下の基本コンポーネント
- `src/components/blocks/` 配下の複合コンポーネント
- `src/app/*/_components/` 配下のページ固有コンポーネント（ダイアログ、モーダル、フォーム等）

### 対象外
- `page.tsx`, `layout.tsx` 等のNext.js固有ファイル
- `styles.ts`, `schema.ts`, `adapter.ts` 等の非UIファイル

### Stories に含めるべき状態
- デフォルト状態
- 主要なバリエーション（Props違い）
- インタラクション状態（入力中、送信中、エラー等）
- エッジケース（データなし、長文テキスト等）

### Server Actionsのモック
Server Actionsを受け取るコンポーネントでは、Storybookの`args`でモック関数を渡す:

```typescript
export const Default: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Mock submit:', data)
    },
  },
}
```

---

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

<!-- source: .claude/rules/styling-rules.md -->

# スタイリング (PandaCSS)

## スタイル定義ファイル

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

## CSS関数の命名規則

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

## レシピの使用

```typescript
import { button } from '@/styled-system/recipes'

<button className={button({ variant: 'primary', size: 'md' })}>
```

## トークンの活用

- **トークンの確認にはPandaCSS MCPツールを使用する**（ファイル直読みより優先）
- スペーシング: 数値トークン (`4`, `8`, `16`) を使用
- マジックナンバー禁止

### PandaCSS MCP（トークン確認時は必ず使用）

トークン・レシピ・パターンを確認する際は、ファイルを直接読む前にPandaCSS MCPツールを使用すること。
MCPツールはPandaCSSが設定を解析済みの構造化データとして返すため、正確な実効値を取得できる。

| 用途 | MCPツール | 従来の方法（非推奨） |
|------|-----------|-------------------|
| トークン値の確認 | `get_tokens` | `src/styles/tokens/*.ts` を読む |
| セマンティックトークン確認 | `get_semantic_tokens` | `src/styles/semanticTokens.ts` を読む |
| カラーパレット確認 | `get_color_palette` | `src/styles/tokens/colors.ts` を読む |
| レシピ・バリアント確認 | `get_recipes` | `src/styles/recipes/*.ts` を読む |
| パターン確認 | `get_patterns` | ドキュメントを確認 |
| 使用状況分析 | `get_usage_report` | Grep で検索 |

**注意**: トークンの**追加・変更**時は引き続き該当ファイルを直接編集する。MCPは読み取り専用。

## トークンの2層構造と追加ルール（乱立防止・厳守）

色は必ずトークンで定義し、コンポーネントに生の色値をハードコードしない。トークンは **2層** に分け、役割を混ぜない。

| 層 | ファイル | 役割 | 命名 | 値の形式 |
|----|---------|------|------|---------|
| **base（`colors`）** | `src/styles/tokens/colors.ts`（+`colorValues.ts`） | **ベースカラーの定義そのもの**。色相・明度のパレット。意味は持たない | 色相＋段階（`green.500`, `gray.100`, `paperBorder.50`） | **すべて OKLCH** |
| **semantic（`semanticTokens`）** | `src/styles/semanticTokens.ts` | base に **意味・役割を与えた別名**。コンポーネントはこちらを参照 | 用途・役割（`bg.card`, `text.body`, `border.default`） | base への参照（`{colors.green.500}`） |

- **`colors` と `semanticTokens` は別物**。`colors`＝「どんな色があるか」、`semanticTokens`＝「その色を何に使うか」。semantic は必ず base を参照し、**semantic やコンポーネントに生の色値（oklch/hex）を直書きしない**。
- コンポーネントが参照するのは原則 **semantic トークン**。base を直接参照するのは意味付け不要な純粋な色相利用（例: `systemBadge.green`）に限る。

**トークン追加ルール（同じ色のトークンを乱立させないため）:**

1. **まず既存で賄えないか探す**（PandaCSS MCP の `get_tokens` / `get_semantic_tokens` で確認）。
2. **その追加は本当に必要か問う**。既存の役割トークンに寄せられるなら追加しない。「この画面専用」の色を増やさない。
3. **base への追加は OKLCH で**、同一 L/C ランプ・同一トーン設計を崩さない（色相のみ変える）。
4. **semantic の命名は汎用的・カテゴリー的に**。詳細で固有の名前（`scenarioDetailHeadDivider` 等）は避け、**再利用できる役割名**（`border.subtle`, `bg.card`, `text.secondary`）を付ける。画面名プレフィックス（`landing.*` 等）は乱立の予兆。

> DB 由来の動的色（`tags.color`）は例外系統。OKLCH 保存＋CSS変数注入で `Tag`→`Pill tone="custom"` に隔離する（下記「データ駆動の動的色」）。

## UI Design Guidelines

プロジェクト全体のUIトーン: **モダン × ソフト × レイヤードUI**

**UI実装時は `ui-design-system.md` メモリを必ず参照すること。**

| 原則 | 説明 |
|------|------|
| ボーダーレス基調 | 境界線は基調として避け、輪郭は影で表現する。ただし border が最適な箇所では意図的に使ってよい（下記） |
| 面で区切る | 各情報ブロックは「面」として認識できること |
| 影で階層化 | 階層差は影の強弱で表現する |
| 余白で構造化 | 背景色と余白によって情報の階層を表現する |
| セマンティックHTML | 見た目ではなく意味に基づいて要素を選択 |

**border の使い分け（基調はボーダーレス、border は限定許可）**

判断基準は elevation の意味: **浮かせたい＝影 / 同じ高さで区切りたい＝border**。

| border を使う（最適な場面） | 従来どおり影で表す |
|------|------|
| フォーカスリング（`borders.focusRing`） | カードの輪郭（`card.default`） |
| 入力欄のアフォーダンスが必要な箇所 | 浮かせたい面（パネル/メニュー/ダイアログ） |
| 高密度な表・リスト行の区切り（影だと重い） | チップ/タグの外形 |
| 同一 elevation の面どうしの境界 | ホバーで持ち上がる要素 |
| 半透明背景・画像上の要素の輪郭（影が効かない） | |
| 選択/アクティブ状態の強調（例: 選択カードに `primary` border） | |

border は必ず既存トークン（`border.{default,subtle,focus,error}` / `borders.soft`）を参照する。`1px solid #...` のハードコードは禁止。

**実装パターン** - セマンティックトークンを使用:
- カード: `shadow: 'card.default', _hover: { shadow: 'card.hover' }`
- チップ: `bg: 'chip.default', shadow: 'chip.default'`
- オーバーレイ: `bg: 'overlay.light'` または `'overlay.dark'`
- 区切り線: `border-top`ではなく`<hr>`要素を使用
- 入力フィールド: border なし、bg を少し暗く

**重要**: 新しい色・影・サイズを追加する場合は、必ず`src/styles/semanticTokens.ts`にトークンとして定義し、コンポーネントではトークン名を参照すること。コンポーネント側のスタイルに生の色値（`rgba(...)`, `oklch(...)`等）を直接書かない。

**カラートークンは OKLCH 直書き**: パレット本体 `src/styles/tokens/colors.ts` は **OKLCH** で定義する（全ファミリーで同一の L/C ランプを共有し色相のみ変える同一トーン設計）。「OKLCH禁止・HEX」の旧方針は撤回。ただしこれは**トークン定義ファイルの話**で、コンポーネント側は引き続きトークン名を参照する（生の oklch を直書きしない）。

### 例外: データ駆動の動的色（DB管理カラー）

DB 等から来る**動的な色**（例: `tags.color`）はクラス事前生成が不可能なため、以下を限定的に許可する。**静的な色はこの例外の対象外**（従来どおり HEX トークン固定）。

| 通常の禁止 | 動的色での例外 |
|---|---|
| OKLCH 形式 | **OKLCH を許可**（基準色を保存し、明度を振って bg/text を導出するとコントラストを担保しやすい） |
| インラインスタイル（style属性） | **CSS 変数注入に限り `style` を許可**（例: `style={{ '--pill-bg': ..., '--pill-text': ... }}`） |

実装の隔離: 動的色は専用コンポーネント（例: `Tag` → `Pill` の `tone="custom"`）に閉じ込め、汎用コンポーネントには波及させない。導出ロジックは `src/lib/tagColor.ts`。

<!-- source: .claude/rules/form-rules.md -->

# フォームルール

## フォームライブラリ

- **React Hook Form**を使用してフォームの状態管理を行う
- 標準のReact state (`useState`) でフォームを管理しない

## バリデーション

- **必ずZodでバリデーションスキーマを定義する**
- `@hookform/resolvers/zod`を使用してReact Hook Formと連携する
- バリデーションスキーマはフォームコンポーネントと同階層に配置

## ファイル構成

- **Zodスキーマは必ず別ファイル（`schema.ts`）に分離する**
- スキーマファイルはフォームコンポーネントと同階層に配置

```
src/app/(main)/users/me/
├── page.tsx
├── _components/
│   ├── ProfileEditForm.tsx    # フォームコンポーネント
│   └── schema.ts              # Zodスキーマ定義
```

## 実装例

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

## 注意事項

- フォームの型は`z.infer<typeof schema>`でスキーマから導出する
- スキーマと型は`schema.ts`からエクスポートして使用する
- Server Actionsと組み合わせる場合も、クライアント側でZodバリデーションを行う
- エラーメッセージは日本語で記述する

---

# URL状態管理（nuqs）

## 概要

検索・フィルタリング画面など、URLクエリパラメータと状態を同期させる場合は**nuqs**を使用する。
`useState`でURLと状態を別々に管理しない。

## 使用場面

| 場面 | nuqs使用 | 備考 |
|------|----------|------|
| 検索条件 | ○ | URLで共有・ブックマーク可能にする |
| フィルタ | ○ | ページリロードで状態を維持 |
| ソート順 | ○ | URLで状態を表現 |
| ページネーション | ○ | ページ番号をURLに反映 |
| モーダル開閉 | △ | 必要に応じて |
| フォーム入力中 | ✕ | 送信後にURLに反映する場合のみ |

## ファイル構成

ページディレクトリに`searchParams.ts`を作成してパーサーを定義する。

```
src/app/(main)/scenarios/
├── page.tsx              # Server Component
├── searchParams.ts       # nuqsパーサー定義
└── _components/
    └── ScenariosContent.tsx  # Client Component（useQueryStates使用）
```

## パーサー定義

```typescript
// searchParams.ts
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

const sortOptions = ['newest', 'rating', 'playtime_asc', 'playtime_desc'] as const

export const searchParamsParsers = {
  systems: parseAsArrayOf(parseAsString).withDefault([]),
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  minPlayer: parseAsInteger,
  maxPlayer: parseAsInteger,
  q: parseAsString.withDefault(''),
  sort: parseAsStringLiteral(sortOptions).withDefault('newest'),
}

export const searchParamsCache = createSearchParamsCache(searchParamsParsers)
```

## 使用例

**Server Component**:
```typescript
import { searchParamsCache } from './searchParams'

export default async function ScenariosPage({ searchParams }) {
  const params = await searchParamsCache.parse(searchParams)
  const { systems, tags, minPlayer, sort } = params
  // データ取得...
}
```

**Client Component**:
```typescript
'use client'
import { useQueryStates } from 'nuqs'
import { useTransition } from 'react'
import { searchParamsParsers } from '../searchParams'

export const SearchContent = () => {
  const [isPending, startTransition] = useTransition()
  const [queryParams, setQueryParams] = useQueryStates(searchParamsParsers, {
    history: 'push',
    scroll: false,
    shallow: false,
    startTransition,
  })
  // ...
}
```

## Zodとの連携時の注意

数値フィールドの空文字列処理に注意:

```typescript
// OK - 空文字列をundefinedに変換してから処理
const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : val),
    z.coerce.number().min(min).max(max).optional(),
  )
```

## パーサーの種類

| パーサー | 用途 | 例 |
|----------|------|-----|
| `parseAsString` | 文字列 | 検索キーワード |
| `parseAsInteger` | 整数 | ページ番号、件数 |
| `parseAsBoolean` | 真偽値 | フラグ |
| `parseAsArrayOf(...)` | 配列 | 複数選択フィルタ |
| `parseAsStringLiteral([...])` | リテラル型 | ソート順 |
| `parseAsJson<T>()` | JSON | 複雑なオブジェクト |

<!-- source: .claude/rules/error-handling.md -->

# エラーハンドリング

## Result型パターン

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

## 使用例

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

## Server Actionsでのエラー

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

## Null/Undefinedチェック

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

<!-- source: .claude/rules/logging.md -->

# Logging（ログ出力）

## 使用ライブラリ

**LogTape** (`@logtape/logtape`)

本番コードでは `console.log` / `console.error` / `console.warn` を使用しない。
必ず `src/lib/logger.ts` の `getAppLogger()` でロガーを取得して使用する。

## 初期化

`src/instrumentation.ts` の `register()` 関数でアプリ起動時に1回だけ初期化される（Next.js Instrumentation機能）。

## カテゴリ設計

`["app", "機能名"]` の形式で指定する。

| カテゴリ | 用途 |
|----------|------|
| `["app", "auth"]` | 認証関連 |
| `["app", "upload"]` | ファイルアップロード |
| `["app", "feedback"]` | フィードバック |
| `["app", "sessions"]` | セッション管理 |
| `["app", "scenarios"]` | シナリオ管理 |

新しい機能を追加する場合は `["app", "新機能名"]` のカテゴリを使用する。

## ログレベルの使い分け

| レベル | 用途 | 本番出力 |
|--------|------|----------|
| `error` | 操作失敗・例外キャッチ | ○ |
| `warn` | 注意が必要だが動作は継続 | ○ |
| `info` | 重要な処理の記録 | ✕ |
| `debug` | 開発時のみ必要な情報 | ✕ |

## 使用例

```typescript
import { getAppLogger } from '@/lib/logger'

const logger = getAppLogger(['app', 'auth'])

// テンプレートリテラル構文を使用（構造化ログ対応）
logger.error`認証コールバックでエラー発生: ${error}`
logger.warn`ファイルサイズ超過: ${fileSize}`
logger.info`ユーザーログイン完了: ${userId}`
logger.debug`リクエストパラメータ: ${params}`
```

## 例外

- テストコード内の `console.warn` / `console.error` は許容（テスト用途）
- HTMLテンプレートリテラル内のブラウザ側スクリプト（`<script>` 内等）は、サーバー側ライブラリのLogTapeが使用できないため `console` を使用してよい

<!-- source: .claude/rules/icons.md -->

# Icons（アイコン）

## プロジェクト方針

**絵文字（emoji）は一切使用せず、`@phosphor-icons/react` のSVGアイコンコンポーネントを使用する。**

## Weight バリアント

Phosphor Icons は6種類の weight バリアントを提供する:

| weight | 用途 |
|--------|------|
| `regular`（デフォルト） | 通常のアウトラインアイコン |
| `fill` | 塗りつぶし（お気に入りON、選択状態等） |
| `bold` | 太線（強調、spinner等） |
| `light` | 細線 |
| `thin` | 極細線 |
| `duotone` | 二色調 |

## サイズ

デフォルトは `"1em"`（親の font-size に追従）。固定サイズが必要な場合は `size` prop を指定:

```typescript
<Star size={16} />        // 固定16px
<Star />                  // 親のfont-sizeに追従
```

## Import パス（重要）

**全ファイルで `@phosphor-icons/react/ssr` から import する。**

```typescript
// OK - SSR 互換（Server/Client 両方で動作）
import { Star, Calendar } from '@phosphor-icons/react/ssr'

// NG - Server Component で createContext エラーになる
import { Star, Calendar } from '@phosphor-icons/react'
```

`@phosphor-icons/react` は内部で `React.createContext()` を使用するため、Server Component で直接 import するとビルドエラーになる。`/ssr` エントリポイントは context を使わないため安全。

## 使用例

```typescript
// NG - 絵文字の使用
<span>★</span>
<span>📅</span>
<button>✏️ 編集</button>

// OK - @phosphor-icons/react/ssr の使用
import { Star, Calendar, PencilSimple } from '@phosphor-icons/react/ssr'

<Star weight="fill" color={styles.colors.filled} />
<Calendar size={16} />
<button><PencilSimple size={16} /> 編集</button>
```

## よく使うアイコン

| 用途 | @phosphor-icons/react |
|------|----------------------|
| お気に入り | `Star`, `Heart` |
| 編集 | `PencilSimple`, `PencilLine` |
| 削除 | `Trash`, `X` |
| メニュー | `DotsThreeVertical`, `List` |
| カレンダー | `Calendar`, `CalendarX` |
| 時間 | `Clock`, `Timer` |
| ユーザー | `User`, `Users`, `UserPlus` |
| チェック | `Check`, `CheckCircle` |
| 警告 | `Warning`, `WarningCircle` |
| 情報 | `Info` |
| リンク | `Link`, `ArrowSquareOut` |
| 共有 | `ShareNetwork` |
| 再生 | `Play`, `PlayCircle`, `FilmSlate` |
| 非表示 | `EyeSlash` |
| 表示 | `Eye` |
| 戻る | `ArrowLeft`, `CaretLeft` |
| 検索 | `MagnifyingGlass`, `MagnifyingGlassMinus` |
| フィルター | `Funnel` |
| 設定 | `GearSix` |
| ログイン/ログアウト | `SignIn`, `SignOut` |
| ローダー | `SpinnerGap` |
| アップロード | `UploadSimple` |
| コピー | `Copy` |
| サイドバー | `SidebarSimple` |

<!-- source: .claude/rules/accessibility.md -->

# Accessibility Guidelines (WCAG 2.1 AA準拠、コントラストを除く)

本プロジェクトは、**コントラスト比を除き** WCAG 2.1 AA 基準に準拠したアクセシビリティを確保する。

> **コントラスト比の方針（正典）**: 本プロジェクトは**コントラスト比をAA厳守の対象としない**（ブランドの色味を優先するユーザー判断）。カラーパレットは同一トーン設計（`color-system-oklch` メモリ / `src/styles/tokens/colors.ts`）で、AA を満たさない組み合わせも意図的に許容する。E2E の axe チェックも `disableRules(['color-contrast'])` で無効化している（`testing-patterns.md`）。
> したがって**コントラスト比は「厳守すべき必須要件」ではなく「目標・推奨」**として扱う。レビューでコントラスト不足を検出しても `required`（マージ阻止）ではなく `recommended`/情報提供に留める。
> 一方、**コントラスト以外の a11y（フォーカス管理・キーボード操作・セマンティックHTML・ARIA・色以外での情報伝達）は引き続き必須**とする。

## コントラスト比の目安（厳守しない・目標値）

以下は**目標値**であり、ブランド色味を優先する場合は逸脱してよい。

| 要素 | 目標コントラスト比 | 備考 |
|------|-------------------|------|
| 通常テキスト | 4.5:1 | 本文、ラベル、ボタンテキスト。可読性の観点で可能な限り確保 |
| 大きいテキスト | 3:1 | 18pt以上、または14pt太字以上 |
| UIコンポーネント | 3:1 | アイコン、ボーダー、フォーカスリング |
| 非活性要素 | - | 要件なし |

## 色の使用ガイドライン

**必須（コントラストを除く a11y の核心）**:
- 色だけに依存せず、アイコン・テキスト・形状でも情報を伝える
- フォーカス状態は2px以上のフォーカスリングで明示

**目標（厳守しない）**:
- テキストと背景のコントラスト比を可能な範囲で確保（OKLCH明度差0.45以上を目安）

**推奨される色の組み合わせ**:
- 淡い背景（明度0.90以上）+ 暗いテキスト（明度0.40以下）
- 暗い背景（明度0.50以下）+ 白テキスト
- 中間色の背景は避ける（コントラスト確保が困難）

**非推奨（可読性のため避けるのが望ましいが、ブランド判断で許容されうる）**:
- primary.500などの中間明度色に白テキストを直接配置
- placeholderを薄すぎる色にする（明度0.60以下を使用）

## フォーカス管理

- すべてのインタラクティブ要素にフォーカス可能
- フォーカス順序は論理的な読み順に従う
- フォーカスリングは`borders.focusRing`トークン（`semanticTokens.ts`で定義）を使用
- キーボードナビゲーション対応（Tab, Enter, Space, Escape, 矢印キー）

## セマンティックHTML

- 適切なHTML要素を使用（`<button>`, `<a>`, `<nav>`, `<main>`等）
- 見出しは階層構造を守る（h1→h2→h3）
- フォーム要素には`<label>`を関連付け
- 画像には適切な`alt`属性

## Ark UIの活用

Ark UIはアクセシビリティ対応済みのコンポーネントを提供。以下を活用：
- Dialog（モーダル）: フォーカストラップ、Escapeで閉じる
- Menu: キーボードナビゲーション対応
- Tooltip: スクリーンリーダー対応
- Select/Combobox: ARIA属性自動付与

<!-- source: .claude/rules/testing-patterns.md -->

# テスト安定化パターン（プロジェクト固有のノウハウ）

E2E（Playwright）と UT（Vitest）を**グリーンに保つ**ための、このプロジェクトで実証済みの知見。
新規テスト作成・既存テスト修正・UIリデザイン時に必ず参照すること。

> 出典: 2026-06 のテストグリーン化作業（E2E 63失敗 → 286 passed）。経緯は `.claude/PROGRESS.md` の「E2Eテスト失敗の分類と対応方針」参照。

---

## 1. 共通品質ゲートと実行範囲

PR前の標準入口は `pnpm quality:changed --base <比較元ref>`。readonly lint → 型 → pure/unit/tools → 全体の静的台帳検査 → 関連runner → 保存receipt再照合の順で実行する。比較元・HEAD・index・working bytesを固定し、途中変更は失敗にする。検査前の整形には `pnpm check`、検査自体には変更しない `check:ci` を使う。

| コマンド | 用途 |
|---------|------|
| `pnpm quality:changed --base HEAD` | 作業中の変更を検査。既定は部分実行と全件shadowの比較も行う |
| `pnpm quality:changed --base <ref> --all` | 共通品質前段と全required・全legacy-local |
| `pnpm quality:changed --base <ref> --no-shadow` | 関連実行のみ。全件比較なしと記録し、全体保証と扱わない |
| `pnpm e2e:ledger:check --base <ref>` | 抽出・台帳・全登録・不足baselineの静的整合 |
| `pnpm e2e:verify:all` | runtime単独の全件検証。lint/型/静的M1の代替ではない |
| `pnpm test:unit` / `pnpm test:e2e-tools` | DB不要のunit / 抽出・台帳・runner基盤の回帰 |
| `pnpm e2e:ledger:staged` | index上の台帳schema・ID・参照だけを検査 |

- ownerが専用local SupabaseとNext productionを起動する。Next 43100、Supabase 57321/57322、Storybook 6007を使い、既存プロセスを流用・killしない。終了後は所有runのprocess/container/network/volume/lockと認証情報を回収する。復旧は `docs/testing/e2e-environment.md` を参照。
- `test:e2e` / `test:e2e:dev` / `:ui` / `:headed` は旧設定の個別調査用であり、品質ゲートの成功証拠にしない。共通ゲートに共有cloud key/email/passwordを渡さない。
- `test-results/quality/changed.json` は最新品質サマリー。照合にはunique ID配下のplan/receipt/inputs-start/inputs-endを使い、latestの成功を流用しない。
- skip/fixme/xfail/retry後成功/中断/登録不足/cleanup不足は必須caseの成功にしない。legacyの既存例外は明示目録の一致だけを確認し、requiredの成功件数に混ぜない。deferred-liveと旧integrationは未実行として残す。
- docs-onlyは独立NoOp証明が成立した場合だけ許す。unknownな変更や未解決の依存は全requiredへ戻し、未検証領域の存在を表示する。
- hookの台帳検査はindexのJSONだけが対象。未stageのtestやTS型検査をcommit内容の証明にしない。通常の `git add` → `git commit` を使う。別indexを使うpath限定commitは明示的に拒否する。PR前とCIの全体ゲートは省略しない。

---

## 2. E2E セレクタの鉄則

UIリデザインで**最も壊れるのがセレクタ**。次を守ると stale 化に強い。

- **role + アクセシブル名を第一候補**にする: `getByRole('button'|'link'|'menuitem'|'combobox'|'option', { name })`。CSSクラス依存は避ける。
- **PandaCSS のクラスは使うな**: `className={styles.x}` はアトミックなハッシュ列になり「`styles.x`」という文字列は**含まれない**。`page.locator('[class*="voteSection"]')` のような部分一致は必ず壊れる。→ role / `aria-*` / `data-testid` を使う。
- **レスポンシブ重複は `.filter({ visible: true })`**: 同じテキスト/見出しが PC版・モバイル版で2つDOMに存在し strict-mode 違反になる。可視要素に限定する。
- **ナビは viewport 非依存に**: PC=ヘッダー nav / モバイル=BottomNav。`page.getByRole('navigation').getByRole('link', { name, exact: true }).filter({ visible: true })` で可視な方を選ぶ。
- **同名要素が複数あるなら `.first()`**: 例）詳細ページのアクションリンクが本体＋メニュー内に重複。
- **Ark UI コンポーネントの内部要素**:
  - Select の選択肢: `page.locator('[data-scope="select"][data-part="item"]').filter({ hasText: label })`。トリガーは role=`combobox`（aria-label 付き）。
  - Menu/SpeedDial の項目: `getByRole('menuitem', { name })`。
- **見出し/ラベルは実物を確認してから書く**: リデザインで「参加予定のセッション→予定されているセッション」「新着シナリオ→新着おすすめシナリオ」のように頻繁に変わる。`error-context.md`（test-results 配下の ARIA スナップショット）で実際のアクセシブル名を確認する。

---

## 3. 専用DB・fixtureと検証の責務

品質ゲートはrun専用local Supabaseを空DBからmigration/seedで復元し、ULID・actor・対象行をfixtureのjournalで管理する。共有cloudの既存データを前提にしない。

- 更新テストは所有fixtureだけを操作し、失敗してもjournalとowner cleanupを実行する。他ユーザーや別runのデータを掃除しない。
- 拒否・権限・原子性はintegration/DB側、画面の操作・エラー表示・再試行はStorybook/browser側で検証する。layerを増やしただけで業務assertionを実証したことにしない。
- 固定 `waitForTimeout` を避け、期待するUI/DB状態を待つ。既存skipを減らす際は失敗原因と解消の根拠を記録し、例外目録を正規のmigrationで更新する。
- 新caseはstable case/variant/binding IDと対象contractに結び、独立した反例で失敗するassertionをレビューする。成功件数、操作数、fingerprintの変化だけでは検証の質を判断しない。

---

## 4. 外部ネットワーク依存テスト

- **Server Action 経由のサーバー側 fetch は `page.route()` で傍受できない**（ブラウザ層ではないため）。
- 外部サイト（TALTO/BOOTH）にアクセスするテストは**明示オプトイン**にする: `E2E_LIVE_IMPORT=1` のときのみ実行し、既定スイートでは skip（`import.spec.ts` Tier2 が実例）。既定の決定論性と外部非依存を保つ。

---

## 5. a11y / コンポーネントの落とし穴（実バグ由来）

テスト整備中に発見した**実アプリのバグ**。同種の実装で再発させないこと。

- **`Button asChild`**: `asChild` 指定時は子要素をそのまま Slot に渡す（prefix/suffix のフラグメントで包むと Ark の Slot が単一子要素要求で壊れ**何も描画されない**）。Linkボタンは `<Button asChild><Link/></Button>`。`button.tsx` で対応済み。
- **`Select`（Ark UI）**: フォーム送信用の**隠し native `<select>`（HiddenSelect）にも `aria-label` を伝播**する。トリガーだけに付けると axe の `select-name` 違反。`select.tsx` で対応済み。
- **`NumberInput`（Ark UI）**: アクセシブル名は **`aria-label` を `<input>` に転送**して付ける。**`id` を外部から上書きしない**（Ark が内部 id を採番し増減ボタンの `aria-controls` が参照しているため、id 上書きで `aria-valid-attr-value` 違反になる）。
- **`FormField` の使い分け**: 単一入力は `id` を渡して `<label htmlFor>` 関連付け、複数入力グループは `id` 無しで `<fieldset><legend>`。ただし**Ark系（NumberInput/Select 等、内部 id を持つ）には FormField の `htmlFor` を当てず、コンポーネント側の `aria-label` で名前を付ける**。
- **フォームのクライアント検証エラー表示**: RHF の `formState.errors` を各セクションコンポーネントに**必ず渡す**（`externalErrors ?? formState.errors`）。渡し忘れると必須未入力でもエラーが画面に出ない（`SessionForm` で実際に発生）。
- **a11y E2E（axe）は実コンポーネントのバグ検出器**として有効。`disableRules(['color-contrast'])` 済みでも `label` / `select-name` / `aria-valid-attr-value` 等は実バグを拾う。

---

## 6. 進め方の原則

- **失敗を分類してから変更する**: 共通receiptのphase・required key・safe reportを確認し、実行不足、fixture不備、selectorのずれ、実装不具合を分ける。旧共有DBの成功で代替しない。
- **失敗は `test-results/<test名>/error-context.md`（ARIAスナップショット）で原因分類**: 「データが無い」のか「セレクタがズレた」のか「実バグ」かを、スナップショット内の実要素で判別する。
- **dev/prod 両モードで再現するか確認**: prod ビルド固有か切り分けるなら `pnpm test:e2e:dev` で同テストを回して比較する。

<!-- source: .claude/rules/terminology.md -->

# UI用語ルール

## 「スケジュール」と「日程」の使い分け

この2つは**異なる概念**に対する用語であり、統一しない。

| 用語 | 概念 | 使用場面 |
|------|------|---------|
| **スケジュール** | 参加者個人の空き時間（availability） | 空き時間の提出・表示 |
| **日程** | セッションの開催日時（confirmed date） | 開催日時の確定・状態表示 |

### フロー

1. 参加者が「**スケジュール**を提出」（自分の空き時間）
2. システムがおすすめ候補を算出
3. GMが「**日程**を確定」（セッション開催日時）

### 判断基準

- 主語が**参加者個人**の予定 → 「スケジュール」
- 主語が**セッション**の開催日時 → 「日程」
