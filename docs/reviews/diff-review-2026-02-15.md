# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-15）
> **反映内容**: 必須 0件 + 推奨 3件 + 検討 2件（検討3はトークン確認の結果変更不要）

> **レビュー日時**: 2026-02-15
> **対象範囲**: HEAD (`f3af9db`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 15 files (+647, -318)
> **総合評価**: B

## 変更サマリー

シナリオ新規登録フォーム（ScenarioForm）のUI大幅リデザイン、BOOTH/TALTO URL検知によるインポート誘導バナー機能の追加、およびインポートページのURLクエリパラメータ自動解析機能の実装。E2Eテスト・ユニットテストも併せて追加。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `e2e/auth/import.spec.ts` | +67 | -0 | 変更（Tier 3テスト追加） |
| `e2e/auth/scenario-new-banner.spec.ts` | +88 | -0 | 新規（バナーE2E） |
| `e2e/pages/import-page.ts` | +20 | -3 | 変更（Page Object拡張） |
| `src/app/(main)/scenarios/_components/ScenariosContent.tsx` | +2 | -2 | 変更（アイコン変更） |
| `src/app/(main)/scenarios/import/_components/ImportPageContent.tsx` | +43 | -4 | 変更（自動解析追加） |
| `src/app/(main)/scenarios/import/_components/UrlInputStep.tsx` | +37 | -8 | 変更（自動解析UI追加） |
| `src/app/(main)/scenarios/import/_components/styles.ts` | +31 | -0 | 変更（スタイル追加） |
| `src/app/(main)/scenarios/import/page.tsx` | +15 | -3 | 変更（searchParams対応） |
| `src/app/(main)/scenarios/import/searchParams.ts` | +9 | -0 | 新規（nuqsパーサー） |
| `src/app/(main)/scenarios/new/_components/ScenarioForm.tsx` | +225 | -202 | 変更（UIリデザイン） |
| `src/app/(main)/scenarios/new/_components/styles.ts` | +129 | -82 | 変更（スタイルリデザイン） |
| `src/app/(main)/scenarios/new/styles.ts` | +15 | -1 | 変更（SP対応レイアウト） |
| `src/components/elements/file-upload/styles.ts` | +4 | -1 | 変更（dropzone破線ボーダー） |
| `src/lib/scenario-fetcher/__tests__/url-validator.test.ts` | +45 | -1 | 変更（isImportableUrlテスト追加） |
| `src/lib/scenario-fetcher/url-validator.ts` | +18 | -2 | 変更（export追加 + 新関数） |

## 評価詳細

### 1. コーディング規約準拠 OK

- 命名規則: `form_importBanner`, `urlStep_autoParseError` 等、アンダースコア区切りの命名規約に準拠
- スタイル分離: 全スタイルが `styles.ts` に定義されている
- アイコン: `@phosphor-icons/react/ssr` から正しくインポート
- セマンティックHTML: `<hr>` によるフッター区切り、`<aside role="note">` によるバナー
- `primary.500` → `primary.700` への修正はカラーコントラスト基準に適合
- Zodスキーマ・型導出パターンに準拠

### 2. 設計・保守性 OK

- URL検知ロジック (`isImportableUrl`) がバリデータモジュールに適切に配置されている
- nuqs による searchParams 管理は既存パターン（scenarios/searchParams.ts）と一貫
- 自動解析のステート管理（loading, error, data）が親コンポーネント（ImportPageContent）に集約されている
- UrlInputStep は表示に徹しており、責務が明確

### 3. セキュリティ OK

- `isImportableUrl` はクライアント専用のUI判定関数であり、JSDocに「SSRF検証は行わない」と明記
- サーバー側の `validateScenarioUrl`（SSRF対策あり）は変更なし
- `encodeURIComponent` でURLクエリパラメータを適切にエスケープ

### 4. パフォーマンス OK

- URL検知に300msデバウンスを適用し、キーストロークごとの不要な処理を回避
- `isImportableUrl` は `new URL()` + 文字列比較のみで軽量
- 自動解析は `useEffect` 内で1回のみ実行（`initialUrl` 依存）

### 5. UX・アクセシビリティ WARN

- インポート誘導バナー: `role="note"` + `aria-live="polite"` で適切にアナウンス
- 自動解析エラー: `tabIndex={-1}` でプログラム的フォーカスを受け取れるが、`role` 属性が未設定（後述）
- フォーカス管理: エラー時に `setTimeout` でフォーカス移動を実装

### 6. バグ・ロジックエラー WARN

- E2Eテストのロケータに脆弱な点あり（後述）
- `Button asChild disabled` と `Link` の組み合わせでナビゲーション抑止が不完全な可能性あり（後述）

## 指摘一覧

### 必須（マージ前に修正すべき）

なし

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | a11y | `UrlInputStep.tsx:67-74` | 自動解析エラーバナーに `role="alert"` または `role="status"` がない。`tabIndex={-1}` でフォーカス移動はされるが、スクリーンリーダーが自動的にアナウンスしない場合がある | `role="alert"` を追加（動的に表示されるエラーメッセージのため）。`aria-live` との重複に注意（`role="alert"` は暗黙的に `aria-live="assertive"`） |
| 2 | テスト | `import.spec.ts:52-54,68-70` | `[tabindex="-1"]` セレクタが汎用的すぎる。ページ上の他の `tabindex="-1"` 要素（ダイアログ背景等）とマッチする可能性がある | `page.locator('[tabindex="-1"]')` → `importPage.autoParseError` を使用するか、エラーバナーにテスト用の `data-testid` を追加 |
| 3 | バグ | `UrlInputStep.tsx:105` | `<Button variant="ghost" asChild disabled={isLoading}>` で `<Link>` を包んでいるが、`disabled` 属性は `<a>` 要素に対してHTML標準では無効。ローディング中にリンクのクリックを防げない可能性がある | ローディング中は `<Link>` を `<span>` に切り替えるか、`onClick` で `e.preventDefault()` するか、`pointer-events: none` のCSSクラスを適用 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 設計 | `ImportPageContent.tsx:32` | `const isMounted = { current: true }` パターンは動作するが、React 18+では `AbortController` を使った非同期キャンセルがより慣用的 | Server Actionが `AbortSignal` をサポートする場合、`AbortController` パターンへの移行を検討 |
| 2 | a11y | `ImportPageContent.tsx:49` | `setTimeout(() => errorRef.current?.focus(), 100)` — 100msの固定遅延はレンダリングタイミングに依存する。`requestAnimationFrame` や `useEffect` 内での `ref.current?.focus()` がより確実 | 現時点で問題は報告されていないので優先度低。問題が出たら `requestAnimationFrame` に切り替え |
| 3 | スタイル | `styles.ts（new）:5` | `form_card` で `borderRadius: '0'` + `shadow: '[none]'`（SP）→ `borderRadius: '2xl'` + `shadow: 'card.default'`（lg）はレスポンシブ切り替えが適切だが、`borderRadius: '0'` と `shadow: '[none]'` はPandaCSSトークンではなくリテラル値 | `borderRadius: 'none'`, `shadow: 'none'` がトークンとして存在するか確認し、あればトークンを使用 |

## 良い点

- `isImportableUrl` をurl-validatorモジュールに配置し、サーバー側 `validateScenarioUrl` との責務分離が明確
- デバウンス付きURL検知で不要な処理を抑制しつつ、リアルタイムのフィードバックを提供
- インポート誘導バナーに `role="note"` + `aria-live="polite"` を適用し、アクセシビリティに配慮
- `<hr>` によるセマンティックな区切り線の使用（coding-standards.md 準拠）
- E2Eテストがバナー表示・非表示・リンク遷移・URL削除時の動的変化まで網羅的にカバー
- searchParams.ts の nuqs パーサー定義が既存パターン（scenarios/searchParams.ts）と統一
- `primary.500` → `primary.700` の修正でカラーコントラスト基準（4.5:1）に適合
- プレイ時間の時間単位への変更（UIは時間、DBは分）でユーザー体験が向上

## 総合所見

機能追加・UIリデザインとも質が高く、既存のコーディング規約・パターンに沿った実装。必須修正なしの評価B。推奨指摘3件（a11yのrole追加、E2Eロケータの改善、disabled Link対応）の対応でAに到達可能。特に、URL検知ロジックの責務分離とE2Eテストの網羅性は優れている。
