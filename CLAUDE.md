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

### UI Design Guidelines
プロジェクト全体のUIトーン: **モダン × パステル × レイヤードUI**

| 原則 | 説明 |
|------|------|
| ボーダーレス | 境界線は原則使用しない |
| 面で区切る | 各情報ブロックは「面」として認識できること |
| 明度差で階層化 | 階層差は背景色の明度差で表現する |
| 余白で構造化 | 背景色と余白によって情報の階層を表現する |

```
【実装例】
- カード: border なし、bg.subtle + shadow.sm で浮遊感
- セクション区切り: 背景色の切り替えで表現
- 入力フィールド: border なし、bg を少し暗く
- 階層構造: 親=明るい背景、子=やや暗い背景
```

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
5. Co-Authored-Byを付与

### タスクの細分化
- 複雑なタスクは小さなサブタスクに分解する
- TodoWriteツールで進捗を管理する
- 各サブタスクに最適なサブエージェントを選定

### 継続的最適化
- 永続的・基盤的な指示を受けた場合、CLAUDE.mdに追記して知識を蓄積
- プロジェクト固有のパターンや方針を学習し、より効率的な開発を目指す
