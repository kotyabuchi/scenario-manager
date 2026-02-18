# コード差分レビュー

> **レビュー日時**: 2026-02-19
> **対象範囲**: HEAD (`8b2cfaa`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 7 files
> **総合評価**: B
> **レビューモード**: パラレル（3エージェント）

## 変更サマリー

セッション募集フォーム（`/sessions/new`）のUI基盤リデザイン（Batch 1）。ネイティブHTML要素をArk UIコンポーネント（Input, Textarea, NumberInput, Switch, RadioGroup, FormField）に置き換え、カードベースの4セクション構造に再編成した。スキーマに `scheduleType` UIフィールドを追加し、開催日時の「後で調整」/「日時を指定」ラジオ選択を実装。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `src/app/(main)/sessions/new/_components/SessionForm.tsx` | +198 | -131 | 変更 |
| `src/app/(main)/sessions/new/_components/styles.ts` | +56 | -133 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.test.tsx` | +45 | -32 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.stories.tsx` | +1 | -1 | 変更 |
| `src/app/(main)/sessions/new/schema.ts` | +3 | -0 | 変更 |
| `src/app/(main)/sessions/new/page.tsx` | +1 | -1 | 変更 |
| `src/app/(main)/sessions/new/styles.ts` | +4 | -2 | 変更 |

## 評価詳細

### 1. コーディング規約準拠 WARN

全体的に命名規則・スタイル分離・セマンティックHTML・アイコン使用・型定義は適切。ただしImport順序に違反あり（相対パスが内部モジュールより先に記述）。`styles.ts` で `bg: 'gray.50'` がハードコードされているが、既存コードベース全体の慣行でもあるため consider 扱い。

### 2. 設計・保守性 OK

`SessionForm` と `SessionFormContainer` の責務分離が明確。`z.input` / `z.infer` の使い分け、`Result` 型パターンの適切な使用、1ファイル1コンポーネント、`_components/` 配置など設計上の問題なし。`scheduleType` のノーマライズ処理も `onFormSubmit` に適切に集約されている。

### 3. セキュリティ OK

ページ・Server Action 両レベルでの認証チェック、Zod による入力再バリデーション、`dangerouslySetInnerHTML` 不使用、ハードコードされたシークレットなし。問題は検出されなかった。

### 4. パフォーマンス WARN

Server Component の活用やクライアント境界の分離は適切。ただし `useWatch` と `watch` の混在使用がある（`descriptionValue` は `useWatch`、`scheduleType` は `watch`）。`useWatch` に統一することで一貫性とパフォーマンスが改善される。

### 5. UX・アクセシビリティ WARN

セマンティックHTML（`<form>`, `<section>`, `<h2>`, `<fieldset>`, `<legend>`, `<hr>`）、`aria-live="polite"` 付き文字数カウンター、送信中の三重フィードバック（disabled + loading + loadingText）など全体的に良好。ただし RadioGroup の `_focusVisible` スタイル未定義（WCAG 2.4.7）と `aria-label` の重複が確認された。

### 6. バグ・ロジックエラー WARN

`iso8601Pattern` の正規表現に末尾アンカー `$` がなく、不正な文字列が通過する可能性がある。また `NumberInput min={0}` とスキーマの `.min(1)` が不一致だが、これは Batch 2 Step 2-1 でスキーマ側を `.min(0)` に変更する計画のため、現時点では意図的な不一致。

## 指摘一覧

### 必須（マージ前に修正すべき）

なし

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | コーディング規約準拠 | `SessionForm.tsx:17-22` | Import順序が規約に違反。相対パス（`../schema`, `./styles`）が内部モジュール（`@/components/...`）より前に配置されている | 内部モジュール `@/components/...` のimportブロックを `../schema` と `./styles` より前に移動する |
| 2 | パフォーマンス | `SessionForm.tsx:81` | `watch('scheduleType')` を使用しているが、同一ファイルで `useWatch` も使用中。`watch` はフォーム全体の購読を発生させる可能性があり、`useWatch` に統一すると最適化される | `const scheduleType = useWatch({ name: 'scheduleType', control })` に変更して `watch` のインポートを削除 |
| 3 | バグ・ロジックエラー | `schema.ts:43` | `iso8601Pattern` に末尾アンカー `$` がなく、ISO形式の後ろに任意の文字列を付加した値が検証を通過する | `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/` を `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z\|[+-]\d{2}:\d{2})?$/` に修正 |
| 4 | バグ・ロジックエラー | `SessionForm.tsx:229` | `<NumberInput min={0} />` だがスキーマは `.min(1)` を要求。値0をUIが許可するが送信時にバリデーションエラーになる | Batch 2 Step 2-1 でスキーマ側を `.min(0)` に変更予定のため、現時点では対応保留 |
| 5 | UX・アクセシビリティ | `radio-group/styles.ts:20` | `radioGroup_item` に `_focusVisible` スタイルが未定義。キーボードフォーカス時の視覚的インジケーターがない（WCAG 2.4.7）。共有コンポーネントだが本 Batch で使用拡大 | `_focusVisible: { outline: '[2px solid]', outlineColor: 'border.focus', outlineOffset: '[2px]' }` を追加 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | UX・アクセシビリティ | `SessionForm.tsx:200` | `<Input aria-label="開催日時">` と上位 `FormField label="開催日時"` の fieldset/legend の両方が同じラベルを提供しており意味が重複 | `aria-label` を削除し `FormField` に `id` を渡して `<label htmlFor>` で関連付けるか、テキストをより具体的に変更 |
| 2 | UX・アクセシビリティ | `SessionForm.tsx:147-153` | 「参加者」セクションが見出しのみで空コンテンツ。スクリーンリーダーが空セクションを読み上げる | Batch 2 実装前の暫定措置として視覚的プレースホルダーを追加 |
| 3 | コーディング規約準拠 | `styles.ts:49` | `bg: 'gray.50'` がハードコード。`styling-rules.md` ではセマンティックトークン定義を推奨 | `semanticTokens.ts` にトークンを追加。ただし既存コードベース全体の慣行でもあるため優先度低 |

## 良い点

- `page.tsx` が Server Component として認証チェックを行い、`SessionFormContainer` を Client 境界として適切に分離。不要な `'use client'` の伝播がない
- `z.input` と `z.infer` を明示的に使い分けており、フォーム入力型と出力型の型安全性が高い（TypeScriptルールの最重要パターンを正確に実装）
- `SessionForm` と `SessionFormContainer` の責務分離が明確で、フォームUIとサーバーアクション実行の境界が適切
- Zodスキーマに設計思想（「柔軟な募集」「すべてオプション」）をJSDocコメントで記述しており、保守性と可読性が高い
- `useWatch` を使った文字数カウンターが `aria-live="polite"` と組み合わせられ、スクリーンリーダーへのフィードバックが提供されている
- セクション区切りに `<hr>` 要素を使用しており、`styling-rules.md` のセマンティックHTMLガイドラインに準拠
- `@phosphor-icons/react/ssr` から必要な4アイコンのみインポートし、バンドルサイズへの影響を最小化
- フォーム送信中の状態が `disabled` + `loading` + `loadingText` の三重フィードバックで提供
- `FormField` コンポーネントが `id` あり/なしで `<label htmlFor>` / `<fieldset>/<legend>` を切り替えるデュアルパターンを採用
- Server Action で入力データをZodスキーマで再バリデーションする多層防御が実装されている
- `scheduleType` のノーマライズ処理が `onFormSubmit` に集約されており、UIロジックとデータ変換の分離が明確

## 総合所見

Batch 1 のフォームUI基盤リデザインは全体的に高品質。セキュリティ・設計面は問題なく、セマンティックHTML・型安全性・責務分離が適切に実装されている。推奨指摘は Import 順序の修正、`watch` → `useWatch` 統一、正規表現の末尾アンカー追加の3点が主要な改善点。NumberInput の min 不一致は Batch 2 で解消予定。RadioGroup のフォーカスリングは共有コンポーネントの改善として別途対応を推奨。
