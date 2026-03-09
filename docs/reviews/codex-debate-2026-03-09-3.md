# Codex Debate レビューレポート

> **日時**: 2026-03-09
> **対象**: 0749e37..HEAD（#10 参加申請承認画面リファクタ）
> **モード**: 差分レビュー
> **ラウンド数**: 2/5
> **採用指摘数**: 3 / 全10件（Codex 3件 + Claude 7件）

## 対象ファイル

| ファイル | 変更行数 | 種別 |
|----------|---------|------|
| `ApplicationApprovalContent.tsx` | +266/-212 | 変更 |
| `ApplicationApprovalContent.stories.tsx` | +62/-5 | 変更 |
| `ApplicationCard.tsx` | +63/-37 | 変更 |
| `Breadcrumb.tsx` | +57 | 新規 |
| `Breadcrumb.stories.tsx` | +29 | 新規 |
| `FilterBar.tsx` | +80 | 新規 |
| `FilterBar.stories.tsx` | +48 | 新規 |
| `loading.tsx` | +9/-4 | 変更 |
| `page.tsx` | +17/-14 | 変更 |
| `styles.ts` | +260/-173 | 変更 |

## Codex の指摘（3件）

| # | ファイル:行 | 問題 | 改善案 | 優先度 |
|---|------------|------|--------|--------|
| C-1 | ApplicationApprovalContent.tsx:157 | maxPlayer=0（制限なし）で Progress max={0} → NaN/Infinity | maxPlayer > 0 ガードを追加 | 中 |
| C-2 | ApplicationApprovalContent.tsx:191 | フィルターで0件時に「申請はまだありません」と誤表示 | filterValue を含めて文言分岐 | 低 |
| C-3 | ApplicationApprovalContent.tsx:142 | Badge「募集中」が常に固定 | sessionPhase を渡して動的化 | 低 |

## Claude の指摘（7件）

| # | ファイル:行 | 問題 | 改善案 | 優先度 |
|---|------------|------|--------|--------|
| A-1 | styles.ts:filterBar_container | bg:'white' ハードコード | bg:'bg.card' セマンティックトークンに変更 | 中 |
| A-2 | FilterBar.tsx | 'use client' ディレクティブなし | 偽陽性（親がClient Component） | 低 |
| A-3 | ApplicationCard.tsx:statsRow | stats値がハードコード「-」 | title属性あり、意図的 | 低 |
| A-4 | Breadcrumb.tsx:Link href | `as Route` 型アサーション | Next.js動的パスでは不可避 | 低 |
| A-5 | ApplicationApprovalContent.tsx | toSorted() ES2023 | ビルド通過済み | 低 |
| A-6 | ApplicationApprovalContent.tsx | ページネーションにnuqs未使用 | クライアントサイドのためURL同期不要 | 中 |
| A-7 | styles.ts:card_root | borderLeftWidth '[3px]' ハードコード | デザイン一貫性あり | 低 |

## 議論サマリー

### 合意点（初回で一致、即採用）

- C-1: maxPlayer=0 での Progress 描画破綻は実バグ（adapter.ts で確認済み）

### ラリーの記録

#### C-3: 固定バッジ「募集中」
- **R1 Codex**: sessionPhase を渡して動的化すべき
- **R1 Claude**: このページは募集中フェーズでのみ使用。スコープ外の新機能であり修正は過剰。
- **R2 Codex**: 【撤回】仕様説明を前提にすると修正必須事項とは言えない。別Issue化が妥当。
- **結論**: 却下（スコープ外）

#### A-1: bg:'white' ハードコード
- **R1 Claude**: セマンティックトークンを使うべき
- **R2 Codex**: 【修正】規約がトークン運用なら bg:'white' は避けるべき。bg.card 等へ置換。
- **結論**: 採用

### 議論を経て採用

| 指摘 | 最終ラウンド | ラリー概要 | 結論 |
|------|:-----------:|-----------|------|
| C-1 | R1 | 即合意（adapter確認で裏付け済み） | 採用 |
| C-2 | R2 | Codex維持、Claude同意 | 採用 |
| A-1 | R2 | Codex同意 | 採用 |

### 議論を経て却下

| 指摘 | 最終ラウンド | 却下理由 |
|------|:-----------:|---------|
| C-3 | R2 | スコープ外（リファクタではなく新機能） |
| A-2 | - | 偽陽性 |
| A-4 | - | Next.js制約上不可避 |
| A-5 | - | ビルド通過済み |
| A-6 | - | クライアントサイドページネーションでURL同期不要 |
| A-7 | - | デザイン一貫性あり、低優先 |

## 実施した改善

| # | ファイル | 改善内容 | 出典 |
|---|---------|---------|------|
| 1 | ApplicationApprovalContent.tsx | `maxPlayer > 0` ガード追加（Progress/stats表示） | C-1 |
| 2 | styles.ts | `bg: 'white'` → `bg: 'bg.card'` | A-1 |
| 3 | ApplicationApprovalContent.tsx | 空状態メッセージにfilterValue分岐追加 | C-2 |

## 検証結果

- lint/format: PASS
- ビルド: PASS
- テスト: N/A

## 所見

Codex の C-1（maxPlayer=0 での Progress 描画破綻）は、DB の「0=制限なし」センチネル値と UI の `isNil` ガードの不整合に起因する実バグ。adapter 層で 0→null に正規化するのが根本的な解決だが、他画面への影響を考慮して今回はコンポーネント側でガードを追加する最小限の修正とした。C-2 の空状態メッセージ改善も、タブUI→フィルターバー移行時に文言分岐の見直しが漏れていた箇所を的確に検出した。
