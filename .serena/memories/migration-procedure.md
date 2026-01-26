# マイグレーション手順

## 概要
drizzle-kit 0.31.8にはSupabaseのauth schemaにあるcheck制約をパースできないバグがあり、`drizzle-kit push`/`pull`コマンドが使用できない。そのため、Supabase MCP経由でSQLを直接実行する。

## 手順

### 1. スキーマ変更（src/db/schema.ts, src/db/enum.ts）
- `src/db/enum.ts`: 新しいEnumを追加
- `src/db/schema.ts`: テーブル定義・リレーション定義を更新

### 2. マイグレーションSQL生成
```bash
pnpm drizzle-kit generate
```
- 出力先: `supabase/migrations/` に `XXXX_name.sql` が生成される
- `--> statement-breakpoint` コメントで区切られている

### 3. SQLの整形
生成されたSQLから `--> statement-breakpoint` を除去し、実行可能な形式にする。

### 4. Supabase MCPでマイグレーション適用
```
mcp__supabase__apply_migration
- project_id: nclafjbndhidarwpebnx
- name: マイグレーション名（snake_case）
- query: 整形したSQL
```

### 5. 適用確認
```
mcp__supabase__list_tables または mcp__supabase__execute_sql で確認
```

## 注意事項

### IF NOT EXISTS / IF EXISTS の活用
部分的に適用済みの場合に備えて：
- `CREATE TABLE IF NOT EXISTS`
- `CREATE TYPE IF NOT EXISTS` （PostgreSQLは非対応のため、エラー時は既存を確認）
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `DROP CONSTRAINT IF EXISTS`
- `DROP INDEX IF EXISTS`

### ENUMへの値追加
```sql
ALTER TYPE "public"."enum_name" ADD VALUE 'NEW_VALUE' BEFORE 'EXISTING_VALUE';
```
※ トランザクション内では実行できないため、単独で実行が必要な場合がある

### 外部キー制約の順序
1. 先にテーブルを作成
2. その後に外部キー制約を追加

### drizzle-kitのバグについて
- GitHub Issue: https://github.com/drizzle-team/drizzle-orm/issues/3766
- 原因: auth schemaのcheck制約（oauth_authorizations, oauth_clients等）をパース時にクラッシュ
- 修正予定: drizzle-kit v1.0.0-beta以降で修正済みだが、APIの破壊的変更あり
- 対応: stable版で修正されるまでSupabase MCP経由で適用

## Supabase プロジェクト情報
- Project ID: `nclafjbndhidarwpebnx`
- Region: ap-northeast-1
