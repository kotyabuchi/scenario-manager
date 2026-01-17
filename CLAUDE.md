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

## Agent Strategy

### タスク実行方針
- **タスクの細分化**: 複雑なタスクは小さなサブタスクに分解する
- **サブエージェントの活用**: 各サブタスクに最適なサブエージェントを選定して実行
  - `Explore`: コードベース探索・検索
  - `Plan`: 実装計画の設計
  - `code-reviewer`: コードレビュー
  - `serena-expert`: 構造化されたアプリ開発
  - `ui-expert` / `ui-implementer`: UI実装・改善

### タスク完了時のコミット
- **タスク完了後は必ずコミットを作成する**
- コミットメッセージはConventional Commits形式（`feat`, `fix`, `style`, `refactor`等）
- Co-Authored-Byを付与

### 継続的最適化
- 永続的・基盤的な指示を受けた場合、CLAUDE.mdに追記して知識を蓄積
- プロジェクト固有のパターンや方針を学習し、より効率的な開発を目指す
