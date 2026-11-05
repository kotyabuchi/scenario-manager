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
