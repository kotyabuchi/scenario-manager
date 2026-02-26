# セッション日程調整（可用枠提出 + 複数枠確定）リデザイン計画

## Context

現行の日程調整フローは「主催者が候補日を作成し、参加者が○△×で回答する」前提で実装されている。

- 候補日作成: `src/app/(main)/sessions/[id]/schedule/`
- 回答: `src/app/(main)/sessions/[id]/schedule/respond/`
- 集計・確定: `src/app/(main)/sessions/[id]/schedule/summary/`

しかし、要件としては以下のフローが必要になった。

- 全員が「参加可能な時間枠（可用枠）」を提出できる
- 1日に対して複数枠を提出できる（例: `3/1 12:00-15:00`, `3/1 18:00-22:00`）
- 日跨ぎ枠も許容する（例: `3/1 22:00 - 3/2 02:00`）
- 提出された可用枠を集計し、主催者/GM/KP がおすすめ候補から複数枠を確定できる
- 日程確定は「準備中フェーズ」の主催者メインアクション（セッション詳細 PageHeader アクション群）とする

本計画では、既存の候補日+回答モデルを段階的に置き換え、**可用枠提出 + 複数枠確定モデル**へ移行する。

## 要件（確定）

### 提出

- 全員が可用枠を提出可能
- 同日複数枠を提出可能
- 日跨ぎ枠を許容
- 時間粒度は **30分固定**
- 提出UIは共通レイアウトを使用し、右サイドに他ユーザー提出枠（時間付き）を表示
- 他ユーザー提出枠は **クリックで同じ枠を自分の提出枠に追加/解除** 可能

### 集計・おすすめ

- 単純な合計時間最大化ではなく優先順位付きでおすすめ表示
- 優先順位:
  1. `1回` で最低プレイ時間を満たす枠
  2. `1回` で重なり時間が長い枠
  3. `複数回` の場合、合計で最低プレイ時間を満たし、できるだけ近くまとまる枠
- 見学者優先度は「重み」ではなく **おすすめ表示グループの分離** で扱う
  - 先頭: 全ユーザー（見学含む）参加可
  - 次点: 見学を無視すれば成立する候補
  - 境界に注記: `ここから下は見学者が参加できない候補です`

### 確定

- 主催者/GM/KP が複数枠を確定可能（前編/後編など）
- 再編集（再確定）を許可
- 確定UIは提出UIと同じレイアウト骨格を使い、右サイドにおすすめ一覧を表示
- おすすめ一覧は **クリックでその枠（または枠セット）を確定候補に追加/解除** 可能

### レイアウト

- PC:
  - 左: カレンダー + 選択中日程
  - 右: サイドパネル常時表示
- SP:
  - メイン: カレンダー + 選択中日程
  - 下固定バー: 合計時間 / 最低時間 / サイド表示切替 / 保存・確定
  - サイド内容: ドロワー（Bottom Sheet）

## 現行実装との差分（影響範囲）

| 項目 | 現行 | 変更後 |
|------|------|--------|
| 入力モデル | 主催者が候補日作成 | 全員が可用枠提出 |
| 参加者操作 | ○△×回答 | 可用枠提出/更新 |
| 確定モデル | 単一候補ID確定 | 複数枠確定（timestamp区間） |
| 集計軸 | OK件数中心 | 時間枠重なり + 優先順位付き推薦 |
| UI構造 | 画面ごとに別UI | 共通レイアウト骨格 + submit/confirm差分 |

## 決定事項

| 項目 | 決定 | 理由 |
|------|------|------|
| 時間粒度 | 30分固定 | 集計・UI・バリデーションを安定させる |
| 日跨ぎ | 許容 | 実運用に必要 |
| 提出UI/確定UI | 共通レイアウト骨格を採用 | 学習コスト低減・再利用性向上 |
| PCサイド表示 | 常時表示 | 横幅を活かして比較性向上 |
| SPサイド表示 | ドロワー | 画面占有を抑えつつ情報量を確保 |
| 見学者優先度 | グループ分離表示 | 重み付けより説明可能性が高い |
| 確定操作 | 複数枠全置換（再編集可） | 実装が単純で整合性を保ちやすい |
| 提出保存 | 自分の枠を全置換 | 差分更新より実装/検証が容易 |
| 旧フロー | 段階的移行（即削除しない） | 回帰リスクを下げる |
| 参加者ロール分類 | DB enum `participant_type`（`KEEPER/PLAYER/SPECTATOR`）をそのまま使用。HOST判定は `created_by_id === user_id` で導出 | 新enum追加は不要。GM/KPの表示区別はゲームシステム依存でDB上はどちらも`KEEPER` |
| 型導出原則 | Supabase生成型（`Database['public']['Tables'][T]['Row']`）から導出。UIビューモデル型のみ独自定義を許容 | `typescript-rules.md` の Single Source of Truth 原則に準拠 |
| タイムゾーン | UIは JST 固定表示。DB は `timestamptz` で保存し、日跨ぎ判定は JST 基準 | 国内TRPG向けサービスのため、Phase 1 では JST 固定で十分 |
| `schedule_phase` | 既存の `ADJUSTING / CONFIRMED` をそのまま流用。可用枠提出中 = `ADJUSTING`、確定後 = `CONFIRMED` | 新enum値追加は不要。既存フローとの互換性を維持 |
| 楽観的更新 | 提出保存・確定保存で `useOptimistic` + `useTransition` パターンを使用 | `react-rules.md` の楽観的更新ルールに準拠 |
| 楽観的更新失敗時UX | トースト通知でエラーメッセージ表示 + ロールバック後の状態を維持 | 失敗原因を即時に伝え、再操作しやすくする |
| 離脱者の提出枠 | WITHDRAWNユーザーの枠は集計から除外。データは残置し Phase 2 で整理 | 削除すると参照整合性の問題が生じる |
| 確定枠の自由入力 | Phase 1 ではおすすめ一覧からの選択のみ。自由枠入力は Phase 2 で検討 | Phase 1 のUIと検証を単純に保つ |
| 確定操作の同時編集 | Last-write-wins（後勝ち）。ロック機構は不要 | 主催者/GM/KPは通常1-2人で競合リスクが低い |
| 提出操作の同時編集 | Last-write-wins（後勝ち）。複数タブでも最後の保存を採用 | 提出保存も全置換のため競合解決を単純化 |
| ユーザーID/認証ID/DiscordID | `users.user_id`（ULID, 業務FK）と `users.auth_user_id`（uuid, Supabase Auth UID）を分離。Discord実IDは `users.discord_account_id`（text）で保持 | RLS/認証判定の混乱を防ぎ、将来のDiscord Bot連携（DM/メンション）に必要なIDを保持する |
| SP ドロワー実装 | Ark UI Dialog（drawer mode）を使用 | フォーカストラップ/復元を安定して実装できる |

## 前提条件

- `game_sessions`, `game_schedules`, `session_participants`, `users` は既存利用
- セッション詳細のアクション制御は `src/app/(main)/sessions/[id]/_components/sessionActionsModel.ts` を拡張して実装可能
- 既存 `schedule_candidates / schedule_responses` は当面残置し、導線を切り替えて段階移行する

---

## データモデル設計（DB）

### 既存 `users` テーブルのID整理（Phase 1で実施）

背景:
- 現状の `users.discord_id` は名称に反して `auth.uid()`（Supabase Auth UID）を保持している可能性が高い
- 本機能でRLSを追加するにあたり、`auth.uid()` と業務FK（`users.user_id`）の対応を明確化する必要がある
- 将来的な Discord Bot 連携のため、DiscordユーザーID（Snowflake）は別カラムで保持したい

Phase 1 の到達形（推奨）:
- `users.user_id`（既存）: ULID, 業務FK用（維持）
- `users.auth_user_id`（新規）: `uuid`, `UNIQUE`, `NOT NULL`（Supabase Auth UID）
- `users.discord_account_id`（新規）: `text`, `UNIQUE`, `NULL` 許容（Discord User ID / Snowflake）

移行方針（段階移行）:
1. `users.auth_user_id uuid` を追加し、既存 `users.discord_id` の値を backfill（`::uuid` cast）
2. `users.discord_account_id text` を追加（Phase 1 では未取得ユーザーは `NULL` 許容）
3. 認証照合/RLS/アプリコードを `auth_user_id` 基準へ移行
4. 既存 `users.discord_id` は互換のため当面残置（Phase 2 で rename/drop を別計画）

### 追加テーブル1: 可用枠提出

**テーブル名**: `session_availability_slots`

用途:
- 全ユーザーの提出可用枠（元データ）

主カラム（案）:
- `availability_slot_id` (ULID, PK)
- `session_id` (FK -> `game_sessions.game_session_id`)
- `user_id` (FK -> `users.user_id`)
- `start_at` (`timestamptz`)
- `end_at` (`timestamptz`)
- `created_at`
- `updated_at`

制約:
- `start_at < end_at`
- 30分単位（`start_at` / `end_at` が 30分境界）

推奨インデックス:
- `(session_id)`
- `(session_id, user_id)`
- `(session_id, start_at)`
- `(session_id, end_at)`

### 追加テーブル2: 確定枠（複数）

**テーブル名**: `game_schedule_slots`

用途:
- 最終確定された複数枠

主カラム（案）:
- `game_schedule_slot_id` (ULID, PK)
- `game_schedule_id` (FK -> `game_schedules.game_schedule_id`)
- `session_id` (FK -> `game_sessions.game_session_id`) ※検索簡略化のため重複保持
- `start_at` (`timestamptz`)
- `end_at` (`timestamptz`)
- `slot_order` (`int`)
- `created_by` (FK -> `users.user_id`)
- `created_at`
- `updated_at`

制約:
- `start_at < end_at`
- 30分単位

推奨インデックス:
- `(session_id)`
- `(game_schedule_id, slot_order)`
- `(session_id, start_at)`

### 既存 `game_schedules` の扱い

- 親レコードとして維持
- UI/ロジックは `game_schedule_slots` を主参照に切り替える
- 単一日時カラム（既存互換用途）は段階移行中は維持

### 既存 `schedule_candidates / schedule_responses` の扱い

- 当面は削除しない
- 新導線リリース後に利用箇所を停止
- 影響範囲の回帰確認後に削除計画を別途作成

---

## TypeScript 型設計（コード化前確定）

### DB行型（Supabase生成型から導出）

マイグレーション後に `supabase gen types typescript` で再生成される `src/db/types.ts` から導出する。
以下は実装時の導出パターンを示す（計画段階の概要）:

```ts
import type { Database } from '@/db/types'

// DB行型 — Single Source of Truth
type AvailabilitySlotRow = Database['public']['Tables']['session_availability_slots']['Row']
type AvailabilitySlotInsert = Database['public']['Tables']['session_availability_slots']['Insert']
type GameScheduleSlotRow = Database['public']['Tables']['game_schedule_slots']['Row']
type GameScheduleSlotInsert = Database['public']['Tables']['game_schedule_slots']['Insert']
type UserRow = Database['public']['Tables']['users']['Row']

// 参加者ロール — DB enum をそのまま使用
// DB: participant_type = 'KEEPER' | 'PLAYER' | 'SPECTATOR'
// HOST判定: game_sessions.created_by_id === user_id で導出（enumには含めない）
// GM/KP 表示区別: ゲームシステム依存（DB上はどちらも KEEPER）
```

### 集計ロジック用の参加者情報型

```ts
// DB enum + 導出フラグで構成
type ScheduleParticipantInfo = {
  userId: string;
  userName: string;
  participantType: Database['public']['Enums']['participant_type']; // 'KEEPER' | 'PLAYER' | 'SPECTATOR'
  isHost: boolean; // game_sessions.created_by_id === user_id で導出
};

// 参加者分類（集計ロジックで使用）
// requiredUsers: participantType が 'KEEPER' または 'PLAYER'
// spectators: participantType が 'SPECTATOR'
```

### UI表示用: 提出枠 + ユーザー情報付き

```ts
// AvailabilitySlotRow をベースに表示用フィールドを付加
type AvailabilitySlotWithUser = AvailabilitySlotRow & {
  userName: string;
  participantType: Database['public']['Enums']['participant_type'];
  isHost: boolean;
};
```

### クライアントUI用ドラフト型（独自定義を許容）

```ts
// UI上で編集中の未保存枠（DBに対応するRowがないため独自定義）
type AvailabilitySlotDraft = {
  tempId: string;
  startAt: string;
  endAt: string;
};
```

### おすすめ（推薦）関連型（独自定義 — DB非永続化）

```ts
// サーバー側で計算して返す一時的な集計結果のため、独自定義を許容

type CoverageSummary = {
  totalRequiredUsers: number;
  totalSpectators: number;
  coveredRequiredUsers: number;
  coveredSpectators: number;
};

type RecommendationKind = 'single' | 'combo';
type RecommendationGroupType = 'all_users' | 'required_users_only';

type RecommendationItem = {
  recommendationId: string;
  kind: RecommendationKind;
  group: RecommendationGroupType;
  slots: Array<{
    startAt: string;
    endAt: string;
  }>;
  totalMinutes: number;
  meetsMinPlaytime: boolean;
  coverage: CoverageSummary;
  reasonLabels: string[];
  // 表示/デバッグ補助用。実際のソートは comparator 関数で評価順（複数項目）を一元管理する
  rankingScore: {
    priorityBucket: number;
    durationMinutes: number;
    compactnessScore: number;
  };
};

type RecommendationGroup = {
  group: RecommendationGroupType;
  title: string;
  note?: string;
  items: RecommendationItem[];
};
```

### 画面初期データ型（共通）

```ts
type AvailabilityWorkspaceData = {
  sessionId: string;
  sessionName: string;
  minPlaytimeMinutes: number | null;
  currentUserId: string;
  currentUserParticipantType: Database['public']['Enums']['participant_type'] | null;
  currentUserIsHost: boolean;
  myAvailabilitySlots: AvailabilitySlotRow[];
  otherUserAvailabilitySlots: AvailabilitySlotWithUser[];
  confirmedScheduleSlots: GameScheduleSlotRow[];
};
```

### UI ViewModel（カレンダー/サイドバー表示）

```ts
type CalendarDayBadge = {
  dateKey: string; // yyyy-MM-dd (表示日)
  markers: string[];
  counts?: {
    submissions: number;
    overlapStrong: number;
  };
};

type SidebarSlotItem = {
  itemId: string;
  startAt: string;
  endAt: string;
  label: string;
  subLabel?: string;
  meta?: string;
  state: 'default' | 'selected' | 'partial' | 'disabled';
};
```

### 補助関数（共通ユーティリティ）

- `normalizeToThirtyMinutes()`
- `isOverlappingSlot(a, b)`
- `isSameSlot(a, b)` (`startAt/endAt` 完全一致)
- `toggleExactSlot(list, slot)`
- `calcTotalMinutes(slots)`
- `formatSlotRange(startAt, endAt)`（日跨ぎ表示対応）
- `getDateKeyFromSlot(slot)`（カレンダー同期用）
- `resolveCurrentAppUserIdByAuthUid()`（`auth.uid()` -> `users.user_id` 解決。adapter/action/RLS前提の補助）

---

## API / Server Actions 設計

### 1. ワークスペース初期データ取得（共通）

**関数**: `getAvailabilityWorkspaceData(sessionId: string)`

責務:
- セッション名取得
- シナリオ最低プレイ時間取得
- 現在ユーザー取得
- 現在ユーザーの参加ロール取得
- 自分の提出枠取得
- 他ユーザー提出枠取得（名前・役割付き）
- 既存確定枠取得（再編集用）

利用画面:
- 提出UI
- 確定UI

### 2. 可用枠保存（全員）

**Action**: `saveAvailabilitySlotsAction(sessionId, slots)`

保存方式:
- 自分の提出枠を **全置換**

認可:
- 主催者/GM/KP/承認済み参加者
- 見学者も提出可能（要件上全員可）

バリデーション:
- `startAt < endAt`
- 30分単位
- 同一ユーザー内の重複・交差禁止（Phase 1）
- 上限件数（例: 100）

副作用:
- セッション詳細・提出UI・確定UI関連パス再検証

### 3. おすすめ取得（主催者/GM/KP）

**関数/Action**: `getScheduleRecommendations(sessionId)`

返却:
- `RecommendationGroup[]`

認可:
- 主催者/GM/KP のみ

備考:
- サーバー側で集計/ランキング済みで返す（クライアントで再計算しない）
- DBアクセス（提出枠/参加者/シナリオ最低プレイ時間取得）+ 認可 + 純関数呼び出し + DTO整形を担当
- 提出枠が 0 件（または集計対象が空）の場合は `[]` を返す（エラーにしない）
- 提出不足メッセージの表示責務は確定UI側が持つ

### 4. 確定枠保存（複数・再編集可）

**Action**: `confirmScheduleSlotsAction(sessionId, selectedSlots)`

保存方式:
- `game_schedule_slots` 全置換
- 再実行で上書き可能

認可:
- 主催者/GM/KP のみ

バリデーション:
- `selectedSlots.length >= 1`（Phase 1: 0件確定は不許可）
- `startAt < endAt`
- 30分単位
- 確定枠同士の重複・交差禁止
- `slot_order` の再採番

副作用:
- セッション詳細ページ再検証
- `game_schedules.schedule_phase` を更新
  - 初回確定成功時: `CONFIRMED`
  - 再編集保存成功時: `CONFIRMED` のまま維持（確定枠のみ全置換）
- `session_phase` は本機能では更新しない（準備中フェーズ内の主催者アクションとして扱う）

---

## 集計・おすすめロジック設計（サーバー）

## 基本方針

- 30分単位の半開区間 `[start, end)` で統一
- 日跨ぎ枠も時刻区間としてそのまま扱う
- 「見学者の扱い」は重み付けではなく **グループ分離**

### パフォーマンス基準

| 指標 | 想定上限 | 許容レスポンスタイム |
|------|---------|-------------------|
| 参加者数 | 10人 | - |
| 提出枠/人 | 20枠 | - |
| 全提出枠数 | 200枠 | - |
| おすすめ生成 | 上記条件で | 500ms以内 |

集計ロジックの単体テストにベンチマークケースを含め、上記条件で性能を確認する。

### `minPlaytimeMinutes = null` 時の扱い

- シナリオ最低プレイ時間が未設定（`null`）の場合:
  - `meetsMinPlaytime = true`（常に達成扱い）
  - 単一枠ランキングは実質 `durationMinutes desc` → `startAt asc`
  - combo は「参考表示」に留める（単一枠優先の並びを維持）

### 参加者分類

- `requiredUsers`: `participant_type` が `KEEPER` または `PLAYER`（主催者は `created_by_id` で判定し、いずれかに含まれる）
- `spectators`: `participant_type` が `SPECTATOR`
- WITHDRAWNユーザー（`participant_status = 'WITHDRAWN'`）は集計から除外

### おすすめグループ

1. `all_users`
- `requiredUsers + spectators` 全員が参加可能

2. `required_users_only`
- `requiredUsers` 全員が参加可能（spectators は無視）
- UI注記を付与:
  - `ここから下は見学者が参加できない候補です`

### 単一枠候補生成

処理概要:
1. 全提出枠の `start_at`, `end_at` を境界として時間軸を分割
2. 各セグメントの参加可能ユーザー集合を求める
3. 同一参加可能集合が連続するセグメントは結合
4. グループ条件（`all_users`, `required_users_only`）を満たす枠を抽出

単一枠の評価順（グループ内）:
1. `meetsMinPlaytime`（最低プレイ時間達成）を優先
2. `durationMinutes` 降順
3. `startAt` 昇順（安定化）

### 複数枠組み合わせ候補（combo）

目的:
- 単一枠で最低プレイ時間を満たせない場合の代替候補を提示

生成方針:
- 各グループの上位N単一枠を母集団にする（組み合わせ爆発回避）
- 組み合わせサイズは上限（例: 2〜4枠）
- 合計時間 `>= minPlaytimeMinutes` を満たす候補を抽出
- `minPlaytimeMinutes = null` の場合は「最低時間達成」の判定を行わず、単一枠優先で補助的に表示

評価順:
1. `slotCount` 昇順（少ないほど良い）
2. `sameDay` 優先
3. `timeGapTotal` 昇順
4. `daySpan` 昇順
5. `totalMinutes` 降順
6. `firstStartAt` 昇順

### 理由ラベル（UI表示用）

候補例:
- `1回で最低プレイ時間を満たす`
- `全ユーザー参加可`
- `見学者を除けば全員参加可`
- `重なり 4時間30分`
- `2枠で最低プレイ時間を満たす`
- `同日で完結`

---

## UI アーキテクチャ設計

### コンポーネント分割（共通骨格 + モード差分）

#### 共通骨格

- `AvailabilityWorkspaceLayout`
- `BaseAvailabilityCalendar`
- `SelectedSlotsPanel`
- `SelectedSlotsStickyBar`
- `DesktopSidebarPanel`（Phase 1 は `AvailabilityWorkspaceLayout` 内部実装・非公開コンポーネント）
- `MobileSidebarDrawer`（Phase 1 は `AvailabilityWorkspaceLayout` 内部実装・非公開コンポーネント）

#### 提出UI専用

- `SubmitAvailabilityWorkspace`
- `SubmitSidebarContent`（他ユーザー提出枠）
- `AvailabilitySlotEditor`（枠追加・編集）

#### 確定UI専用

- `ConfirmAvailabilityWorkspace`
- `ConfirmSidebarContent`（おすすめ一覧）

### レイアウト（PC）

- 左カラム
  - 上: カレンダー（日別バッジ）
  - 下: 選択中日程（提出枠/確定候補）
- 右カラム（常時表示）
  - 提出UI: 他ユーザー提出枠（時間付き）
  - 確定UI: おすすめ一覧（グループ分け）

### レイアウト（SP）

- 上: カレンダー
- 中: 選択中日程（簡易）
- 下固定バー:
  - 合計時間 / 最低時間進捗
  - サイド内容表示ボタン
  - 保存/確定
- サイド内容:
  - `MobileSidebarDrawer`（Bottom Sheet, Ark UI Dialog drawer mode）
  - 開閉時フォーカス管理: フォーカストラップ + クローズ時にトリガーへ復帰

---

## 主要コンポーネント Props 設計（コード化前）

### `BaseAvailabilityCalendar`

```ts
type BaseAvailabilityCalendarProps = {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  dayBadges: CalendarDayBadge[];
  readonly?: boolean;
  highlightedDates?: string[]; // yyyy-MM-dd
  className?: string;
};
```

責務:
- 日付グリッド描画
- 日単位のバッジ/密度表示
- 色だけに依存しない情報伝達（件数テキスト/`aria-label` 併用）
- 月移動
- 日選択イベント通知

### `AvailabilityWorkspaceLayout`

```ts
type AvailabilityWorkspaceLayoutProps = {
  calendar: React.ReactNode;
  selectedPanel: React.ReactNode;
  desktopSidebar: React.ReactNode;
  mobileSidebar: React.ReactNode;
  stickyBar: React.ReactNode;
};
```

責務:
- PC/SP のレイアウト切り替え
- サイドバー表示位置の管理（見た目）
- `MobileSidebarDrawer` のフォーカストラップ/復元（Ark UI Dialog drawer mode を使用）

### `SelectedSlotsPanel`

```ts
type SelectedSlotsPanelProps = {
  slots: AvailabilitySlotDraft[];
  minPlaytimeMinutes: number | null;
  readonly?: boolean;
  onRemoveSlot?: (tempId: string) => void;
  onMoveSlotUp?: (tempId: string) => void;
  onMoveSlotDown?: (tempId: string) => void;
};
```

責務:
- 選択中枠の一覧表示
- 合計時間表示
- 最低プレイ時間との比較（達成/未達）
- 並び替え/削除（提出・確定で共通）

### `SubmitSidebarContent`

```ts
type SubmitSidebarContentProps = {
  selectedDate: Date | null;
  otherUserSlots: AvailabilitySlot[];
  selectedMySlots: AvailabilitySlotDraft[];
  onClickOtherUserSlot: (slot: AvailabilitySlot) => void;
};
```

クリック挙動:
- 他ユーザー枠をクリック -> 同じ時間枠を自分の提出枠へ `追加/解除`
- exact一致: トグル
- 部分重複: 追加拒否（エラー表示）

### `AvailabilitySlotEditor`（提出UI専用）

```ts
type AvailabilitySlotEditorProps = {
  selectedDate: Date | null;
  slots: AvailabilitySlotDraft[];
  onAddSlot: (slot: { startAt: string; endAt: string }) => void;
  onUpdateSlot: (tempId: string, patch: { startAt: string; endAt: string }) => void;
  onRemoveSlot: (tempId: string) => void;
  disabled?: boolean;
};
```

責務:
- 選択日の枠追加/編集UI
- 30分単位の入力補助
- クライアント側の基本バリデーション表示（重複・逆転）

### `ConfirmSidebarContent`

```ts
type ConfirmSidebarContentProps = {
  groups: RecommendationGroup[];
  selectedSlots: AvailabilitySlotDraft[];
  onClickRecommendation: (item: RecommendationItem) => void;
  onFocusSlot?: (slot: { startAt: string; endAt: string }) => void;
};
```

クリック挙動:
- `single`: 1枠トグル
- `combo`: セット単位トグル（全追加/全解除）
- 部分選択時は `partial` 表示

### `SelectedSlotsStickyBar`（SP）

```ts
type SelectedSlotsStickyBarProps = {
  slotCount: number;
  totalMinutes: number;
  minPlaytimeMinutes: number | null;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  primaryActionDisabled?: boolean;
};
```

---

## 画面・ルーティング計画

### 提出UI（全員）

新規推奨ルート:
- `src/app/(main)/sessions/[id]/availability/page.tsx`

関連ファイル（想定）:
- `adapter.ts`
- `actions.ts`
- `schema.ts`
- `styles.ts`
- `_components/SubmitAvailabilityWorkspace.tsx`

### 確定UI（主催者/GM/KP）

新規推奨ルート:
- `src/app/(main)/sessions/[id]/schedule/confirm/page.tsx`

関連ファイル（想定）:
- `adapter.ts`
- `actions.ts`
- `schema.ts`
- `styles.ts`
- `_components/ConfirmAvailabilityWorkspace.tsx`

### セッション詳細 PageHeader アクション統合（準備中フェーズ）

対象:
- `src/app/(main)/sessions/[id]/_components/SessionActions.tsx`
- `src/app/(main)/sessions/[id]/_components/sessionActionsModel.ts`
- `src/app/(main)/sessions/[id]/_components/SessionDetailContent.tsx`

追加/変更アクション:
- 主催者/GM/KP:
  - 初回: `日程を確定する`
  - 確定済み: `日程を再編集する`
- 参加者/見学:
  - `参加可能時間を提出`
  - 提出済みなら `参加可能時間を更新`

---

## バリデーション設計（サーバー/クライアント）

### 提出枠（`saveAvailabilitySlotsAction`）

- `startAt < endAt`
- 30分単位
- 同一ユーザー内で重複/交差禁止（Phase 1）
- 件数上限（例: 100）
- セッション参加権限確認
- 過去日時チェック: **Phase 1 は許容**（テスト容易性優先）。Phase 2 で制限を検討

### 確定枠（`confirmScheduleSlotsAction`）

- `startAt < endAt`
- 30分単位
- 確定枠同士の重複/交差禁止
- 権限確認（主催者/GM/KP）
- `slot_order` の再採番

### UI 右サイドクリック追加（提出/確定共通）

- exact一致: `toggle`
- 交差するが一致しない: 追加拒否（メッセージ）
- 追加成功時:
  - 左下選択中パネル更新
  - `selectedDate` を枠開始日に同期

### 同時編集（複数タブ）

- 提出枠保存（全置換）: Last-write-wins
- 確定枠保存（全置換）: Last-write-wins
- 競合検知UI/ロックは Phase 1 では実装しない

---

## 移行方針

### Phase 1（新フロー追加）

- `users` の認証ID整理（`auth_user_id` / `discord_account_id` 追加、`auth_user_id` backfill）
- 新DBテーブル追加
- 新提出UI / 新確定UI追加
- セッション詳細導線を新フローへ切替
- 旧 `schedule/respond`, `schedule/summary` は残置（未導線化または注記）

### Phase 2（旧フロー整理）

- `users.discord_id`（旧・実態はAuth UID格納列）の rename/drop 計画を実施
- 認証照合コードを `auth_user_id` に完全移行し、互換参照を撤去
- 提出枠の過去日時バリデーション（必要なら）を導入
- Server Action レート制限（可用枠保存/確定保存）の導入を検討
- 旧候補日+回答フローの参照を削除
- `schedule_candidates / schedule_responses` の使用箇所撤去
- 必要ならデータ移行/削除計画を別途策定

---

## テスト計画

### DB / Adapter

- 可用枠の取得・保存（全置換）
- 日跨ぎ枠の保存
- 重複/交差の拒否
- 確定枠の全置換・再編集

### 集計ロジック

- `all_users` / `required_users_only` グループ分け
- 単一枠で最低時間達成の優先
- 長時間枠優先
- combo のまとまり優先（gap/daySpan）
- 日跨ぎケース
- 見学者境界注記の出し分け
- `minPlaytimeMinutes = null` 時の `meetsMinPlaytime = true` / 単一枠優先の並び

### UI（提出）

- 他ユーザー枠クリックで自分の枠へ追加/解除
- exact一致トグル
- 部分重複時のエラー表示
- SP ドロワー開閉
- SP ドロワー開閉時のフォーカス移動/復帰
- 楽観的更新失敗時のトースト通知 + ロールバック

### UI（確定）

- おすすめ単一枠クリックで追加/解除
- combo クリックでセット追加/解除
- 部分選択状態表示
- 最低プレイ時間進捗表示
- 再編集時の初期選択反映
- おすすめ空状態（提出不足メッセージ）
- `minPlaytimeMinutes = null` 時の表示（未設定扱い）
- 楽観的更新失敗時のトースト通知 + ロールバック

### セッション詳細

- 準備中フェーズのメインアクション表示
- 権限別の表示差分（主催者/GM/KP/PL/見学）

---

## 実装バッチ計画

## Batch 1: DB基盤と型定義

### Step 1-1. マイグレーション追加（ユーザー認証ID整理 + 可用枠/確定枠 + RLSポリシー）

- **追加（番号は例。実装時は最新連番に合わせる）**:
  - `supabase/migrations/0011_add_users_auth_identity_columns.sql`
  - `supabase/migrations/0012_add_session_availability_slots.sql`
  - `supabase/migrations/0013_add_game_schedule_slots.sql`
- `users.auth_user_id uuid UNIQUE NOT NULL` を追加し、既存 `users.discord_id` から backfill
- `users.discord_account_id text UNIQUE NULL` を追加（将来のDiscord Bot連携用）
- backfill 前に `users.discord_id` の UUID妥当性を preflight チェック（非UUID値が存在する場合は移行停止 + 手動方針に切替）
- 30分単位制約・インデックス・FKを定義
- `current_app_user_id()` SQL関数を追加（`SECURITY DEFINER`, `search_path = ''` を明示）

**RLSポリシー設計**（既存 `schedule_candidates` / `schedule_responses` のパターンに準拠）:

前提:
- `auth.uid()` は Supabase Auth UID（uuid）
- 業務FKは `users.user_id`（ULID）を使用するため、RLS内では `users.auth_user_id = auth.uid()` から `users.user_id` を解決して判定する
- `user_id = auth.uid()` の直接比較は使用しない

推奨:
- `auth.uid()` -> `users.user_id` を解決するSQL関数（例: `current_app_user_id()`）を定義してRLS式で再利用

`session_availability_slots`:
- **SELECT**: セッション参加者（`session_participants` に `participant_status = 'CONFIRMED'` で存在）+ 主催者（`created_by_id`）
- **INSERT**: 本人のみ（`user_id = current_app_user_id()` 相当）かつ「承認済み参加者 or 主催者」
- **UPDATE**: 本人の枠のみ（`user_id = current_app_user_id()` 相当）
- **DELETE**: 本人の枠のみ（`user_id = current_app_user_id()` 相当）

`game_schedule_slots`:
- **SELECT**: セッション参加者 + 主催者
- **INSERT**: 主催者/KEEPER のみ（`isSessionManager` 相当。`auth.uid()` -> `users.user_id` 解決後に判定）
- **UPDATE**: 主催者/KEEPER のみ（同上）
- **DELETE**: 主催者/KEEPER のみ（同上）

### Step 1-2. DB型再生成

- Supabase型を再生成
- `src/db/types.ts` 反映確認

### Step 1-3. 共通型追加

- **追加候補**: `src/app/(main)/sessions/[id]/availability/interface.ts`（または sessions共通 interface 拡張）
- DB生成型（`AvailabilitySlotRow`, `GameScheduleSlotRow`）からの導出型を定義
- `AvailabilitySlotWithUser`, `ScheduleParticipantInfo`, `AvailabilityWorkspaceData` を定義
- おすすめ関連型（`RecommendationItem`, `RecommendationGroup` 等）はDB非永続化のため独自定義
- `src/db/helpers.ts` に `resolveCurrentAppUserIdByAuthUid()` を実装（Batch 1 内で追加/拡張）

### Review Checkpoint: Batch 1

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] `/review-diff` 実行（ファイル数 > 5 or 変更行数 > 100 の場合）
- [ ] 指摘修正
- [ ] レビュー通過後にコミット作成

## Batch 2: Adapter / Server Actions

### Step 2-1. 可用枠 Adapter 実装

- 提出枠取得（自分/他人）— WITHDRAWNユーザーの枠は除外
- 提出枠全置換保存
- 既存確定枠取得

### Step 2-2. 確定枠 Adapter / Action 実装

- `game_schedule_slots` 全置換
- 再編集許可
- 再検証パス設定
- `game_schedules` 親レコードの作成/取得（初回確定時）と `schedule_phase=CONFIRMED` 更新ルールを実装

### Review Checkpoint: Batch 2

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] `/review-diff` 実行（ファイル数 > 5 or 変更行数 > 100 の場合）
- [ ] 指摘修正
- [ ] レビュー通過後にコミット作成

## Batch 3: 集計・おすすめロジック（純関数）

集計ロジックは200行超の見込みのため、独立Batchとして分離。単体テスト+レビューを確実に行う。

### Step 3-1. 集計ロジック実装

- `src/lib/availability/recommendation.ts`
- `src/lib/availability/slotUtils.ts`
- 30分単位正規化
- 単一枠抽出
- combo 推薦生成
- グループ分け / ランキング / 理由ラベル

### Step 3-2. 集計ロジック単体テスト

- `src/lib/availability/__tests__/recommendation.test.ts`
- `src/lib/availability/__tests__/slotUtils.test.ts`
- `all_users` / `required_users_only` グループ分け
- 単一枠で最低時間達成の優先
- combo のまとまり優先（gap/daySpan）
- 日跨ぎケース
- 見学者境界注記の出し分け
- ベンチマークケース（参加者10人 × 各20枠 → 500ms以内）

### Step 3-3. おすすめ取得 Adapter / Action 実装

- `getScheduleRecommendations(sessionId)` のサーバー実装
- 認可（主催者/GM/KP）
- 提出枠/参加者/最低プレイ時間の取得
- Step 3-1 の純関数呼び出し
- `RecommendationGroup[]` へのDTO整形
- 提出枠 0 件時は `[]` を返し、UI側で「提出が不足しています」を表示

### Review Checkpoint: Batch 3

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 集計ロジック単体テスト全通過（必須）
- [ ] `/review-diff` 実行（変更行数 > 100 のため必須）
- [ ] 指摘修正
- [ ] レビュー通過後にコミット作成

## Batch 4: 共通 UI 基盤

### Step 4-1. `AvailabilityWorkspaceLayout` 実装

- PC/SP レイアウト
- Desktop サイド / Mobile ドロワー / Sticky Bar の器
- `MobileSidebarDrawer` は Ark UI Dialog（drawer mode）を使用し、フォーカストラップ + クローズ時フォーカス復帰を実装

### Step 4-2. `BaseAvailabilityCalendar` 実装

- 日別バッジ・選択日・月移動
- 既存 `ScheduleCalendar` の見た目を必要に応じて再利用/抽象化
- **キーボード操作**: 矢印キーで日付移動、Enter/Space で選択、Tab でフォーカス移動
- `aria-label` で「○月○日 提出枠N件」等の情報を付与
- 色のみ依存を避けるため、件数テキスト/tooltip/補助ラベルを併用

### Step 4-3. `SelectedSlotsPanel` / `SelectedSlotsStickyBar` 実装

- 選択枠一覧
- 合計時間
- 最低時間進捗
- 削除/並び替え
- 合計時間・達成状態の変化を `aria-live="polite"` リージョンで通知

### Step 4-4. Storybook ストーリー作成（共通UI）

- `AvailabilityWorkspaceLayout`, `BaseAvailabilityCalendar`, `SelectedSlotsPanel`, `SelectedSlotsStickyBar`
- PC/SP レスポンシブ表示確認用の stories を作成

補足:
- Batch 4 の実装量が大きい場合は `Batch 4-A（Layout + Calendar）` / `Batch 4-B（Panel + StickyBar + Stories）` に分割してよい

### Review Checkpoint: Batch 4

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] `/review-diff` 実行（ファイル数 > 5 or 変更行数 > 100 の場合）
- [ ] 指摘修正
- [ ] レビュー通過後にコミット作成

## Batch 5: 提出 UI（全員）

### Step 5-1. `SubmitSidebarContent` 実装

- 他ユーザー提出枠を時間付き表示
- クリック追加/解除（exact一致トグル）
- 部分重複エラー表示
- **キーボード操作**: Tab で枠リスト間を移動、Enter/Space でトグル
- 追加/解除結果を `aria-live="assertive"` で通知（「○○の枠を追加しました」「重複のため追加できません」）

### Step 5-2. `SubmitAvailabilityWorkspace` 実装

- 左カレンダー + 左下選択 + 右サイド統合
- `AvailabilitySlotEditor` 統合（枠追加・編集）
- 自分の枠編集/保存（`useOptimistic` + `useTransition` で楽観的更新）
- 楽観的更新失敗時: トースト通知 + ロールバック後の状態維持
- SP ドロワー動作
- **ローディング**: 保存中はスケルトン表示（SelectedSlotsPanel をスケルトンに差し替え）
- **ローディング**: 初期データ取得中は AvailabilityWorkspaceLayout 全体のスケルトン
- 提出保存は Last-write-wins（複数タブ時）

### Step 5-3. 提出ルート実装

- `src/app/(main)/sessions/[id]/availability/page.tsx`
- 認可・データ取得・初期化

### Step 5-4. Storybook ストーリー作成（提出UI）

- `SubmitSidebarContent`
- `AvailabilitySlotEditor`
- `SubmitAvailabilityWorkspace`（モックデータ）

### Review Checkpoint: Batch 5

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] `/review-diff` 実行（ファイル数 > 5 or 変更行数 > 100 の場合）
- [ ] 指摘修正
- [ ] レビュー通過後にコミット作成

## Batch 6: 確定 UI（主催者/GM/KP）

### Step 6-1. `ConfirmSidebarContent` 実装

- おすすめグループ表示
- 単一/combo クリック追加/解除
- 部分選択状態表示
- グループ境界注記表示
- **キーボード操作**: Tab でおすすめ項目間を移動、Enter/Space でトグル
- 追加/解除結果を `aria-live="assertive"` で通知

### Step 6-2. `ConfirmAvailabilityWorkspace` 実装

- 左カレンダー + 左下選択 + 右サイド統合
- 合計時間/最低時間進捗
- 確定保存（`useOptimistic` + `useTransition` で楽観的更新）
- 楽観的更新失敗時: トースト通知 + ロールバック後の状態維持
- 再編集時の初期選択反映
- おすすめ空状態（提出枠 0 件/集計結果 0 件）で「提出が不足しています」メッセージ表示
- **ローディング**: おすすめ取得中はサイドバー内スケルトン表示
- **ローディング**: 確定保存中は primaryAction ボタンを disabled + スピナー

### Step 6-3. 確定ルート実装

- `src/app/(main)/sessions/[id]/schedule/confirm/page.tsx`
- 認可・おすすめ取得・初期化

### Step 6-4. Storybook ストーリー作成（確定UI）

- `ConfirmSidebarContent`
- `ConfirmAvailabilityWorkspace`（モックデータ: all_users / required_users_only 両グループ）

### Review Checkpoint: Batch 6

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 関連テスト通過
- [ ] `/review-diff` 実行（ファイル数 > 5 or 変更行数 > 100 の場合）
- [ ] 指摘修正
- [ ] レビュー通過後にコミット作成

## Batch 7: セッション詳細導線統合 + 旧導線整理

### Step 7-1. PageHeader アクションモデル更新

- 主催者メインアクション: 日程確定 / 再編集
- 参加者アクション: 可用枠提出 / 更新

### Step 7-2. セッション詳細画面からの導線接続

- `SessionActions` / `SessionDetailContent` 側のリンク更新

### Step 7-3. 旧導線の非表示または注記

- `schedule/respond`, `schedule/summary` の扱いを決定（非導線化推奨）

### Step 7-4. テスト追加・回帰確認

- 集計ロジック・提出UI・確定UI・セッション詳細アクションの回帰

### Review Checkpoint: Batch 7

- [ ] `pnpm check` 通過
- [ ] `pnpm vitest` 全テスト通過
- [ ] `/review-diff` 実行（最終Batch — 必須）
- [ ] 指摘修正
- [ ] レビュー通過後にコミット作成

---

## 実装前の最終確認事項（小）

- 提出枠上限件数（Phase 1 の安全値）→ 定数 `MAX_AVAILABILITY_SLOTS_PER_USER = 100`
- combo 推薦の最大表示件数（各グループ）→ 定数 `MAX_COMBO_RECOMMENDATIONS = 10`
- combo 母集団サイズ（各グループの単一枠上位N）→ 定数 `MAX_SINGLE_CANDIDATES_FOR_COMBO = 10`

上記は実装開始時に定数化して対応し、要件変更しやすい形にする。

※ `requiredUsers` のロール対応は決定事項で解決済み: `KEEPER` + `PLAYER` = requiredUsers, `SPECTATOR` = spectators

---

## ファイル一覧

### 新規ファイル

| ファイル | 用途 |
|---------|------|
| `supabase/migrations/0011_add_users_auth_identity_columns.sql` | `users.auth_user_id` / `users.discord_account_id` 追加 + backfill（番号は例） |
| `supabase/migrations/0012_add_session_availability_slots.sql` | 可用枠テーブル + RLSポリシー（番号は例） |
| `supabase/migrations/0013_add_game_schedule_slots.sql` | 確定枠テーブル + RLSポリシー（番号は例） |
| `src/app/(main)/sessions/[id]/availability/interface.ts` | 可用枠関連の型定義 |
| `src/app/(main)/sessions/[id]/availability/adapter.ts` | 可用枠 DB 操作 |
| `src/app/(main)/sessions/[id]/availability/actions.ts` | 可用枠 Server Actions |
| `src/app/(main)/sessions/[id]/availability/schema.ts` | 可用枠 Zod スキーマ |
| `src/app/(main)/sessions/[id]/availability/styles.ts` | 提出UI スタイル |
| `src/app/(main)/sessions/[id]/availability/page.tsx` | 提出UI ページ（Server Component） |
| `src/app/(main)/sessions/[id]/availability/_components/SubmitAvailabilityWorkspace.tsx` | 提出ワークスペース |
| `src/app/(main)/sessions/[id]/availability/_components/SubmitSidebarContent.tsx` | 提出サイドバー |
| `src/app/(main)/sessions/[id]/availability/_components/AvailabilitySlotEditor.tsx` | 提出枠の追加/編集UI |
| `src/app/(main)/sessions/[id]/schedule/confirm/page.tsx` | 確定UI ページ（Server Component） |
| `src/app/(main)/sessions/[id]/schedule/confirm/adapter.ts` | 確定UI DB 操作 |
| `src/app/(main)/sessions/[id]/schedule/confirm/actions.ts` | 確定UI Server Actions |
| `src/app/(main)/sessions/[id]/schedule/confirm/schema.ts` | 確定UI Zod スキーマ |
| `src/app/(main)/sessions/[id]/schedule/confirm/styles.ts` | 確定UI スタイル |
| `src/app/(main)/sessions/[id]/schedule/confirm/_components/ConfirmAvailabilityWorkspace.tsx` | 確定ワークスペース |
| `src/app/(main)/sessions/[id]/schedule/confirm/_components/ConfirmSidebarContent.tsx` | 確定サイドバー |
| `src/components/blocks/AvailabilityWorkspaceLayout/AvailabilityWorkspaceLayout.tsx` | 共通レイアウト骨格 |
| `src/components/blocks/AvailabilityWorkspaceLayout/styles.ts` | レイアウト スタイル |
| `src/components/blocks/AvailabilityWorkspaceLayout/index.ts` | エクスポート |
| `src/components/blocks/BaseAvailabilityCalendar/BaseAvailabilityCalendar.tsx` | 日程カレンダー |
| `src/components/blocks/BaseAvailabilityCalendar/styles.ts` | カレンダー スタイル |
| `src/components/blocks/BaseAvailabilityCalendar/index.ts` | エクスポート |
| `src/components/blocks/SelectedSlotsPanel/SelectedSlotsPanel.tsx` | 選択枠パネル |
| `src/components/blocks/SelectedSlotsPanel/styles.ts` | パネル スタイル |
| `src/components/blocks/SelectedSlotsPanel/index.ts` | エクスポート |
| `src/components/blocks/SelectedSlotsStickyBar/SelectedSlotsStickyBar.tsx` | SP用スティッキーバー |
| `src/components/blocks/SelectedSlotsStickyBar/styles.ts` | バー スタイル |
| `src/components/blocks/SelectedSlotsStickyBar/index.ts` | エクスポート |
| `src/components/blocks/AvailabilityWorkspaceLayout/AvailabilityWorkspaceLayout.stories.tsx` | 共通レイアウト Storybook |
| `src/components/blocks/BaseAvailabilityCalendar/BaseAvailabilityCalendar.stories.tsx` | カレンダー Storybook |
| `src/components/blocks/SelectedSlotsPanel/SelectedSlotsPanel.stories.tsx` | 選択枠パネル Storybook |
| `src/components/blocks/SelectedSlotsStickyBar/SelectedSlotsStickyBar.stories.tsx` | SPバー Storybook |
| `src/app/(main)/sessions/[id]/availability/_components/SubmitSidebarContent.stories.tsx` | 提出サイドバー Storybook |
| `src/app/(main)/sessions/[id]/availability/_components/AvailabilitySlotEditor.stories.tsx` | 提出枠エディタ Storybook |
| `src/app/(main)/sessions/[id]/availability/_components/SubmitAvailabilityWorkspace.stories.tsx` | 提出ワークスペース Storybook |
| `src/app/(main)/sessions/[id]/schedule/confirm/_components/ConfirmSidebarContent.stories.tsx` | 確定サイドバー Storybook |
| `src/app/(main)/sessions/[id]/schedule/confirm/_components/ConfirmAvailabilityWorkspace.stories.tsx` | 確定ワークスペース Storybook |
| `src/lib/availability/recommendation.ts` | 集計・おすすめロジック（純関数） |
| `src/lib/availability/slotUtils.ts` | 枠操作ユーティリティ（純関数） |
| `src/lib/availability/__tests__/recommendation.test.ts` | 集計ロジック テスト |
| `src/lib/availability/__tests__/slotUtils.test.ts` | ユーティリティ テスト |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/db/types.ts` | Supabase型再生成（新テーブル + `users` カラム追加分） |
| `src/db/helpers.ts` | `resolveCurrentAppUserIdByAuthUid()` 追加/拡張 |
| `src/app/(main)/sessions/[id]/_components/sessionActionsModel.ts` | 新アクション追加（可用枠提出/確定導線） |
| `src/app/(main)/sessions/[id]/_components/SessionActions.tsx` | 新アクション対応のリンク/ボタン追加 |
| `src/app/(main)/sessions/[id]/_components/SessionDetailContent.tsx` | 新導線への接続 |
| `src/app/(main)/sessions/interface.ts` | 必要に応じて型追加 |

## 検証方法

### 自動テスト

```bash
# 集計ロジック・ユーティリティの単体テスト
pnpm vitest run src/lib/availability/

# 提出UI Adapter テスト
pnpm vitest run src/app/(main)/sessions/[id]/availability/

# 確定UI Adapter テスト
pnpm vitest run src/app/(main)/sessions/[id]/schedule/confirm/

# 全テスト
pnpm vitest
```

### 手動テスト

- [ ] 提出UI: カレンダーで日付選択 → 時間枠追加 → 保存 → リロードで反映確認
- [ ] 提出UI: 他ユーザー枠クリックで自分の枠に追加/解除（exact一致トグル）
- [ ] 提出UI: 部分重複時のエラー表示確認
- [ ] 提出UI: SP表示でドロワー開閉・スティッキーバー動作確認
- [ ] 提出UI: SPドロワー開閉時にフォーカスがトリガーへ復帰すること
- [ ] 確定UI: おすすめ一覧の表示（グループ分け・境界注記）
- [ ] 確定UI: 提出枠 0 件時に「提出が不足しています」メッセージ表示
- [ ] 確定UI: single/combo クリックで追加/解除
- [ ] 確定UI: 確定保存 → セッション詳細に反映
- [ ] 確定UI: 再編集で既存確定枠が初期選択に反映
- [ ] `minPlaytimeMinutes` 未設定シナリオで推薦/表示が破綻しないこと
- [ ] セッション詳細: 準備中フェーズのアクション表示（権限別）
- [ ] 権限チェック: 非参加者がURLを直接叩いた場合のリダイレクト
- [ ] 日跨ぎ枠: 22:00-02:00 の枠が正しく保存・表示・集計されること
