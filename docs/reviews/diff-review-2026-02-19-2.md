# コード差分レビュー

> **レビュー日時**: 2026-02-19
> **対象範囲**: HEAD (b550ca7) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 10 files (+214/-4)
> **総合評価**: B
> **レビューモード**: パラレル（3エージェント）

## 変更サマリー

セッション募集フォームの参加者セクション（Batch 2）を実装。ユーザー検索Server Action、参加者管理コンポーネント（MemberSearchInput / MemberListItem）、招待メンバーの一括DB登録、Zodスキーマ拡張、テスト追加を含む。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `src/app/(main)/sessions/new/schema.ts` | +14 | -1 | 変更 |
| `src/app/(main)/sessions/new/actions.ts` | +48 | -0 | 変更 |
| `src/app/(main)/sessions/new/adapter.ts` | +35 | -0 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.tsx` | +70 | -1 | 変更 |
| `src/app/(main)/sessions/new/_components/styles.ts` | +13 | -0 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.test.tsx` | +27 | -0 | 変更 |
| `src/app/(main)/sessions/new/__tests__/adapter.test.ts` | +11 | -0 | 変更 |
| `src/app/(main)/sessions/new/_components/MemberSearchInput.tsx` | +144 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/MemberListItem.tsx` | +75 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/memberStyles.ts` | +125 | -0 | 新規 |

## 評価詳細

### 1. コーディング規約準拠 WARN

命名規則、アイコン使用（`@phosphor-icons/react/ssr`）、コメント言語（日本語）、`any`禁止、`console.log`禁止、エクスポート形式は全ファイルで規約遵守。ただし `memberStyles.ts` の新規コードで `gray.50` がセマンティックトークンを使わずハードコードされている（2箇所）。

### 2. 設計・保守性 OK

Result型パターン、`isNil`使用、1ファイル1コンポーネント、Zod `z.input`/`z.infer` の使い分け等、既存パターンとの整合性が確保されている。`useFieldArray` + `useState<Map>` による二重管理はシリアライズの都合上妥当な設計判断。エラー時のクリーンアップ処理も適切に実装。

### 3. セキュリティ WARN

認証チェック必須、Zodバリデーション（クライアント+サーバー二重）、ILIKE `%`/`_` エスケープ、ユーザー列挙攻撃対策（2文字未満ガード）が適切に実装されている。ただし `.or()` に渡すフィルタ文字列で PostgREST 特殊文字（`,`, `(`, `)`）がエスケープされていない点に改善余地。

### 4. パフォーマンス WARN

デバウンス（300ms）+ `useTransition` の組み合わせ、`useCallback`、Supabase クエリの `select` フィールド制限と `.limit(10)` など適切な最適化が施されている。ただし `excludeUserIds` のインライン配列生成で `useCallback` が毎回再生成される可能性がある。

### 5. UX・アクセシビリティ WARN

`aria-label`、`aria-live`、`aria-hidden`、セマンティックHTML（`<section>` + `<h2>` + `<hr>`）、空状態メッセージの提供、削除ボタンのコンテキスト付きラベルなど多くの良い実装。ただし combobox パターンのARIA実装に2件の必須修正あり（`aria-controls` 未指定、`option`/`button` の不正なネスト構造）。

### 6. バグ・ロジックエラー WARN

重複追加防止（`fields.some`）、`handleMemberRemove` のローカル変数保持、ガード条件の適切さは確認済み。ただし `invitedMembers[].userId` のULID形式チェックが欠如しており、`scenarioId` との一貫性が取れていない。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | UX・アクセシビリティ | MemberSearchInput.tsx:96-98 | `role="combobox"` に `aria-controls` が未指定。WCAG 4.1.2 / ARIA 1.2 combobox パターン違反 | listbox の div に `id="member-search-listbox"` を付与し、Input に `aria-controls="member-search-listbox"` を追加 |
| 2 | UX・アクセシビリティ | MemberSearchInput.tsx:110-138 | `role="option"` の div 内に `button` が入れ子になっており ARIA 仕様違反。キーボードナビゲーション（WCAG 2.1.1）が機能しない | `role="option"` の外側 div を除去し、button 自体に `role="option"` と `aria-selected={false}` を付与する |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 3 | セキュリティ | actions.ts:125 | `.or()` に渡すフィルタ文字列で PostgREST 特殊文字（`,`, `(`, `)`）がエスケープされていない。フィルタ条件が変形する可能性 | `query` のクリーニングを強化し、PostgREST フィルタ記法の特殊文字も除去する |
| 4 | バグ・ロジックエラー | schema.ts:79 | `invitedMembers[].userId` が `z.string()` のみでULID形式チェックなし。`scenarioId` にはパターンチェックがあるのに一貫性が欠けている | `userId: z.string().regex(ulidPattern, 'ユーザーIDの形式が正しくありません')` に変更 |
| 5 | コーディング規約準拠 | memberStyles.ts:59 | `_hover: { bg: 'gray.50' }` がセマンティックトークンを使わずハードコード | `semanticTokens.ts` に適切なトークンを定義して参照する |
| 6 | コーディング規約準拠 | memberStyles.ts:89 | `bg: 'gray.50'` がセマンティックトークンを使わずハードコード | finding #5 と同様にセマンティックトークンで参照する |
| 7 | パフォーマンス | SessionForm.tsx:194 | `excludeUserIds={fields.map((f) => f.userId)}` がインライン評価され毎レンダリングで新配列が生成される | `const excludeUserIds = useMemo(() => fields.map((f) => f.userId), [fields])` でメモ化 |
| 8 | UX・アクセシビリティ | MemberSearchInput.tsx:101-106 | ローディング中スピナーが `aria-hidden="true"` のみでスクリーンリーダーへの通知がない | Input に `aria-busy={isPending}` を追加するか、`role="status"` のライブリージョンで通知 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 9 | セキュリティ | actions.ts:116 | `searchUsersAction` の `query` に最大文字数のガードがない | `if (query.length > 100) { return ok([]) }` 等の上限チェックを追加 |
| 10 | 設計・保守性 | memberStyles.ts:1-124 | 2コンポーネント（MemberSearchInput / MemberListItem）のスタイルが1ファイルに混在 | 将来的に各コンポーネント固有のスタイルファイルへ分割を検討 |

## 良い点

- デバウンス（300ms）と `useTransition` を組み合わせた検索実装により、Server Action の過剰呼び出しを防ぎつつ UI ブロックを回避
- `searchUsersAction` で認証チェックを必須とし、コメントでセキュリティ意図を明示
- `%` と `_` の ILIKE エスケープを実装しており、基本的なパターンインジェクション対策が施されている
- `createSessionAction` でクライアント入力に対してサーバー側でも Zod バリデーションを再実行（二重バリデーション）
- `adapter.ts` で招待メンバー追加失敗時に作成済みセッションと参加者をクリーンアップするロールバック処理が実装されている
- Zod スキーマで `z.input` と `z.infer` を適切に使い分けており Single Source of Truth 原則に準拠
- `@phosphor-icons/react/ssr` のSSR安全なインポートパスを全コンポーネントで統一使用
- 削除ボタンに `aria-label={`${user.nickname}を削除`}` でコンテキスト付きのアクセシブルなラベルが付与されている
- `<section>` + `<h2>` + `<hr>` によるセマンティックな構造化と空状態メッセージの提供

## 総合所見

Batch 2（参加者セクション）は設計・セキュリティ・パフォーマンスの各面で高品質な実装。特にServer Actionの二重バリデーション、デバウンス検索、ロールバック処理は適切に実装されている。必須修正2件はcomboboxパターンのARIA属性に関するもので、`aria-controls` の追加と `option`/`button` のネスト構造修正で対応可能。推奨指摘もセマンティックトークン化やバリデーション強化など、品質向上に寄与する改善点。
