# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-17）
> **反映内容**: 必須 4件（#2,#3,#4,#5） + 推奨 8件（#6-#8,#10-#14） + 検討 8件（#15-#22）

> **レビュー日時**: 2026-02-17
> **対象範囲**: HEAD (`91e112a`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 61 files（tracked: 21, untracked: 40）
> **総合評価**: B

## 変更サマリー

フィードバック管理機能の大規模実装。一覧ページ・詳細ページ・投票・コメント・管理者設定を含む完全なCRUD機能に加え、FeedbackModal の編集モード対応、SpeedDialFAB へのメニュー追加、Storybook 背景色のグローバル化など周辺改善を実施。E2E テスト・Storybook ストーリー・ユニットテストも新規追加。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `src/app/(main)/feedback/page.tsx` | +77 | - | 新規 |
| `src/app/(main)/feedback/adapter.ts` | +500 | - | 新規 |
| `src/app/(main)/feedback/actions.ts` | +221 | - | 新規 |
| `src/app/(main)/feedback/interface.ts` | +53 | - | 新規 |
| `src/app/(main)/feedback/searchParams.ts` | +87 | - | 新規 |
| `src/app/(main)/feedback/helpers.ts` | +16 | - | 新規 |
| `src/app/(main)/feedback/styles.ts` | +17 | - | 新規 |
| `src/app/(main)/feedback/_components/*.tsx` | +450 | - | 新規 |
| `src/app/(main)/feedback/_components/styles.ts` | +393 | - | 新規 |
| `src/app/(main)/feedback/[id]/page.tsx` | +99 | - | 新規 |
| `src/app/(main)/feedback/[id]/_components/*.tsx` | +700 | - | 新規 |
| `src/app/(main)/feedback/[id]/_components/styles.ts` | +571 | - | 新規 |
| `src/app/(main)/feedback/[id]/schema.ts` | +20 | - | 新規 |
| `src/app/(main)/feedback/hooks/useVoteToggle.ts` | +35 | - | 新規 |
| `src/app/api/feedback/search/route.ts` | +93 | - | 新規 |
| `src/hooks/useDebouncedValue.ts` | +22 | - | 新規 |
| `src/lib/validateUlid.ts` | +6 | - | 新規 |
| `src/components/blocks/FeedbackModal/FeedbackModal.tsx` | +271 | -113 | 変更 |
| `src/components/blocks/FeedbackModal/actions.ts` | +154 | -43 | 変更 |
| `src/components/blocks/FeedbackModal/__tests__/actions.test.ts` | +258 | -108 | 変更 |
| `src/components/blocks/SpeedDialFAB/SpeedDialPanel.tsx` | +10 | - | 変更 |
| `src/components/blocks/SpeedDialFAB/SpeedDialFAB.test.tsx` | +7 | -4 | 変更 |
| `src/db/types.ts` | +3 | - | 変更 |
| `src/styles/semanticTokens.ts` | +1 | -1 | 変更 |
| `.storybook/preview.ts` | +8 | - | 変更 |
| `*.stories.tsx`（9ファイル） | - | -36 | 変更 |
| `e2e/auth/feedback*.spec.ts` | +200 | - | 新規 |
| `e2e/pages/feedback*-page.ts` | +100 | - | 新規 |
| `*.stories.tsx`（新規9ファイル） | +500 | - | 新規 |

## 評価詳細

### 1. コーディング規約準拠 OK

- 命名規則（PascalCase コンポーネント、camelCase 変数、`styles.ts` アンダースコア記法）を遵守
- `@phosphor-icons/react/ssr` からの import が一貫
- LogTape でのロギング（console.log 不使用）
- スタイル分離（`styles.ts`）が徹底
- `isNil` による null/undefined チェック
- `export const` での直接エクスポート
- Biome 準拠（セミコロンなし、シングルクォート）

### 2. 設計・保守性 WARN

全体として adapter → actions → components の3層構造が整理されている。ただし FeedbackModal/actions.ts と feedback/actions.ts の間にレイヤーの不統一がある。

### 3. セキュリティ WARN

- 全 Server Action で認証チェック実施
- ULID バリデーション追加済み
- ステータス・優先度の enum ホワイトリスト検証
- コメントのサーバーサイドバリデーション（trim + 長さ制限）
- レート制限（投稿10件/日、コメント20件/時間）
- `ilike` 検索のワイルドカードエスケープ処理
- **ただし `createFeedbackAction` にサーバーサイドレート制限が未実装（下記 #4）**

### 4. パフォーマンス OK

- `getFeedbackById` の並列クエリ（`Promise.all`）
- `searchFeedbacks` の投票済みフラグ一括取得
- `useDebouncedValue` による検索クエリのデバウンス
- AbortController によるリクエストキャンセル
- 楽観的更新（useOptimistic）

### 5. UX・アクセシビリティ WARN

- `aria-pressed` 属性がカテゴリフィルタ・投票ボタンに適切に設定
- `aria-live="polite"` で投票数の変更を通知
- `role="alert"` でエラーメッセージを通知
- `aria-label` がボタンに設定
- フォーカスリングの `_focusVisible` が全インタラクティブ要素に存在
- ただしカラーコントラストに懸念あり（下記指摘）

### 6. バグ・ロジックエラー WARN

CommentSection の楽観的更新フローに軽微な問題あり。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 5 | `[id]/_components/styles.ts:397-401` | `commentCard_officialBadge` の `bg: 'primary.500'` + `color: 'white'` + `fontSize: '[10px]'` はコントラスト比約3.8:1で WCAG AA 不合格。10px テキストは「大きいテキスト」に該当しない | `bg: 'primary.700'` に変更（コントラスト比7:1以上確保） |
| 2 | 6 | `feedback/[id]/page.tsx:25` | URL パラメータ `id` に ULID バリデーションがない。不正な値で無駄な DB 問い合わせが発生する | `isValidUlid(id)` チェックを追加し、不正なら `notFound()` |
| 3 | 2 | `FeedbackModal/actions.ts:97-178` | `updateFeedbackAction` が adapter.ts の `updateFeedback` と完全に重複したロジック（所有者チェック・ステータス制限・TRIAGED→NEWリセット）をインラインで持つ | adapter の `updateFeedback` を呼ぶか、共通ヘルパーに抽出する。現状では一方のバグ修正が他方に反映されないリスクがある |
| 4 | 3 | `FeedbackModal/actions.ts:38-92` | `createFeedbackAction` にサーバーサイドのレート制限チェックがない。UI側の `useEffect` で `checkRateLimitAction` を呼んでいるが、これはUXガードに過ぎず、Server Action を直接呼び出されるとバイパス可能 | `createFeedbackAction` の冒頭でレート制限チェックを追加する |
| 5 | 6 | `hooks/useVoteToggle.ts:27-31` | `toggleVoteAction` の `Result` 戻り値が無視されている。サーバー失敗時（ネットワークエラー、認証切れ等）に楽観的更新がロールバックされず、UIの投票状態とDBが不整合になる | `result.success` をチェックし、失敗時にエラー通知を表示する |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 6 | 5 | `_components/styles.ts:289` | `card_description` の `color: 'gray.500'` + `fontSize: 'sm'` は白背景に対してコントラスト比約4.48:1で WCAG AA の4.5:1基準にギリギリ不合格の可能性 | `color: 'gray.600'` に変更（メモリの推奨に合致） |
| 7 | 5 | `_components/styles.ts:179` | `listEmptySubtext` の `color: 'gray.500'` も同様のコントラスト懸念 | `color: 'gray.600'` に変更 |
| 8 | 5 | `FeedbackModal/FeedbackModal.tsx:223-233` | レート制限・送信成功メッセージの `<div>` に `role="status"` / `aria-live="polite"` がない。フォーム→メッセージの動的切り替えがスクリーンリーダーに通知されない | メッセージコンテナに `role="status"` を追加 |
| 9 | 6 | `FeedbackModal/actions.ts:134-165` | `updateFeedbackAction` の所有者チェック（select）と更新（update）が別クエリで TOCTOU 競合の可能性。ステータスリセット `TRIAGED→NEW` が特に敏感 | 条件付き UPDATE（`.eq('user_id', ...).in('status', ['NEW','TRIAGED'])`）で1クエリに統合 |
| 10 | 1 | `actions.ts:104,139,206` 等 | ロール判定に `'MODERATOR'` 文字列リテラルがハードコード。`Roles.MODERATOR.value` を使用すべき | `@/db/enum` の `Roles` 定数を使用 |
| 11 | 5 | `VoteButton.tsx:45,61` | `aria-live="polite"` が `<button>` の**内側**の `<span>` にあり、投票数更新時にボタンラベル全体が再読み上げされる可能性 | 投票数表示を `<button>` の外側に移動するか、`aria-atomic="true"` を追加 |
| 12 | 2 | `feedback/page.tsx:48` | 変数名 `searchParams2` が意味不明。命名が不適切 | `feedbackSearchParams` など意味のある名前に変更 |
| 13 | 2 | `adapter.ts:29-60` | `toFeedbackWithUser`, `toCommentWithUser`, `toFeedbackDetail` の全てで `as unknown as` ダブルキャスト。型安全性がゼロ | Supabase クエリの戻り値型を明示的に定義するか、Pick/Omit で型を絞り込んだ後にキャストする |
| 14 | 6 | `_components/FeedbackContent.tsx:103-139` | `useEffect` 内の `fetchResults` がフィルタ変更のたびにフルフェッチするが、SSR の初期データ（`initialResult`）を初回表示に活かすタイミングが `useEffect` の初回実行でのフェッチにより上書きされる | 初回マウント時はフェッチをスキップするフラグを追加するか、フィルタ変更時のみフェッチを実行する |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 15 | 2 | `_components/FeedbackCard.tsx:14-22` | `CategoryKey`, `StatusKey` の型が手動定義。DB Enum から導出すれば型の二重管理を防げる | `FeedbackCategories` / `FeedbackStatuses` から union 型を導出 |
| 16 | 2 | `FeedbackModal/actions.ts:183-235` vs `feedback/actions.ts:197-220` | `checkRateLimitAction` が2箇所に存在（一方はDB直接、他方はadapter経由）。MODERATORスキップロジックも重複 | 共通化を検討 |
| 17 | 4 | `_components/FeedbackContent.tsx:79-95` | 5つの個別 `useQueryState` の代わりに `useQueryStates(searchParamsParsers)` を使えば、URL更新が一括で行われパフォーマンス向上 | `useQueryStates` パターンへの移行を検討（`form-rules.md` の推奨パターン） |
| 18 | 2 | `adapter.ts:305-343` | `updateFeedbackStatus` の `updateData` が `Record<string, unknown>` 型で型安全でない | Supabase の `Update` 型を使って型を明示する |
| 19 | 5 | `FeedbackModal/FeedbackModal.tsx:227-232` | リンクテキスト「みんなのフィードバックを見る →」の `→` はスクリーンリーダーで不自然に読み上げられる | Phosphor Icons の `ArrowRight` + `aria-hidden` に置換 |
| 20 | 2 | `FeedbackModal/FeedbackModal.tsx:54-59` | `EditTarget.category` が `string` 型で、`FeedbackFormValues['category']` に毎回 `as` キャストが必要 | 型を `FeedbackFormValues['category']` に絞る |
| 21 | 5 | `FeedbackCard.tsx:78`, `FeedbackDetailContent.tsx:89` | セパレータ `•` が `aria-hidden` なしでスクリーンリーダーに読み上げられる | `<span aria-hidden="true">•</span>` に変更 |
| 22 | 3 | `api/feedback/search/route.ts:35-37` | `category` パラメータが `FeedbackCategories` enum に対するバリデーションなしで受け入れ | `extractValues(FeedbackCategories)` でホワイトリスト検証を追加 |

## 良い点

- **レイヤー分離**: adapter（DB操作）→ actions（認証+バリデーション）→ components（UI）の3層が明確に分離されている
- **楽観的更新**: 投票（`useVoteToggle`）とコメント投稿（`useOptimistic`）で即座のUIフィードバックを提供
- **セキュリティ意識**: 全アクションに認証チェック、ULID バリデーション、レート制限、enum ホワイトリスト検証
- **AbortController**: フィルタ変更時・コンポーネントアンマウント時のリクエストキャンセル
- **アクセシビリティ**: `aria-pressed`, `aria-live`, `role="alert"`, `aria-label` の適切な使用
- **Storybook背景色の一元化**: 各ストーリーからの個別設定を除去し、preview.ts に集約
- **成功タイマーのRefでの管理**: メモリリーク防止のため `useRef` で setTimeout を管理
- **空状態UI**: フィルタあり/なしで異なる空状態メッセージを表示

## 総合所見

フィードバック機能の大規模実装として、全体的にバランスの取れた高品質な実装。必須指摘4件のうち、コントラスト問題（#1）とULIDバリデーション不足（#2）は数行の修正で対応可能。レート制限のサーバーサイド未実装（#4）はセキュリティ上対応必須。ロジック重複（#3）は設計上の判断が絡むため、チーム方針に応じて対応のタイミングを決定すべき。推奨指摘の `initialResult` 上書き問題（#11）はSSRの意図に反する挙動を生む可能性があり、ユーザー体験への影響を検証した上で対応を検討されたい。
