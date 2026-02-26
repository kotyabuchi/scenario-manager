# セッション日程調整（可用枠提出 + 複数枠確定）リデザイン 実装レビュー（バッチ別）

> **反映ステータス**: 反映済み（2026-02-26）
> **反映内容**: 推奨 2件（useOptimistic移行、テスト追加） + 検討 1件（スケルトンローディング）

> レビュー日時: 2026-02-26
> 対象計画: `docs/plans/session-availability-confirmation-redesign.md`
> 対象コミット範囲: `c1189c8` 〜 `eb4e90c`（途中のフォローアップ修正含む）
> レビュー方式: コミット履歴 + 現行実装のスポット確認（テスト未実行）

## 結論（要約）

- 実装範囲は概ね計画どおりで、**Batch 1〜3 は実質 DONE**、**Batch 4〜7 は機能実装済みだが一部計画乖離/検証不足あり（PARTIAL）**。
- 追加実装（`auth_user_id` 完全移行、`sessions/new` の可用枠移行、旧候補日DB/RPC削除）はコミット履歴・マイグレーション・コード反映の観点で **DONE**。
- 主な差分は、`useOptimistic` 未採用、Storybook/テスト粒度の不足、共通UIの配置が計画と異なる点。

## 主要指摘（優先順）

### 1. `useOptimistic` が未採用（Batch 5/6 計画乖離）【推奨】

- 計画/決定事項では提出保存・確定保存に `useOptimistic` + `useTransition` を採用する方針。
- 実装は `useState` + `useTransition` + 成功時反映/失敗時メッセージ表示で成立しているが、計画どおりの楽観的更新ではない。
- 該当:
  - `src/app/(main)/sessions/[id]/availability/_components/SubmitAvailabilityWorkspace.tsx:124`
  - `src/app/(main)/sessions/[id]/availability/_components/SubmitAvailabilityWorkspace.tsx:135`
  - `src/app/(main)/sessions/[id]/availability/_components/ConfirmAvailabilityWorkspace.tsx:171`
  - `src/app/(main)/sessions/[id]/availability/_components/ConfirmAvailabilityWorkspace.tsx:186`

### 2. Batch 4〜6 の Storybook / テスト粒度が計画より縮退（Batch 4/5/6/7 PARTIAL）【推奨】

- 計画では共通UI・提出UI・確定UIの個別 Storybook を複数作成する前提だったが、実装は `availability/_components` 配下の2本（集約型）に留まる。
- `availability` / `schedule/confirm` 配下の `*.test.ts(x)` は現時点で見当たらず、計画の Batch 7 Step 7-4 の回帰確認観点は未充足。
- 該当:
  - `src/app/(main)/sessions/[id]/availability/_components/AvailabilityWorkspaceLayout.stories.tsx`
  - `src/app/(main)/sessions/[id]/availability/_components/AvailabilityWorkspaces.stories.tsx`
  - `src/app/(main)/sessions/[id]/availability`
  - `src/app/(main)/sessions/[id]/schedule/confirm`

### 3. 共通UI基盤の配置が計画の `src/components/blocks` 想定と異なる（Batch 4 設計乖離）【検討】

- 計画のファイル一覧は `src/components/blocks/*` を想定していたが、実装は `src/app/(main)/sessions/[id]/availability/_components` に集約。
- 直近要件には対応できているが、他画面再利用や責務分離の観点では計画よりページ局所化されている。
- 該当:
  - `src/app/(main)/sessions/[id]/availability/_components/AvailabilityWorkspaceLayout.tsx`
  - `src/app/(main)/sessions/[id]/availability/_components/BaseAvailabilityCalendar.tsx`
  - `src/app/(main)/sessions/[id]/availability/_components/SelectedSlotsPanel.tsx`
  - `src/app/(main)/sessions/[id]/availability/_components/SelectedSlotsStickyBar.tsx`

### 4. ローディングのスケルトン要件は未確認/未実装（Batch 5/6 計画乖離）【検討】

- 計画では保存中/取得中のスケルトン表示を明示していたが、スポット確認では `isPending` によるボタン文言・disabled はあるものの、スケルトンの実装痕跡は確認できない。
- 該当:
  - `src/app/(main)/sessions/[id]/availability/_components/SubmitAvailabilityWorkspace.tsx:135`
  - `src/app/(main)/sessions/[id]/availability/_components/SubmitAvailabilityWorkspace.tsx:264`
  - `src/app/(main)/sessions/[id]/availability/_components/ConfirmAvailabilityWorkspace.tsx:186`
  - `src/app/(main)/sessions/[id]/availability/_components/ConfirmAvailabilityWorkspace.tsx:324`

## Batch 別レビュー

### Batch 1: DB基盤と型定義 — DONE

対象コミット:
- `c1189c8 feat(schedule-db): 可用枠・複数確定枠のスキーマと認証ID基盤を追加`

確認内容:
- `0011`〜`0013` マイグレーション追加（`users.auth_user_id`, `session_availability_slots`, `game_schedule_slots`）
- `current_app_user_id()` 導入 + RLSからの利用
- `src/db/types.ts` / `src/db/helpers.ts` 更新

証跡:
- `supabase/migrations/0011_add_users_auth_identity_columns.sql:88` (`current_app_user_id()` 定義)
- `supabase/migrations/0011_add_users_auth_identity_columns.sql:92` (`SECURITY DEFINER`)
- `supabase/migrations/0012_add_session_availability_slots.sql:59`
- `supabase/migrations/0013_add_game_schedule_slots.sql:60`
- `src/db/helpers.ts:74` (`resolveCurrentAppUserIdByAuthUid`)

備考:
- 計画上の Step 1-3（共通型追加）の実装ファイル `availability/interface.ts` は次コミット（Batch 2 実装コミット）で追加されているが、最終状態としては充足。

### Batch 2: Adapter / Server Actions — DONE

対象コミット:
- `5a63c4a feat(schedule-backend): 可用枠保存とおすすめ集計のサーバー処理を追加`
- `6b8ec6f fix(schedule-flow): 可用枠提出と日程確定のフェーズ制約をサーバー側で強化`（フォローアップ）

確認内容:
- 可用枠 Adapter / Action 実装
- 確定枠 Adapter / Action 実装
- Server Action 側フェーズ制約の強化

証跡:
- `src/app/(main)/sessions/[id]/availability/adapter.ts`
- `src/app/(main)/sessions/[id]/availability/actions.ts:63`
- `src/app/(main)/sessions/[id]/availability/actions.ts:68`
- `src/app/(main)/sessions/[id]/schedule/confirm/adapter.ts`
- `src/app/(main)/sessions/[id]/schedule/confirm/actions.ts:41`
- `src/app/(main)/sessions/[id]/schedule/confirm/actions.ts:45`
- `src/app/(main)/sessions/[id]/scheduleFlowGuards.ts`

備考:
- 計画レビュー指摘どおり、実装では Batch 2/3 の境界（おすすめ取得）を現実的に統合しており、結果として依存逆転問題は解消されている。

### Batch 3: 集計・おすすめロジック（純関数） — DONE

対象コミット:
- `5a63c4a feat(schedule-backend): 可用枠保存とおすすめ集計のサーバー処理を追加`

確認内容:
- 集計/推薦ロジック本体
- ユーティリティ
- 単体テスト（`recommendation`, `slotUtils`）
- `minPlaytimeMinutes = null` 対応、空配列返却、combo 母集団定数

証跡:
- `src/lib/availability/recommendation.ts:23` (`MAX_SINGLE_CANDIDATES_FOR_COMBO`)
- `src/lib/availability/recommendation.ts:177` (`return []`)
- `src/lib/availability/recommendation.ts:309` (`minPlaytimeMinutes === null ? true ...`)
- `src/lib/availability/__tests__/recommendation.test.ts`
- `src/lib/availability/__tests__/slotUtils.test.ts`
- `src/app/(main)/sessions/[id]/schedule/confirm/adapter.ts:190` (`getScheduleRecommendations`)

備考:
- `MAX_COMBO_RECOMMENDATIONS` の明示確認は今回未実施（コード全体レビュー未実施）。ただし主要定数と null/empty 分岐は確認できた。

### Batch 4: 共通 UI 基盤 — PARTIAL

対象コミット:
- `44bbe6a feat(schedule-ui): 可用枠提出と確定の共通ワークスペースUIを追加`

確認内容:
- 共通レイアウト、カレンダー、選択枠パネル、スティッキーバーの実装は存在
- SP ドロワーは Ark UI Dialog を使用
- `aria-live="polite"` は選択枠サマリーに実装

証跡:
- `src/app/(main)/sessions/[id]/availability/_components/AvailabilityWorkspaceLayout.tsx:3` (`@ark-ui/react/dialog`)
- `src/app/(main)/sessions/[id]/availability/_components/AvailabilityWorkspaceLayout.tsx:52`
- `src/app/(main)/sessions/[id]/availability/_components/SelectedSlotsPanel.tsx:53`
- `src/app/(main)/sessions/[id]/availability/_components/SelectedSlotsStickyBar.tsx:42`
- `src/app/(main)/sessions/[id]/availability/_components/BaseAvailabilityCalendar.tsx:57`

PARTIAL 理由:
- 計画ファイル一覧の想定配置（`src/components/blocks/*`）ではなく、`availability/_components` に配置されている（設計乖離）
- Storybook は個別コンポーネント単位ではなく集約型2本で、計画の粒度とは異なる

### Batch 5: 提出 UI（全員） — PARTIAL

対象コミット:
- `44bbe6a feat(schedule-ui): 可用枠提出と確定の共通ワークスペースUIを追加`
- `50990bc feat(schedule-flow): 可用枠提出と日程確定画面を実ルートに接続`
- `be09f8e feat(schedule-flow): 可用枠提出導線の提出済みラベル出し分けを追加`
- `6b8ec6f fix(schedule-flow): 可用枠提出と日程確定のフェーズ制約をサーバー側で強化`

確認内容:
- 提出UIワークスペース、サイドバー、エディタ、提出ルート、導線接続、提出済みラベル出し分け
- サーバー側フェーズ制約

証跡:
- `src/app/(main)/sessions/[id]/availability/_components/SubmitAvailabilityWorkspace.tsx`
- `src/app/(main)/sessions/[id]/availability/_components/SubmitSidebarContent.tsx`
- `src/app/(main)/sessions/[id]/availability/_components/AvailabilitySlotEditor.tsx`
- `src/app/(main)/sessions/[id]/availability/page.tsx:66`
- `src/app/(main)/sessions/[id]/availability/page.tsx:71`
- `src/app/(main)/sessions/[id]/availability/actions.ts:63`
- `src/app/(main)/sessions/[id]/availability/actions.ts:68`
- `src/app/(main)/sessions/[id]/_components/sessionActionsModel.ts:74`

PARTIAL 理由:
- `useOptimistic` ではなく `useState + useTransition` 実装（計画/決定事項との差分）
- 計画にあるスケルトン表示要件は確認できず（保存中文言/disabled は実装あり）
- `SubmitSidebarContent` の追加/解除通知に `aria-live=\"assertive\"` を確認できず（計画要件との差分）

### Batch 6: 確定 UI（主催者/GM/KP） — PARTIAL

対象コミット:
- `44bbe6a feat(schedule-ui): 可用枠提出と確定の共通ワークスペースUIを追加`
- `50990bc feat(schedule-flow): 可用枠提出と日程確定画面を実ルートに接続`
- `6b8ec6f fix(schedule-flow): 可用枠提出と日程確定のフェーズ制約をサーバー側で強化`

確認内容:
- 確定UIワークスペース、サイドバー、確定ルート、おすすめ取得/空状態、サーバー側フェーズ制約

証跡:
- `src/app/(main)/sessions/[id]/availability/_components/ConfirmAvailabilityWorkspace.tsx`
- `src/app/(main)/sessions/[id]/availability/_components/ConfirmSidebarContent.tsx:54`（空状態文言）
- `src/app/(main)/sessions/[id]/availability/_components/ConfirmSidebarContent.tsx:97`（グループ注記）
- `src/app/(main)/sessions/[id]/schedule/confirm/page.tsx:45`
- `src/app/(main)/sessions/[id]/schedule/confirm/page.tsx:49`
- `src/app/(main)/sessions/[id]/schedule/confirm/actions.ts:74`（おすすめ取得 Action）
- `src/app/(main)/sessions/[id]/schedule/confirm/actions.ts:88`

PARTIAL 理由:
- `useOptimistic` 未採用（Batch 5 と同様）
- 計画上のおすすめ取得中スケルトン/保存中スピナー明記に対し、確認できたのは `isPending` による文言切替・disabled まで
- `ConfirmSidebarContent` の追加/解除通知 `aria-live=\"assertive\"` を確認できず

### Batch 7: セッション詳細導線統合 + 旧導線整理 — PARTIAL

対象コミット:
- `50990bc feat(schedule-flow): 可用枠提出と日程確定画面を実ルートに接続`
- `01e41cf refactor(schedule-flow): 旧候補日ベースの日程調整フローを削除`
- `c152f16 refactor(schedule-flow): セッション詳細から旧候補日データ依存を削除`
- `e62159e fix(schedule-flow): 辞退時に旧候補日回答ではなく可用枠を削除`
- `be09f8e feat(schedule-flow): 可用枠提出導線の提出済みラベル出し分けを追加`
- `b2b1c14 feat(schedule-flow): セッション詳細で複数の確定日程枠を表示`

確認内容:
- PageHeader アクション導線の新フロー切替
- 旧 `schedule/respond`, `schedule/summary` を含む旧UI削除
- セッション詳細の旧候補日依存削除
- セッション詳細で複数確定枠表示

証跡:
- `src/app/(main)/sessions/[id]/_components/sessionActionsModel.ts:77`
- `src/app/(main)/sessions/[id]/_components/sessionActionsModel.ts:90`
- `src/app/(main)/sessions/[id]/_components/sessionActionsModel.ts:100`
- `src/app/(main)/sessions/[id]/adapter.ts:93`
- `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoSection.tsx:128`
- 削除対象確認（コミット `01e41cf`）:
  - `src/app/(main)/sessions/[id]/schedule/page.tsx`（削除）
  - `src/app/(main)/sessions/[id]/schedule/respond/page.tsx`（削除）
  - `src/app/(main)/sessions/[id]/schedule/summary/page.tsx`（削除）

PARTIAL 理由:
- Step 7-4（テスト追加・回帰確認）に対応する availability/confirm 配下のテストは確認できず
- `sessionActionsModel` テスト更新はあるが、UI/導線全体の回帰を裏づける証跡は限定的（今回テスト未実行）

## 追加実装レビュー（計画追記分）

### A. `auth_user_id` 完全移行 + `users.discord_id` 廃止（`0014`） — DONE

対象コミット:
- `dd13ee7 refactor(auth): auth_user_idへ完全移行してdiscord_idを廃止`

確認内容:
- `0014` マイグレーション追加
- アプリ全体の `auth_user_id` 移行
- Discord実ID抽出ヘルパー追加

証跡:
- `supabase/migrations/0014_drop_users_discord_id_and_use_auth_user_id.sql`
- `supabase/migrations/0014_drop_users_discord_id_and_use_auth_user_id.sql:172`
- `src/lib/supabase/discordAuth.ts`
- `src/db/helpers.ts:72`

### B. `sessions/new` 初期候補保存の可用枠移行 + 旧候補日DB/RPC削除（`0015`-`0017`） — DONE

対象コミット:
- `eb4e90c refactor(schedule-db): 初期候補保存を可用枠へ移行して旧候補日テーブル廃止準備を行う`

確認内容:
- `create_session_transaction` へのRPC切替
- 初期候補保存を `session_availability_slots` へ移行
- 旧候補日テーブル/関数/RPC削除マイグレーション

証跡:
- `src/app/(main)/sessions/new/adapter.ts:127`
- `src/app/(main)/sessions/new/adapter.ts:132`
- `supabase/migrations/0015_rename_create_session_rpc.sql`
- `supabase/migrations/0016_store_session_initial_candidates_as_availability_slots.sql`
- `supabase/migrations/0017_drop_legacy_schedule_candidate_tables.sql:4`
- `supabase/migrations/0017_drop_legacy_schedule_candidate_tables.sql:6`
- `supabase/migrations/0017_drop_legacy_schedule_candidate_tables.sql:7`

## 良い点

- RLS前提の `current_app_user_id()` 導入と `auth_user_id` 完全移行の整理ができている（Batch 1 + 追加実装）
- 提出/確定のフェーズ制約をページ側だけでなく Server Action 側にも追加しており、防御が強化されている
- おすすめロジックは純関数 + 単体テストに切り出されており、Batch 3 の分離方針が守られている
- 確定UIの空状態メッセージとグループ注記が実装され、計画レビュー時の懸念（提出不足/見学者境界）に対応している

## 未確認事項（今回のレビュー外）

- `pnpm check` / `pnpm vitest` 実行結果
- 手動テストチェックリスト（SPドロワー操作、日跨ぎ枠、権限別導線など）
- パフォーマンス基準（500ms以内）の実測

## 次のアクション（レビュー観点）

1. Batch 5/6 の `useOptimistic` 方針を採用するか、現行実装（`useState + useTransition`）を正式方針へ更新するかを決定
2. Batch 4〜6 の Storybook 粒度（個別 story vs 集約 story）をどこまで戻すか決定
3. Batch 7 Step 7-4 の回帰テスト（availability/confirm導線）を追加し、`pnpm vitest` 実行証跡を残す

