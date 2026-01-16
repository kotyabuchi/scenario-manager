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
├── app/
│   ├── (auth)/           # 認証関連ページ（login, signup）
│   └── (main)/           # メインページ（home, scenarios, users）
├── components/
│   ├── elements/         # 基本コンポーネント（Button, Card, Alert等）
│   └── blocks/           # 複合コンポーネント（SideMenu等）
├── db/
│   ├── schema.ts         # Drizzle スキーマ定義
│   └── enum.ts           # DB用Enum定義
├── hooks/                # カスタムフック
└── styles/
    ├── preset.ts         # PandaCSS プリセット
    ├── recipes/          # コンポーネントレシピ
    └── tokens/           # デザイントークン
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
