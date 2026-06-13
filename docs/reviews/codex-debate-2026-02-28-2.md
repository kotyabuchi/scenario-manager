# Codex Debate レビューレポート

> **日時**: 2026-02-28
> **対象**: HEAD~3（Slot→TimeBlock/Seatリネーム 3コミット）
> **モード**: 差分（第1回レビューと同一範囲の再レビュー）
> **ラウンド数**: 1/5
> **採用指摘数**: 4 / 全6件

## 対象コミット

| コミット | メッセージ | 変更 |
|---------|----------|------|
| `595a1aa` | docs(requirements): 要件定義書の用語をSlot→Seat | ドキュメント |
| `2abbce1` | refactor(session-flow): Slot→TimeBlock/Seatリネーム | コード本体 |
| `4c5f073` | docs: Slot→TimeBlock/Seatリネーム計画書とCodexレビューレポート | ドキュメント |

**差分規模**: 50ファイル変更、+2091 / -604

## Codex の指摘（2件）

| # | 対象 | 問題 | 改善案 | 優先度 |
|---|------|------|--------|--------|
| C-1 | Migration SQL:145 | 旧RPC即時DROP、DB-firstデプロイ時リスク | 2段階マイグレーション | 高 |
| C-2 | searchParams.ts:21 | `slots_desc`→`seats_desc`で既存ブックマーク破壊 | リダイレクト or エイリアス | 中 |

## Claude の指摘（4件）

| # | 対象 | 問題 | 改善案 | 優先度 |
|---|------|------|--------|--------|
| A-1 | recommendation.ts:173 | `buildBaseSegments`パラメータ名`slots`が旧用語 | `timeBlocks`にリネーム | 低 |
| A-2 | recommendation.ts:20 | 定数`MAX_COMBO_SLOT_COUNT`が旧用語 | `MAX_COMBO_TIME_BLOCK_COUNT`にリネーム | 低 |
| A-3 | コンポーネント名3箇所 | `AvailabilitySlotEditor`等が未リネーム | `AvailabilityTimeBlockEditor`等にリネーム | 低 |
| A-4 | Props名6箇所 | `onAddSlot`等が旧用語のまま | `onAddTimeBlock`等にリネーム | 低 |

## 議論サマリー

### 合意点（初回で一致、即採用）

- A-1〜A-4: Claude の指摘に対し Codex は R1 で全て【修正】（＝妥当性を認めた上で低優先リファクタとして同意）

### ラリーの記録

#### C-1: DBマイグレーションの即時リネームリスク（再掲）

- **R1 Codex**: 旧RPCの即時DROPはDB-firstデプロイ時リスク。（第1回と同一指摘）
- **R1 Claude**: 本日の第1回debateで議論済み＆Codex自身が撤回済み。個人プロジェクト＋アトミックデプロイで不要。
- **R1 Codex**: 【撤回】前回と同じ判断で妥当。
- **結論**: 却下（第1回と同一理由）

#### C-2: URL互換性（再掲）

- **R1 Codex**: `slots_desc`→`seats_desc`で既存ブックマーク破壊。（第1回と同一指摘）
- **R1 Claude**: 本日の第1回debateで議論済み＆Codex自身が撤回済み。プレローンチで外部ユーザーなし。
- **R1 Codex**: 【撤回】プレローンチで互換性対応は不要。
- **結論**: 却下（第1回と同一理由）

#### A-1〜A-4: コード内部の旧用語残存

- **R1 Claude**: 型は正しくリネームされているが、変数名・定数名・コンポーネント名・Props名に旧用語`Slot`/`slots`が残存。grepでの網羅検索を妨げる。
- **R1 Codex**: 全て【修正】。機能不具合ではないが命名一貫性として妥当。波及範囲があるため別コミット推奨。
- **結論**: 採用（一貫性のためリネーム）

### 議論を経て採用

| 指摘 | 最終ラウンド | Codex → Claude のラリー概要 | 結論 |
|------|:-----------:|---------------------------|------|
| A-1 | R1 | Codex「命名統一として妥当」 | 採用 |
| A-2 | R1 | Codex「命名統一として妥当」 | 採用 |
| A-3 | R1 | Codex「妥当だが別コミット推奨」 | 採用 |
| A-4 | R1 | Codex「妥当だが別コミット推奨」 | 採用 |

### 議論を経て却下

| 指摘 | 最終ラウンド | 却下理由 |
|------|:-----------:|---------|
| C-1 | R1 | ドメイン不一致（第1回と同一。個人プロジェクト＋アトミックデプロイで不要） |
| C-2 | R1 | 本質的でない（第1回と同一。プレローンチで既存ブックマークなし） |

## 実施した改善

| # | ファイル | 改善内容 | 出典 |
|---|---------|---------|------|
| 1 | recommendation.ts | 定数 `MAX_COMBO_SLOT_COUNT` → `MAX_COMBO_TIME_BLOCK_COUNT` | A-2 |
| 2 | recommendation.ts | `buildBaseSegments` パラメータ `slots` → `timeBlocks` | A-1 |
| 3 | AvailabilitySlotEditor.tsx | ファイル名・コンポーネント名・Props名をリネーム → `AvailabilityTimeBlockEditor` | A-3, A-4 |
| 4 | SelectedSlotsPanel.tsx | ファイル名・コンポーネント名・Props名をリネーム → `SelectedTimeBlocksPanel` | A-3, A-4 |
| 5 | SelectedSlotsStickyBar.tsx | ファイル名・コンポーネント名・Props名をリネーム → `SelectedTimeBlocksStickyBar` | A-3, A-4 |
| 6 | SubmitAvailabilityWorkspace.tsx | import更新 + Props名 `onSaveSlots`→`onSaveTimeBlocks`, `onClickSlot`→`onClickTimeBlock`, `onAddSlot`→`onAddTimeBlock` | A-4 |
| 7 | ConfirmAvailabilityWorkspace.tsx | import更新 + Props名 `onConfirmSlots`→`onConfirmTimeBlocks`, `onRemoveSlot`→`onRemoveTimeBlock` | A-4 |
| 8 | SubmitSidebarContent.tsx | Props名 `onClickSlot`→`onClickTimeBlock` | A-4 |
| 9 | AvailabilityWorkspaceLayout.stories.tsx | import更新 + Props名更新 | A-3, A-4 |
| 10 | availability/page.tsx | Props名 `onSaveSlots`→`onSaveTimeBlocks` | A-4 |
| 11 | schedule/confirm/page.tsx | Props名 `onConfirmSlots`→`onConfirmTimeBlocks` | A-4 |

## 検証結果

- lint/format: **PASS**
- ビルド: **PASS**
- テスト（recommendation）: **PASS**（7テスト全パス）
- テスト（AvailabilityWorkspaces）: **PASS**（9テスト全パス）

## 所見

第1回レビューがUI文言の旧用語残存を発見したのに対し、第2回レビューではコード識別子（変数名・定数名・コンポーネント名・Props名）の旧用語残存を発見した。
Codex は第1回と全く同じインフラ寄りの指摘（C-1, C-2）を繰り返したが、Claude が前回の議論結果を引用して即座に却下し、1ラウンドで議論が収束した。

**教訓**: 大規模リネームでは、型の修正だけでなく以下の3層すべてを確認すべき。
1. **型・テーブル名**（TypeScript型、DB DDL）— 型チェッカーで検出可能
2. **コード識別子**（変数名、定数名、コンポーネント名、Props名）— grepで検出可能
3. **日本語文言**（UI文言、ログメッセージ、テスト名）— 手動検索が必須

第1回で層3、第2回で層2を網羅的にカバーし、リネームの一貫性が完全に確保された。
