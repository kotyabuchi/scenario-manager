# フィードバック機能 保留事項の一括実装 レビューレポート

> **レビュー日時**: 2026-02-16
> **対象ファイル**: `docs/plans/feedback-deferred-items.md`
> **総合評価**: B
>
> **反映ステータス**: 反映済み（2026-02-16）
> **反映内容**: 必須 3件 + 推奨 4件 + 検討 3件

## サマリー

4つの保留事項（削除・UI改善・コメント数ソート・編集）を段階的に実装する計画で、全体として堅実に設計されている。既存パターン（Result型、adapter層、FeedbackModal再利用）を適切に踏襲しており、セキュリティ面のIDOR対策も考慮されている。ただし、カスケード削除の安全性、UIコンポーネント一貫性、ステータストグルのラベル不整合に対処が必要。

## 評価詳細

### 1. 技術的妥当性 WARN

**カスケード削除の安全性**: Step 1-1 の `deleteFeedback` 関数は、投票→コメント→本体の順に3つの独立した DELETE クエリを実行する。途中でエラーが発生した場合（例: 本体の DELETE が失敗）、投票とコメントのみ削除された不整合状態が残る。Supabase JS Client はトランザクションをサポートしないが、DBレベルで `ON DELETE CASCADE` を設定すれば、本体の削除だけで関連データが自動削除される。既に `feedbacks` テーブルの FK 関係が存在するため、CASCADE 制約の追加が最も安全。

**ソートの代替考慮**: Batch 3 で `comment_count` カラムを追加するアプローチは `vote_count` と同パターンで妥当。代替として `feedback_comments` の COUNT をリアルタイムで取得する方法もあるが、ソートのパフォーマンスを考えるとカラム追加が正解。

### 2. 網羅性・考慮漏れ WARN

**ステータストグルのラベル不整合**: Step 2-2 のトグルラベル「完了・見送りも表示」は不正確。`DEFAULT_STATUSES` には既に `DONE`（完了）が含まれているため、トグルで追加されるのは `WONT_FIX`（見送り）と `DUPLICATE`（統合済み）のみ。正確には「見送り・統合済みも表示」とすべき。

**トグル状態の判定ロジック**: `statuses.length > DEFAULT_STATUSES.length` で判定しているが、URLパラメータを手動編集して `DEFAULT_STATUSES` より要素数が多い任意のステータス配列を指定した場合、意図しない挙動になる。`statuses` が `ALL_STATUSES` と一致するかの比較、または専用の `showAll` パラメータの導入がより堅牢。

**削除後の画面遷移**: Step 1-3 で `useRouter().push('/feedback')` を使用するが、削除処理中のローディング状態や、削除失敗時のエラー表示についての記述が薄い。`isPending` による二重クリック防止は必要。

**既存の `page.tsx` の `isAuthor` 判定位置**: Step 1-5 で `currentUserId === feedback.userId` を比較するが、`currentUserId` が `undefined` の場合（未ログイン）の安全性を明示的に考慮すべき。現在の `page.tsx` はログイン必須で redirect するため実際には問題ないが、ActionSection の Props で `isAuthor` を `boolean` にするならデフォルト `false` を保証する記述があるとよい。

### 3. セキュリティ OK

IDOR対策として、adapter層で `feedback.user_id !== userId` チェックを実施している。削除・編集ともに投稿者本人チェックが適切に実装されている。Server Action 層で `getAuthUser()` による認証チェックも行われており、二重の保護になっている。

ステータス制限（削除は NEW のみ、編集は NEW/TRIAGED のみ）も要件定義どおりで問題なし。

### 4. UX・アクセシビリティ WARN

**UIコンポーネントの一貫性**: Step 2-2 で `<input type="checkbox">` を直接使用しているが、プロジェクトには `@/components/elements/checkbox/checkbox.tsx`（Ark UI ベース）が存在する。既存コンポーネントを使うべき。

**削除確認ダイアログの内容**: Step 1-3 で Modal を使った削除確認は言及されているが、確認メッセージの具体的なテキストが不明確。「この操作は取り消せません」等の警告テキストを明記すべき。

**アクセシビリティ**: ActionSection の削除・編集ボタンに `aria-label` の指定がない。特に削除ボタンは破壊的操作のため、明確なラベル付けが望ましい。

### 5. 保守性・拡張性 OK

既存コンポーネント（Modal, FeedbackModal, Button）の再利用を最大化しており、新規コンポーネントは ActionSection のみで最小限。FeedbackModal の `editTarget` パラメータによるモード切替は、将来的にプレビュー等の追加モードにも拡張しやすい設計。

`comment_count` トリガーは `vote_count` と同パターンで保守性が高い。

### 6. プロジェクト整合性 WARN

**チェックボックス**: `<input type="checkbox">` ではなく `Checkbox` コンポーネント（`@/components/elements/checkbox`）を使用すべき。`mineToggle` でも同様に生の `<input>` を使っているが、新規追加のトグルでは既存コンポーネントに統一すべき。

**Server Action の返り値型**: `deleteFeedbackAction` は `{ success: boolean; error?: string }` で、これは `actions.ts` 内の既存パターンと一致。`updateFeedbackAction` は `Result<void>` で、`FeedbackModal/actions.ts` 内の既存パターンと一致。ファイル間の型パターンの違いは既存の問題だが、今回の計画はそれに従っているため問題なし。

**スタイル命名**: `actionSection`, `deleteConfirm_message` 等は `{section}_{element}` パターンに準拠。OK。

### 7. 実行可能性 OK

Batch の分割順序は適切で、依存関係が明確。Batch 1（削除）が最もシンプルで先に実装、Batch 3（DB マイグレーション）を Batch 4（編集）の前に配置することでリスクを分散している。

SQL マイグレーションの手順も具体的で、既存データの集計更新も含まれている。検証方法は各 Batch ごとに記載されており実行可能。

## 改善提案

### 必須（実装前に対処すべき）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 技術的妥当性 | `deleteFeedback` のカスケード削除が3つの独立クエリで非トランザクション | SQL マイグレーション（Batch 3）に `ON DELETE CASCADE` 制約の追加を含め、adapter では `feedbacks` の DELETE のみ実行する |
| 2 | 網羅性 | ステータストグルのラベル「完了・見送りも表示」が不正確（DONE は既にデフォルト表示） | 「見送り・統合済みも表示」に修正 |
| 3 | プロジェクト整合性 | `<input type="checkbox">` を直接使用 | `@/components/elements/checkbox` の Checkbox コンポーネントを使用 |

### 推奨（対応が望ましい）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 網羅性 | トグル状態の判定が `statuses.length` 比較で脆弱 | `ALL_STATUSES` との配列一致比較、または `showClosed` パラメータの導入を検討 |
| 2 | UX | 削除確認ダイアログの確認メッセージが未定義 | 「このフィードバックを削除しますか？関連する投票・コメントもすべて削除されます。この操作は取り消せません。」を明記 |
| 3 | UX | 削除処理中のローディング状態についての記述不足 | `useTransition` で `isPending` を管理し、削除ボタンに `loading` / `disabled` を付与 |
| 4 | a11y | ActionSection の削除・編集ボタンに aria-label の指定なし | `aria-label="このフィードバックを削除"` 等を付与（ボタンテキストが十分なら不要） |

### 検討（余裕があれば）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 保守性 | `FeedbackContent` に `FeedbackModal` を追加すると責務が広がる | 将来的にヘッダー部分を `FeedbackPageHeader` コンポーネントに切り出すことを検討 |
| 2 | 網羅性 | 既存の `mineToggle` も生の `<input type="checkbox">` を使用 | 今回の変更に合わせて既存の mineToggle も Checkbox に統一するか検討 |
| 3 | UX | 編集完了後の成功メッセージ表示時間（2秒固定）が短い可能性 | トースト通知の導入を将来検討 |

## 総合所見

計画全体は堅実で、既存アーキテクチャとの整合性が高い。4つの保留事項を適切な粒度のバッチに分割し、リスクの低い順（削除→UI→DB→編集）に並べている点は評価できる。特に FeedbackModal の `editTarget` による新規/編集モード切替は、既存コンポーネントの再利用を最大化する良いアプローチ。

必須指摘3件のうち、最も重要なのはカスケード削除の安全性で、SQL マイグレーション時に `ON DELETE CASCADE` を追加するだけで解決できる。残りの2件（ラベル修正、Checkbox 統一）も小さな修正で対応可能。修正後は即座に実装に着手できる品質にある。
