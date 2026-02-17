# フィードバック機能 保留事項の一括実装 実装レビュー

> **反映ステータス**: 反映済み（2026-02-16）
> **反映内容**: 必須 0件 + 推奨 2件 + 検討 1件
>
> **レビュー日時**: 2026-02-16（第2回）
> **対象計画**: `docs/plans/feedback-deferred-items.md`
> **計画充足度**: 100% (15/15 Steps)
> **サービス品質**: B

## サマリー

4つの保留事項（削除・UI改善・コメント数ソート・編集）のすべてのStepが計画どおりに実装されている。第1回レビューの必須指摘（削除失敗時のエラー通知不足）は `useSystemMessageActions` フックの導入で対応済み。残る改善点は、`FeedbackModal` の `editTarget` プロップが毎レンダーで新しいオブジェクト参照を生成し `useEffect` のリセットを誤発火させる可能性がある点と、`updateFeedbackAction` の専用テストが未整備な点である。

---

## Part A: 計画充足度

### Batch 1: 投稿者による削除機能

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 1-1 | adapter に削除関数を追加 | DONE | `deleteFeedback` が `adapter.ts:320-354` に実装。権限チェック・ステータスチェック・CASCADE削除すべて計画どおり |
| 1-2 | Server Action に削除アクションを追加 | DONE | `deleteFeedbackAction` が `actions.ts:135-152` に実装。認証・ログ・revalidatePath 計画どおり |
| 1-3 | 削除確認ダイアログ付き ActionSection | DONE | `ActionSection.tsx` が新規作成。Modal確認、`Button status="danger"`、`Trash`アイコン、`aria-label`、`useTransition` すべて実装。削除成功/失敗時のシステムメッセージ通知も追加（第1回レビュー指摘対応） |
| 1-4 | スタイル追加 | DONE | `actionSection`, `deleteConfirm_message` が `[id]/_components/styles.ts:257-267` に追加 |
| 1-5 | 詳細ページに ActionSection を統合 | DONE | `page.tsx:67-76` で `isAuthor` 判定・props渡しが計画どおり |

### Batch 2: 一覧ページ「新規投稿」ボタン + ステータストグル

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 2-1 | FeedbackContent に新規投稿ボタンを追加 | DONE | `pageHeader` に `<h2>` + `Button status="primary"` + `Plus` アイコン実装。`FeedbackModal` の state 管理も実装 |
| 2-2 | ステータストグルを searchRow に追加 | DONE | `Checkbox` コンポーネント使用、`isShowAll` は `ALL_STATUSES.every()` で判定、ラベル「見送り・統合済みも表示」。`mineToggle` も `Checkbox` に統一 |
| 2-3 | searchParams に ALL_STATUSES を追加 | DONE | `searchParams.ts:23-31` に `ALL_STATUSES` 定義。`DEFAULT_STATUSES` も併記 |
| 2-4 | スタイル追加 | DONE | `pageHeader`, `pageTitle` が `_components/styles.ts:5-15` に追加。`filterActions`（`styles.ts:76-81`）がトグル配置用コンテナとして機能。計画の `statusToggle` は `Checkbox` の組み込みスタイルで不要に |

### Batch 3: コメント数ソート（DB カラム追加）

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 3-1 | SQL マイグレーション | DONE | `comment_count` カラムが `src/db/types.ts` に存在。ON DELETE CASCADE 制約の追加も実施済み |
| 3-2 | Supabase 型再生成 | DONE | `types.ts` に `comment_count: number` 反映確認 |
| 3-3 | adapter のソートロジック更新 | DONE | `adapter.ts:77-78` で `comment_count` によるソート実装。TODO コメント削除済み |
| 3-4 | commentCount マッピング更新 | DONE | select から `feedback_comments(count)` 削除、`adapter.ts:113` で `camelRow.commentCount` を直接使用 |
| 3-5 | API route の更新 | DONE | 変更不要（計画どおり）。adapter 修正で自動対応 |

### Batch 4: 投稿者による編集機能

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 4-1 | adapter に更新関数を追加 | DONE | `updateFeedback` が `adapter.ts:359-403` に実装。TRIAGED→NEW リセット含め計画どおり |
| 4-2 | Server Action に更新アクションを追加 | DONE | `updateFeedbackAction` が `FeedbackModal/actions.ts:91-136` に実装。認証・Zod検証・revalidatePath 完備 |
| 4-3 | FeedbackModal を編集モードに拡張 | DONE | `editTarget` props、`useEffect` での `reset()`、送信分岐、編集時の要素非表示、成功メッセージ分岐すべて実装 |
| 4-4 | ActionSection に編集ボタンを追加 | DONE | `PencilSimple` アイコン、`canEdit` 条件、`aria-label`、`FeedbackModal` 連携すべて実装 |
| 4-5 | 詳細ページで feedback データを渡す | DONE | `page.tsx:67-76` で category/title/description を ActionSection に渡す実装 |

### 計画レビュー指摘の対応状況

| # | 指摘事項 | 対応状態 |
|---|---------|---------|
| 必須1 | カスケード削除の安全性 | 対応済: ON DELETE CASCADE + adapter は feedbacks の DELETE のみ |
| 必須2 | ステータストグルのラベル不正確 | 対応済: 「見送り・統合済みも表示」 |
| 必須3 | `<input type="checkbox">` → `Checkbox` | 対応済: Ark UI Checkbox で統一 |
| 推奨1 | トグル状態判定が脆弱 | 対応済: `ALL_STATUSES.every()` で一致比較 |
| 推奨2 | 削除確認メッセージ未定義 | 対応済: メッセージ明記 |
| 推奨3 | 削除処理中のローディング | 対応済: `useTransition` + `isPending` |
| 推奨4 | aria-label 未指定 | 対応済: 編集・削除ボタンともに付与 |

### 第1回実装レビュー指摘の対応状況

| # | 指摘事項 | 対応状態 |
|---|---------|---------|
| 必須1 | `handleDelete` で削除失敗時のエラー通知がない | **対応済**: `useSystemMessageActions` フックを導入し、成功時・失敗時ともに `addMessage` で通知 |
| 推奨1 | テストカバレッジがゼロ | **部分対応**: `adapter.test.ts` に `deleteFeedback`/`updateFeedback` のテストケースが追加。ただし `updateFeedbackAction` のテストは未整備 |
| 推奨2 | 未使用 `mineToggle` スタイル | **対応済**: `mineToggle` スタイル定義は削除済み（styles.ts に存在しない） |

---

## Part B: サービス品質

### B1. エラーハンドリング OK

adapter 層で `Result` 型を一貫して使用。Server Actions で `getAuthUser()` による認証チェックと LogTape によるエラーログが適切。

- `ActionSection.tsx:46-57`: 削除成功時に `addMessage('success', ...)` 、失敗時に `addMessage('danger', ...)` でユーザーに通知。モーダルを閉じてメッセージを表示する導線も適切
- `FeedbackModal.tsx:128-164`: 編集・作成ともに `serverError` state で送信失敗をフォーム内に表示
- `updateFeedbackAction`: `revalidatePath` で `/feedback` と `/feedback/${feedbackId}` の両方を再検証

### B2. エッジケース・空状態 OK

- フィードバック一覧の空状態 UI は `FeedbackList` で対応済み
- `ActionSection` は `isAuthor === false` や編集・削除不可時に `null` を返す適切な制御
- `commentCount` の null 安全は `?? 0` で対応
- 未ログイン時は `page.tsx:30-32` で redirect

### B3. ローディング・Suspense OK

- `ActionSection`: `useTransition` で削除処理中の `isPending` 管理、ボタンに `loading` / `disabled` 適用
- `FeedbackModal`: `useTransition` で送信中状態管理、`loadingText` で「更新中...」/「送信中...」表示
- `FeedbackContent`: `isLoadingMore` で追加読み込み状態管理

### B4. セキュリティ OK

- 認証: `getAuthUser()` による Server Action 層チェック + adapter 層の `userId` 比較で二重保護
- 認可: `feedback.user_id !== userId` による投稿者本人チェック
- ステータス制限: 削除は `NEW` のみ、編集は `NEW/TRIAGED` のみ
- IDOR 対策: adapter 層でサーバーサイド権限チェック

### B5. パフォーマンス WARN

- `comment_count` カラムにより JOIN ベースの COUNT を排除 ✓
- `useCallback` でイベントハンドラをメモ化（`FeedbackContent`）✓
- **問題点**: `ActionSection.tsx:75-82` で `editTarget` プロップがインラインオブジェクトとして生成されるため、ActionSection が再レンダーするたびに新しい参照が作られる。これにより `FeedbackModal` 内の `useEffect`（`editTarget` 依存）が誤発火し、`reset()` でフォームの入力内容が上書きされる可能性がある。現行の親 Server Component 構造では影響が限定的だが、将来的なリファクタリングで顕在化するリスクがある

### B6. アクセシビリティ OK

- 削除ボタン: `aria-label="このフィードバックを削除"` ✓
- 編集ボタン: `aria-label="このフィードバックを編集"` ✓
- 見出し階層: `<h2>` でフィードバック見出し ✓
- `Checkbox`: Ark UI ベースでアクセシビリティ対応済み ✓
- `Modal`: Ark UI Dialog ベースでフォーカストラップ・Escape 閉じ対応 ✓

### B7. テストカバレッジ WARN

- `adapter.test.ts`: `deleteFeedback` / `updateFeedback` のテストケースが追加済み（エラーケース中心、DB接続不要ケースは実行可能）
- `actions.test.ts`: `createFeedbackAction` のみカバー。**`updateFeedbackAction` のテストが未整備**
- ActionSection のコンポーネントテスト / Storybook ストーリーは未作成
- FeedbackModal の編集モードに関するテストも未作成

### B8. プロジェクト規約準拠 OK

- スタイル分離（`styles.ts`）✓
- LogTape 使用（`console.log` なし）✓
- `isNil` による null チェック ✓
- PandaCSS セマンティックトークン使用 ✓
- 命名規則（`actionSection`, `deleteConfirm_message`）✓
- Phosphor Icons の `/ssr` エントリポイント使用 ✓
- 旧 `mineToggle` スタイルは削除済み ✓

---

## 改善提案

### 必須（リリース前に対処すべき）

なし（第1回レビューの必須指摘はすべて対応済み）

### 推奨（対応が望ましい）

| # | 種別 | ファイル | 指摘事項 | 推奨対応 |
|---|------|---------|---------|---------|
| 1 | Part B (B5) | `ActionSection.tsx:75-82` + `FeedbackModal.tsx:106-114` | `editTarget` がインラインオブジェクトのため毎レンダーで新参照が生成され、`useEffect` の `reset()` が意図せず発火する可能性 | ActionSection 側で `useMemo` を使って `editTarget` を安定化するか、FeedbackModal 側で `editTarget` の個々のプロパティを dependency に使う |
| 2 | Part B (B7) | `FeedbackModal/__tests__/actions.test.ts` | `updateFeedbackAction` のテストケースが未整備 | `createFeedbackAction` と同パターンで認証エラー・バリデーションエラー・成功時の Result 型テストを追加 |

### 検討（余裕があれば）

| # | 種別 | ファイル | 指摘事項 | 推奨対応 |
|---|------|---------|---------|---------|
| 1 | Part B (B7) | - | ActionSection のコンポーネントテスト / Storybook ストーリーが未作成 | 削除確認モーダルの表示/非表示、編集ボタンの条件表示をカバーするテストまたはストーリーを追加 |
| 2 | Part B (B1) | `FeedbackModal/actions.ts:132` | `revalidatePath` を動的 import で取得している | 他の Server Action ファイル（`feedback/actions.ts`）ではトップレベル import。統一が望ましい |

## 良い点

- 第1回レビューの必須指摘（削除失敗時の通知不足）を `useSystemMessageActions` フックで修正し、成功/失敗の両方をシステムメッセージで一貫して通知するようにした
- 計画レビュー・実装レビュー双方の指摘をすべて追跡・対応しており、レビュープロセスが効果的に機能している
- `Checkbox` コンポーネントへの統一により、既存の `mineToggle` も含めてUI一貫性が向上
- `ALL_STATUSES.every()` による堅牢なトグル状態判定
- `FeedbackModal` の `editTarget` パターンによるモード切替が簡潔で拡張性が高い
- ON DELETE CASCADE 採用によりデータ整合性を DB レベルで保証
- `adapter.test.ts` に新機能（`deleteFeedback`/`updateFeedback`）のテストケースを追加済み
- SpeedDialPanel に「みんなのフィードバックを見る」導線を追加（計画外の UX 改善）

## 総合所見

計画の15 Stepすべてが仕様どおりに実装されており、計画充足度は100%。計画レビュー・第1回実装レビューの必須指摘もすべて反映済み。サービス品質面では、`editTarget` のオブジェクト参照安定性と `updateFeedbackAction` のテスト不足が推奨改善点として残るが、リリースをブロックする深刻な問題はない。全体として高品質な実装であり、推奨2件を対応すればさらに堅牢なコードベースとなる。
