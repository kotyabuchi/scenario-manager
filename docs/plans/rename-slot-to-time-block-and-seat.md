# Rename Plan: Slot → TimeBlock / Seat

## Context

TRPGセッション管理アプリで「Slot」が**時間帯**と**人数枠**の2つの異なる概念に使われており、ドメイン用語として曖昧。
TRPG コミュニティの自然な言い回し（「候補日時」「確定日程」「残り席」）に統一する全面リネーム。

## 決定事項

| 判断 | 決定 |
|------|------|
| 時間帯の英語名 | `time_block` |
| 人数枠の英語名 | `seat` |
| 日本語（提出側） | 候補日時 |
| 日本語（確定側） | 確定日程 |
| 日本語（人数枠） | 席 |

## 用語マッピング

### DB オブジェクト

| 現在 | 新 |
|------|-----|
| `session_availability_slots` | `session_availability_time_blocks` |
| `game_schedule_slots` | `game_schedule_time_blocks` |
| `availability_slot_id` | `availability_time_block_id` |
| `game_schedule_slot_id` | `game_schedule_time_block_id` |
| `slot_order` | `block_order` |
| `remaining_player_slot_count` | `remaining_seat_count` |
| `adjust_session_remaining_player_slots` | `adjust_session_remaining_seats` |
| `sync_remaining_player_slots_on_participants` | `sync_remaining_seats_on_participants` |
| `replace_availability_slots` | `replace_availability_time_blocks` |
| `replace_confirmed_schedule_slots` | `replace_confirmed_schedule_time_blocks` |
| `p_initial_availability_slots` | `p_initial_availability_time_blocks` |
| `p_slots` | `p_time_blocks` |
| JSONB `availabilitySlotId` | `availabilityTimeBlockId` |
| JSONB `gameScheduleSlotId` | `gameScheduleTimeBlockId` |
| JSONB `slotOrder` | `blockOrder` |

### TypeScript 型・関数

| 現在 | 新 |
|------|-----|
| `SessionAvailabilitySlotRow` | `SessionAvailabilityTimeBlockRow` |
| `SessionAvailabilitySlotInsert` | `SessionAvailabilityTimeBlockInsert` |
| `GameScheduleSlotRow` | `GameScheduleTimeBlockRow` |
| `GameScheduleSlotInsert` | `GameScheduleTimeBlockInsert` |
| `GameScheduleSlot` | `GameScheduleTimeBlock` |
| `AvailabilitySlotRow` | `AvailabilityTimeBlockRow` |
| `ConfirmedScheduleSlotRow` | `ConfirmedScheduleTimeBlockRow` |
| `AvailabilitySlotWithUser` | `AvailabilityTimeBlockWithUser` |
| `AvailabilitySlotInput` | `AvailabilityTimeBlockInput` |
| `RecommendationSlot` | `RecommendationTimeBlock` |
| `RecommendationSourceSlot` | `RecommendationSourceTimeBlock` |
| `SlotLike` | `TimeBlockLike` |
| `SourceSlotWithMs` | `SourceTimeBlockWithMs` |
| `SlotWarningInput` | `SeatWarningInput` |
| `SlotWarningResult` | `SeatWarningResult` |
| `isSameSlot` | `isSameTimeBlock` |
| `isOverlappingSlot` | `isOverlappingTimeBlock` |
| `calcSlotMinutes` | `calcTimeBlockMinutes` |
| `toggleExactSlot` | `toggleExactTimeBlock` |
| `sortSlotsByStart` | `sortTimeBlocksByStart` |
| `getSlotWarning` | `getSeatWarning` |
| `calcSelectedSlotsTotalMinutes` | `calcSelectedTimeBlocksTotalMinutes` |
| `formatSlotDateTimeRange` | `formatTimeBlockDateTimeRange` |
| `calcTotalMinutes` | `calcTotalTimeBlockMinutes` |
| `saveSlotsServerAction` (page.tsx local) | `saveTimeBlocksServerAction` |
| `confirmSlotsServerAction` (page.tsx local) | `confirmTimeBlocksServerAction` |
| `SessionDetail.scheduleSlots` | `SessionDetail.scheduleTimeBlocks` |
| `SessionWithRelations.scheduleSlots` | `SessionWithRelations.scheduleTimeBlocks` |
| `RecommendationItem.slots` | `RecommendationItem.timeBlocks` |
| `AvailabilityWorkspaceLayoutProps.selectedSlotsSection` | `selectedTimeBlocksSection` |
| `AvailabilityWorkspaceData.myAvailabilitySlots` | `myAvailabilityTimeBlocks` |
| `AvailabilityWorkspaceData.otherUserAvailabilitySlots` | `otherUserAvailabilityTimeBlocks` |
| `AvailabilityWorkspaceData.confirmedScheduleSlots` | `confirmedScheduleTimeBlocks` |
| `PublicSortOption: 'slots_desc'` | `'seats_desc'` |

### ファイルリネーム

| 現在 | 新 |
|------|-----|
| `src/lib/availability/slotUtils.ts` | `timeBlockUtils.ts` |
| `src/lib/availability/__tests__/slotUtils.test.ts` | `timeBlockUtils.test.ts` |
| `src/app/.../sessions/_components/slotWarning.ts` | `seatWarning.ts` |
| `src/app/.../sessions/__tests__/slotWarning.test.ts` | `seatWarning.test.ts` |
| `src/app/.../_components/slotPresentation.ts` | `timeBlockPresentation.ts` |
| `src/app/.../_components/__tests__/slotPresentation.test.ts` | `timeBlockPresentation.test.ts` |
| `src/app/.../_components/AvailabilitySlotEditor.tsx` | `AvailabilityTimeBlockEditor.tsx` |
| `src/app/.../_components/SelectedSlotsPanel.tsx` | `SelectedTimeBlocksPanel.tsx` |
| `src/app/.../_components/SelectedSlotsStickyBar.tsx` | `SelectedTimeBlocksStickyBar.tsx` |

### UIラベル

| 現在 | 新 |
|------|-----|
| 提出枠 | 候補日時 |
| 確定枠 | 確定日程 |
| 日程枠 | 候補日時 |
| 枠を追加 | 日時を追加 |
| N枠（時間の件数） | N件 |
| おすすめ枠 | おすすめ候補 |
| 残りN枠 | 残りN席 |
| 残り枠順 | 残り席順 |
| 募集枠 | 募集席 |
| GM枠 | GM席 |
| `slots_desc` | `seats_desc` |

### リネーム対象外

- `slotRecipes` (`src/styles/recipes/index.ts`) — PandaCSS Slot Recipe
- `SlotRecipeFn` (`src/lib/create-style-context.tsx`) — Ark UI 概念
- `defineSlotRecipe` — PandaCSS API
- 「枠線」（UIコンポーネント要件の border 記述）

## 前提条件

- `feature/session-flow` ブランチで作業
- 既存マイグレーション（0010-0019）は変更しない
- `src/db/types.ts` は `supabase gen types` で自動再生成
- マイグレーション実行前に Supabase Dashboard で Point-in-Time Recovery が有効であることを確認
- 本計画は `/exec-plan` スキルで実行する前提（Batch 間のレビュー・テスト・コミットは自動実行）

---

## Batch 1: DB マイグレーション + Core Types

**見積もり**: 5 ファイル, ~350 行

### Step 1-1. マイグレーション SQL 作成

`supabase/migrations/0020_rename_slot_to_time_block_and_seat.sql` を作成。

処理順序（依存関係に基づく）:

1. **テーブルリネーム** (2件) — `ALTER TABLE ... RENAME TO`
2. **カラムリネーム** (4件) — `ALTER TABLE ... RENAME COLUMN`
3. **インデックスリネーム** (7件) — `ALTER INDEX ... RENAME TO`
4. **制約リネーム** (13件) — `ALTER TABLE ... RENAME CONSTRAINT`
5. **トリガー削除** (1件) — 既存トリガーを DROP
6. **関数削除** (6件) — 全 slot 関連関数を `DROP FUNCTION`
7. **関数再作成** (6件) — 新名称 + 新テーブル/カラム参照で `CREATE FUNCTION`
   - `adjust_session_remaining_seats`
   - `sync_remaining_seats_on_participants`
   - `create_session_transaction`（パラメータ名・JSONB キー更新）
   - `replace_availability_time_blocks`
   - `replace_confirmed_schedule_time_blocks`
   - ※ `create_session_transaction` は DROP → CREATE（パラメータ名変更のため RENAME 不可）
8. **トリガー再作成** (1件) — 新名称で CREATE TRIGGER
9. **RLS ポリシー再作成** (8件) — DROP 旧ポリシー + CREATE 新ポリシー
10. **RPC 権限設定** — REVOKE/GRANT を新関数に適用

**関数再作成時の権限チェックリスト（0018 準拠）:**

| 関数 | SECURITY DEFINER | SET search_path | REVOKE PUBLIC | GRANT TO |
|------|:----------------:|:---------------:|:-------------:|----------|
| `adjust_session_remaining_seats` | ○ | `public` | ○ | service_role |
| `sync_remaining_seats_on_participants` | ○ | `public` | ○ | (trigger) |
| `create_session_transaction` | ○ | `public` | ○ | authenticated, service_role |
| `replace_availability_time_blocks` | ○ | `public` | ○ | authenticated, service_role |
| `replace_confirmed_schedule_time_blocks` | ○ | `public` | ○ | authenticated, service_role |

### Step 1-2. マイグレーション適用 + 型再生成

`/supabase-migrate` スキルを実行:
- リモート DB にマイグレーション適用
- `src/db/types.ts` 再生成
- nullable 手動修正（必要なら）

### Step 1-3. Core Types 更新

**`src/db/helpers.ts`** — 4つの型エイリアスを更新:
- `GameScheduleSlotRow` → `GameScheduleTimeBlockRow`
- `SessionAvailabilitySlotRow` → `SessionAvailabilityTimeBlockRow`
- `GameScheduleSlotInsert` → `GameScheduleTimeBlockInsert`
- `SessionAvailabilitySlotInsert` → `SessionAvailabilityTimeBlockInsert`
- テーブル参照キー `session_availability_slots` → `session_availability_time_blocks` 等

**`src/app/(main)/sessions/interface.ts`** — 型エイリアス + フィールド名更新:
- `GameScheduleSlot` → `GameScheduleTimeBlock`
- `SessionDetail.scheduleSlots` → `scheduleTimeBlocks`
- `SessionWithRelations.scheduleSlots` → `scheduleTimeBlocks`
- `PublicSortOption: 'slots_desc'` → `'seats_desc'`

**`src/app/(main)/sessions/[id]/availability/interface.ts`** — 全型 + フィールド名更新:
- `AvailabilitySlotRow` → `AvailabilityTimeBlockRow`
- `ConfirmedScheduleSlotRow` → `ConfirmedScheduleTimeBlockRow`
- `AvailabilitySlotWithUser` → `AvailabilityTimeBlockWithUser`
- `AvailabilitySlotInput` → `AvailabilityTimeBlockInput`
- `RecommendationSlot` → `RecommendationTimeBlock`
- `RecommendationSourceSlot` → `RecommendationSourceTimeBlock`
- `RecommendationItem.slots` → `RecommendationItem.timeBlocks`
- `AvailabilityWorkspaceData.myAvailabilitySlots` → `myAvailabilityTimeBlocks`
- `AvailabilityWorkspaceData.otherUserAvailabilitySlots` → `otherUserAvailabilityTimeBlocks`
- `AvailabilityWorkspaceData.confirmedScheduleSlots` → `confirmedScheduleTimeBlocks`

---

## Batch 2: ユーティリティライブラリ

**見積もり**: 7 ファイル, ~200 行

### Step 2-1. slotUtils → timeBlockUtils

`src/lib/availability/slotUtils.ts` → `timeBlockUtils.ts`:
- ファイルリネーム（`git mv`）
- `SlotLike` → `TimeBlockLike`
- 全関数名リネーム（マッピング表参照）
- `calcTotalMinutes` → `calcTotalTimeBlockMinutes`
- 変数名 `slot`/`slots` → `timeBlock`/`timeBlocks`

### Step 2-2. slotWarning → seatWarning

`src/app/(main)/sessions/_components/slotWarning.ts` → `seatWarning.ts`:
- ファイルリネーム
- `SlotWarningInput` → `SeatWarningInput`
- `SlotWarningResult` → `SeatWarningResult`
- `getSlotWarning` → `getSeatWarning`
- `remainingSlots` → `remainingSeats`
- UIラベル: `残り${N}枠` → `残り${N}席`
- JSDoc コメント更新

### Step 2-3. slotPresentation → timeBlockPresentation

`src/app/.../availability/_components/slotPresentation.ts` → `timeBlockPresentation.ts`:
- ファイルリネーム
- `calcSelectedSlotsTotalMinutes` → `calcSelectedTimeBlocksTotalMinutes`
- `formatSlotDateTimeRange` → `formatTimeBlockDateTimeRange`
- import 元 `slotUtils` → `timeBlockUtils`

### Step 2-4. recommendation.ts 内部参照更新

`src/lib/availability/recommendation.ts`:
- `SourceSlotWithMs` → `SourceTimeBlockWithMs`
- import 元 `slotUtils` → `timeBlockUtils`
- 変数名 `slot`/`slots` → `timeBlock`/`timeBlocks`
- 関数パラメータ `slots: RecommendationSourceSlot[]` → `timeBlocks: RecommendationSourceTimeBlock[]`
- 内部結果オブジェクト `slots: [segment.slot]` → `timeBlocks: [segment.timeBlock]` 等

### Step 2-5. 全 import パス更新

Batch 2 完了後に以下のファイルの import を更新:
- `ConfirmAvailabilityWorkspace.tsx` — `slotUtils` → `timeBlockUtils`
- `SubmitAvailabilityWorkspace.tsx` — `slotUtils` → `timeBlockUtils`
- `SelectedSlotsPanel.tsx` — `slotPresentation` → `timeBlockPresentation`
- `SelectedSlotsStickyBar.tsx` — `slotPresentation` → `timeBlockPresentation`
- `PublicTab.tsx` — `slotWarning` → `seatWarning`
- その他 `slotUtils` を import している全ファイル

---

## Batch 3: ビジネスロジック（Adapter / Schema / Actions）

**見積もり**: 13 ファイル, ~300 行

### Step 3-1. availability adapter / schema / actions

**`src/app/(main)/sessions/[id]/availability/schema.ts`**:
- `saveAvailabilitySlotsSchema` → `saveAvailabilityTimeBlocksSchema`
- `SaveAvailabilitySlotsValues` → `SaveAvailabilityTimeBlocksValues`
- フィールド `slots` → `timeBlocks`
- バリデーションメッセージ: 「提出枠は100件以内」→「候補日時は100件以内」

**`src/app/(main)/sessions/[id]/availability/adapter.ts`**:
- RPC 名: `replace_availability_slots` → `replace_availability_time_blocks`
- RPC パラメータ: `p_slots` → `p_time_blocks`
- JSONB キー: `availabilitySlotId` → `availabilityTimeBlockId`
- 関数名: `replaceAvailabilitySlots` → `replaceAvailabilityTimeBlocks`
- エラーメッセージ: 「提出枠同士が重複」→「候補日時同士が重複」
- ログメッセージ: 「可用枠」→「候補日時」/ 「提出枠」→「候補日時」
- 変数名 `slot`/`slots` → `timeBlock`/`timeBlocks`

**`src/app/(main)/sessions/[id]/availability/actions.ts`**:
- import 更新（スキーマ名、型名）
- `saveAvailabilitySlotsAction` → `saveAvailabilityTimeBlocksAction`

### Step 3-2. confirm adapter / schema / actions

**`src/app/(main)/sessions/[id]/schedule/confirm/schema.ts`**:
- `confirmScheduleSlotsSchema` → `confirmScheduleTimeBlocksSchema`
- `ConfirmScheduleSlotsValues` → `ConfirmScheduleTimeBlocksValues`
- フィールド `slots` → `timeBlocks`
- バリデーションメッセージ: 「確定枠」→「確定日程」、「日程枠」→「候補日時」

**`src/app/(main)/sessions/[id]/schedule/confirm/adapter.ts`**:
- RPC 名: `replace_confirmed_schedule_slots` → `replace_confirmed_schedule_time_blocks`
- RPC パラメータ: `p_slots` → `p_time_blocks`
- JSONB キー: `gameScheduleSlotId` → `gameScheduleTimeBlockId`, `slotOrder` → `blockOrder`
- 関数名: `replaceConfirmedScheduleSlots` → `replaceConfirmedScheduleTimeBlocks`
- エラーメッセージ: 「確定枠」→「確定日程」、「日程枠」→「候補日時」
- 変数名 `slot`/`slots` → `timeBlock`/`timeBlocks`

**`src/app/(main)/sessions/[id]/schedule/confirm/actions.ts`**:
- import 更新（スキーマ名、型名）
- `confirmScheduleSlotsAction` → `confirmScheduleTimeBlocksAction`

### Step 3-3. session adapter + participantAdapter + 新規セッション作成

**`src/app/(main)/sessions/[id]/adapter.ts`**:
- 変数名 `scheduleSlots` → `scheduleTimeBlocks` 等
- `.from('game_schedule_slots')` → `'game_schedule_time_blocks'`
- `.order('slot_order')` → `'block_order'`
- ログメッセージ: 「確定枠」→「確定日程」

**`src/app/(main)/sessions/participantAdapter.ts`**:
- `.select('remaining_player_slot_count')` → `'remaining_seat_count'`
- `sessionCapacity.remaining_player_slot_count` → `remaining_seat_count`
- エラーメッセージ: 「プレイヤー募集枠」→「プレイヤー募集席」、「PL募集枠」→「PL募集席」
- ログメッセージ: 「可用枠」→「候補日時」
- 変数名更新

**`src/app/(main)/sessions/new/adapter.ts`**:
- `p_initial_availability_slots` → `p_initial_availability_time_blocks`
- JSONB キー `availabilitySlotId` → `availabilityTimeBlockId`
- 変数名 `initialAvailabilitySlotPayload` → `initialAvailabilityTimeBlockPayload`

**`src/app/(main)/sessions/[id]/availability/page.tsx`**:
- ローカル関数 `saveSlotsServerAction` → `saveTimeBlocksServerAction`
- パラメータ `slots: AvailabilitySlotInput[]` → `timeBlocks: AvailabilityTimeBlockInput[]`
- 呼び出し `saveAvailabilitySlotsAction(id, { slots })` → `saveAvailabilityTimeBlocksAction(id, { timeBlocks })`

**`src/app/(main)/sessions/[id]/schedule/confirm/page.tsx`**:
- ローカル関数 `confirmSlotsServerAction` → `confirmTimeBlocksServerAction`
- パラメータ・呼び出し更新

**`src/app/(main)/sessions/searchParams.ts`**:
- `slots_desc` → `seats_desc`

**`src/app/(main)/sessions/adapter.ts`** (セッション一覧):
- `case 'slots_desc'` → `case 'seats_desc'`

---

## Batch 4: UI コンポーネント & スタイル

**見積もり**: 15 ファイル, ~350 行

### Step 4-1. コンポーネントファイルリネーム

3 ファイルを `git mv` + 内部リネーム:

- `AvailabilitySlotEditor.tsx` → `AvailabilityTimeBlockEditor.tsx`
  - Props 型: `AvailabilitySlotEditorProps` → `AvailabilityTimeBlockEditorProps`
  - コンポーネント名: `AvailabilitySlotEditor` → `AvailabilityTimeBlockEditor`
  - UIラベル: 「枠を追加」→「日時を追加」
  - import 元の型名更新

- `SelectedSlotsPanel.tsx` → `SelectedTimeBlocksPanel.tsx`
  - Props 型: `SelectedSlotsPanelProps` → `SelectedTimeBlocksPanelProps`
  - コンポーネント名: `SelectedSlotsPanel` → `SelectedTimeBlocksPanel`
  - UIラベル: 「日程枠がまだ選択されていません」→「候補日時がまだ選択されていません」
  - 「N枠」→「N件」
  - import 元更新（`timeBlockPresentation`）

- `SelectedSlotsStickyBar.tsx` → `SelectedTimeBlocksStickyBar.tsx`
  - Props 型 + コンポーネント名リネーム
  - 「N枠」→「N件」
  - import 元更新（`timeBlockPresentation`）

### Step 4-2. ワークスペース・サイドバー更新

**`SubmitAvailabilityWorkspace.tsx`**:
- import 更新（リネーム済みコンポーネント・関数）
- UIラベル: 「自分の提出枠」→「自分の候補日時」
- 「他の人の提出枠」→「他の人の候補日時」
- 「同じ枠をクリックで追加」→「同じ日時をクリックで追加」
- 変数名 `selectedDateSlotCount` → `selectedDateTimeBlockCount` 等
- エラーメッセージ: 「既存の提出枠と時間が重複」→「既存の候補日時と時間が重複」

**`ConfirmAvailabilityWorkspace.tsx`**:
- import 更新
- UIラベル: 「確定枠を選びます」→「確定日程を選びます」
- `item.slots.length` → `item.timeBlocks.length`（RecommendationItem フィールド参照）
- 変数名更新

**`AvailabilityWorkspaceLayout.tsx`**:
- Props 型: `selectedSlotsSection` → `selectedTimeBlocksSection`
- 分割代入の変数名更新
- import 更新は不要（styles のみ使用）

**`BaseAvailabilityCalendar.tsx`**:
- `styles.slotListItemSub` → `styles.timeBlockListItemSub`（style 参照更新）

**`SubmitSidebarContent.tsx`**:
- 「他の人の提出枠」→「他の人の候補日時」
- 「同じ枠を自分の提出枠に追加 / 解除」→「同じ日時を自分の候補日時に追加 / 解除」
- 「他ユーザーの提出枠がありません」→「他ユーザーの候補日時がありません」

**`ConfirmSidebarContent.tsx`**:
- 「提出枠が不足しています」→「候補日時が不足しています」
- 「N枠セット」→「N件セット」
- `item.slots` → `item.timeBlocks`（RecommendationItem フィールド参照）

**`PublicTab.tsx`**:
- `slots_desc` → `seats_desc`
- 「残り枠順」→「残り席順」
- import: `getSlotWarning` → `getSeatWarning`

### Step 4-3. スタイル定義更新

**`src/app/(main)/sessions/_components/styles.ts`**:
- `publicCard_slotWarning` → `publicCard_seatWarning`

**`src/app/(main)/sessions/[id]/styles.ts`**:
- `info_scheduleSlotList` → `info_scheduleTimeBlockList`
- `info_scheduleSlotItem` → `info_scheduleTimeBlockItem`

**`src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoSection.tsx`**:
- `styles.info_scheduleSlotList` → `styles.info_scheduleTimeBlockList`
- `styles.info_scheduleSlotItem` → `styles.info_scheduleTimeBlockItem`
- `session.scheduleSlots` → `session.scheduleTimeBlocks`
- `hasConfirmedScheduleSlots` → `hasConfirmedScheduleTimeBlocks`

**`src/app/(main)/sessions/[id]/availability/_components/styles.ts`**:
- `selectedSlotsPanel` → `selectedTimeBlocksPanel`
- `selectedSlotsSummary` → `selectedTimeBlocksSummary`
- `selectedSlotsSummaryRow` → `selectedTimeBlocksSummaryRow`
- `slotList` → `timeBlockList`
- `slotListItem` → `timeBlockListItem`
- `slotListItemMain` → `timeBlockListItemMain`
- `slotListItemLabel` → `timeBlockListItemLabel`
- `slotListItemSub` → `timeBlockListItemSub`
- `slotListItemActions` → `timeBlockListItemActions`

---

## Batch 5: テスト & ドキュメント

**見積もり**: 15 ファイル, ~350 行

### Step 5-1. テストファイルリネーム + 内容更新

3 ファイルを `git mv` + テスト記述更新:

- `slotUtils.test.ts` → `timeBlockUtils.test.ts`
  - import 元更新
  - テスト記述: 「枠の完全一致・重複判定」→「日時の完全一致・重複判定」

- `slotWarning.test.ts` → `seatWarning.test.ts`
  - JSDoc: 「残り枠警告」→「残り席警告」
  - テスト記述: 「残り1枠」→「残り1席」等
  - `expect(result?.label).toBe('残り1枠')` → `'残り1席'`

- `slotPresentation.test.ts` → `timeBlockPresentation.test.ts`
  - import 元更新
  - テスト記述: 「スロット」→「日時」

### Step 5-2. その他テスト・モック更新

- `recommendation.test.ts` — テスト記述内の「枠」→適切な用語、import更新、`slots` 変数名 → `timeBlocks`
- `sessionActionsModel.test.ts` — 「可用枠提出」→「候補日時提出」等のテスト記述更新
- `AvailabilityWorkspaces.test.tsx` — アサーション文字列更新（「自分の提出枠」→「自分の候補日時」等）
- `AvailabilityWorkspaceLayout.stories.tsx` — style 参照 `selectedSlotsPanel`/`slotList`/`slotListItem*` → 新名称、テキスト更新
- `AvailabilityWorkspaces.stories.tsx` — モックデータのフィールド名更新（`availabilitySlotId` → `availabilityTimeBlockId`、`gameScheduleSlotId` → `gameScheduleTimeBlockId`、`slotOrder` → `blockOrder`、`myAvailabilitySlots` → `myAvailabilityTimeBlocks`、`confirmedScheduleSlots` → `confirmedScheduleTimeBlocks`）
- `src/__tests__/helpers/fixtures.ts` — `.from('session_availability_slots')` → `'session_availability_time_blocks'`、`.from('game_schedule_slots')` → `'game_schedule_time_blocks'`
- `src/app/(main)/sessions/new/__tests__/adapter.test.ts` — `.from('session_availability_slots')` → `'session_availability_time_blocks'`、`p_initial_availability_slots` → `p_initial_availability_time_blocks`
- `src/app/(main)/home/_components/_mocks.ts` — `remainingPlayerSlotCount` → `remainingSeatCount`
- `src/app/(main)/sessions/[id]/_components/SessionDetailContent.stories.tsx` — `remainingPlayerSlotCount` → `remainingSeatCount`、`scheduleSlots` → `scheduleTimeBlocks`

### Step 5-3. 要件定義書更新

- `.claude/requirements/requirements-v1.md` — slot 関連の記述があれば更新（該当なしの可能性あり）
- `.claude/requirements/requirements-session-list.md` — 「残り枠警告」→「残り席警告」、`slots_desc` → `seats_desc`
- `.claude/requirements/requirements-session-flow.md` — 「GM枠」→「GM席」等

---

## ファイル一覧

### 新規ファイル

| ファイル | Batch |
|---------|-------|
| `supabase/migrations/0020_rename_slot_to_time_block_and_seat.sql` | 1 |

### リネームファイル（git mv）

| 変更前 → 変更後 | Batch |
|----------------|-------|
| `slotUtils.ts` → `timeBlockUtils.ts` | 2 |
| `slotWarning.ts` → `seatWarning.ts` | 2 |
| `slotPresentation.ts` → `timeBlockPresentation.ts` | 2 |
| `slotUtils.test.ts` → `timeBlockUtils.test.ts` | 5 |
| `slotWarning.test.ts` → `seatWarning.test.ts` | 5 |
| `slotPresentation.test.ts` → `timeBlockPresentation.test.ts` | 5 |
| `AvailabilitySlotEditor.tsx` → `AvailabilityTimeBlockEditor.tsx` | 4 |
| `SelectedSlotsPanel.tsx` → `SelectedTimeBlocksPanel.tsx` | 4 |
| `SelectedSlotsStickyBar.tsx` → `SelectedTimeBlocksStickyBar.tsx` | 4 |

### 変更ファイル

| ファイル | Batch | 主な変更 |
|---------|-------|---------|
| `src/db/types.ts` | 1 | 自動再生成 |
| `src/db/helpers.ts` | 1 | 型エイリアス更新 |
| `sessions/interface.ts` | 1 | 型・フィールド名・PublicSortOption 更新 |
| `availability/interface.ts` | 1 | 全型・フィールド名更新 |
| `recommendation.ts` | 2 | 内部参照・フィールド名更新 |
| `availability/schema.ts` | 3 | スキーマ名・メッセージ |
| `availability/adapter.ts` | 3 | RPC 名・JSONB キー |
| `availability/actions.ts` | 3 | import・関数名 |
| `availability/page.tsx` | 3 | ローカル関数名・パラメータ |
| `confirm/schema.ts` | 3 | スキーマ名・メッセージ |
| `confirm/adapter.ts` | 3 | RPC 名・JSONB キー |
| `confirm/actions.ts` | 3 | import・関数名 |
| `confirm/page.tsx` | 3 | ローカル関数名・パラメータ |
| `sessions/[id]/adapter.ts` | 3 | 変数名・テーブル名・ログ |
| `participantAdapter.ts` | 3 | DB カラム名・エラー/ログメッセージ |
| `sessions/new/adapter.ts` | 3 | RPC パラメータ名 |
| `sessions/searchParams.ts` | 3 | `slots_desc` → `seats_desc` |
| `sessions/adapter.ts` | 3 | ソートケース更新 |
| `SubmitAvailabilityWorkspace.tsx` | 4 | import・ラベル |
| `ConfirmAvailabilityWorkspace.tsx` | 4 | import・ラベル・フィールド参照 |
| `AvailabilityWorkspaceLayout.tsx` | 4 | prop 名・style 参照 |
| `BaseAvailabilityCalendar.tsx` | 4 | style 参照 |
| `SubmitSidebarContent.tsx` | 4 | ラベル |
| `ConfirmSidebarContent.tsx` | 4 | ラベル・フィールド参照 |
| `PublicTab.tsx` | 4 | import・ラベル |
| `sessions/_components/styles.ts` | 4 | CSS 名 |
| `sessions/[id]/styles.ts` | 4 | CSS 名 |
| `availability/_components/styles.ts` | 4 | CSS 名 |
| `BasicInfoSection.tsx` | 4 | style 参照・フィールド名 |
| `recommendation.test.ts` | 5 | テスト記述・変数名 |
| `sessionActionsModel.test.ts` | 5 | テスト記述 |
| `AvailabilityWorkspaces.test.tsx` | 5 | アサーション文字列 |
| `AvailabilityWorkspaceLayout.stories.tsx` | 5 | style 参照・テキスト |
| `AvailabilityWorkspaces.stories.tsx` | 5 | モックデータフィールド名 |
| `src/__tests__/helpers/fixtures.ts` | 5 | テーブル名更新 |
| `sessions/new/__tests__/adapter.test.ts` | 5 | テーブル名・パラメータ名 |
| `home/_components/_mocks.ts` | 5 | フィールド名更新 |
| `SessionDetailContent.stories.tsx` | 5 | フィールド名更新 |
| `requirements-v1.md` | 5 | 用語置換（該当あれば） |
| `requirements-session-list.md` | 5 | 用語置換 |
| `requirements-session-flow.md` | 5 | 用語置換 |

## 検証方法

### 各 Batch 完了時
1. `pnpm check` — lint / format 確認
2. `pnpm vitest` — 全テスト実行
3. `pnpm build` — ビルド確認

### Batch 1 完了後（追加）
- Supabase Dashboard でテーブル名確認
- `supabase gen types` で型整合性確認

### 最終確認
- `pnpm dev` で開発サーバー起動
- セッション詳細 → 候補日時提出 → 日程確定の一連フローを手動確認
- UI ラベルが新用語になっていることを目視確認
