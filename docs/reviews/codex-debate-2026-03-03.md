# Codex Debate レビューレポート

> **日時**: 2026-03-03
> **対象**: #4 基本情報編集 全体（Batch 1 + Batch 2 統合差分）
> **ラウンド数**: 2/5
> **採用指摘数**: 1 / 全3件

## 対象ファイル

| ファイル | 行数 | 種別 |
|----------|------|------|
| `schema.ts` | +21 | 変更 |
| `adapter.ts` | +69 | 変更 |
| `actions.ts` | +46 | 変更 |
| `BasicInfoEditForm.tsx` | 180 | 新規 |
| `BasicInfoSection.tsx` | 246 | 変更 |
| `styles.ts` | +55 | 変更 |

## Codex の指摘（3件）

| # | ファイル:行 | 問題 | 改善案 | 優先度 |
|---|------------|------|--------|--------|
| C-1 | adapter.ts:391 | `maxParticipantCount=0`（制限なし）のデルタ計算が不正。有限→無制限で失敗、無制限→有限で remaining_seat_count 不整合 | 0→有限は参加者実数から算出、有限→0 は remaining=0 に固定 | 高 |
| C-2 | BasicInfoEditForm.tsx:59 | 楽観的更新が保存失敗時にロールバックされない | 失敗時にロールバック or 成功後適用に変更 | 高 |
| C-3 | BasicInfoSection.tsx:123 | expectedUpdatedAt が初回 session.updatedAt のまま固定 | API戻り値で updatedAt を更新するか router.refresh() | 中 |

## Claude の指摘（1件）

| # | ファイル:行 | 問題 | 改善案 | 優先度 |
|---|------------|------|--------|--------|
| A-1 | adapter.ts:391 | C-1 と同一。maxParticipantCount=0 のデルタ計算が未対応 | 3分岐（0→0/有限→0/0→有限/有限→有限）で処理 | 高 |

## 議論サマリー

### 合意点（初回で一致、即採用）

- C-1/A-1: `remaining_seat_count` のデルタ計算が `maxParticipantCount=0`（制限なし）を考慮していない。無制限→有限は参加者実数カウント、有限→無制限は `remaining=0` 固定が必要。

### 議論を経て却下

| 指摘 | 最終ラウンド | 却下理由 |
|------|:-----------:|--------|
| C-2 | R2 | Codex 撤回。`useOptimistic` は `startTransition` 完了時に自動ロールバック。#2/#3/#4-Batch2 でも同一指摘を検証して却下済み |
| C-3 | R2 | Codex 撤回。`revalidatePath` → Server Component 再実行 → 最新 `session.updatedAt` が props に再注入される |

## 実施した改善

| # | ファイル | 改善内容 | 出典 |
|---|---------|---------|------|
| 1 | adapter.ts | `updateSessionBasicInfo` の remaining_seat_count 計算を3分岐化: (1) 新max=0→remaining=0, (2) 旧max=0→参加者実カウントから算出, (3) 両方>0→デルタ計算 | C-1/A-1 合意 |

## 検証結果

- lint/format: PASS
- ビルド: N/A（pnpm check で型エラーなし確認済み）
- テスト: PASS（82ファイル、1149テスト）

## 所見

Batch 単位のレビュー（計画レビュー + Batch 2 差分レビュー）では見落とされていた
`maxParticipantCount=0`（制限なし）のエッジケースが、全体差分レビューで発見された。
DB の `remaining_seat_count` セマンティクス（PLAYER 席のみ追跡、トリガーは PLAYER+CONFIRMED のみ発火）を
正しく理解した上で、無制限⇔有限の切り替え時に参加者実数を `session_participants` から取得する分岐を追加した。
C-2/C-3 は #2/#3 からの繰り返し指摘であり、React 19 の `useOptimistic` + `startTransition` + `revalidatePath` の
組み合わせに対する理解不足に起因するもので、Codex 自身が R2 で撤回した。
