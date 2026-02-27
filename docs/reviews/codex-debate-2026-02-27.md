# Codex Debate レビューレポート

> **日時**: 2026-02-27
> **対象**: `docs/plans/rename-slot-to-time-block-and-seat.md`（計画書モード）
> **ラウンド数**: 2/5
> **採用指摘数**: 16 / 全16件

## Codex の指摘（6件）

| # | セクション | 問題 | 改善案 | 優先度 |
|---|-----------|------|--------|--------|
| C-1 | Batch 1 / Step 1-2 | remote DB先行適用で本番互換性を失うリスク | 2段階移行を提案 | 高 |
| C-2 | Batch 1 / Step 1-1 | 関数再作成時の権限制御仕様（SECURITY DEFINER, REVOKE/GRANT）が不十分 | 完全再現チェックリスト追加 | 高 |
| C-3 | Batch 4 / Step 4-3 | BasicInfoSection.tsx がstyles.ts変更の参照側として漏れ | 同Batchに追加 | 中 |
| C-4 | Batch 3 | PublicSortOption定義のリネームが漏れ | interface.ts更新 + 後方互換ロジック | 中 |
| C-5 | Batch 5 | fixtures.ts, adapter.test.ts の旧テーブル名が漏れ | Batch 5に追加 | 中 |
| C-6 | 計画フォーマット | 各Batch末尾のReview Checkpointがない | 各Batchに追加 | 中 |

## Claude の指摘（10件）

| # | セクション | 問題 | 改善案 | 優先度 |
|---|-----------|------|--------|--------|
| A-1 | sessions/interface.ts | `scheduleSlots` フィールド名のリネーム未記載 | 用語マッピング + Step 1-3に追加 | 高 |
| A-2 | availability/interface.ts | `RecommendationItem.slots` フィールド名のリネーム未記載 | 用語マッピング + 関連Step追加 | 高 |
| A-3 | AvailabilityWorkspaceLayout.tsx | `selectedSlotsSection` prop名が未記載 | Batch 4に追加 | 中 |
| A-4 | BaseAvailabilityCalendar.tsx | styles参照の更新ファイルとして未記載 | Batch 4に追加 | 中 |
| A-5 | AvailabilityWorkspaceLayout.tsx | styles参照の更新ファイルとして未記載 | Batch 4に追加 | 中 |
| A-6 | page.tsx (availability/confirm) | ローカル関数名が未記載 | Batch 3に追加 | 中 |
| A-7 | home/_mocks.ts | `remainingPlayerSlotCount` が未記載 | Batch 5に追加 | 中 |
| A-8 | SessionDetailContent.stories.tsx | mock値が未記載 | Batch 5に追加 | 中 |
| A-9 | slotUtils.ts | `calcTotalMinutes` リネーム検討漏れ | 用語マッピングに追加 | 低 |
| A-10 | requirements-v1.md | slot記述がない可能性 | 注記追加 | 低 |

## 議論サマリー

### 合意点（初回で一致、即採用）

- C-3 / A-4: BasicInfoSection.tsx の style 参照漏れ
- C-5 / A-7: テスト補助ファイル（fixtures.ts）の漏れ

### ラリーの記録

#### C-1: remote DB先行適用の互換性リスク
- **R1 Codex**: 2段階移行（旧RPCラッパー残し）を提案
- **R1 Claude**: 個人開発アプリで同時デプロイ運用のため、2段階移行のオーバーヘッドは不要では？
- **R2 Codex**: 【修正】2段階は不要と同意。ただしロールバック手順・事前バックアップの明記を推奨
- **結論**: 修正して採用（Point-in-Time Recovery確認を前提条件に追記）

#### C-2: 関数権限チェックリスト
- **R1 Codex**: pg_proc/権限検証SQLを含む完全チェックリスト追加を提案
- **R1 Claude**: Step 1-1の10番にREVOKE/GRANTは明記済み。重いチェックリストは不要では？
- **R2 Codex**: 【修正】軽量な1表で十分。SECURITY DEFINER / SET search_path / REVOKE/GRANT を各関数ごとに確認
- **結論**: 修正して採用（5関数の権限確認表を追加）

#### C-6: Review Checkpoint
- **R1 Codex**: 各Batch末尾にReview Checkpointセクション追加を提案
- **R1 Claude**: /exec-planが自動実行するため計画書に明記不要では？
- **R2 Codex**: 【修正】/exec-plan前提を1行明記するだけで十分と同意
- **結論**: 修正して採用（前提条件セクションに1行追記）

#### A-1/A-2: フィールド名リネーム漏れ（scheduleSlots, RecommendationItem.slots）
- **R2 Claude → Codex**: interface.ts のフィールド名が全面リネーム方針と不整合
- **R2 Codex**: 【修正】リネーム対象に含めるべき。全面リネーム方針と一貫性を保つ
- **結論**: 採用

#### A-3: selectedSlotsSection prop名
- **R2 Claude → Codex**: 内部propsだがリネームすべきか？
- **R2 Codex**: 【修正】全面リネーム方針なら命名の一貫性を保つべき
- **結論**: 採用

### 議論を経て採用

| 指摘 | 最終ラウンド | ラリー概要 | 結論 |
|------|:-----------:|-----------|------|
| C-1 | R2 | 2段階→単発+ロールバック | 修正して採用 |
| C-2 | R2 | 完全チェック→軽量表 | 修正して採用 |
| C-6 | R2 | 全Batchにセクション→前提1行 | 修正して採用 |
| A-1 | R2 | Codex同意 | 採用 |
| A-2 | R2 | Codex同意 | 採用 |
| A-3 | R2 | Codex同意 | 採用 |
| A-4/A-5 | R2 | Codex同意 | 採用 |

### 議論を経て却下

なし

## 実施した改善

| # | セクション | 改善内容 | 出典 |
|---|---------|---------|------|
| 1 | 前提条件 | PITR確認 + /exec-plan前提を追記 | C-1修正, C-6修正 |
| 2 | 用語マッピング | フィールド名12項目追加（scheduleSlots, RecommendationItem.slots, selectedSlotsSection, AvailabilityWorkspaceData.*, PublicSortOption, calcTotalMinutes, page.tsxローカル関数） | A-1,A-2,A-3,A-6,A-9,C-4 |
| 3 | Step 1-1 | 関数権限チェックリスト表（5関数）追加 | C-2修正 |
| 4 | Step 1-3 | interface.ts の scheduleSlots + PublicSortOption 追記 | A-1,C-4 |
| 5 | Step 1-3 | availability/interface.ts のフィールド名4項目追記 | A-2 |
| 6 | Step 2-1 | calcTotalMinutes リネーム追記 | A-9 |
| 7 | Step 2-4 | recommendation.ts フィールド名・パラメータ詳細追記 | A-2 |
| 8 | Step 3-3 | participantAdapter.ts の DB カラム名アクセス追記 | Explore |
| 9 | Step 3-3 | page.tsx ローカル関数名2件追記 | A-6 |
| 10 | Step 4-2 | AvailabilityWorkspaceLayout.tsx / BaseAvailabilityCalendar.tsx 追記 | A-3,A-4,A-5 |
| 11 | Step 4-2 | ConfirmAvailabilityWorkspace/ConfirmSidebarContent のフィールド参照追記 | A-2 |
| 12 | Step 4-3 | BasicInfoSection.tsx 追記 | C-3 |
| 13 | Step 5-2 | 5ファイル追加（fixtures.ts, adapter.test.ts, _mocks.ts, stories 2件） | C-5,A-7,A-8 |
| 14 | Step 5-3 | requirements-v1.md のno-op可能性を注記 | A-10 |
| 15 | ファイル一覧 | 変更ファイル10件追加 | 全体 |
| 16 | 見積もり更新 | Batch 3: 11→13, Batch 4: 12→15, Batch 5: 10→15 | 全体 |

## 検証結果

- 計画書構造: PASS（Batch/Step番号連続、ファイル一覧整合）
- plan-template.md準拠: PASS

## 所見

計画書は全面リネームの網羅性が最大の課題であり、**型名のリネームは記載されていたがフィールド名（scheduleSlots, RecommendationItem.slots等）のリネームが複数漏れていた**。これはリネーム計画において型定義の「外形」（型名）に目が行き、「内部構造」（フィールド名、prop名）を見落とすパターンとして典型的。

Codexとの議論では、2段階移行の過剰提案を個人開発の運用前提で却下できた一方、関数権限チェックリストは軽量版として有用な形に着地した。style参照ファイルの漏れ（BaseAvailabilityCalendar.tsx, AvailabilityWorkspaceLayout.tsx）は**両者が独立して発見**しており、クロスレビューの有効性が確認された。
