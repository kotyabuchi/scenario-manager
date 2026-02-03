# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TRPG（テーブルトークRPG）のシナリオとセッションを管理するWebアプリケーション。

## Commands

| コマンド | 用途 |
|---------|------|
| `pnpm dev` | 開発サーバー起動（Turbopack） |
| `pnpm build` | ビルド |
| `pnpm check` | lint + format 一括実行 |
| `pnpm vitest` | テスト実行 |
| `pnpm storybook` | Storybook（port 6006） |
| `pnpm prepare` | PandaCSS コード生成 |

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: PostgreSQL (Supabase) — Supabase JS Client
- **Styling**: PandaCSS（`@/styled-system/*`）
- **UI**: Ark UI + 自作コンポーネント
- **Linter/Formatter**: Biome
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
│           └── _components/    # ページ固有コンポーネント
├── components/
│   ├── elements/          # 基本コンポーネント
│   └── blocks/            # 複合コンポーネント
├── db/                    # Supabase型・ヘルパー
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティ
├── types/                 # 共通型定義
└── styles/                # PandaCSSトークン・レシピ
```

## Key Patterns

| パターン | 概要 | 詳細参照 |
|---------|------|---------|
| DBアクセス | `createClient()` + Supabase生成型 | - |
| 型安全ルーティング | `typedRoutes: true` | - |
| パスエイリアス | `@/*` → `src/*` | - |
| Result型 | `ok`, `err` でエラーハンドリング | `error-handling.md` |
| Null/Undefinedチェック | `ramda` の `isNil` を使用 | `error-handling.md` |
| スタイル分離 | 同階層の `styles.ts` に定義 | `styling-rules.md` |
| 楽観的更新 | `useOptimistic` + `useTransition` | `react-rules.md` |
| アイコン | lucide-react を使用（絵文字禁止） | `icons.md` |
| ログ出力 | LogTape を使用（console禁止） | `logging.md` |

## Rules Reference

| ルールファイル | 内容 |
|---------------|------|
| `coding-standards.md` | 命名規則、Import順序、コメント、Git |
| `typescript-rules.md` | 型厳格さ、Single Source of Truth |
| `react-rules.md` | コンポーネント定義、楽観的更新 |
| `styling-rules.md` | PandaCSS、UIデザインガイドライン |
| `form-rules.md` | React Hook Form + Zod、nuqs |
| `error-handling.md` | Result型、isNil |
| `logging.md` | LogTape使用方法 |
| `icons.md` | lucide-react使用規約 |
| `accessibility.md` | WCAG 2.1 AA準拠 |
| `plan-mode.md` | Planエージェント使用ガイド |
| `agent-strategy.md` | サブエージェント活用、プロセス管理 |
| `tdd-workflow.md` | TDD開発フロー、スキル一覧 |
| `bash-rules.md` | Bashコマンド実行ルール |

すべてのルールファイルは `.claude/rules/` に配置。

## Skills Reference

| スキル | フェーズ | 用途 |
|--------|---------|------|
| `/requirements` | 要件定義 | 詳細仕様の策定 |
| `/pencil-design` | UIデザイン | Pencilでデザイン作成 |
| `/gen-test` | Red | 失敗するテストを生成 |
| `/fix-bug` | バグ修正 | 再現テスト → 修正 |
| `/redesign` | UI更新 | デザインからUIリデザイン |
| `/review-fix` | レビュー | コード規約準拠チェック |
| `/serena` | 汎用 | 調査・設計・実装 |
| `/vibe` | Worktree | git worktree管理 |

## Memory Files Reference

Serenaメモリ（`.serena/memories/`）:
- `ui-design-system.md` - カラーパレット、コンポーネントパターン
- `ui-component-behavior.md` - コンポーネント動作仕様
- `ark-ui-pandacss-styling.md` - Ark UI + PandaCSSスタイリング

## Progress Management

**進捗管理ファイル**: `.claude/PROGRESS.md`

| 状態 | マーク |
|------|--------|
| 未着手 | `[ ]` |
| 作業中 | `[→]` |
| 完了 | `[x]` |

## Database Schema

主要テーブル: `users`, `scenarios`, `scenario_systems`, `tags`, `game_sessions`, `game_schedules`, `session_participants`, `user_reviews`

- ID生成: ULID（26文字）
- タイムスタンプ: `created_at`, `updated_at` は自動設定

## Deployment

- **本番環境**: Cloudflare Pages
- **ビルド**: `pnpm build:cloudflare`
- **デプロイ**: `pnpm deploy`
- **本番URL**: https://scenario-manager.kotyabuchi.workers.dev
