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
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
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

#### Hyperdrive（DB接続プーリング）
Cloudflare **Hyperdrive** を使用してPostgreSQL接続を最適化。

| 項目 | 値 |
|------|-----|
| Hyperdrive ID | `d075b1e588984ebd896a4617cdc24719` |
| バインディング名 | `HYPERDRIVE` |
| 接続先 | Supabase Direct Connection (port 5432) |

**設定ファイル**: `wrangler.jsonc`
```jsonc
{
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "d075b1e588984ebd896a4617cdc24719"
    }
  ]
}
```

**DB接続コード**: `src/db/index.ts`
- Cloudflare環境: `getCloudflareContext()` から `env.HYPERDRIVE.connectionString` を取得
- ローカル環境: `process.env.DATABASE_URL` にフォールバック

#### GitHub Actions（CI/CD）
`.github/workflows/deploy-cloudflare.yml` でmainブランチへのpush時に自動デプロイ。

**必要なSecrets**:
| Secret名 | 説明 |
|----------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare APIトークン |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareアカウントID |
| `DATABASE_URL` | Supabase接続文字列（ビルド時用） |
| `HYPERDRIVE_CONNECTION_STRING` | Supabase Direct接続文字列（デプロイ時用） |
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
│           ├── interface.ts    # ページ用型定義（Drizzleから導出）
│           ├── adapter.ts      # DB操作関数（Drizzle）
│           └── _components/    # ページ固有コンポーネント
├── components/
│   ├── elements/           # 基本コンポーネント（Button, Card等）
│   └── blocks/             # 複合コンポーネント（Header, SideMenu等）
├── db/
│   ├── schema.ts           # Drizzle スキーマ定義
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

**詳細なデザインパターンは `ui-design-system.md` メモリを参照すること。**

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
- フォーカスリングは`focusRing`トークンを使用
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

### Worktree運用ルール（worktree環境のみ適用）

このプロジェクトでは `git worktree` を使用して複数のClaude Codeが並行作業できる。
worktree環境で作業する場合は以下のルールを厳守すること。

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
pnpm dev --port 3001  # worktree-1
pnpm dev --port 3002  # worktree-2
```

**タスク完了時は必ずサーバーを停止すること。** ポートを専有したままにしない。

#### タスク完了時のフロー
1. 変更をコミット・プッシュ
2. **開発サーバーを停止**（KillShellツールまたは手動）
3. PRはメインリポジトリから作成（worktreeからでも可）

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
