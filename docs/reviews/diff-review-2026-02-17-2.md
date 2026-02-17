# コード差分レビュー

> **レビュー日時**: 2026-02-17
> **対象範囲**: HEAD (`91e112a`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 60 files（tracked 21 + untracked 39）
> **総合評価**: **B**
>
> **反映ステータス**: 反映済み（2026-02-17）
> **反映内容**: 必須 3件 + 推奨 4件 + 検討 3件（全10件）

## 変更サマリー

フィードバック機能の完全な新規実装（一覧・詳細・投票・コメント・管理者設定）と、既存のFeedbackModal/SpeedDialFABの拡張、Storybookの背景色統一、UIデザインシステムのカラーパレット更新、要件定義書の大幅改訂を含む大規模変更。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `.storybook/preview.ts` | +8 | 0 | 変更 |
| `.vscode/settings.json` | 0 | -1 | 変更 |
| `src/app/(main)/home/_components/*.stories.tsx` (6件) | 0 | -24 | 変更 |
| `src/app/(main)/scenarios/[id]/_components/*.stories.tsx` (3件) | 0 | -12 | 変更 |
| `src/components/blocks/FeedbackModal/FeedbackModal.tsx` | +265 | -100 | 変更 |
| `src/components/blocks/FeedbackModal/__tests__/actions.test.ts` | +170 | -158 | 変更 |
| `src/components/blocks/FeedbackModal/actions.ts` | +51 | 0 | 変更 |
| `src/components/blocks/SpeedDialFAB/SpeedDialFAB.test.tsx` | +4 | -3 | 変更 |
| `src/components/blocks/SpeedDialFAB/SpeedDialPanel.tsx` | +10 | 0 | 変更 |
| `src/db/types.ts` | +3 | 0 | 変更 |
| `src/styles/semanticTokens.ts` | +1 | -1 | 変更 |
| `.claude/requirements/requirements-feedback.md` | +187 | -93 | 変更 |
| `.claude/requirements/requirements-session-flow.md` | +140 | -75 | 変更 |
| `.serena/memories/ui-design-system.md` | +120 | -64 | 変更 |
| `src/app/(main)/feedback/**/*` (28件) | 全量新規 | 0 | 新規 |
| `src/app/api/feedback/search/route.ts` | 全量新規 | 0 | 新規 |
| `src/hooks/useDebouncedValue.ts` | 全量新規 | 0 | 新規 |
| `e2e/auth/feedback*.spec.ts` (2件) | 全量新規 | 0 | 新規 |
| `e2e/pages/feedback*-page.ts` (2件) | 全量新規 | 0 | 新規 |

## 評価詳細

### 1. コーディング規約準拠 WARN

**レイヤー間の依存方向違反が1件あり。** その他は全体的に規約準拠。

- 命名規則: PascalCase コンポーネント、camelCase 関数、styles.ts 分離すべて遵守
- Import順序: Biome自動整理済み
- LogTape使用: server-side では `getAppLogger` を正しく使用
- エクスポート形式: `export const` を一貫して使用
- セマンティックHTML: `<section>`, `<article>`, `<hr>`, `<h2>` を適切に使用

### 2. 設計・保守性 WARN

アーキテクチャ全体は堅実だが、共有コンポーネントからページ固有コードへの逆依存がある。

- **adapter → actions → components の責務分離は明確**
- Result型パターン、isNil チェック一貫して使用
- 型安全: Supabase生成型からの導出、Zodスキーマからの `z.infer`
- nuqs による URL 状態管理が適切

### 3. セキュリティ WARN

- ilike 検索のエスケープは適切（PostgREST構文文字含む）
- 認証チェックは全 Server Action / API Route で実施
- MODERATOR 権限チェックは `updateStatusAction` で適切
- **ただしコメント投稿の Server Action にサーバーサイドバリデーションが不足**

### 4. パフォーマンス OK

- `Promise.all` による並列 DB クエリ（getFeedbackById）
- デバウンス済み検索（400ms）
- AbortController によるリクエストキャンセル
- 投票済みフラグの一括取得（N+1回避）
- `useCallback` / `useMemo` の適切な使用

### 5. UX・アクセシビリティ WARN

- VoteButton: `aria-pressed`, `aria-label`, `aria-live="polite"` で優秀
- CommentSection: `aria-labelledby` 使用
- AdminSection: `role="radiogroup"` + `aria-label`
- エラー状態: `role="alert"` で通知
- **カテゴリフィルタチップに `aria-pressed` が不足**

### 6. バグ・ロジックエラー WARN

- 投票の楽観的更新は `useOptimistic` で正しく実装
- TRIAGED で編集時の NEW リセットロジックは要件通り
- 削除は NEW 時のみ、編集は NEW/TRIAGED のみ — 要件通り
- **コメント内容がサーバーサイドで未検証**

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | セキュリティ | `src/app/(main)/feedback/actions.ts:69-101` | `createCommentAction` で `content` パラメータのサーバーサイドバリデーションが欠如。クライアントサイドの Zod バリデーションはバイパス可能。空文字列や 1000 文字超の入力がそのまま DB に保存される | `commentFormSchema.parse(content)` または最低限 `content.trim()` の長さチェック（1-1000文字）をサーバーサイドで実施 |
| 2 | 設計 | `src/components/blocks/FeedbackModal/FeedbackModal.tsx:23` | 共有コンポーネント（`components/blocks/`）からページ固有コード（`app/(main)/feedback/actions`）への逆依存。`checkRateLimitAction` のインポートがレイヤー分離に違反 | (a) `checkRateLimitAction` を `FeedbackModal/actions.ts` に移動、または (b) レート制限チェックを `onBeforeOpen` コールバック prop として外部から注入 |
| 3 | 設計 | `src/components/blocks/FeedbackModal/actions.ts:7` | `updateFeedbackAction` が `app/(main)/feedback/adapter` から `updateFeedback` をインポート。#2 と同じレイヤー違反 | `updateFeedback` のロジックを `FeedbackModal/actions.ts` 内に直接実装するか、共通の adapter 層に切り出す |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 4 | セキュリティ | `src/app/(main)/feedback/actions.ts:46-63` | `toggleVoteAction` / `createCommentAction` 等で `feedbackId` のフォーマット検証がない。不正な文字列が DB クエリに渡される | ULID フォーマット（26文字英数字）のバリデーションを追加。共通ヘルパー `validateUlid(id)` を作成推奨 |
| 5 | a11y | `src/app/(main)/feedback/_components/FeedbackContent.tsx:194-207` | カテゴリフィルタのチップボタンに `aria-pressed` がない。スクリーンリーダーで選択状態が識別できない | `<button aria-pressed={!mine && category === opt.value}>` を追加 |
| 6 | バグ | `src/components/blocks/FeedbackModal/FeedbackModal.tsx:130-135` | `handleSuccess` の `setTimeout` がコンポーネントアンマウント時にクリアされない。React 18+ では実害は少ないが、クリーンアップ漏れ | `useRef` でタイマーIDを保持し、`useEffect` の cleanup または `handleClose` でクリア |
| 7 | UX | `src/app/(main)/feedback/[id]/_components/AdminSection.tsx:148-153` | 運営メモの Textarea に文字数制限の視覚的表示がない（スキーマでは max 2000） | `maxLength={2000}` を Textarea に追加、または残り文字数カウンターを表示 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 8 | 設計 | `src/app/(main)/feedback/_components/FeedbackContent.tsx:129` | Client Component で `getAppLogger` を使用しているが、LogTape はサーバーサイドのみで初期化される（`instrumentation.ts`）。クライアントではログ出力が無効 | クライアントのエラーログが不要なら問題なし。必要なら `console.error` を許容するか、クライアント用ログシンクを設定 |
| 9 | パフォーマンス | `src/app/(main)/feedback/_components/FeedbackContent.tsx:148-177` | `handleLoadMore` に AbortController がない。ボタンの `loading` state で二重クリックは防止されているが、コンポーネントアンマウント時のリクエストキャンセルがない | AbortController を `useRef` で保持し、アンマウント時に abort |
| 10 | UX | `src/app/(main)/feedback/[id]/_components/CommentSection.tsx:56-66` | コメント投稿後、一覧は `revalidatePath` による RSC 再レンダリングまで更新されない（楽観的更新なし） | 投票と同様に楽観的更新を導入するか、フォームリセット時にローカルステートに追加 |

## 良い点

- **adapter → actions → components の三層構造**が一貫しており、責務が明確に分離されている
- **投票の楽観的更新**が `useOptimistic` で正しく実装され、即座にUIに反映される
- **レート制限**を DB カウント方式で実装し、Cloudflare Pages のステートレス環境でも正しく動作する設計
- **PostgREST ilike のエスケープ**が `%`, `_`, `\`, `"` すべてをカバーしており堅牢
- **VoteButton の a11y** が優秀: `aria-pressed`, `aria-label`（状態に応じて変化）, `aria-live="polite"` の3点セット
- **E2E テスト**が投票のオプティミスティック更新、カウント非負保証、aria-pressed 状態変化まで検証
- **Storybook の背景色統一**: 各ストーリーの個別定義をグローバル `preview.ts` に集約し、デザインシステムの `#f6f8f7` と一致させた
- **テストのリファクタリング**: FeedbackModal のテストをスキップだらけのモック検証から、実際に Zod スキーマをパースする実質的な単体テストに刷新
- **`getFeedbackById` の `Promise.all`**: コメント・投票済みフラグ・マージ元カウントを並列取得し、3つの直列 DB クエリを1往復に圧縮
- **要件定義書とUIデザインシステムの同期更新**: 実装と合わせてドキュメントも最新化されている

## 総合所見

フィードバック機能の新規実装として完成度が高く、既存プロジェクトのパターン（Result型、LogTape、PandaCSS、nuqs、楽観的更新）を正しく踏襲している。

**最優先の改善点**は (1) コメント投稿のサーバーサイドバリデーション追加、(2) 共有コンポーネントからページ固有コードへの逆依存の解消。特に #1 はセキュリティに直結するため、マージ前に対応すべき。

#2, #3 の依存方向は機能的には動作するが、将来の保守性（フィードバック機能の削除や移動時に影響）を考慮すると早期に対応したい。

全体としてはB評価で、必須3件を修正すればマージ可能。
