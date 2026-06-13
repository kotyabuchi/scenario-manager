---
name: supabase-migrate
description: Supabaseのマイグレーション適用と型再生成を一括実行する。「マイグレーションして」「型生成して」「supabase-migrate」で起動。
---

# Supabase Migrate - マイグレーション適用 & 型再生成

未適用のマイグレーションをリモートDBにプッシュし、`supabase gen types` で型を再生成する。
RPC関数のnullableパラメータも自動修正する。

## When to Use

- `supabase/migrations/` に新しいマイグレーションファイルを追加した後
- DBスキーマを変更して `src/db/types.ts` を最新にしたい
- 「マイグレーションして」「型生成して」「DB同期して」と言われた

## Prerequisites

- `supabase link` が完了していること（`supabase/.temp/project-ref` が存在）
- `supabase login` でCLI認証済みであること

## Instructions

### Step 1: 環境チェック

1. `supabase/.temp/project-ref` の存在を確認

```bash
cat supabase/.temp/project-ref
```

ファイルが存在しない場合はユーザーに `npx supabase link --project-ref <ref>` の実行を促して終了。

2. プロジェクトrefを変数に取得

```bash
PROJECT_REF=$(cat supabase/.temp/project-ref)
```

### Step 2: 未適用マイグレーションの確認

`migration list` で Local / Remote の差分を確認する:

```bash
npx supabase migration list
```

- Local と Remote が一致 → Step 4 へスキップ（型生成のみ実行）
- Local にのみ存在するマイグレーションがある → 一覧をユーザーに表示し、適用確認

### Step 3: マイグレーション適用

```bash
npx supabase db push
```

エラーが発生した場合:
- SQL エラーの内容をユーザーに表示
- 修正を提案（カラムの重複、型の不一致など）

### Step 4: 型再生成

**重要**: stderr を分離してファイルに出力する。stdout のみを `types.ts` に書き込む。

```bash
npx supabase gen types typescript --project-id "$PROJECT_REF" 2>"src/db/types.stderr" > "src/db/types.ts"
```

生成後の確認:
1. `src/db/types.ts` の1行目が `export type Json =` で始まることを確認
2. もし stderr の接続メッセージが混入していたら除去する
3. `src/db/types.stderr` を削除

### Step 5: RPC関数のnullable修正

`supabase gen types` はRPC関数のパラメータをすべて非nullableとして生成する。
PostgreSQL側で `NULL` を受け付けるパラメータを手動で `| null` に修正する必要がある。

**修正方法**:

1. `src/db/types.ts` の `Functions` セクション内の各RPC関数を確認
2. 対応する adapter ファイル（`adapter.ts`）を検索し、`null` を渡しているパラメータを特定:

```bash
grep -r "supabase.rpc" src/ --include="*.ts" -A 30
```

3. `null` を渡しているパラメータの Args 型に `| null` を追加
4. Returns 型についても、元のテーブルカラムが nullable なら `| null` を追加

**例**: `p_scenario_id: string` → `p_scenario_id: string | null`

### Step 6: ビルド検証

```bash
pnpm build
```

- 成功 → 完了メッセージを表示
- 型エラー → エラー内容に応じて修正:
  - `Type 'X | null' is not assignable to type 'X'` → Args の nullable 修正漏れ
  - `Property 'X' does not exist on type 'never'` → Relationships の型不整合（型再生成で解決済みのはず）
  - その他 → エラー内容をユーザーに表示

### Step 7: 結果レポート

以下の形式で結果を表示:

```
| 項目 | 状態 |
|------|------|
| マイグレーション | {適用件数}件適用 / スキップ |
| 型再生成 | 完了 |
| nullable修正 | {修正件数}件 |
| ビルド | 成功 / 失敗 |
```
