# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-17）
> **反映内容**: 必須 4件 + 推奨 3件 + 検討 3件（#9 Server Actionテストはスキップ）
> **レビュー日時**: 2026-02-17
> **対象範囲**: HEAD (`91e112a`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 59 files（tracked: 21, untracked: 38）
> **総合評価**: **B**

## 変更サマリー

フィードバック機能の大規模実装。一覧ページ（`/feedback`）、詳細ページ（`/feedback/[id]`）、投票・コメント・管理者操作を含む完全なCRUD機能を新規追加。既存のFeedbackModalに編集モード・レート制限を追加し、SpeedDialFABにフィードバック一覧への導線を追加。Storybookの背景色をグローバル設定に統一し、要件定義書・UIデザインシステムメモリも大幅に更新。テストはE2Eテスト・スキーマバリデーションテスト・アダプター統合テストを追加。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `.claude/requirements/requirements-feedback.md` | +190 | -90 | 変更 |
| `.claude/requirements/requirements-session-flow.md` | +155 | -60 | 変更 |
| `.serena/memories/ui-design-system.md` | +130 | -54 | 変更 |
| `.storybook/preview.ts` | +8 | -0 | 変更 |
| `.vscode/settings.json` | +0 | -1 | 変更 |
| `src/components/blocks/FeedbackModal/FeedbackModal.tsx` | +180 | -80 | 変更 |
| `src/components/blocks/FeedbackModal/__tests__/actions.test.ts` | +120 | -138 | 変更 |
| `src/components/blocks/FeedbackModal/actions.ts` | +51 | -0 | 変更 |
| `src/components/blocks/SpeedDialFAB/SpeedDialFAB.test.tsx` | +4 | -3 | 変更 |
| `src/components/blocks/SpeedDialFAB/SpeedDialPanel.tsx` | +10 | -0 | 変更 |
| `src/db/types.ts` | +3 | -0 | 変更 |
| `src/styles/semanticTokens.ts` | +1 | -1 | 変更 |
| 9x `*.stories.tsx` | -36 | -0 | 変更（背景色削除） |
| `src/app/(main)/feedback/**` (24ファイル) | 新規 | - | 新規 |
| `src/app/api/feedback/search/route.ts` | 新規 | - | 新規 |
| `e2e/**` (4ファイル) | 新規 | - | 新規 |

## 評価詳細

### 1. コーディング規約準拠 WARN

- Storiesファイルのグローバル化は良い改善
- 型導出は `db/helpers` のSupabase生成型を活用しておりルールに準拠
- **console.error** が `FeedbackContent.tsx` に2箇所残っている（logging.md違反）
- `as Route` 型キャストが複数箇所にあるが、Next.jsのtypedRoutes制約上やむを得ない

### 2. 設計・保守性 OK

- adapter / actions / hooks の責務分離は明確
- Result型パターンの統一使用
- `isNil` による一貫したnullチェック
- `useVoteToggle` による投票ロジックの共通化は良い設計
- 型定義（interface.ts）がSupabase生成型から正しく導出されている
- `toFeedbackWithUser` 等のマッピング関数で `as` キャストを使用しているが、`camelCaseKeys` の戻り値が `Record<string, unknown>` のため構造的にやむを得ない

### 3. セキュリティ WARN

- 認証チェックは全Server Action・APIルートで実施されている
- MODERATOR権限チェックも適切
- レート制限がDB方式で正しく実装されている
- **ilike検索のフィルタ文字列構築にリスクあり**（後述）

### 4. パフォーマンス WARN

- `Promise.all` による並列DB取得は良い
- 投票済みフラグの一括取得も効率的
- **検索入力にdebounceがない**ため、キー入力ごとにAPIコールが発生する

### 5. UX・アクセシビリティ OK

- `aria-pressed`, `aria-live="polite"`, `aria-label` を正しく使用
- `role="radiogroup"` + `role="radio"` + `aria-checked` で優先度ピルを実装
- FieldErrorコンポーネントによるエラー表示
- コメント件数0の場合の空状態表示あり
- 投票ボタンのsize mdは十分なタップ領域を確保

### 6. バグ・ロジックエラー WARN

- **背景色の不整合**: `semanticTokens.ts` を `#f6f8f7` に変更したが、`ui-design-system.md` は `#f5f8f7` のまま
- `useVoteToggle` の `Math.max(0)` ガードにより投票数が負にならない防御あり（修正済みバグの対策）
- E2Eテストでデータなし時の `test.skip()` は堅牢

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 規約 | `src/app/(main)/feedback/_components/FeedbackContent.tsx:126` | `console.error` 使用（logging.md違反）。`[feedback] Search failed:` | `getAppLogger(['app', 'feedback']).error` に変更 |
| 2 | 規約 | `src/app/(main)/feedback/_components/FeedbackContent.tsx:169` | `console.error` 使用（logging.md違反）。`[feedback] Load more failed:` | 同上 |
| 3 | セキュリティ | `src/app/(main)/feedback/adapter.ts:94-96` | `.or()` フィルタのilike文字列構築で、ユーザー入力にカンマ(`,`)やピリオド(`.`)が含まれるとPostgRESTフィルタ構文が壊れる。`\`, `%`, `_` のみエスケープしており、PostgREST構文上の特殊文字が未対策 | カンマ・ピリオドを含む検索語がある場合の対策を検討。Supabase `.ilike()` を2回呼ぶ構成に変更するか、`.or()` の代わりに `.textSearch()` を使用 |
| 4 | バグ | `src/styles/semanticTokens.ts:8` vs `.serena/memories/ui-design-system.md` | `bg.page` が `#f6f8f7` に変更されたが、`ui-design-system.md` は `#f5f8f7` のまま。設計メモリとトークンの不整合 | `ui-design-system.md` の背景色記述を `#f6f8f7` に更新 |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 5 | パフォーマンス | `src/app/(main)/feedback/_components/FeedbackContent.tsx:222` | 検索入力(`onChange`)にdebounceがなく、キー入力ごとにAPIリクエストが発生。日本語IME入力でも各確定で発火する | `useDebounce` フックを導入し300-500msのdebounceを追加。または `onCompositionEnd` でIME確定時のみ発火 |
| 6 | 設計 | `src/app/(main)/feedback/_components/FeedbackContent.tsx:100-136` | `useEffect` 内で `fetch` を実行しクリーンアップに `AbortController` を使用。依存配列が `[category, q, mine, statuses, sort]` だが、`q` がdebounceなしのため頻繁に発火 | debounce追加と合わせてSWRやReact Query等のデータフェッチライブラリの導入を検討（キャッシュ・再検証・エラーリトライ等） |
| 7 | 型安全 | `src/app/(main)/feedback/adapter.ts:28-55` | `toFeedbackWithUser`, `toCommentWithUser`, `toFeedbackDetail` でSupabase行を `as` キャストしている。`camelCaseKeys` の戻り値が `Record<string, unknown>` のため致し方ないが、フィールド名変更時にランタイムエラーになる | `camelCaseKeys` にジェネリクス型パラメータを追加して型推論を活用するか、マッピング関数内で必要なフィールドを明示的に取り出す |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 8 | テスト | `src/app/(main)/feedback/__tests__/adapter.test.ts` | Result型の `data` アクセス時に型ガード（`result.success` チェック後のナローイング）が不完全な箇所あり。TypeScript型エラーが出る（既知の技術的負債） | `if (!result.success) return;` の後に `result.data` にアクセスするパターンに統一 |
| 9 | テスト | `src/components/blocks/FeedbackModal/__tests__/actions.test.ts` | テストがZodスキーマバリデーションのみで、実質的にServer Actionの単体テストがスキップされている。モック活用によるテスト追加が望ましい | 認証・DBをモック化した単体テストの追加を検討 |
| 10 | a11y | `src/app/(main)/feedback/[id]/_components/CommentSection.tsx:69` | `<section>` に `aria-labelledby` がない。`<h2>` の存在で暗黙的にラベル付けされるが、明示的な紐付けが推奨 | `<h2 id="comment-heading">` + `<section aria-labelledby="comment-heading">` |
| 11 | 設計 | `src/components/blocks/FeedbackModal/FeedbackModal.tsx:72-81` | `editTarget` の変更で `useEffect` によるフォームリセットを実行。`reset` が依存配列に含まれており、RHFの `reset` は参照安定だが、将来の変更で無限ループリスクがある | `editTarget` のみを依存配列にし、`reset` は `useRef` 経由で安定化 |

## 良い点

- **型の導出が正しい**: `interface.ts` で `FeedbackRow`, `FeedbackCommentRow`, `UserRow` からPickで導出しており、Single Source of Truth原則に準拠
- **楽観的更新の共通化**: `useVoteToggle` フックが一覧/詳細の両方で再利用されており、投票ロジックが一箇所に集約
- **レート制限のDBカウント方式**: Cloudflare Pages（ステートレス）環境を考慮したサーバーサイドのレート制限。MODERATORの除外処理も適切
- **`Promise.all` による並列取得**: `getFeedbackById` でコメント・投票済み・マージ元カウントを並列取得
- **Storybookの背景色グローバル化**: 各Stories個別の `backgrounds` パラメータを削除し、`preview.ts` に統一。DRYかつ保守性向上
- **テストの書き直し**: `actions.test.ts` の意味のないモックテストを実際のZodスキーマバリデーションテストに置き換え、テスト品質が大幅に向上
- **E2Eテストの防御的設計**: データ未存在時の `test.skip()` やクリーンアップ（投票後の元戻し）が堅牢
- **要件定義書の実装フィードバック**: 実装で判明した技術的制約（DBトリガー、レート制限方式、ストレージ変更等）を要件定義書に逆反映

## 総合所見

フィードバック機能の初期実装として品質は高く、設計パターンがプロジェクト既存のルールに良く準拠している。必須修正は4件で、いずれも軽微（console.error→LogTape変更、背景色メモリ更新、検索フィルタのエスケープ強化）。検索のdebounce未実装はUX上の影響が大きいため早期対応を推奨する。
