# コード差分レビュー

> **レビュー日時**: 2026-02-16
> **対象範囲**: HEAD (`91e112a`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 40 files（10 changed + 30 new）
> **総合評価**: **B**
>
> **反映ステータス**: 反映済み（2026-02-16）
> **反映内容**: 必須 3件 + 推奨 9件 + 検討 0件

## 変更サマリー

フィードバック管理システムの一覧ページ（`/feedback`）と詳細ページ（`/feedback/[id]`）の新規実装。投票・コメント・管理者設定機能を含む。加えて既存のFeedbackModal/SpeedDialFABの拡張、要件定義書・UIデザインシステムの更新、Supabase型定義への`comment_count`追加。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `.claude/requirements/requirements-feedback.md` | +167 | -113 | 変更 |
| `.claude/requirements/requirements-session-flow.md` | +152 | -63 | 変更 |
| `.serena/memories/ui-design-system.md` | +134 | -50 | 変更 |
| `.vscode/settings.json` | +0 | -1 | 変更 |
| `src/components/blocks/FeedbackModal/FeedbackModal.tsx` | +180 | -82 | 変更 |
| `src/components/blocks/FeedbackModal/__tests__/actions.test.ts` | +102 | -88 | 変更 |
| `src/components/blocks/FeedbackModal/actions.ts` | +51 | +0 | 変更 |
| `src/components/blocks/SpeedDialFAB/SpeedDialFAB.test.tsx` | +4 | -3 | 変更 |
| `src/components/blocks/SpeedDialFAB/SpeedDialPanel.tsx` | +10 | +0 | 変更 |
| `src/db/types.ts` | +3 | +0 | 変更 |
| `src/app/(main)/feedback/page.tsx` | +67 | - | 新規 |
| `src/app/(main)/feedback/actions.ts` | +183 | - | 新規 |
| `src/app/(main)/feedback/adapter.ts` | +503 | - | 新規 |
| `src/app/(main)/feedback/interface.ts` | +53 | - | 新規 |
| `src/app/(main)/feedback/helpers.ts` | +15 | - | 新規 |
| `src/app/(main)/feedback/searchParams.ts` | +87 | - | 新規 |
| `src/app/(main)/feedback/styles.ts` | - | - | 新規 |
| `src/app/(main)/feedback/_components/` | - | - | 新規 (6 files + stories) |
| `src/app/(main)/feedback/[id]/page.tsx` | +96 | - | 新規 |
| `src/app/(main)/feedback/[id]/schema.ts` | - | - | 新規 |
| `src/app/(main)/feedback/[id]/styles.ts` | +539 | - | 新規 |
| `src/app/(main)/feedback/[id]/_components/` | - | - | 新規 (5 files + stories) |
| `src/app/api/feedback/search/route.ts` | +88 | - | 新規 |

## 評価詳細

### 1. コーディング規約準拠 WARN

- Result型パターン、`isNil`、`@phosphor-icons/react/ssr`、スタイル分離（`styles.ts`）、React Hook Form + Zodなど主要なパターンは正しく適用されている
- ただし `adapter.ts` で `as Record<string, unknown>` → `as FeedbackWithUser` のような段階的型アサーションが多用されている（型安全性が低下）
- Client Component 内の `getAppLogger` 呼び出しが問題（後述）

### 2. 設計・保守性 WARN

- ページ構造、ファイル分離は規約どおり
- FeedbackModal の成功/リセット/クローズ処理がedit/createで重複
- 詳細ページのVote処理がVoteButtonコンポーネントのロジックを再実装している
- `adapter.ts:getFeedbackById` の4連続クエリが最適化可能

### 3. セキュリティ WARN

- 認証チェック、レート制限、権限チェックは適切
- ただし `updateStatusAction` の `status` パラメータがenum検証されておらず、任意文字列をDBに渡せる
- API route の `statuses` パラメータも同様に未検証

### 4. パフォーマンス OK

- SSRでの初期データ取得、バッチ投票チェック（N+1回避）は適切
- `getFeedbackById` は `Promise.all` で並列化可能だが、現状でも許容範囲

### 5. UX・アクセシビリティ WARN

- 投票ボタンの `aria-pressed`、`aria-live="polite"` は優秀
- 検索入力に `aria-label` がない
- AdminSection の優先度ピルに radio セマンティクスがない
- コメントソートタブに tab ロールがない

### 6. バグ・ロジックエラー WARN

- `[id]/page.tsx:38` に冗長な `if (authUser)` チェック
- Client Component の `useEffect` 内 fetch エラーがユーザーに表示されない（サイレント失敗）
- FeedbackContent の `useState(initialResult)` は Server Component の revalidation で更新されない

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | セキュリティ | `feedback/actions.ts:104` | `updateStatusAction` の `status` パラメータが enum 検証されていない。任意の文字列をDBに渡せる | Zod で `z.enum([...])` またはランタイム検証を追加 |
| 2 | セキュリティ | `api/feedback/search/route.ts:37` | `statuses` パラメータが有効な enum 値かバリデーションされていない | 有効な FeedbackStatus 値のホワイトリストでフィルタ |
| 3 | バグ | `feedback/_components/FeedbackContent.tsx:126,168` | Client Component 内で `getAppLogger()` を使用しているが、LogTape はサーバー側でのみ初期化される。クライアント側ではログが一切出力されず、デバッグ不能 | クライアント側は `console.error` を許容するか、クライアント対応のログユーティリティを用意する |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 4 | 設計 | `FeedbackModal.tsx:130-172` | edit/create の成功時処理（`setIsSubmitted`, `reset`, `setTimeout`, `onOpenChange`）が完全に重複 | 共通のヘルパー関数に抽出 |
| 5 | 設計 | `FeedbackDetailContent.tsx:31-47` | VoteButton と同じ楽観的更新ロジックを再実装。投票ロジックの変更時に2箇所の修正が必要 | VoteButton を大サイズバリアント対応にして再利用、またはカスタムhookに抽出 |
| 6 | パフォーマンス | `adapter.ts:181-207` | `getFeedbackById` で comments, votes, mergedCount の3クエリが直列実行 | `Promise.all` で並列化 |
| 7 | a11y | `FeedbackContent.tsx:233` | 検索入力フィールドに `aria-label` がない。プレースホルダーだけではスクリーンリーダーに不十分 | `aria-label="フィードバックを検索"` を追加 |
| 8 | a11y | `AdminSection.tsx:109-122` | 優先度ピルが `role="radiogroup"` / `role="radio"` + `aria-checked` なしで、スクリーンリーダーでは単なるボタンの列に見える | ARIA radio パターンを適用 |
| 9 | バグ | `[id]/page.tsx:30,38,45` | (a) `!authUser` を `isNil` でなく直接比較（規約違反、`isNil` は import 済み）。(b) L38 の `if (authUser)` が冗長（L31 で redirect 済み）。(c) L45 の `if (user)` も `isNil` を使うべき | `isNil` を使用し、冗長チェックを削除 |
| 10 | UX | `FeedbackContent.tsx:119-127` | フィルタ変更時の fetch エラーがユーザーに通知されない（サイレント失敗） | エラー時にトースト表示または「取得に失敗しました」メッセージを表示 |
| 11 | テスト | `__tests__/adapter.test.ts` | DB接続失敗時に `expect(true).toBe(true)` でテストをパスさせている。実際のDBエラーをマスクする危険なパターン | `it.skipIf()` / `describe.skipIf()` で環境変数チェック方式に変更 |
| 12 | テスト | `_components/_mocks.ts:112-167` | `mockFeedbackList` 内で `feedbackId` が重複（`01JFEEDBACK0002`等）。Storybook で React key 警告が発生する | ユニークなIDに修正 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 13 | 規約 | `adapter.ts:28-55` | `camelCaseKeys(row) as FeedbackWithUser` のような段階的型アサーションが多い。型安全性が低下 | Supabase の型推論を活かしたマッピング関数に改善 |
| 14 | a11y | `CommentSection.tsx:77-97` | ソートタブに `role="tablist"` / `role="tab"` + `aria-selected` がない | タブパターンを適用 |
| 15 | 設計 | `FeedbackContent.tsx:99` | `useState(initialResult)` は revalidation 後も初期値のまま更新されない | `key` prop でリセットするか、`useEffect` で `initialResult` 変更を検知 |
| 16 | スタイル | `[id]/_components/styles.ts:195` | `mergedInfo_count` が `border: '[1px solid]'` を使用。UI原則はボーダーレス | shadow で代替可能か検討（情報ボックスとしてのborderは許容範囲内） |
| 17 | 規約 | `_components/styles.ts:133,184` | `fontSize: '[13px]'`, `fontSize: '[18px]'` 等のハードコードされたピクセル値。PandaCSSトークン（`xs`, `lg` 等）を使用すべき | トークンに置換 |
| 18 | セキュリティ | `[id]/schema.ts:20-21` | `adminSectionSchema` の `status` が `z.string().min(1)` で任意文字列を受け入れる。`z.enum()` で制限すべき | `z.enum(['NEW', 'TRIAGED', ...])` に変更 |

## 良い点

- **Result型の一貫した使用**: adapter → actions → UI まで一貫してResult型パターンが適用されており、エラーハンドリングが型安全
- **楽観的更新の実装**: VoteButton で `useOptimistic` を使った楽観的更新が要件定義どおりに実装されている
- **レート制限**: DBカウント方式でCloudflare Pages のステートレス環境に適したレート制限が実装されている
- **テストの改善**: 旧テスト（スキップだらけ、定数をアサートするだけの意味のないテスト）を、実際にZodスキーマを検証する実質的なテストに書き換えた
- **nuqs による URL 状態管理**: フィルタ・ソートがURLに反映され、ブックマーク・共有が可能
- **SQL インジェクション対策**: テキスト検索でワイルドカード文字をエスケープ済み
- **認証・権限チェック**: 全Server Action で認証確認、MODERATOR権限チェック、投稿者本人チェックが適切

## 総合所見

フィードバック管理システムの主要機能（一覧・詳細・投票・コメント・管理者設定）が要件定義に沿って実装されている。設計パターン・コーディング規約への準拠度は高い。

**マージに必要な修正は3点**:
1. `updateStatusAction` の status パラメータの enum 検証（セキュリティ）
2. API route の statuses パラメータのバリデーション（セキュリティ）
3. Client Component 内の LogTape 使用問題の解消（バグ）

これらを修正すればマージ可能。推奨事項（#4-#10）は次のイテレーションで対応しても問題ない。
