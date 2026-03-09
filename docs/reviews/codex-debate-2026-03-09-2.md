# Codex Debate レビューレポート

> **日時**: 2026-03-09
> **対象**: #9 セッション完了ダイアログ 実装計画書
> **モード**: 計画書レビュー
> **ラウンド数**: 2/5
> **採用指摘数**: 6 / 全11件（Codex 6件 + Claude 5件）

## 対象ファイル

| ファイル | 種別 |
|----------|------|
| 計画書: `splendid-finding-summit.md` | レビュー対象 |
| `CompleteSessionDialog.tsx` | 変更対象 |
| `SessionActions.tsx` | 変更対象 |
| `styles.ts` | 変更対象 |

## Codex の指摘（6件）

| # | セクション | 問題 | 改善案 | 優先度 |
|---|------------|------|--------|--------|
| C-1 | Step 1-2 | `revalidatePath` 後に `SessionActions` が `actions.length===0` で早期 return → サクセス画面が消滅する | `openDialog` 中はダイアログを描画し続ける構造に変更 | 高 |
| C-2 | 決定事項 | `typedRoutes: true` で未実装ルート `/sessions/[id]/reviews/new` は型エラーor 404 | disabled ボタン + 準備中表示 | 高 |
| C-3 | Step 1-3 | `session.scheduleDate` を生で渡すと `null`/生文字列表示 | 整形済み `scheduleLabel` を渡す | 中 |
| C-4 | 検証方法 | `CompleteSessionDialog.stories.tsx` 追加が計画に含まれていない | Stories 追加を Step に含める | 中 |
| C-5 | Step 1-2 | チェックリストの a11y 要件が未定義 | `ul/li` 構造化 + `aria-hidden` | 中 |
| C-6 | 計画書構成 | 「前提条件」「Review Checkpoint」欠落 | — | 低 |

## Claude の指摘（5件）

| # | セクション | 問題 | 改善案 | 優先度 |
|---|------------|------|--------|--------|
| A-1 | 決定事項 | `sessionDate` が null の場合の表示パターン未定義 | 「日程未定」表示を明記 | 中 |
| A-2 | Step 1-2 | view state のリセット漏れ | `handleClose` に `setView('confirm')` 追加 | 中 |
| A-3 | 決定事項 | レビューリンクの実在性 | ルート確認 or TODO コメント | 中 |
| A-4 | Step 1-3 | Props 粒度（個別 vs Pick型） | 既存パターンとの一貫性を優先 | 低 |
| A-5 | 検証方法 | Storybook の言及が曖昧 | Stories 更新を明確に | 低 |

## 議論サマリー

### 合意点（初回で一致、即採用）

- C-3 ≈ A-1: `scheduleDate` の null 対応 → 整形済み `scheduleLabel` を渡す
- C-4 ≈ A-5: Stories ファイル追加を計画に含める
- C-5: チェックリストの a11y 対応（`ul/li` + `aria-hidden`）

### ラリーの記録

#### C-1: サクセス画面消滅問題
- **R1 Codex**: `revalidatePath` 後に `SessionActions` が消滅し、内部のダイアログも消える
- **R1 Claude**: 実コード確認（`getAvailableSessionActions` は COMPLETED で `[]` を返す）。指摘は完全に正しい。案A（early return 条件修正）と案B（外部移動）を提示
- **R2 Codex**: 案A が妥当。変更範囲最小で既存責務を崩さない
- **結論**: **採用**（案A: `if (actions.length === 0 && openDialog === null) return null;`）

#### C-2: typedRoutes 型エラー
- **R1 Codex**: 未実装ルートへの Link は型エラーまたは 404
- **R1 Claude**: `as Route` キャストで型エラーは回避可能（既存例あり）。案A（as Route + TODO）と案B（disabled ボタン）を提示
- **R2 Codex**: 案B が妥当。`as Route` は実在ルート用途が中心で、未実装遷移の前例なし
- **結論**: **修正して採用**（disabled ボタン + 準備中テキスト）

#### C-6: 計画書フォーマット
- **R1 Codex**: plan-mode.md 必須セクション欠落
- **R1 Claude**: この計画は Claude Code プランモード用（`docs/plans/` 外）のため適用外
- **R2 Codex**: 撤回。管理外なら必須セクション違反は不適切
- **結論**: **却下**

### 議論を経て採用

| 指摘 | 最終ラウンド | 概要 | 結論 |
|------|:-----------:|------|------|
| C-1 | R2 | 案A（early return 条件修正）で合意 | 採用 |
| C-2 | R2 | 案B（disabled ボタン）で合意 | 修正して採用 |

### 議論を経て却下

| 指摘 | 最終ラウンド | 却下理由 |
|------|:-----------:|---------|
| C-6 | R2 | 計画書が `docs/plans/` 管理外のため適用外 |
| A-4 | R1 | 既存パターンとの一貫性を優先（低優先度で影響軽微） |

## 実施した改善

| # | セクション | 改善内容 | 出典 |
|---|---------|---------|------|
| 1 | 決定事項 | サクセス画面消滅対策を追加 | C-1 |
| 2 | 決定事項 | レビューボタンを disabled + 準備中に変更 | C-2 |
| 3 | 決定事項 | Props を `scheduleLabel`（整形済み）に変更、null 時「日程未定」 | C-3/A-1 |
| 4 | Step 1-2 | チェックリストを `ul/li` + `aria-hidden` に明記 | C-5 |
| 5 | Step 1-2 | `handleClose` に view state リセットを追加 | A-2 |
| 6 | Step 1-3 | early return 修正を明記 | C-1 |
| 7 | Step 1-4 | Stories ファイル追加を新 Step として追加 | C-4/A-5 |

## 検証結果

- 計画書構造: Batch/Step 番号連続、ファイル一覧整合
- 粒度: 4ファイル / 約240行 — ガイドライン内

## 所見

Codex の C-1（サクセス画面消滅）は Claude が見落としていた致命的な設計問題で、`revalidatePath` 後のコンポーネント再描画と `useState` の組み合わせに起因する。このようなデータフロー上の問題は、実装前の計画レビューで発見できたことに大きな価値がある。C-2 の typedRoutes 指摘も、ビルド時に発覚する問題を事前に回避できた。
