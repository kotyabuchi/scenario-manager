# コード差分レビュー

> **レビュー日時**: 2026-02-16
> **対象範囲**: HEAD (`0fecb7f`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 42 files（tracked 12 + untracked 30）
> **総合評価**: B
>
> **反映ステータス**: 反映済み（2026-02-16）
> **反映内容**: 推奨 7件（全件反映）+ 検討 6件（全件反映）+ テスト修正 1件

## 変更サマリー

フィードバック機能の大規模な実装追加。一覧ページ（`/feedback`）、詳細ページ（`/feedback/[id]`）、API検索エンドポイント、投票・コメント・削除・編集機能、管理者セクション、レート制限を含む。
加えて、要件定義書の更新、Stitch MCPスキルの追加、UIデザインシステムメモリの更新も含まれる。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `.claude/requirements/requirements-feedback.md` | +196 | -84 | 変更 |
| `.claude/requirements/requirements-session-flow.md` | +163 | -52 | 変更 |
| `.claude/rules/tdd-workflow.md` | +1 | -0 | 変更 |
| `.mcp.json` | +7 | -0 | 変更 |
| `.serena/memories/ui-design-system.md` | +130 | -54 | 変更 |
| `.vscode/settings.json` | +0 | -1 | 変更 |
| `CLAUDE.md` | +1 | -0 | 変更 |
| `src/components/blocks/FeedbackModal/FeedbackModal.tsx` | +168 | -88 | 変更 |
| `src/components/blocks/FeedbackModal/__tests__/actions.test.ts` | +138 | -0 | 変更 |
| `src/components/blocks/FeedbackModal/actions.ts` | +51 | -0 | 変更 |
| `src/components/blocks/SpeedDialFAB/SpeedDialPanel.tsx` | +10 | -0 | 変更 |
| `src/db/types.ts` | +3 | -0 | 変更 |
| `.claude/skills/stitch-design/SKILL.md` | ~300 | -0 | 新規 |
| `src/app/(main)/feedback/page.tsx` | ~30 | -0 | 新規 |
| `src/app/(main)/feedback/actions.ts` | ~190 | -0 | 新規 |
| `src/app/(main)/feedback/adapter.ts` | ~475 | -0 | 新規 |
| `src/app/(main)/feedback/interface.ts` | ~52 | -0 | 新規 |
| `src/app/(main)/feedback/searchParams.ts` | ~35 | -0 | 新規 |
| `src/app/(main)/feedback/styles.ts` | ~50 | -0 | 新規 |
| `src/app/(main)/feedback/_components/*.tsx` | ~600 | -0 | 新規 |
| `src/app/(main)/feedback/[id]/**` | ~700 | -0 | 新規 |
| `src/app/api/feedback/search/route.ts` | ~74 | -0 | 新規 |

## 評価詳細

### 1. コーディング規約準拠 WARN

- スタイルは`styles.ts`に適切に分離されている
- アイコンは`@phosphor-icons/react/ssr`から正しくインポート
- `console.log`の使用なし（LogTapeを正しく使用）
- `isNil`を適切に使用
- `export const`パターンを一貫して使用
- `any`型の使用なし

問題点:
- `actions.ts`（feedback/）のServer Actionの戻り値が `{ success: boolean; error?: string }` 形式でプロジェクト標準の `Result<T>` 型と不整合がある
- **AdminSectionがReact Hook Form + Zodを使用していない**: `useState`で`status`, `priority`, `adminNote`を管理しており、`form-rules.md`の「フォームの状態管理に`useState`を使用しない」規約に違反

### 2. 設計・保守性 WARN

- コンポーネントの分離は良好（ActionSection、AdminSection、CommentSection、FeedbackDetailContent等）
- adapter層とaction層の責務分離が明確
- `interface.ts`での型定義はSupabase生成型から導出しており適切（Single Source of Truth原則）
- `camelCaseKeys`のダブルキャスト（`as Record<string, unknown>` → `as FeedbackWithUser`）は型安全性を損なう
- `updateFeedbackAction`のテストがほぼ全て`.skip`で、実行される非スキップテストは実質的に何もテストしていない
- `getCategoryLabel`/`getStatusLabel`ヘルパーが`FeedbackCard.tsx`と`FeedbackDetailContent.tsx`で重複定義

### 3. セキュリティ WARN

- API検索エンドポイント（`/api/feedback/search`）は認証なしでアクセス可能。要件では「ログイン必須」だが、ページレベルの認証に委ねている可能性あり。APIレベルでも認証チェックを検討すべき
- `limit`/`offset`パラメータに上限チェックがなく、巨大な値でパフォーマンス問題の可能性
- Server ActionでのZodバリデーションは適切に実装されている
- `deleteFeedback`は投稿者チェック + ステータスチェックを実施

### 4. パフォーマンス OK

- 楽観的更新が適切に実装されている（VoteButton）
- `useMemo`で不要な再計算を防止（CommentSection、ActionSection）
- 投票済みフラグの一括取得（N+1回避）
- `count: 'exact', head: true`でレート制限チェックを効率化

### 5. UX・アクセシビリティ WARN

- VoteButton: `aria-pressed`、`aria-label`、`aria-live="polite"`を適切に使用
- 編集・削除ボタンに`aria-label`あり
- `<section>`、`<article>`要素の適切な使用
- フォームはReact Hook Form + Zodで適切に管理（CommentSection）
- `<h1>`、`<h2>`の階層構造が適切
- コメントソートの切り替えUIあり

問題点:
- **AdminSection**: `handleUpdate`が結果を無視しており、保存の成功/失敗がユーザーに伝わらない
- **CommentSection**: `onSubmit`失敗時にエラーメッセージが表示されない
- **FeedbackContent**: fetch失敗時にログは出力されるがユーザーにエラーが表示されない

### 6. バグ・ロジックエラー WARN

- **FeedbackModal**: レート制限チェックのuseEffect内で`check()`関数にtry/catchがなく、`checkRateLimitAction`が例外を投げた場合にサイレントに失敗する
- **FeedbackModal**: 編集モードの成功後に`reset()`が呼ばれていない（作成モードでは呼ばれている）
- **API route**: `searchParams.get('sort') as FeedbackSortOption`は安全でない型アサーション。不正な値が渡された場合に型システムを迂回する
- **AdminSection**: `handleUpdate`で`adminNote`を空文字列として送信しているが、`updateStatusAction`は`undefined`時のみスキップするため、意図せず空文字列で上書きされる可能性がある

## 指摘一覧

### 必須（マージ前に修正すべき）

なし（APIキー露出は対策済み）

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 規約違反 | `AdminSection.tsx` 全体 | `useState`でフォーム管理しており`form-rules.md`に違反 | React Hook Form + Zodに移行 |
| 2 | UX | `AdminSection.tsx`:50-58 | `handleUpdate`が結果を無視、保存成功/失敗がユーザーに伝わらない | result判定 + `useSystemMessageActions`で通知 |
| 3 | バグ | `FeedbackModal.tsx`:57-66 | レート制限チェックにtry/catchがない | `check()`内で例外をcatchし、失敗時はレート制限なしとして動作継続 |
| 4 | 設計 | `src/app/(main)/feedback/actions.ts` 全体 | Server Actionの戻り値が`Result<T>`ではなく`{ success; error? }`形式 | プロジェクト標準の`Result<T>`型に統一 |
| 5 | バグ | `FeedbackModal.tsx`:127-135 | 編集モード成功後に`reset()`が呼ばれない | 作成モードと同様に成功後にformをリセット |
| 6 | セキュリティ | `src/app/api/feedback/search/route.ts`:14 | API routeに認証チェックなし | 認証を必須とするか、意図的に公開する場合はコメントで明記 |
| 7 | バグ | `src/app/api/feedback/search/route.ts`:39-41 | `as FeedbackSortOption`の安全でないキャスト + `limit`/`offset`の上限チェックなし | 許容値バリデーション追加、limitを`Math.min(limit, 100)`等で制限 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 9 | 設計 | `actions.test.ts`:159-720 | 新規テストの大半が`.skip`で、非スキップテストは定数検証のみ | 統合テスト環境が整うまでスキップは許容だが、スキーマバリデーションの実テスト追加を推奨 |
| 10 | 設計 | `adapter.ts`:106-116 | `camelCaseKeys`のダブルキャスト（`as Record` → `as FeedbackWithUser`） | 型安全なマッピング関数の導入 |
| 11 | バグ | `AdminSection.tsx`:56-57 | `adminNote`が空文字列で送信され、`updateStatusAction`で空文字列は`undefined`扱いにならない | `adminNote \|\| undefined`に変更するか、adapter側で空文字列をnullに変換 |
| 12 | 設計 | `FeedbackCard.tsx`:18-28, `FeedbackDetailContent.tsx`:29-39 | `getCategoryLabel`/`getStatusLabel`ヘルパーが2ファイルで重複定義 | 共通ユーティリティに抽出 |
| 13 | UX | `CommentSection.tsx`:53-59 | `onSubmit`失敗時にエラーメッセージが表示されない | 失敗時にユーザーへフィードバック表示 |
| 14 | 設計 | `AdminSection.tsx`:68 | `color="var(--colors-primary-500)"`のハードコードCSS変数 | `styles.ts`に移動 |

## 良い点

- **楽観的更新の実装**: VoteButtonで`useOptimistic`を1オブジェクトにまとめ、hasVotedとvoteCountの整合性を確保している。要件定義書のベストプラクティスに忠実
- **権限管理**: deleteFeedbackとupdateFeedbackで投稿者チェック + ステータスチェックの2段階検証を実装。TRIAGED→NEW自動リセットも要件通り
- **レート制限**: DBカウント方式でCloudflare Pagesのステートレス環境に適合。MODERATOR除外も適切
- **型設計**: `interface.ts`でSupabase生成型（`FeedbackRow`, `UserRow`等）からPick/Intersectionで導出しており、Single Source of Truth原則に忠実
- **コンポーネント分離**: 一覧・詳細の各セクション（投票、コメント、管理者、アクション）が明確に分離されており、保守性が高い
- **アクセシビリティ**: VoteButtonの`aria-pressed`、`aria-live="polite"`による投票状態の適切な表現

## 総合所見

フィードバック機能の基盤として堅実な実装。adapter/action/componentの3層分離、楽観的更新、権限管理、レート制限など主要な要素が要件通りに実装されている。

必須指摘はなし（APIキー露出は対策済み）。推奨指摘のうち優先度が高いのはAdminSectionの2点（React Hook Form未使用 + 保存結果の未処理）。これらはユーザー体験と規約準拠に直結する。actions.tsのResult型不整合は既存コードとの一貫性のため早期の統一が望ましい。テストについては、スキーマレベルのバリデーションテストを非スキップで追加することで、最小限のカバレッジを確保することを推奨する。
