# セッション系Storybook整理

## Context

セッション系コンポーネントのStorybook階層が統一されていない。現在は `Sessions/...`, `Pages/Sessions/...` が混在しており、画面ベースでの整理が行われていない。また17個のStoryファイルが存在するが、重要コンポーネントの多くにStoryが未作成。各画面全体のPage Mock Storyも存在しない。

本計画では以下を実施:
1. 既存17個のStoryの `meta.title` を画面ベースの統一階層に修正
2. Storybook未対応の重要コンポーネントにStoryを追加
3. 各画面のPage Mock Storyを作成

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| 階層構造 | `Sessions/{画面名}/{コンポーネント名}` | 画面単位でコンポーネントを把握可能にする |
| カテゴリ名 | 一覧, 作成フォーム, 詳細, 日程調整, 参加申請管理 | ルーティングと対応 |
| モックデータ | `__mocks__/sessionMocks.ts` に集約 | Story間で共有し重複削減 |
| Tab系 | 個別Storyは作成しない | nuqs+useTransition依存でコスト高。Page Mockでカバー |
| Page Mock方式 | Presentationalコンポーネントにモックデータを渡す | 既存パターン準拠 |
| Server Actions | `fn()` でモック | 既存パターン準拠 |

## 前提条件

- `.storybook/preview.ts` にグローバルデコレーター・プロバイダーが設定されていることを Batch 1 開始前に確認する

---

## 統一後の meta.title マッピング

| 現在 | 変更後 |
|------|--------|
| `Sessions/SessionForm` | `Sessions/作成フォーム/SessionForm` |
| `Pages/Sessions/SessionDetailContent` | `Sessions/詳細/SessionDetailContent` |
| `Pages/Sessions/SessionPhaseStepper` | `Sessions/詳細/SessionPhaseStepper` |
| `Pages/Sessions/ParticipationRequestDialog` | `Sessions/詳細/ダイアログ/ParticipationRequestDialog` |
| `Pages/Sessions/CancelSessionDialog` | `Sessions/詳細/ダイアログ/CancelSessionDialog` |
| `Pages/Sessions/CancelApplicationDialog` | `Sessions/詳細/ダイアログ/CancelApplicationDialog` |
| `Pages/Sessions/WithdrawDialog` | `Sessions/詳細/ダイアログ/WithdrawDialog` |
| `Pages/Sessions/CompleteSessionDialog` | `Sessions/詳細/ダイアログ/CompleteSessionDialog` |
| `Pages/Sessions/ParticipantCard` | `Sessions/詳細/ParticipantCard` |
| `Pages/Sessions/MemberListItem` | `Sessions/作成フォーム/MemberListItem` |
| `Pages/Sessions/MemberSearchInput` | `Sessions/作成フォーム/MemberSearchInput` |
| `Pages/Sessions/ScenarioSearchModal` | `Sessions/作成フォーム/ScenarioSearchModal` |
| `Pages/Sessions/ScenarioSelectedCard` | `Sessions/作成フォーム/ScenarioSelectedCard` |
| `Pages/Sessions/FilterBar` | `Sessions/参加申請管理/FilterBar` |
| `Pages/Sessions/ApplicationApprovalContent` | `Sessions/参加申請管理/ApplicationApprovalContent` |
| `Sessions/AvailabilityWorkspaces` | `Sessions/日程調整/AvailabilityWorkspaces` |
| `Sessions/AvailabilityWorkspaceLayout` | `Sessions/日程調整/AvailabilityWorkspaceLayout` |

---

## Batch 1: 既存Storyの meta.title 一括修正

### Step 1-0. Storybook設定確認 + AvailabilityWorkspaceLayout の現在タイトル確認

- `.storybook/preview.ts` のグローバルデコレーター・Provider設定を確認し、新規Storyで必要なProviderが不足していないか検証
- `AvailabilityWorkspaceLayout.stories.tsx` の現在の `meta.title` を確認し、マッピング表を確定

### Step 1-1. 詳細ページ系Story（7ファイル）の title 修正

- `SessionDetailContent.stories.tsx` → `Sessions/詳細/SessionDetailContent`
- `SessionPhaseStepper.stories.tsx` → `Sessions/詳細/SessionPhaseStepper`
- `ParticipationRequestDialog.stories.tsx` → `Sessions/詳細/ダイアログ/ParticipationRequestDialog`
- `CancelSessionDialog.stories.tsx` → `Sessions/詳細/ダイアログ/CancelSessionDialog`
- `CancelApplicationDialog.stories.tsx` → `Sessions/詳細/ダイアログ/CancelApplicationDialog`
- `WithdrawDialog.stories.tsx` → `Sessions/詳細/ダイアログ/WithdrawDialog`
- `CompleteSessionDialog.stories.tsx` → `Sessions/詳細/ダイアログ/CompleteSessionDialog`

### Step 1-2. セクション + 作成フォーム + 申請管理 + 日程調整系（10ファイル）の title 修正

- `ParticipantCard.stories.tsx` → `Sessions/詳細/ParticipantCard`
- `SessionForm.stories.tsx` → `Sessions/作成フォーム/SessionForm`
- `MemberListItem.stories.tsx` → `Sessions/作成フォーム/MemberListItem`
- `MemberSearchInput.stories.tsx` → `Sessions/作成フォーム/MemberSearchInput`
- `ScenarioSearchModal.stories.tsx` → `Sessions/作成フォーム/ScenarioSearchModal`
- `ScenarioSelectedCard.stories.tsx` → `Sessions/作成フォーム/ScenarioSelectedCard`
- `FilterBar.stories.tsx` → `Sessions/参加申請管理/FilterBar`
- `ApplicationApprovalContent.stories.tsx` → `Sessions/参加申請管理/ApplicationApprovalContent`
- `AvailabilityWorkspaces.stories.tsx` → `Sessions/日程調整/AvailabilityWorkspaces`
- `AvailabilityWorkspaceLayout.stories.tsx` → `Sessions/日程調整/AvailabilityWorkspaceLayout`

### Review Checkpoint

- [ ] `pnpm check` 通過
- [ ] `Pages/Sessions/` の旧カテゴリが残っていないこと（grepで確認）

---

## Batch 2: モックデータ基盤 + 一覧ページStory追加

### Step 2-1. 共有モックデータファクトリ作成

`src/app/(main)/sessions/__mocks__/sessionMocks.ts`:
- `createPublicSession(overrides?)` — PublicSessionのファクトリ
- `createMySession(overrides?)` — MySessionWithRoleのファクトリ
- `createScenarioSystem(overrides?)` — ScenarioSystemのファクトリ

### Step 2-2. SessionCard + EmptyState + SessionList Story 作成

- `SessionCard.stories.tsx` — `Sessions/一覧/SessionCard` (PublicDefault, PublicFewSeatsLeft, MyUpcoming, MyHistory等)
- `EmptyState.stories.tsx` — `Sessions/一覧/EmptyState` (Upcoming, History, Public)
- `SessionList.stories.tsx` — `Sessions/一覧/SessionList` (PublicSessions, MySessions)

### Step 2-3. FilterPanel Story 作成

- `FilterPanel.stories.tsx` — `Sessions/一覧/FilterPanel` (Default, WithSelections)

### Review Checkpoint

- [ ] `pnpm check` 通過

---

## Batch 3: 一覧ページ残り + 詳細ページセクションStory

### Step 3-1. SearchPanel + CalendarView Story 作成

- `SearchPanel.stories.tsx` — `Sessions/一覧/SearchPanel`
- `CalendarView.stories.tsx` — `Sessions/一覧/CalendarView`

### Step 3-2. TimelineSection + GMNotesSection Story 作成

- `TimelineSection.stories.tsx` — `Sessions/詳細/TimelineSection` (Default, AllTypes, Empty)
- `GMNotesSection.stories.tsx` — `Sessions/詳細/GMNotesSection` (WithMemo, Empty, WithEditButton)

### Step 3-3. BasicInfoSection + ParticipantsSection Story 作成

- `BasicInfoSection.stories.tsx` — `Sessions/詳細/BasicInfoSection` (Default, AsParticipant, WithoutScenario)
- `ParticipantsSection.stories.tsx` — `Sessions/詳細/ParticipantsSection` (Default, AsParticipant, Empty)

### Review Checkpoint

- [ ] `pnpm check` 通過

---

## Batch 4: 詳細残り + 日程調整・申請管理コンポーネント

### Step 4-1. LinkItem + LinkFormDialog Story 作成

- `LinkItem.stories.tsx` — `Sessions/詳細/LinkItem` (Discord, Ccfolia, Other, AsParticipant)
- `LinkFormDialog.stories.tsx` — `Sessions/詳細/ダイアログ/LinkFormDialog` (AddNew, Edit)

### Step 4-2. ApplicationCard Story 作成

- `ApplicationCard.stories.tsx` — `Sessions/参加申請管理/ApplicationCard` (Pending, Confirmed, WithMessage)

### Step 4-3. 日程調整サブコンポーネント Story 作成

- `SelectedTimeBlocksPanel.stories.tsx` — `Sessions/日程調整/SelectedTimeBlocksPanel`
- `SelectedTimeBlocksStickyBar.stories.tsx` — `Sessions/日程調整/SelectedTimeBlocksStickyBar`

### Review Checkpoint

- [ ] `pnpm check` 通過

---

## Batch 5: Page Mock Story（詳細 + モックデータ外部化）

### Step 5-1. 詳細ページ用モックデータを共有ファイルに抽出

`src/app/(main)/sessions/[id]/__mocks__/detailMocks.ts`:
- SessionDetailContent.storiesのインラインモックを移動
- フェーズ別バリアント追加（recruiting, preparation, inProgress, completed, cancelled）
- **型互換性の検証**: 抽出後のモックデータが `SessionDetailContentProps` 等のコンポーネント型と一致することを確認

### Step 5-2. SessionDetailContent.stories.tsx 拡充

- インラインモックを `__mocks__/detailMocks` からのimportに置き換え
- フェーズ別Story追加: Preparation, InProgress, Completed, Cancelled

### Review Checkpoint

- [ ] `pnpm check` 通過
- [ ] 既存Storyが壊れていないこと

---

## Batch 6: Page Mock Story（一覧 + 日程調整サイドバー）

### Step 6-1. 一覧ページ Page Mock Story 作成

`SessionListPageMock.stories.tsx` — `Sessions/一覧/PageMock`:
- Presentationalコンポーネントの組み合わせで各タブ状態を表現
- Stories: UpcomingWithSessions, UpcomingEmpty, HistoryWithSessions, PublicWithSessions, PublicEmpty

### Step 6-2. 日程調整サイドバーStory作成

- `SubmitSidebarContent.stories.tsx` — `Sessions/日程調整/SubmitSidebarContent`
- `ConfirmSidebarContent.stories.tsx` — `Sessions/日程調整/ConfirmSidebarContent`

### Review Checkpoint

- [ ] `pnpm check` 通過
- [ ] `pnpm build-storybook` がエラーなく完了すること（全Storyの描画検証）
- [ ] 全Story（既存+新規）が正しい階層で表示されること

---

## ファイル一覧

### 新規ファイル（20個）

| ファイル | Batch |
|---------|-------|
| `sessions/__mocks__/sessionMocks.ts` | 2 |
| `sessions/_components/SessionCard.stories.tsx` | 2 |
| `sessions/_components/EmptyState.stories.tsx` | 2 |
| `sessions/_components/SessionList.stories.tsx` | 2 |
| `sessions/_components/FilterPanel.stories.tsx` | 2 |
| `sessions/_components/SearchPanel.stories.tsx` | 3 |
| `sessions/_components/CalendarView.stories.tsx` | 3 |
| `sessions/[id]/_components/sections/timeline/TimelineSection.stories.tsx` | 3 |
| `sessions/[id]/_components/sections/basic-info/BasicInfoSection.stories.tsx` | 3 |
| `sessions/[id]/_components/sections/gm-notes/GMNotesSection.stories.tsx` | 3 |
| `sessions/[id]/_components/sections/participants/ParticipantsSection.stories.tsx` | 3 |
| `sessions/[id]/_components/sections/tools/LinkItem.stories.tsx` | 4 |
| `sessions/[id]/_components/sections/tools/LinkFormDialog.stories.tsx` | 4 |
| `sessions/[id]/applications/_components/ApplicationCard.stories.tsx` | 4 |
| `sessions/[id]/schedule/availability/_components/SelectedTimeBlocksPanel.stories.tsx` | 4 |
| `sessions/[id]/schedule/availability/_components/SelectedTimeBlocksStickyBar.stories.tsx` | 4 |
| `sessions/[id]/__mocks__/detailMocks.ts` | 5 |
| `sessions/_components/SessionListPageMock.stories.tsx` | 6 |
| `sessions/[id]/schedule/availability/_components/SubmitSidebarContent.stories.tsx` | 6 |
| `sessions/[id]/schedule/availability/_components/ConfirmSidebarContent.stories.tsx` | 6 |

### 変更ファイル（17個 → Batch 1、1個 → Batch 5）

全て `meta.title` 修正 + SessionDetailContent.stories.tsx のモックデータ外部化

## スコープ外

| コンポーネント | 除外理由 |
|--------------|---------|
| UpcomingTab, HistoryTab, PublicTab | nuqs+useTransition依存。Page Mockで間接カバー |
| LoginPrompt | useDiscordAuth→Supabase依存 |
| SessionActions | 複雑なダイアログ管理+Server Actions。Page Mockで表示確認可能 |
| 作成フォーム内セクション個別Story | FormContext依存。SessionForm.storiesでカバー済み |
| ToolsSection | 複合セクション。子コンポーネント（LinkItem, LinkFormDialog）の個別Storyでカバー |

## 検証方法

### 自動テスト
```bash
pnpm check
```

### 手動テスト
- [ ] `pnpm storybook` で全Storyが `Sessions/` 以下に正しく階層表示
- [ ] `Pages/Sessions/` の旧カテゴリが残っていないこと
- [ ] 新規Story全てがエラーなく描画されること

