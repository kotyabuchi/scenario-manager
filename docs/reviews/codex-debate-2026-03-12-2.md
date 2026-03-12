# Codex Debate レビューレポート

> **日時**: 2026-03-12
> **対象**: シナリオフィールドを基本情報フォームに統合（未コミット差分）
> **ラウンド数**: 2/5
> **採用指摘数**: 3 / 全6件

## 対象ファイル

| ファイル | 行数 | 種別 |
|----------|------|------|
| `src/app/(main)/sessions/[id]/schema.ts` | 9 | 変更対象 |
| `src/app/(main)/sessions/[id]/adapter.ts` | 60 | 変更対象 |
| `src/app/(main)/sessions/[id]/actions.ts` | 95 | 変更対象 |
| `src/app/(main)/sessions/[id]/__tests__/adapter.test.ts` | 110 | 変更対象 |
| `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoEditForm.tsx` | 101 | 変更対象 |
| `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoSection.tsx` | 140 | 変更対象 |

## Codex の指摘（3件）

| # | ファイル:行 | 問題 | 改善案 | 優先度 |
|---|------------|------|--------|--------|
| C-1 | BasicInfoEditForm.tsx:73 | scenarioIdをnullに戻す操作がなく、UIからシナリオ解除不可 | 解除ボタン追加でsetValue('scenarioId', null) | 高 |
| C-2 | actions.ts:122 | scenarioChanged判定がConflict判定より先に走り、競合時にフェーズエラーが先に返る | 順序整理 | 中 |
| C-3 | adapter.ts:447 | 'violates'/'value too long'を一括変換、非FKエラーも誤った文言 | DBエラーコード(23503)で分岐 | 低 |

## Claude の指摘（4件）

| # | ファイル:行 | 問題 | 改善案 | 優先度 |
|---|------------|------|--------|--------|
| A-1 | adapter.ts:425-433 | updatePayloadをRecord<string, unknown>で定義、Supabase型推論が失われる | インラインオブジェクトに戻す | 中 |
| A-2 | adapter.ts:437-444 | 'violates'条件が広すぎ（C-3と同一） | C-3で対応 | 中 |
| A-3 | actions.ts:102-133 | フェーズガードで追加DBクエリ、最適化余地 | 設計トレードオフ、現状は許容 | 低 |
| A-4 | BasicInfoEditForm.tsx | handleCancelでRHF resetが未呼び出し | アンマウントで自動クリーンアップされるため問題なし | 低 |

## 議論サマリー

### 合意点（初回で一致、即採用）
- C-3/A-2: エラーハンドリングのパターンマッチが広すぎる問題

### ラリーの記録

#### C-1: シナリオ解除UIのリグレッション
- **R1 Codex**: scenarioIdを選択値にしか更新できず、null戻し不可
- **R1 Claude**: 妥当な指摘。実装案Aを提案（フォーム内解除ボタン + setValue null）
- **R2 Codex**: 修正。案Aが適切。RHF一元管理の方針と整合する
- **結論**: 採用（案Aで実装）

#### C-2: フェーズガードの実行順序
- **R1 Codex**: 競合判定より先にフェーズガードが走る
- **R1 Claude**: フェーズエラーの方がユーザーにとって有用な情報では？
- **R2 Codex**: 撤回。フェーズガード先行は合理的
- **結論**: 却下（現状維持）

### 議論を経て採用
| 指摘 | 最終ラウンド | Codex → Claude のラリー概要 | 結論 |
|------|:-----------:|---------------------------|------|
| C-1 | R2 | 解除リグレッション → 案A合意 | 採用 |
| C-3/A-2 | R2 | エラーコード23503で分岐 | 採用 |
| A-1 | R1 | Claude のみ（型安全性） | 採用 |

### 議論を経て却下
| 指摘 | 最終ラウンド | 却下理由 |
|------|:-----------:|---------|
| C-2 | R2 | 設計判断として妥当（Codexも撤回） |
| A-3 | R1 | 設計トレードオフ、現状は許容範囲 |
| A-4 | R1 | アンマウントによる自動クリーンアップで問題なし |

## 実施した改善

| # | ファイル | 改善内容 | 出典 |
|---|---------|---------|------|
| 1 | BasicInfoEditForm.tsx | シナリオ解除ボタン追加（Trash icon + setValue null） | C-1 |
| 2 | adapter.ts | エラーハンドリングをerror.code === '23503'に変更 | C-3/A-2 |
| 3 | adapter.ts | updatePayloadをインラインオブジェクトに戻し型安全性回復 | A-1 |
| 4 | styles.ts | basicInfoEdit_scenarioActions スタイル追加 | C-1 |

## 検証結果

- lint/format: PASS
- ビルド: PASS
- テスト: PASS (41/41)

## 所見

最も重要な発見はC-1のシナリオ解除UIリグレッション。元のBasicInfoSectionにあった「解除ボタン＋確認ダイアログ」がRHF統合時に失われていた。フォーム内ボタンで解決し、RHF一元管理の設計方針とも整合する形で修正できた。確認ダイアログは保存前のプレビュー段階なので不要（キャンセルで元に戻る）。
