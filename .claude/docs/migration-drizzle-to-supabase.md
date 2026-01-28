# Drizzle ORM → Supabase REST API 移行レポート

## 背景

Cloudflare Workers Free プラン（gzip 3MB 上限）でデプロイが失敗していた。
`drizzle-orm` + `postgres` パッケージがバンドルサイズを圧迫していたため、
既に導入済みの Supabase JS Client のみで DB 操作する方式に移行した。

## 移行規模

| 項目 | 数 |
|------|-----|
| 移行対象ファイル | 16 |
| 移行対象関数 | 44 |
| 削除パッケージ | 5 (`drizzle-orm`, `postgres`, `@neondatabase/serverless`, `drizzle-kit`, `ws`) |
| 削除ファイル | 6 (`db/index.ts`, `db/schema.ts`, `drizzle.config.ts`, seed 関連 3 ファイル) |

---

## Phase 0: 基盤準備

### 新規作成ファイル

#### `src/db/types.ts`
`supabase gen types typescript` で自動生成した DB 型定義。
全テーブルの `Row` / `Insert` / `Update` 型と Enum 型を含む。

#### `src/lib/supabase/transform.ts`
スネークケース → キャメルケース変換ユーティリティ。

```typescript
// 再帰的な型変換
type CamelCaseKeys<T> = { [K in keyof T as CamelCase<K>]: ... }

// ランタイム変換
export const camelCaseKeys = <T>(obj: T): CamelCaseKeys<T> => { ... }
export const camelCaseRows = <T>(rows: T[]): CamelCaseKeys<T>[] => { ... }
```

Supabase REST API はスネークケースのカラム名を返すため、
アプリケーション層で使用するキャメルケースに変換する。

#### `src/db/helpers.ts`
Supabase 型からアプリ層で使うキャメルケース型をエクスポート。

```typescript
// 例
export type UserRow = CamelCaseKeys<Database['public']['Tables']['users']['Row']>
export type ScenarioRow = CamelCaseKeys<Database['public']['Tables']['scenarios']['Row']>
```

### 変更ファイル

#### `src/lib/supabase/server.ts`
- `Database` 型パラメータを `createServerClient<Database>()` に適用
- データアクセス用の `createDbClient()` エイリアスを追加

#### interface.ts（6 ファイル）

Drizzle の `InferSelectModel` を Supabase 由来の型に置き換え。

| ファイル | 変更内容 |
|---------|---------|
| `users/[id]/interface.ts` | `InferSelectModel<typeof users>` → `UserRow` |
| `Profile/interface.ts` | 同上 |
| `home/interface.ts` | `ScenarioRow`, `GameSessionRow` 等に変更 |
| `scenarios/interface.ts` | 同上 |
| `scenarios/[id]/interface.ts` | 同上 + `scheduleDate: Date` → `string \| null` |
| `sessions/interface.ts` | 同上 + タイムスタンプ系が `Date` → `string` |

> **重要**: Supabase は ISO 文字列でタイムスタンプを返すため、
> 型が `Date` → `string` に変わった。

---

## Phase 1: 低複雑度の移行（6 ファイル・10 関数）

### 変換パターン

```typescript
// Before（Drizzle）
const user = await db.query.users.findFirst({
  where: eq(users.discordId, discordId),
})

// After（Supabase）
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('discord_id', discordId)
  .maybeSingle()
```

### 対象ファイル

| ファイル | 関数 | 変更ポイント |
|---------|------|------------|
| `users/[id]/adapter.ts` | `getUserById`, `getUserByDiscordId` | `findFirst` → `.select().eq().maybeSingle()` |
| `profile/adapter.ts` | `getUserByDiscordId`, `updateUserProfile` | 同上 + `.update()` |
| `home/adapter.ts` | `getUpcomingSessions`, `getNewScenarios` | Drizzle `with` → Supabase ネスト select |
| `signup/actions.ts` | `createUser` | `db.insert()` → `.from().insert()` + 明示的 `ulid()` |
| `auth/callback/route.ts` | GET handler | Drizzle import 除去 |
| `FeedbackModal/actions.ts` | `createFeedbackAction` | 同上 + 明示的 `ulid()` |

---

## Phase 2: 中複雑度の移行（1 ファイル・2 関数）

| ファイル | 関数 | 変更ポイント |
|---------|------|------------|
| `sessions/new/adapter.ts` | `createSession` | 明示的 `ulid()` で ID 生成、`camelCaseKeys()` で変換 |
| | `getSessionById` | ネスト select で scenario / participants を JOIN |

### ネスト select の例

```typescript
// Supabase のネスト select（JOINに相当）
const { data } = await supabase
  .from('game_sessions')
  .select(`
    *,
    scenario:scenarios(scenario_id, name),
    participants:session_participants(
      user_id, participant_type, participant_status, application_message
    )
  `)
  .eq('game_session_id', sessionId)
  .maybeSingle()
```

---

## Phase 3: 高複雑度の移行（4 ファイル・32 関数）

### `scenarios/adapter.ts`（8 関数）

**タグ AND フィルタの実装:**

```typescript
// Before（Drizzle）: GROUP BY + HAVING で全タグを持つシナリオを取得
// After（Supabase）: クライアントサイドで Map カウント

const { data: tagData } = await supabase
  .from('scenario_tags')
  .select('scenario_id')
  .in('tag_id', params.tagIds)

// 全タグを持つシナリオのみ（AND フィルタ）
const scenarioTagCounts = new Map<string, number>()
for (const row of tagData) {
  scenarioTagCounts.set(row.scenario_id, (count ?? 0) + 1)
}
const filteredIds = [...scenarioTagCounts]
  .filter(([_, count]) => count >= params.tagIds.length)
  .map(([id]) => id)
```

| 関数 | 概要 |
|------|------|
| `searchScenarios` | タグ AND フィルタ + ページング + ソート |
| `getScenarioById` | 単一取得 + ネスト select |
| `getAllSystems` | 全システム取得 |
| `getAllTags` | 全タグ取得 |
| `getUserByDiscordId` | Discord ID → User 取得 |
| `checkScenarioNameDuplicate` | 同一システム内の名前重複チェック |
| `checkDistributeUrlDuplicate` | 配布 URL 重複チェック（末尾スラッシュ正規化） |
| `createScenario` | シナリオ作成 + タグ紐付け |

### `scenarios/[id]/adapter.ts`（11 関数）

**AVG 評価の計算:**

```typescript
// Before（Drizzle）: avg(userReviews.rating) で DB 側計算
// After（Supabase）: 全 ratings 取得してクライアント計算

const { data: reviews } = await supabase
  .from('user_reviews')
  .select('rating')
  .eq('scenario_id', id)

const avgRating = reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
```

| 関数 | 概要 |
|------|------|
| `getScenarioDetail` | 基本情報 + タグ + 評価集計 |
| `getScenarioReviews` | ソート + ページング + ユーザー JOIN |
| `getScenarioSessions` | 完了済みセッション + keeper/参加者数バッチ取得 |
| `getScenarioVideoLinks` | 動画リンク + session/user JOIN |
| `getUserScenarioPreference` | ユーザープリファレンス取得 |
| `getUserByDiscordId` | Discord ID → User |
| `toggleFavorite` | お気に入りトグル（存在確認 → insert or update） |
| `togglePlayed` | プレイ済みトグル |
| `createReview` | レビュー作成 |
| `updateReview` | レビュー更新 |
| `deleteReview` | レビュー削除 |

### `sessions/adapter.ts`（7 関数）

**マルチ条件検索:**

```typescript
// ネスト select + 条件付きフィルタ
let query = supabase
  .from('game_sessions')
  .select(`
    *, scenario:scenarios!inner(*, system:scenario_systems(*)),
    schedule:game_schedules(schedule_date, schedule_phase)
  `, { count: 'exact' })
  .in('session_phase', [SessionPhases.RECRUITING.value])

if (params.systemIds?.length) {
  query = query.in('scenario.scenario_system_id', params.systemIds)
}
```

| 関数 | 概要 |
|------|------|
| `getCurrentUserId` | 認証ユーザー → Discord ID → User ID |
| `searchPublicSessions` | 公開セッション検索（keeper/参加者数バッチ取得） |
| `getUpcomingSessions` | 参加予定セッション取得 |
| `getHistorySessions` | 履歴セッション + レビュー/動画存在チェック |
| `getCalendarSessions` | カレンダー表示用セッション |
| `getAllSystems` | 全システム取得 |

### `sessions/participantAdapter.ts`（7 関数）

| 関数 | 概要 |
|------|------|
| `isSessionGM` | GM 権限チェック |
| `applyToSession` | 参加申請（募集中チェック + 重複チェック） |
| `approveApplication` | 申請承認（GM 権限チェック） |
| `rejectApplication` | 申請拒否（レコード削除） |
| `withdrawFromSession` | 辞退（完了/キャンセル済みチェック） |
| `cancelApplication` | 申請取消（承認済みは不可） |
| `cancelSession` | セッションキャンセル（GM 権限チェック） |

---

## Phase 4: クリーンアップ

### 削除したパッケージ

| パッケージ | 種別 | 用途 |
|-----------|------|------|
| `drizzle-orm` | dependency | ORM 本体 |
| `postgres` | dependency | PostgreSQL ドライバ |
| `@neondatabase/serverless` | dependency | サーバーレス DB ドライバ |
| `ws` | dependency | WebSocket（postgres 依存） |
| `drizzle-kit` | devDependency | マイグレーション・スタジオ |

### 削除したファイル

| ファイル | 内容 |
|---------|------|
| `src/db/index.ts` | Drizzle DB 接続（Hyperdrive / postgres クライアント） |
| `src/db/schema.ts` | Drizzle テーブル定義（17 テーブル + リレーション） |
| `src/db/seed.ts` | シードエントリポイント |
| `src/db/seed-test-data.ts` | テストデータシード |
| `src/lib/seeds-data/add-test-data.ts` | テストデータ追加スクリプト |
| `drizzle.config.ts` | Drizzle Kit 設定 |

### 設定変更

| ファイル | 変更内容 |
|---------|---------|
| `wrangler.jsonc` | `hyperdrive` バインディング設定を削除 |
| `package.json` | `db:generate`, `db:push`, `db:migrate`, `db:studio`, `db:seed` スクリプトを削除 |
| `tsconfig.json` | `noPropertyAccessFromIndexSignature: false` 追加（Biome 互換性） |

### 型修正（Date → string）

Supabase はタイムスタンプを ISO 文字列で返すため、コンポーネント側も修正。

| ファイル | 変更 |
|---------|------|
| `ReviewSection.tsx` | `formatDate(date: Date)` → `formatDate(date: string)` |
| `SessionSection.tsx` | `formatDate(date: Date \| null)` → `formatDate(date: string \| null)` |
| `SessionCard.tsx` | `formatDateTime(date: Date \| null)` → `formatDateTime(date: string \| null)` |
| `*.stories.tsx`（3 ファイル） | `new Date('2024-...')` → `'2024-...'` |

### テスト移行

| ファイル | 変更 |
|---------|------|
| `duplicateCheck.test.ts` | Drizzle `db.insert()` → Supabase `.from().insert()` + `ulid()` |
| `signup/page.tsx` | Drizzle `db.query.users.findFirst()` → Supabase `.from('users').select()` |

---

## 技術的判断

| 判断事項 | 選択 | 理由 |
|---------|------|------|
| RPC 関数の作成 | **不採用** | Supabase クエリビルダー + クライアント計算で対応できた |
| タグ AND フィルタ | クライアントサイド Map | Supabase REST では `GROUP BY HAVING` が直接使えない |
| 集計クエリ（AVG / COUNT） | クライアント計算 | 全 ratings 取得 → `reduce()` で計算 |
| N+1 問題 | `.in()` バッチ取得 | keeper / 参加者数を `sessionIds` でまとめて取得 |
| ULID 生成 | 明示的 `ulid()` | Drizzle の `$defaultFn(() => ulid())` が使えなくなったため |
| `noPropertyAccessFromIndexSignature` | 無効化 | Biome がブラケット記法をドット記法に戻すため TS との衝突を回避 |

---

## 検証結果

| 検証項目 | 結果 |
|---------|------|
| `npx tsc --noEmit` | OK |
| `pnpm build` | OK |
| `pnpm check`（Biome） | OK（既存の警告 4 件は移行とは無関係） |

---

## 残課題

- Cloudflare へのデプロイ確認とバンドルサイズ測定
- クライアントサイド集計のパフォーマンス検証（レビュー数が多い場合）
- タグ AND フィルタのパフォーマンス検証（タグ数・シナリオ数が増加した場合）
- 必要に応じて RPC 関数を追加して複雑なクエリを DB 側に移すことを検討
