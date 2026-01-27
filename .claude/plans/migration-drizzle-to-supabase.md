# Drizzle ORM → Supabase REST API/RPC 移行計画

## 背景・目的

Cloudflare Workers Free プラン（gzip 3MB上限）でデプロイが失敗している。
handler.mjs に `drizzle-orm`（~1,033KB）+ `postgres`（~215KB）+ `@neondatabase/serverless`（~287KB）がバンドルされており、これらを除去することで **gzip後 350〜450KB の削減** を見込む。

| 状態 | gzipサイズ |
|------|-----------|
| 成功時（b602489） | 3,049 KB |
| 失敗時（c48e8db） | 3,354 KB |
| 上限 | 3,072 KB (3MB) |
| **移行後推定** | **~2,900〜3,000 KB** |

## 移行方針

### 削除するもの
- `drizzle-orm`（依存ごと）
- `postgres`（TCPドライバ）
- `@neondatabase/serverless`（未使用だが依存に存在）
- `drizzle-kit`（devDependencies）
- `src/db/index.ts`（Drizzle接続ロジック）
- `src/db/schema.ts`（Drizzleスキーマ定義 → 型定義のみ残す）
- `wrangler.jsonc` の `hyperdrive` 設定
- `nodejs_compat` フラグ（不要になる可能性を検証）

### 残すもの
- `src/db/enum.ts` — アプリケーションレベルのEnum定義（Drizzle非依存）
- `@supabase/supabase-js` — 既にdependenciesに存在（~176KB、fetchベース）
- `@supabase/ssr` — 認証で使用中

### 新たに必要なもの
- Supabase側のRPC関数（複雑なクエリ用）
- `src/db/types.ts` — Supabase CLI の `supabase gen types` で自動生成した型定義

---

## 影響範囲

### 書き換え対象ファイル一覧

#### adapter.ts（8ファイル・計39関数）

| ファイル | 関数数 | 複雑度 |
|---------|--------|--------|
| `src/app/(main)/scenarios/adapter.ts` | 8 | **高**（全文検索、タグANDフィルタ、サブクエリ） |
| `src/app/(main)/scenarios/[id]/adapter.ts` | 11 | **高**（集約関数、JOIN、UPSERT） |
| `src/app/(main)/sessions/adapter.ts` | 6 | **高**（マルチ条件フィルタ、サブクエリ、カレンダー） |
| `src/app/(main)/sessions/new/adapter.ts` | 2 | 中（INSERT + リレーション取得） |
| `src/app/(main)/sessions/participantAdapter.ts` | 6 | 中（バリデーション + UPDATE） |
| `src/app/(main)/profile/adapter.ts` | 2 | 低 |
| `src/app/(main)/home/adapter.ts` | 2 | 低 |
| `src/app/(main)/users/[id]/adapter.ts` | 2 | 低 |

#### Server Actions（5ファイル・計6関数）

| ファイル | 関数 | DB操作 |
|---------|------|--------|
| `src/app/(auth)/signup/actions.ts` | `createUser` | INSERT users |
| `src/app/(main)/scenarios/new/actions.ts` | `createScenarioAction` | adapter経由 |
| `src/app/(main)/scenarios/[id]/actions.ts` | `toggleFavorite/Played` | adapter経由 |
| `src/app/(main)/profile/actions.ts` | `updateProfile` | adapter経由 |
| `src/components/blocks/FeedbackModal/actions.ts` | `createFeedbackAction` | INSERT feedbacks |

#### その他

| ファイル | 内容 |
|---------|------|
| `src/app/(auth)/auth/callback/route.ts` | ユーザー存在チェック（SELECT users） |
| `src/db/index.ts` | **削除** |
| `src/db/schema.ts` | **削除**（型定義に置き換え） |

---

## Supabase API マッピング

### 基本CRUD → REST API（supabase-js）

```typescript
// Before（Drizzle）
const result = await db.query.scenarios.findMany({
  where: eq(scenarios.systemId, systemId),
  with: { system: true, tags: true },
  limit: 20,
})

// After（Supabase）
const { data, error } = await supabase
  .from('scenarios')
  .select('*, scenario_systems(*), scenario_tags(tags(*))')
  .eq('scenario_system_id', systemId)
  .limit(20)
```

### INSERT

```typescript
// Before
await db.insert(users).values({ userId, userName, ... }).returning()

// After
const { data, error } = await supabase
  .from('users')
  .insert({ user_id: userId, user_name: userName, ... })
  .select()
  .single()
```

### UPDATE

```typescript
// Before
await db.update(users).set({ userName }).where(eq(users.userId, id)).returning()

// After
const { data, error } = await supabase
  .from('users')
  .update({ user_name: userName })
  .eq('user_id', id)
  .select()
  .single()
```

### DELETE

```typescript
// Before
await db.delete(userReviews).where(eq(userReviews.userReviewId, reviewId))

// After
await supabase.from('user_reviews').delete().eq('user_review_id', reviewId)
```

### 複雑なクエリ → RPC（PostgreSQL関数）

以下はSupabase REST APIだけでは表現困難なため、PostgreSQL関数（RPC）が必要：

| クエリ | 理由 | RPC関数名（案） |
|--------|------|----------------|
| シナリオ検索（タグANDフィルタ + ページング） | HAVING COUNT + サブクエリ | `search_scenarios` |
| シナリオ詳細（AVG評価 + COUNT） | 集約関数 + LEFT JOIN | `get_scenario_detail` |
| レビュー一覧（ユーザーJOIN + ページング） | JOIN + ORDER BY + COUNT | `get_scenario_reviews` |
| セッション検索（マルチ条件 + ロール別） | 複数サブクエリ + 条件分岐 | `search_sessions` |
| カレンダーデータ取得 | 日付範囲 + グループ化 | `get_calendar_sessions` |
| お気に入り/プレイ済みトグル（UPSERT） | ON CONFLICT DO UPDATE | `toggle_preference` |
| セッション参加申請（バリデーション付き） | 複数テーブル確認 + INSERT | `apply_to_session` |

---

## 型定義の移行

### Before（Drizzle）
```typescript
// src/db/schema.ts で定義
export const users = pgTable('users', { ... })

// interface.ts で使用
import type { InferSelectModel } from 'drizzle-orm'
type User = InferSelectModel<typeof users>
```

### After（Supabase CLI 自動生成）
```bash
# 型定義の自動生成
supabase gen types typescript --project-id <project-id> > src/db/types.ts
```

```typescript
// src/db/types.ts（自動生成）
export type Database = {
  public: {
    Tables: {
      users: {
        Row: { user_id: string; user_name: string; ... }
        Insert: { user_id: string; user_name?: string; ... }
        Update: { user_id?: string; user_name?: string; ... }
      }
      // ... 全テーブル
    }
    Functions: {
      search_scenarios: { Args: {...}; Returns: {...} }
      // ... 全RPC
    }
  }
}

// interface.ts で使用
import type { Database } from '@/db/types'
type User = Database['public']['Tables']['users']['Row']
```

### カラム名の注意点

Drizzleはキャメルケース変換を自動で行っていた。Supabase REST APIはDB側のスネークケースをそのまま返す。

| Drizzle | Supabase REST |
|---------|---------------|
| `userId` | `user_id` |
| `userName` | `user_name` |
| `createdAt` | `created_at` |

**対策**: Supabase クライアント作成時またはアプリ側で変換レイヤーを設ける。

---

## Supabase クライアントの統一

### 現状
- **認証**: `@supabase/ssr` の `createServerClient` / `createBrowserClient`
- **DB操作**: Drizzle ORM（`postgres` TCPドライバ）

### 移行後
- **認証 + DB操作**: 両方とも `@supabase/ssr` のクライアントを使用

```typescript
// src/lib/supabase/server.ts（既存を拡張）
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/db/types'

export const createClient = () => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { ... } }
  )
}
```

認証済みユーザーのクライアントでDB操作するため、**RLS（Row Level Security）** が自動適用される。これはセキュリティ面でのメリットでもある。

---

## RLS（Row Level Security）の設計

Drizzleでは RLS を迂回（service_role または直接接続）していたため、移行時にRLSポリシーの設計が必要。

### 基本方針
- **読み取り**: 公開データはanon可、非公開データは認証必須
- **書き込み**: 認証ユーザーのみ、本人データのみ更新可
- **削除**: 本人のみ

### 主要テーブルのポリシー案

```sql
-- scenarios: 誰でも読める、認証ユーザーが作成可
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scenarios_select" ON scenarios FOR SELECT USING (true);
CREATE POLICY "scenarios_insert" ON scenarios FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- user_reviews: 誰でも読める、本人のみ書き込み・削除
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON user_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON user_reviews FOR INSERT
  WITH CHECK (user_id = (SELECT user_id FROM users WHERE discord_id = auth.jwt()->>'sub'));
CREATE POLICY "reviews_delete" ON user_reviews FOR DELETE
  USING (user_id = (SELECT user_id FROM users WHERE discord_id = auth.jwt()->>'sub'));
```

**注意**: 現在のアプリはDiscord OAuthで認証し、`users.discord_id` と `auth.users.id` を紐づけている。RLSポリシーではこの紐づけを考慮する必要がある。

---

## 移行手順（推奨順序）

### Phase 0: 準備
1. [ ] Supabase CLIで型定義を生成（`supabase gen types`）
2. [ ] `src/db/types.ts` を作成
3. [ ] RLSポリシーを設計・適用（Supabase Dashboard or マイグレーション）
4. [ ] RPC関数を作成（複雑なクエリ用）
5. [ ] Supabase クライアントに`Database`型を適用

### Phase 1: 低複雑度のadapter移行
6. [ ] `users/[id]/adapter.ts`（2関数）
7. [ ] `profile/adapter.ts`（2関数）
8. [ ] `home/adapter.ts`（2関数）
9. [ ] `signup/actions.ts`（1関数）
10. [ ] `auth/callback/route.ts`（1関数）
11. [ ] `FeedbackModal/actions.ts`（1関数）

### Phase 2: 中複雑度のadapter移行
12. [ ] `sessions/new/adapter.ts`（2関数）
13. [ ] `sessions/participantAdapter.ts`（6関数）
14. [ ] `profile/actions.ts`（1関数）
15. [ ] `scenarios/[id]/actions.ts`（2関数）

### Phase 3: 高複雑度のadapter移行
16. [ ] `scenarios/adapter.ts`（8関数 — 検索・フィルタ・ページング）
17. [ ] `scenarios/[id]/adapter.ts`（11関数 — 集約・JOIN・UPSERT）
18. [ ] `sessions/adapter.ts`（6関数 — マルチ条件・カレンダー）
19. [ ] `scenarios/new/actions.ts`（1関数 — 画像アップロード + バリデーション）

### Phase 4: クリーンアップ
20. [ ] `drizzle-orm`, `postgres`, `@neondatabase/serverless`, `drizzle-kit` を削除
21. [ ] `src/db/index.ts` を削除
22. [ ] `src/db/schema.ts` を削除
23. [ ] `wrangler.jsonc` から `hyperdrive` 設定を削除
24. [ ] `nodejs_compat` フラグの必要性を検証
25. [ ] `ws` パッケージを削除（未使用）
26. [ ] `pnpm build` で動作確認
27. [ ] Cloudflareデプロイでサイズ確認

---

## リスクと注意点

### 1. カラム名のキャメルケース変換
Drizzleが自動で行っていたスネークケース→キャメルケース変換が無くなる。
全コンポーネントのprops参照を`userId`→`user_id`に変更するか、変換レイヤーを設ける必要がある。

**推奨**: adapter層でスネークケース→キャメルケース変換を行い、アプリ側のインターフェースは変えない。

### 2. トランザクション
Drizzleでは`db.transaction()`が使えたが、Supabase REST APIにはトランザクションがない。
複数テーブルへの整合性が必要な操作はRPC関数内でトランザクションを実行する。

**該当箇所**:
- `createScenario`（scenarios + scenario_tags を同時INSERT）
- `createSession`（game_sessions + session_participants を同時INSERT）
- `applyToSession`（バリデーション + INSERT を原子的に）

### 3. RLSの整合性
Drizzleでは直接SQL接続のためRLSが適用されていなかった。
Supabase REST APIではRLSが強制されるため、全テーブルのポリシー設計が必須。
不足すると「データが取得できない」バグになる。

### 4. 型安全性
Drizzleのスキーマ定義による型推論がなくなる。
`supabase gen types`で生成した型を使うことで同等の型安全性を維持する。
スキーマ変更時は型の再生成を忘れないこと。

### 5. パフォーマンス
- Drizzle + Hyperdrive: TCP接続プーリングで低レイテンシ
- Supabase REST API: HTTP経由のため若干のオーバーヘッド
- ただしCloudflare Edge → Supabase間のHTTPは十分高速

### 6. 3MBに収まらない可能性
推定は350-450KBの削減だが、Next.jsのバージョンアップや機能追加で再度超える可能性がある。
長期的にはCloudflare有料プラン（$5/月）またはVercel移行を検討すべき。

---

## テスト戦略

### 既存テストへの影響

| テストファイル | 影響 |
|---------------|------|
| `scenarios/new/__tests__/duplicateCheck.test.ts` | Drizzle直接使用 → 書き換え必要 |
| `scenarios/new/__tests__/adapter.test.ts` | adapter経由 → adapter書き換え後に動作確認 |
| `scenarios/new/__tests__/rateLimit.test.ts` | DB非依存 → 影響なし |
| `scenarios/new/__tests__/schema.test.ts` | Zod専用 → 影響なし |
| その他のコンポーネントテスト | DB非依存 → 影響なし |

### 移行時のテスト方針
- 各adapter移行後にローカルで動作確認
- Phase完了ごとに`pnpm build`でビルド確認
- Phase 4完了後にCloudflareへデプロイしてサイズ確認
