# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TRPG（テーブルトークRPG）のシナリオとセッションを管理するWebアプリケーション。

## Commands

```bash
# 開発サーバー起動（Turbopack使用）
pnpm dev

# ビルド
pnpm build

# Lint & Format（Biome）
pnpm check          # lint + format を一括実行
pnpm lint           # lint のみ
pnpm format         # format のみ

# テスト
pnpm vitest         # テスト実行
pnpm vitest run     # CI用（watch無し）

# Storybook
pnpm storybook      # 開発サーバー起動（port 6006）

# PandaCSS コード生成
pnpm prepare
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: PostgreSQL (Supabase) — Supabase JS Client (REST API/RPC) でアクセス
- **Styling**: PandaCSS（styled-system は `@/styled-system/*` で参照）
- **UI**: Ark UI + 自作コンポーネント
- **Linter/Formatter**: Biome（シングルクォート、2スペースインデント）
- **Testing**: Vitest + Storybook + Playwright
- **Hosting**: Cloudflare Pages (via OpenNext)

### Deployment Environment

#### Cloudflare Pages + OpenNext
本番環境は **Cloudflare Pages** にデプロイ。Next.jsアプリを `@opennextjs/cloudflare` アダプターでCloudflare Workers互換に変換。

```bash
# ビルド（Cloudflare用）
pnpm build:cloudflare

# デプロイ
pnpm deploy
```

#### GitHub Actions（CI/CD）
`.github/workflows/deploy-cloudflare.yml` でmainブランチへのpush時に自動デプロイ。

**必要なSecrets**:
| Secret名 | 説明 |
|----------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare APIトークン |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareアカウントID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |

#### 本番URL
https://scenario-manager.kotyabuchi.workers.dev

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 認証グループ（login, signup）
│   └── (main)/             # メイングループ（home, scenarios, users）
│       └── [feature]/
│           ├── page.tsx        # ページコンポーネント（Server Component）
│           ├── styles.ts       # ページのスタイル定義
│           ├── interface.ts    # ページ用型定義（Supabase生成型から導出）
│           ├── adapter.ts      # DB操作関数（Supabase Client）
│           └── _components/    # ページ固有コンポーネント
├── components/
│   ├── elements/           # 基本コンポーネント（Button, Card等）
│   └── blocks/             # 複合コンポーネント（Header, SideMenu等）
├── db/
│   ├── types.ts            # Supabase生成型定義（supabase gen types）
│   ├── helpers.ts          # DB操作ヘルパー関数
│   └── enum.ts             # DB用Enum定義
├── hooks/                  # カスタムフック
├── lib/                    # ユーティリティ（db接続等）
│   └── seeds-data          # seeds用のデータ
├── types/                  # 共通型定義
│   └── result.ts           # Result型（ok, err, isOk, isErr）
└── styles/
    ├── preset.ts           # PandaCSS プリセット
    ├── recipes/            # コンポーネントレシピ
    └── tokens/             # デザイントークン
```

### Database Schema
主要テーブル: `users`, `scenarios`, `scenario_systems`, `tags`, `game_sessions`, `game_schedules`, `session_participants`, `user_reviews`, `user_scenario_preferences`, `video_links`

- ID生成: ULID（26文字）
- タイムスタンプ: `created_at`, `updated_at` は自動設定
- マイグレーション出力先: `./supabase/migrations`

### Key Patterns
- **DBアクセス**: `src/lib/supabase/server.ts` の `createClient()` を使用。型は `src/db/types.ts`（`supabase gen types` で生成）
- **型安全ルーティング**: `next.config.ts` で `typedRoutes: true` 有効
- **パスエイリアス**: `@/*` → `src/*`, `@/styled-system/*` → `styled-system/*`
- **Storybook**: コンポーネントと同階層に `.stories.tsx` を配置
- **Git Hooks**: pre-commit で Biome check、pre-push で型チェック
- **Result型**: エラーハンドリングは `@/types/result` の `ok`, `err` を使用
- **Null/Undefinedチェック**: `ramda` の `isNil` を使用（`null === x` は禁止）
- **スタイル分離**: CSSは同階層の `styles.ts` に定義しインポート
- **ページ構成**: `page.tsx` + `interface.ts`（型） + `adapter.ts`（DB操作） + `_components/`
- **楽観的更新（Optimistic Updates）**: 更新系UIは必ず楽観的更新を使用する（下記参照）
- **アイコン**: 絵文字は使用禁止。必ず `lucide-react` のSVGアイコンを使用する（下記参照）
- **ログ出力**: `console.log/error/warn` は本番コードで使用禁止。LogTape を使用する（下記参照）

### Logging（ログ出力）
**使用ライブラリ**: LogTape (`@logtape/logtape`)

本番コードでは `console.log` / `console.error` / `console.warn` を使用しない。
必ず `src/lib/logger.ts` の `getAppLogger()` でロガーを取得して使用する。

**初期化**: `src/instrumentation.ts` の `register()` 関数でアプリ起動時に1回だけ初期化される（Next.js Instrumentation機能）。

**カテゴリ設計**: `["app", "機能名"]` の形式で指定する。

| カテゴリ | 用途 |
|----------|------|
| `["app", "auth"]` | 認証関連 |
| `["app", "upload"]` | ファイルアップロード |
| `["app", "feedback"]` | フィードバック |
| `["app", "sessions"]` | セッション管理 |
| `["app", "scenarios"]` | シナリオ管理 |

新しい機能を追加する場合は `["app", "新機能名"]` のカテゴリを使用する。

**ログレベルの使い分け**:

| レベル | 用途 | 本番出力 |
|--------|------|----------|
| `error` | 操作失敗・例外キャッチ | ○ |
| `warn` | 注意が必要だが動作は継続 | ○ |
| `info` | 重要な処理の記録 | ✕ |
| `debug` | 開発時のみ必要な情報 | ✕ |

**使用例**:
```typescript
import { getAppLogger } from '@/lib/logger'

const logger = getAppLogger(['app', 'auth'])

// テンプレートリテラル構文を使用（構造化ログ対応）
logger.error`認証コールバックでエラー発生: ${error}`
logger.warn`ファイルサイズ超過: ${fileSize}`
logger.info`ユーザーログイン完了: ${userId}`
logger.debug`リクエストパラメータ: ${params}`
```

**例外**: テストコード内の `console.warn` / `console.error` は許容（テスト用途）。
HTMLテンプレートリテラル内のブラウザ側スクリプト（`<script>` 内等）は、サーバー側ライブラリのLogTapeが使用できないため `console` を使用してよい。

### Icons（アイコン）
**プロジェクト全体の方針**: 絵文字（emoji）は一切使用せず、`lucide-react` のSVGアイコンコンポーネントを使用する。

```typescript
// NG - 絵文字の使用
<span>★</span>
<span>📅</span>
<button>✏️ 編集</button>

// OK - lucide-react の使用
import { Star, Calendar, Pencil } from 'lucide-react';

<Star className={iconStyle} />
<Calendar size={16} />
<button><Pencil size={16} /> 編集</button>
```

**よく使うアイコン**:
| 用途 | lucide-react |
|------|-------------|
| お気に入り | `Star`, `Heart` |
| 編集 | `Pencil`, `Edit` |
| 削除 | `Trash2`, `X` |
| メニュー | `MoreVertical`, `Menu` |
| カレンダー | `Calendar` |
| 時間 | `Clock` |
| ユーザー | `User`, `Users` |
| チェック | `Check`, `CheckCircle` |
| 警告 | `AlertTriangle` |
| リンク | `Link`, `ExternalLink` |
| 共有 | `Share2` |
| 再生 | `Play`, `Video` |
| 非表示 | `EyeOff` |
| 表示 | `Eye` |
| 戻る | `ArrowLeft`, `ChevronLeft` |

### Optimistic Updates（楽観的更新）
**プロジェクト全体の方針**: すべての更新系操作で楽観的更新を使用する。

```typescript
// パターン: useOptimistic + useTransition
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

### UI Design Guidelines
プロジェクト全体のUIトーン: **モダン × ソフト × レイヤードUI**

**UI実装時は `ui-design-system.md` メモリを必ず参照すること。**（カラーパレット、コンポーネントパターン、禁止パターン等を記載）

| 原則 | 説明 |
|------|------|
| ボーダーレス | 境界線は原則使用しない。輪郭は影で表現 |
| 面で区切る | 各情報ブロックは「面」として認識できること |
| 影で階層化 | 階層差は影の強弱で表現する |
| 余白で構造化 | 背景色と余白によって情報の階層を表現する |
| セマンティックHTML | 見た目ではなく意味に基づいて要素を選択 |

```
【実装パターン】- セマンティックトークンを使用
- カード: shadow: 'card.default', _hover: { shadow: 'card.hover' }
- チップ: bg: 'chip.default', shadow: 'chip.default'
- オーバーレイ: bg: 'overlay.light' または 'overlay.dark'
- 区切り線: border-topではなく<hr>要素を使用
- 入力フィールド: border なし、bg を少し暗く
```

**重要**: 新しい色・影・サイズを追加する場合は、必ず`src/styles/semanticTokens.ts`にトークンとして定義し、コンポーネントではトークン名を参照すること。ハードコードされた値（`rgba(...)`, `oklch(...)`等）を直接スタイルに書かない。

### Accessibility Guidelines (WCAG 2.1 AA準拠)

本プロジェクトはWCAG 2.1 AA基準に準拠したアクセシビリティを確保する。

#### コントラスト比の基準
| 要素 | 最小コントラスト比 | 備考 |
|------|-------------------|------|
| 通常テキスト | 4.5:1 | 本文、ラベル、ボタンテキスト |
| 大きいテキスト | 3:1 | 18pt以上、または14pt太字以上 |
| UIコンポーネント | 3:1 | アイコン、ボーダー、フォーカスリング |
| 非活性要素 | - | コントラスト要件なし（ただし視認性は確保） |

#### 色の使用ガイドライン
```
【必須】
- テキストと背景のコントラスト比を確保（OKLCH明度差0.45以上を目安）
- 色だけに依存せず、アイコン・テキスト・形状でも情報を伝える
- フォーカス状態は2px以上のフォーカスリングで明示

【推奨される色の組み合わせ】
- 淡い背景（明度0.90以上）+ 暗いテキスト（明度0.40以下）
- 暗い背景（明度0.50以下）+ 白テキスト
- 中間色の背景は避ける（コントラスト確保が困難）

【禁止】
- primary.500などの中間明度色に白テキストを直接配置
- placeholderを薄すぎる色にする（明度0.60以下を使用）
```

#### フォーカス管理
- すべてのインタラクティブ要素にフォーカス可能
- フォーカス順序は論理的な読み順に従う
- フォーカスリングは`borders.focusRing`トークン（`semanticTokens.ts`で定義）を使用
- キーボードナビゲーション対応（Tab, Enter, Space, Escape, 矢印キー）

#### セマンティックHTML
- 適切なHTML要素を使用（`<button>`, `<a>`, `<nav>`, `<main>`等）
- 見出しは階層構造を守る（h1→h2→h3）
- フォーム要素には`<label>`を関連付け
- 画像には適切な`alt`属性

#### Ark UIの活用
Ark UIはアクセシビリティ対応済みのコンポーネントを提供。以下を活用：
- Dialog（モーダル）: フォーカストラップ、Escapeで閉じる
- Menu: キーボードナビゲーション対応
- Tooltip: スクリーンリーダー対応
- Select/Combobox: ARIA属性自動付与

## Progress Management（進捗管理）

**進捗管理ファイル**: `.claude/PROGRESS.md`

このファイルは複数のClaude Codeインスタンスで共有される。タスクの状態管理は以下のルールに従うこと。

| 状態 | マーク | タイミング |
|------|--------|------------|
| 未着手 | `[ ]` | 初期状態 |
| 作業中 | `[→]` | タスク着手時 |
| 完了 | `[x]` | タスク完了時 |

**運用ルール**:
1. タスク着手時は `[ ]` → `[→]` に変更し、作業ログに記録
2. タスク完了時は `[→]` → `[x]` に変更
3. 競合回避のため、同じタスクを複数人で着手しない
4. 依存関係があるタスクは上から順に進める

## TDD Development（テスト駆動開発）

このプロジェクトはTDD（テスト駆動開発）手法を採用している。機能開発・バグ修正は以下のフローに従うこと。

### 開発フロー

```
/requirements → /pencil-design → レビュー → /gen-test → /implement-tests → /refactor
    ↓                ↓              ↓           ↓              ↓               ↓
 要件定義        UIデザイン        承認        Red           Green          Refactor
 (仕様策定)     (.penファイル)              (失敗テスト)   (最小実装)     (品質改善)
```

### UI開発フロー（Design First）

**UIを含む機能開発では、実装前にPencilでデザインを作成する。**

#### フロー詳細

1. **要件定義** (`/requirements`)
   - ユーザーと対話しながら詳細仕様を策定
   - 画面の目的、ユーザーストーリー、必要な要素を明確化

2. **UIデザイン** (`/pencil-design`)
   - `.pen`ファイルでUIデザインを作成
   - `ui-design-system`メモリを参照してデザインシステムに準拠
   - 画面ごとにスクリーンショットを見せてユーザーの承認を得る

3. **レビュー・承認**
   - ユーザーにデザインを確認してもらう
   - フィードバックを反映して修正
   - 承認後に実装フェーズへ進む

4. **TDD実装** (`/gen-test` → `/implement-tests` → `/refactor`)
   - 承認されたデザインに基づいてテストを作成
   - デザイン通りの実装を行う

#### デザインファイルの配置

全画面を1つのファイルに集約し、フレーム名でセクションを区別する。

```
docs/designs/
└── scenarios.pen            # 全画面・コンポーネント集約
```

#### フレーム命名規則

フレーム名は `セクション名 / 画面名` 形式で統一する。

```
Components                           # 共通コンポーネント定義
Landing / Top                        # ランディングページ
Scenarios / 検索画面                  # /scenarios
Scenarios / 検索画面（空状態）         # /scenarios（結果なし）
Scenarios / 検索画面（詳細条件展開）   # /scenarios（フィルタ展開時）
Scenarios / 詳細画面                  # /scenarios/[id]
Sessions / 作成画面                   # /sessions/create
Users / プロフィール                  # /users/me
```

#### デザインルール

**1. 画面フレーム境界を守る**
- 要素はトップレベルの画面フレーム（`Scenarios / 検索画面`等）からはみ出さない
- 内部コンポーネント間のはみ出し（スライダーのつまみ等）は許容

**2. 共通コンポーネントの定義**
- `Components`フレームに共通コンポーネントを定義（reusable: true）
- 各画面で使用する際はインスタンスとして配置

**3. コンポーネント変更時の反映**
- 共通コンポーネント（reusable）を変更すると、全インスタンスに自動反映される
- 画面固有のカスタマイズはインスタンスのプロパティで上書き

#### Pencil MCP ツールの使用

| ツール | 用途 |
|--------|------|
| `get_editor_state` | 現在のエディタ状態を確認 |
| `open_document` | .penファイルを開く / 新規作成 |
| `get_guidelines` | デザインガイドラインを取得 |
| `get_style_guide` | スタイルガイドを取得 |
| `batch_design` | デザイン操作（挿入/更新/削除等） |
| `get_screenshot` | デザインのスクリーンショットを取得 |

#### 適用場面

| 場面 | Design First | 直接実装 |
|------|:------------:|:--------:|
| 新規画面の開発 | ○ | - |
| 複雑なコンポーネント | ○ | - |
| UIリニューアル | ○ | - |
| 軽微なスタイル修正 | ○ | - |
| ロジックのみの変更 | - | ○ |
| 既存パターンの再利用 | - | ○ |

### TDDスキル・エージェント一覧

| 名前 | 種別 | フェーズ | 説明 |
|------|------|---------|------|
| `/requirements` | スキル | 要件定義 | ユーザーと対話しながら詳細仕様を策定 |
| `/pencil-design` | スキル | UIデザイン | 要件定義を元にPencilでUIデザインを作成 |
| `/component-spec` | スキル | 要件定義 | Pencilデザインを元にコンポーネント仕様を定義 |
| `/gen-test` | スキル | Red | 要件定義書から失敗するテストを生成 |
| `tdd-implementer` | エージェント | Green | テストを通過させる最小限の実装（自律実行） |
| `tdd-refactorer` | エージェント | Refactor | テストを維持しながらコード品質を改善（自律実行） |
| `/fix-bug` | スキル | バグ修正 | テストケース見直し → 再現テスト → 修正 |
| `/redesign` | スキル | UI更新 | Pencilデザインを唯一の情報源としてUIをリデザイン |

**スキル vs エージェントの使い分け**:
- スキル: ユーザーとの対話が必要（確認・選択）
- エージェント: 自律実行可能（明確なゴールがある）

### 進捗追跡

TDD進捗は `.claude/PROGRESS.md` の「TDD進捗」セクションで関数・コンポーネント単位で追跡する。

```markdown
| 対象 | 要件定義 | テスト設計 | テスト実装 | 機能実装 | リファクタ | 状態 |
|------|:-------:|:--------:|:--------:|:-------:|:---------:|------|
| searchFormSchema | ✅ | ✅ | ✅ | ✅ | ⬜ | 機能実装済 |
```

### バグ修正フロー

バグが発生した場合は `/fix-bug` スキルを使用し、以下の流れで修正する:

1. **テストケース見直し**: バグはテスト不足の証拠。既存テストを確認
2. **再現テスト作成（Red）**: バグを再現するテストを書く
3. **修正（Green）**: 最小限の修正でテストをパス
4. **リファクタ（任意）**: 必要に応じてコード改善

### リファクタリング時のルール

- 既存テストは必ず実行し、パスを維持
- 仕様変更がある場合はテストケースも更新
- 動作を変えずに品質のみを改善

### 要件定義書の配置

機能ごとの詳細要件は `.claude/requirements/` に配置する:

```
.claude/requirements/
├── requirements-v1.md          # プロジェクト全体の基本要件
├── requirements-feedback.md    # フィードバック機能
├── requirements-session-flow.md # セッションフロー
└── requirements-review-ui.md   # レビューUI
```

### スキル・エージェントの使い分け

TDDスキルと汎用スキルは目的が異なる。状況に応じて適切なものを選択すること。

| 状況 | 使用するスキル | 理由 |
|------|---------------|------|
| 新機能の開発 | `/requirements` → `/gen-test` → `/implement-tests` → `/refactor` | TDDフローで品質を担保 |
| バグ修正 | `/fix-bug` | 再現テスト作成 → 修正でバグ再発を防止 |
| コーディング規約チェック | `/review-fix` | `coding-standards.md`準拠の確認・自動修正 |
| アドホックな問題解決 | `/serena` | TDDに乗らない調査・設計・実装 |

**TDDスキル vs `/serena` の違い**:

| 観点 | TDDスキル | `/serena` |
|------|----------|-----------|
| 目的 | 品質を担保した開発フロー | 汎用的な問題解決 |
| テスト | 必須（Red → Green） | 任意 |
| 進捗管理 | PROGRESS.mdで追跡 | なし |
| 適用場面 | 機能開発・バグ修正 | 調査、設計検討、軽微な修正 |

**`/refactor` vs `/review-fix` の違い**:

| 観点 | `/refactor` | `/review-fix` |
|------|------------|---------------|
| 目的 | TDDのRefactorフェーズ | コーディング規約準拠 |
| テスト | 必須（パス維持） | 参照しない |
| 対象 | 直近の実装コード | 任意のコード |
| 観点 | 可読性・保守性・パフォーマンス | 命名・フォーマット・パターン |

## Agent Strategy

### サブエージェントの活用（必須）
**複雑なタスクでは必ずサブエージェントを使用すること。** 直接ファイルを大量に読むより効率的。

| サブエージェント | 用途 | 使用タイミング |
|-----------------|------|---------------|
| `Explore` | コードベース探索・検索 | ファイル構造把握、実装箇所の特定 |
| `Plan` | 実装計画の設計 | 複雑な機能の設計前 |
| `code-reviewer` | コードレビュー | 実装完了後の品質確認 |
| `serena-expert` | 構造化されたアプリ開発 | 複数ファイルにまたがる実装 |
| `ui-expert` | UI/UX改善 | 既存UIの分析・改善 |
| `ui-implementer` | UI実装 | 新規UI機能の実装 |
| `playwright-test-fixer` | 機能テスト＆修正 | UIの動作確認と問題の自動修正 |
| `tdd-implementer` | TDD Green実装 | 失敗テストを通す実装（自律実行） |
| `tdd-refactorer` | TDD Refactor | テスト維持しながら品質改善（自律実行） |

### Worktree運用ルール（worktree環境のみ適用）

このプロジェクトでは `git worktree` + `vibe` を使用して複数のClaude Codeが並行作業できる。
worktree環境で作業する場合は以下のルールを厳守すること。

#### worktreeの作成・削除

**`/vibe`コマンドを使用する（推奨）**

```bash
# 新しいworktreeを作成（developから分岐、デフォルト）
/vibe start feature/new-feature

# ベースブランチを明示的に指定
/vibe start hotfix/urgent-fix main

# worktreeを削除してメインに戻る
/vibe clean

# worktree一覧を確認
/vibe list
```

**メリット：**
- ✅ **管理者権限不要**（シンボリックリンク不使用）
- ✅ **Claude Codeを通常権限で起動可能** → **通知が正常に動作**
- ✅ 環境変数ファイル（`.env`等）と`.claude/settings.local.json`を自動コピー
- ✅ `pnpm install`を自動実行
- ✅ ブランチ名の`/`は自動的に`-`に変換（`feature/ui` → `scenario-manager-feature-ui`）

#### worktree環境の判定方法
```bash
# worktreeかどうかを確認
git rev-parse --is-inside-work-tree && git worktree list | wc -l
# 2以上ならworktree環境の可能性が高い

# または、ディレクトリ名で判定
# scenario-manager-feature-xxx のような命名ならworktree
```

#### ブランチ名の命名規則
| パターン | 形式 | 例 |
|----------|------|-----|
| issue指定あり | `type/issue番号-description` | `feature/123-add-search`, `fix/456-login-bug` |
| issue指定なし | `type/description` | `feature/add-search`, `refactor/ui-components` |

**許可されるtype**:
- `feature`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `style`: スタイル変更
- `docs`: ドキュメント
- `test`: テスト
- `chore`: 雑務・設定変更
- `perf`: パフォーマンス改善
- `ci`: CI/CD関連

#### 禁止操作
| 操作 | 禁止理由 |
|------|----------|
| `git merge ... main` | mainへのマージはPRを通す。worktreeからの直接マージ禁止 |
| `git push origin main` | mainへの直接pushは禁止 |
| `git checkout main` | worktreeでmainブランチに切り替えない |

#### 許可される操作
- 自ブランチへのコミット・プッシュ
- `git rebase develop` などでベースブランチの変更を取り込む
- `git fetch origin` でリモートの最新を取得

#### 開発サーバーのポート管理
worktreeでは**指定されたポート**を使用する。3000番はメインリポジトリ用。

```bash
# worktreeでの開発サーバー起動（ポート指定必須）
pnpm dev --port 3001  # 1つ目のworktree
pnpm dev --port 3002  # 2つ目のworktree
pnpm dev --port 3003  # 3つ目のworktree
```

**推奨ポート番号：**
- `/vibe start`実行後、既存worktreeの数から推奨ポート（3001, 3002...）が表示される
- 表示された推奨ポートを使用すること

**タスク完了時は必ずサーバーを停止すること。** ポートを専有したままにしない。

#### タスク完了時のフロー
1. 変更をコミット・プッシュ
2. **開発サーバーを停止**（KillShellツールまたは手動）
3. PRはメインリポジトリから作成（worktreeからでも可）
4. **worktreeを削除**（`/vibe clean`コマンドを使用）

**注意：** `/vibe clean`はworktreeディレクトリ内で実行すること。メインリポジトリに自動的に戻る。

### Bashコマンド実行時のルール（必須）
**Bashツールの作業ディレクトリは維持されるため、毎回cdする必要はない。**

| 禁止 | 理由 |
|------|------|
| `cd /d ...` | Windowsのcmd.exe専用コマンド。Bashでは動作しない |
| `cd ... &&` プレフィックス | 不要。作業ディレクトリは維持される |

```bash
# NG - 毎回cdするのは不要
cd /d C:\Development\Nextjs\scenario-manager && pnpm dev

# OK - 直接コマンドを実行
pnpm dev

# OK - 絶対パスを使う（必要な場合）
pnpm vitest run src/components/Button/Button.test.tsx
```

### タスク完了時のコミット（必須）
**タスクが完了したら必ずコミットを作成すること。** 作業を放置しない。

1. `pnpm check` でlint/format確認
2. `pnpm build` でビルド確認（必要に応じて）
3. 変更をステージング
4. Conventional Commits形式でコミット
   - `feat`: 新機能
   - `fix`: バグ修正
   - `style`: スタイル変更
   - `refactor`: リファクタリング
   - `docs`: ドキュメント
   - `chore`: その他

### バックグラウンドプロセスの終了（必須）
**開発サーバーやその他のバックグラウンドプロセスは、使用後に必ず終了すること。**

```bash
# 起動したプロセスの終了方法
# 1. KillShellツールでバックグラウンドタスクを終了
# 2. それでも残っている場合はポートを確認して手動終了

# ポート使用状況の確認（Windows）
netstat -ano | findstr :3000

# プロセスの強制終了（Windows）
cmd //c "taskkill /PID <PID> /F"
```

**注意**: `pnpm dev`などで起動したサーバーは、Playwrightでの確認後など用が済んだら必ず終了する。ポートを専有したままにしない。

### agent-browserの終了（必須）
**agent-browserを使用したら、作業完了後に必ず`agent-browser close`で終了すること。**

```bash
# agent-browserの終了
agent-browser close
```

**理由**: agent-browserはヘッドレスChromeを起動するため、閉じずに放置するとメモリを大量消費し、システム全体のパフォーマンスが低下する。

### Claude Codeプロセスの定期チェック（必須）
**サブエージェント（Taskツール）を使用する際は、定期的にプロセス数を確認すること。**

サブエージェントのプロセスがセッション終了後も残り、メモリを大量消費する場合がある。

```bash
# プロセス数の確認
tasklist | findstr "claude" | find /c /v ""

# 異常に多い場合（10以上）は不要なプロセスを終了
taskkill /IM claude.exe /F
```

**チェックタイミング**:
- サブエージェントを3回以上使った後
- メモリ使用量が高いと感じた時
- セッション終了前

### 開発サーバー起動時のポート管理（必須）
**`pnpm dev`で3000番以外のポートが使われた場合は、必ず以下の手順に従うこと。**

1. **既存のNext.jsサーバーがあれば再利用する**
   - ユーザーが既に3000番で開発サーバーを起動している可能性がある
   - その場合は新たに起動せず、既存のサーバーを利用する

2. **3000番を使用しているプロセスを停止して起動し直す**
   ```bash
   # 3000番ポートの使用状況を確認
   netstat -ano | findstr ":3000" | findstr "LISTENING"

   # 該当プロセスを停止（PIDは上記コマンドで確認）
   cmd //c "taskkill /PID <PID> /F"

   # サーバーを再起動
   pnpm dev
   ```

**理由**: 複数の開発サーバーを起動するとSupabaseの接続プールを使い果たし、`MaxClientsInSessionMode`エラーが発生する。常に1つのサーバーのみを使用すること。

### タスクの細分化
- 複雑なタスクは小さなサブタスクに分解する
- TodoWriteツールで進捗を管理する
- 各サブタスクに最適なサブエージェントを選定

### 継続的最適化
- 永続的・基盤的な指示を受けた場合、CLAUDE.mdに追記して知識を蓄積
- プロジェクト固有のパターンや方針を学習し、より効率的な開発を目指す
