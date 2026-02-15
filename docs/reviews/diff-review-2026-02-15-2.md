# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-15）
> **反映内容**: 必須 0件 + 推奨 3件 + 検討 2件
> **レビュー日時**: 2026-02-15
> **対象範囲**: HEAD (`f3af9db`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 17 files (+665, -327)
> **総合評価**: B

## 変更サマリー

シナリオ新規登録フォームの大規模UIリデザイン（レイアウト再構成、ハンドアウトをRadioに変更、プレイ時間を時間単位に変更、配布URLアイコン付き入力、インポート誘導バナー追加）と、インポートページへのURLクエリパラメータ自動解析機能の追加。FileUploadコンポーネントに`square`プロップ追加、`isImportableUrl`バリデーション関数の新規追加、E2Eテストの拡充も含む。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `e2e/auth/import.spec.ts` | +69 | -0 | 変更 |
| `e2e/auth/scenario-new-banner.spec.ts` | +86 | -0 | 新規 |
| `e2e/pages/import-page.ts` | +16 | -5 | 変更 |
| `src/app/(main)/scenarios/_components/ScenariosContent.tsx` | +2 | -2 | 変更 |
| `src/app/(main)/scenarios/import/_components/ImportPageContent.tsx` | +51 | -6 | 変更 |
| `src/app/(main)/scenarios/import/_components/ImportScenarioForm.tsx` | +1 | -0 | 変更 |
| `src/app/(main)/scenarios/import/_components/UrlInputStep.tsx` | +59 | -14 | 変更 |
| `src/app/(main)/scenarios/import/_components/styles.ts` | +35 | -4 | 変更 |
| `src/app/(main)/scenarios/import/page.tsx` | +18 | -4 | 変更 |
| `src/app/(main)/scenarios/import/searchParams.ts` | +9 | -0 | 新規 |
| `src/app/(main)/scenarios/new/_components/ScenarioForm.tsx` | +260 | -260 | 変更 |
| `src/app/(main)/scenarios/new/_components/styles.ts` | +130 | -85 | 変更 |
| `src/app/(main)/scenarios/new/styles.ts` | +16 | -2 | 変更 |
| `src/components/elements/file-upload/file-upload.tsx` | +17 | -3 | 変更 |
| `src/components/elements/file-upload/styles.ts` | +17 | -2 | 変更 |
| `src/lib/scenario-fetcher/__tests__/url-validator.test.ts` | +46 | -1 | 変更 |
| `src/lib/scenario-fetcher/url-validator.ts` | +20 | -2 | 変更 |

## 評価詳細

### 1. コーディング規約準拠 WARN

- `FadersIcon` のインポート名がプロジェクト慣習（`CaretDown`, `Check`, `Funnel` 等のプレーンな名前）と不一致。`Faders` が標準名
- スタイル分離は `styles.ts` に正しく行われている
- セマンティックHTMLの適切な使用（`<hr>`, `<aside role="note">`）

### 2. 設計・保守性 OK

- nuqs による URL 状態管理が `form-rules.md` のパターンに準拠
- `isImportableUrl` のサーバー/クライアント責務分離が適切（SSRF検証なしの旨をJSDocに明記）
- AbortControllerによるクリーンアップパターンが正しく実装されている
- FileUpload の `square` プロップはコンポーネント側で制御する適切なアプローチ

### 3. セキュリティ OK

- `encodeURIComponent` でURL値を適切にエンコード
- `isImportableUrl` はUI表示判定のみに使用し、SSRF検証は行わない旨が明記されている
- サーバー側の `validateScenarioUrl` がSSRF検証を担当する責務分離が維持されている

### 4. パフォーマンス OK

- デバウンス（300ms）によるURL検知で不要な再計算を抑制
- `useEffect` の依存配列が適切（`[initialUrl]`, `[distributeUrl]`）

### 5. UX・アクセシビリティ WARN

- `role="alert"` + `tabIndex={-1}` + `requestAnimationFrame` フォーカスは良いアクセシビリティパターン
- `aria-live="polite"` でスクリーンリーダーにバナー出現を通知
- `form_importBanner` の `transition` プロパティが無効（条件付きレンダリングではCSSトランジションは発火しない）
- `color: 'primary.500'` → `primary.700` への変更はコントラスト改善として正しい

### 6. バグ・ロジックエラー WARN

- `useRangeInputs` がマウント時に `setMinValue`/`setMaxValue` を呼ばないため、スライダー未操作でのフォーム送信時に `minPlaytime`/`maxPlaytime` が `undefined` になる。UIには "1 〜 3 時間" と表示されるがフォーム値は空。これは既存の動作だが、playtime のみ `v * 60` 変換が追加されたため、初期同期の不在が顕在化しやすい
- `form_importBanner` のCSS transition は条件付きレンダリング（mount/unmount）で適用されるため無効。アニメーションが必要なら `display` toggle や CSS animation を使用する必要がある

## 指摘一覧

### 必須（マージ前に修正すべき）

なし

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 規約 | `ScenariosContent.tsx:4` | `FadersIcon` はプロジェクトの Phosphor Icons 命名慣習（`Icon`サフィックスなし）と不一致 | `Faders` に変更（`import { Faders } from '@phosphor-icons/react/ssr'`） |
| 2 | UX | `styles.ts(new):245-251` | `form_importBanner` の `transition` プロパティが無効。条件付きレンダリングではCSSトランジションは発火しない | transition プロパティを削除するか、アニメーションが必要なら CSS `@keyframes` や `data-state` ベースのアプローチに変更 |
| 3 | バグ | `ScenarioForm.tsx:92-98` | プレイ時間スライダーの初期値（1〜3時間）がフォーム値に同期されない。`useRangeInputs` はマウント時に `setMinValue`/`setMaxValue` を呼ばないため、スライダー未操作でのフォーム送信時にplaytimeが `undefined` になる | `useRangeInputs` にマウント時の初期同期を追加するか、フォームの `defaultValues` に `minPlaytime: 60, maxPlaytime: 180` を設定 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | テスト | `import-page.ts:39` | `autoParseError` ロケータ `div[role="alert"][tabindex="-1"]` が汎用的。他の `role="alert"` 要素が追加された場合に壊れる可能性 | `data-testid="auto-parse-error"` の追加、または `.urlStep_autoParseError` クラスセレクタの使用を検討 |
| 2 | 規約 | `styles.ts(new):253-256, (import):67-69` | `fontSize: '[14px]'`, `fontSize: '[13px]'` 等のハードコード値が複数箇所にある。PandaCSSの `sm`(14px), `xs`(12px) トークンの使用も検討可能 | プロジェクトのデザインシステムと照合し、トークン化を検討 |

## 良い点

- **自動解析フロー**: `initialUrl` → useEffect → AbortController → エラー/成功分岐の非同期フローが堅牢に設計されている
- **アクセシビリティ**: エラーバナーの `role="alert"` + プログラマティックフォーカス、インポートバナーの `aria-live="polite"`、セマンティックな `<hr>` と `<aside>` の使用
- **責務分離**: `isImportableUrl`（クライアント用、SSRF検証なし）と `validateScenarioUrl`（サーバー用、SSRF検証あり）の明確な分離とJSDocによる注意書き
- **テストカバレッジ**: `isImportableUrl` に対するエッジケース（部分一致ドメイン、入力途中URL等）を含む包括的なテストと、E2Eテストでの自動解析フローの検証
- **nuqs統合**: `searchParams.ts` + `importSearchParamsCache` パターンがプロジェクト慣習に準拠
- **ローディング中のLink無効化**: 条件分岐で `<Button disabled>` と `<Button asChild><Link>` を切り替えるアプローチは、Next.js の Link コンポーネントが `disabled` を受け付けない問題への正しい対処

## 総合所見

UIリデザインとURLクエリパラメータ自動解析の2つの大きな変更が含まれる差分。設計・実装ともに質が高く、アクセシビリティとセキュリティの考慮も適切。主な改善点は、アイコン命名の統一（`FadersIcon` → `Faders`）、無効なCSSトランジションの除去、スライダー初期値のフォーム同期の3点。いずれも軽微であり、修正後にマージ可能。
