# game_schedules テーブルを game_sessions に統合

## Context

`game_schedules` テーブルは `game_sessions` と 1:1 関係で、`schedule_phase`（ADJUSTING/CONFIRMED）と `schedule_date`（代表日時）の2カラムのみ保持。セッション作成時にレコードが作成されず、日程確定時に初めて UPSERT されるため、各所で null ハンドリングが必要でバグの温床になっている（例: `session.schedule?.schedulePhase ?? 'ADJUSTING'` が SessionActions.tsx と scheduleFlowGuards.ts で不統一）。

統合により `schedule_phase` は `DEFAULT 'ADJUSTING'` で常に値が存在し、null 分岐を排除できる。

## 決定事項

| 項目 | 決定 | 理由 |
|------|------|------|
| schedule_phase | `NOT NULL DEFAULT 'ADJUSTING'` | null ハンドリング排除 |
| schedule_date | `NULL 許容` | 未確定時は NULL が自然 |
| game_schedule_time_blocks FK | `game_sessions.game_session_id` に変更 | 親テーブル統合に伴う |
| game_schedules テーブル | データ移行後に DROP | 不要になる |
| RPC | UPSERT → UPDATE に変更 + `auth.uid()` 認可追加 | game_schedules が消えるため。再作成ついでにセキュリティ強化 |
| schedule_date の型 | `TIMESTAMP`（TZなし） | 既存 `game_schedules.schedule_date` と同じ型を維持 |
| インデックス | `game_sessions(schedule_date)` に作成 | カレンダー検索のパフォーマンス維持 |
| types.ts | 手動更新 | ローカル Supabase CLI 不要 |

## 前提条件

なし

---

## Batch 1: DB マイグレーション + 型追加（基盤）

**注意**: この Batch では `game_sessions` への列追加と types.ts への型追加のみ行う。`game_schedules` 関連の型削除は Batch 2 以降で、参照側を更新してから行う。これによりビルドが常に通る状態を維持する。

### Step 1-1. マイグレーション SQL 作成

**新規**: `supabase/migrations/0021_merge_game_schedules_into_game_sessions.sql`

処理順序:
1. `game_sessions` に `schedule_date TIMESTAMP` と `schedule_phase schedule_phase NOT NULL DEFAULT 'ADJUSTING'` を追加
2. `game_schedules` の既存データを `game_sessions` に移行（UPDATE ... FROM）
3. `game_schedule_time_blocks` の FK 変更（DROP + ADD → `game_sessions.game_session_id` 参照）
4. RPC `replace_confirmed_schedule_time_blocks` を再作成（UPSERT → UPDATE + `auth.uid()` 認可チェック追加）
5. `game_sessions(schedule_date)` にインデックスを作成
6. `game_schedules` の RLS ポリシー削除
7. `game_schedules` テーブル DROP

### Step 1-2. types.ts — 型の追加（削除は後続 Batch）

**変更**: `src/db/types.ts`

- `game_sessions` の Row に `schedule_date: string | null` と `schedule_phase: Database['public']['Enums']['schedule_phase']` を追加
- `game_sessions` の Insert/Update にも同様に追加（optional）
- `game_schedule_time_blocks` の Relationships で `referencedRelation` を `'game_sessions'`、`referencedColumns` を `['game_session_id']` に変更
- **`game_schedules` テーブル定義と `GameScheduleRow` はまだ削除しない**（Batch 2 で参照が消えてから削除）

---

## Batch 2: 型定義 + アダプター更新

### Step 2-1. sessions/interface.ts の更新

**変更**: `src/app/(main)/sessions/interface.ts`

- `GameScheduleRow` の import 削除
- `GameSchedule` 型エイリアス削除（L15）
- `SessionDetail` から `schedule: GameSchedule | null` を削除（L43）— `scheduleDate` と `schedulePhase` は `GameSession`（= `GameSessionRow`）に含まれるため自動的に利用可能
- `SessionWithRelations` から `schedule: GameSchedule | null` を削除（L58）
- export リストから `GameSchedule` を削除（L148）

### Step 2-2. home/interface.ts の更新

**変更**: `src/app/(main)/home/interface.ts`

- `GameScheduleRow` の import 削除
- `UpcomingSession` から `schedule: GameScheduleRow | null` を削除（L23）

### Step 2-3. sessions/adapter.ts の更新（4箇所）

**変更**: `src/app/(main)/sessions/adapter.ts`

- `searchPublicSessions`: select から `schedule:game_schedules(...)` 削除、マッピングで `session.schedule_date` / `session.schedule_phase` を直接参照
- `getUpcomingSessions`: select から `schedule:game_schedules(*)` 削除
- `getHistorySessions`: 同上
- `getCalendarSessions`: `game_schedules!inner(schedule_date)` → `schedule_date` 直接参照 + `.not('schedule_date', 'is', null)` フィルタ

### Step 2-4. sessions/[id]/adapter.ts の更新

**変更**: `src/app/(main)/sessions/[id]/adapter.ts`

- `getSessionDetail`（L86）: select から `game_schedules(*)` 削除
- マッピング（L129-131）: `schedule: isNil(data.game_schedules) ? null : ...` を削除
- `buildSessionTimeline`（L192-202）: `session.schedule?.schedulePhase` → `session.schedulePhase`、`session.schedule?.scheduleDate` → `session.scheduleDate`

### Step 2-5. scenarios/[id]/adapter.ts の更新

**変更**: `src/app/(main)/scenarios/[id]/adapter.ts`

- select から `schedule:game_schedules(schedule_date)` 削除、`schedule_date` を直接選択
- マッピング: `(s.schedule as ...)?.schedule_date` → `s.schedule_date`

### Step 2-6. home/adapter.ts の更新（2箇所）

**変更**: `src/app/(main)/home/adapter.ts`

- `getUpcomingSessions`（L85）: select から `schedule:game_schedules(*)` 削除
- `getSessionDatesForRange`（L334-339）: `from('game_schedules')` → `from('game_sessions')` に変更、`schedule_date` と `session_name` を直接選択

### Step 2-7. scheduleFlowGuards.ts の更新

**変更**: `src/app/(main)/sessions/[id]/scheduleFlowGuards.ts`

- `Promise.all` の2クエリ → 単一クエリに統合（`session_phase, schedule_phase` を同時取得）
- `schedule?.schedule_phase ?? 'ADJUSTING'` → `session.schedule_phase`（NOT NULL なので fallback 不要）

### Step 2-8. 旧型定義の削除（参照消去後に実施）

**変更**: `src/db/types.ts`
- `game_schedules` テーブル定義（Row/Insert/Update/Relationships）を削除

**変更**: `src/db/helpers.ts`
- `GameScheduleRow` export を削除

**レビューチェックポイント**: ファイル数 > 5 のため `/review-diff` 必須

---

## Batch 3: UI コンポーネント + ビジネスロジック更新

### Step 3-1. sessionActionsModel.ts の更新

**変更**: `src/app/(main)/sessions/[id]/_components/sessionActionsModel.ts`

- `schedulePhase` 引数型を `string | null` → `string` に変更（3関数: `getManagerActions`, `getParticipantActions`, `getAvailableSessionActions`）

### Step 3-2. SessionActions.tsx の更新

**変更**: `src/app/(main)/sessions/[id]/_components/SessionActions.tsx`

- `session.schedule?.schedulePhase ?? 'ADJUSTING'` → `session.schedulePhase`

### Step 3-3. BasicInfoSection.tsx の更新

**変更**: `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoSection.tsx`

- L137-138: `session.schedule?.scheduleDate` → `session.scheduleDate`

### Step 3-4. SessionCard.tsx の更新

**変更**: `src/app/(main)/sessions/_components/SessionCard.tsx`

- L148: `session.schedule?.scheduleDate ?? null` → `session.scheduleDate ?? null`

### Step 3-5. CalendarView.tsx の更新

**変更**: `src/app/(main)/sessions/_components/CalendarView.tsx`

- L49: `session.schedule?.scheduleDate` → `session.scheduleDate`

### Step 3-6. HeroSection.tsx の更新

**変更**: `src/app/(main)/home/_components/HeroSection.tsx`

- L29-30: `schedule = nextSession?.schedule` + `schedule?.scheduleDate` → `nextSession?.scheduleDate` に簡略化

### Step 3-7. UpcomingSessions.tsx の更新

**変更**: `src/app/(main)/home/_components/UpcomingSessions.tsx`

- L30: `session.schedule?.scheduleDate` → `session.scheduleDate`

**レビューチェックポイント**: ファイル数 = 7 のため `/review-diff` 必須

---

## Batch 4: テスト更新 + 最終検証

### Step 4-1. sessionActionsModel.test.ts の更新

**変更**: `src/app/(main)/sessions/[id]/_components/__tests__/sessionActionsModel.test.ts`

- `null` を渡している箇所を `SchedulePhases.ADJUSTING.value` に変更

### Step 4-2. adapter.test.ts の更新

**変更**: `src/app/(main)/sessions/__tests__/adapter.test.ts`

- `game_schedules` INSERT → `game_sessions` UPDATE に変更

### Step 4-3. fixtures.ts の更新

**変更**: `src/__tests__/helpers/fixtures.ts`

- `cleanupSessions` 内の `game_schedules` DELETE を削除

### Step 4-4. 最終検証

- `pnpm check` / `pnpm vitest` / `pnpm build` すべてパス

---

## ファイル一覧

| ファイル | 操作 | Batch |
|---------|------|-------|
| `supabase/migrations/0021_merge_game_schedules_into_game_sessions.sql` | 新規 | 1 |
| `src/db/types.ts` | 変更（追加） | 1 |
| `src/db/types.ts` | 変更（削除） | 2 |
| `src/db/helpers.ts` | 変更 | 2 |
| `src/app/(main)/sessions/interface.ts` | 変更 | 2 |
| `src/app/(main)/home/interface.ts` | 変更 | 2 |
| `src/app/(main)/sessions/adapter.ts` | 変更 | 2 |
| `src/app/(main)/sessions/[id]/adapter.ts` | 変更 | 2 |
| `src/app/(main)/scenarios/[id]/adapter.ts` | 変更 | 2 |
| `src/app/(main)/home/adapter.ts` | 変更 | 2 |
| `src/app/(main)/sessions/[id]/scheduleFlowGuards.ts` | 変更 | 2 |
| `src/app/(main)/sessions/[id]/_components/sessionActionsModel.ts` | 変更 | 3 |
| `src/app/(main)/sessions/[id]/_components/SessionActions.tsx` | 変更 | 3 |
| `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoSection.tsx` | 変更 | 3 |
| `src/app/(main)/sessions/_components/SessionCard.tsx` | 変更 | 3 |
| `src/app/(main)/sessions/_components/CalendarView.tsx` | 変更 | 3 |
| `src/app/(main)/home/_components/HeroSection.tsx` | 変更 | 3 |
| `src/app/(main)/home/_components/UpcomingSessions.tsx` | 変更 | 3 |
| `src/app/(main)/sessions/[id]/_components/__tests__/sessionActionsModel.test.ts` | 変更 | 4 |
| `src/app/(main)/sessions/__tests__/adapter.test.ts` | 変更 | 4 |
| `src/__tests__/helpers/fixtures.ts` | 変更 | 4 |

## 検証方法

```bash
pnpm check          # lint + format
pnpm vitest         # 全テスト
pnpm build          # ビルド確認
```

参照ゼロ確認:
```bash
# game_schedules への参照が完全に除去されたことを確認
grep -r "game_schedules" src/ --include="*.ts" --include="*.tsx"
# 期待: 0件
```

手動確認:
- セッション一覧（公開卓/参加予定/履歴）の日程表示
- セッション詳細のタイムライン・日程確定表示
- スケジュール提出/日程確定フロー
- ホーム画面のカウントダウン・カレンダー
