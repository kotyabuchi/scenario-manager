# コード差分レビュー

> **レビュー日時**: 2026-02-19
> **対象範囲**: HEAD (`36e1647`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 11 files (+208/-14 lines)
> **総合評価**: D
> **レビューモード**: パラレル（3エージェント）

## 変更サマリー

セッション作成フォームにシナリオ選択機能（Batch 3）を実装。シナリオ検索モーダル、選択済みカード表示、Tabsによる選択方法の切り替え（検索/ID直接入力/URL）、シナリオ検索Server Action、システム一覧取得を追加。テストの更新（スキップ解除・タブUI確認追加）も含む。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.tsx` | +232 | - | 新規 |
| `src/app/(main)/sessions/new/_components/ScenarioSelectedCard.tsx` | +82 | - | 新規 |
| `src/app/(main)/sessions/new/_components/scenarioCardStyles.ts` | +72 | - | 新規 |
| `src/app/(main)/sessions/new/_components/scenarioSearchStyles.ts` | +95 | - | 新規 |
| `src/app/(main)/sessions/new/interface.ts` | +29 | - | 新規 |
| `src/app/(main)/sessions/new/_components/SessionForm.tsx` | +68 | -4 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionFormContainer.tsx` | +14 | -3 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.test.tsx` | +14 | -8 | 変更 |
| `src/app/(main)/sessions/new/_components/styles.ts` | +22 | -0 | 変更 |
| `src/app/(main)/sessions/new/actions.ts` | +70 | -1 | 変更 |
| `src/app/(main)/sessions/new/page.tsx` | +8 | -1 | 変更 |

## 評価詳細

### 1. コーディング規約準拠 OK

命名規則、Import順序、コメント、スタイル分離、エクスポート形式すべて規約に準拠。`any`型・Non-null assertion・`console.log`の使用なし。アイコンは `@phosphor-icons/react/ssr` から正しく import。JSDocが日本語で適切に付与されている。

### 2. 設計・保守性 WARN

1ファイル1コンポーネント原則が守られ、コンテナ/プレゼンテーション分離も適切。ただし `formatPlayerCount`/`formatPlaytime` の2ファイル重複、`SystemSummary` 型の独自定義（Single Source of Truth 違反）、`page.tsx` と `getSystemsAction` のロジック重複が存在。

### 3. セキュリティ WARN

主要Server Actionで認証チェック実施済み。SQLインジェクション/XSS対策は適切。ただし `getSystemsAction` のみ認証チェックが欠如しており、一貫性に問題。

### 4. パフォーマンス WARN

Server Componentでのデータ取得、デバウンス処理、`useTransition`による非ブロッキング検索は良好。`handleQueryChange`/`handleSystemChange`が `useCallback` 未使用で毎レンダー再生成される点が改善候補。

### 5. UX・アクセシビリティ NG

`<search>` セマンティック要素、`aria-hidden`、`aria-label`（IconButton）、`aria-live`（文字数カウンター）は適切。しかし `<button role="option">` のARIAロール不整合、検索中テキストの `aria-live` 欠如、フォーカスリング未定義の3点が必須修正。

### 6. バグ・ロジックエラー WARN

エッジケース処理は概ね適切だが、デバウンスタイマーのアンマウント時クリーンアップが欠如しており、不要なネットワーク呼び出しが発生する可能性がある。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | UX・アクセシビリティ | `ScenarioSearchModal.tsx:180,198` | `<div role="listbox">` の子に `<button role="option">` を使用。ARIA仕様では `option` ロールはインタラクティブな `button` 要素に付与するものではなく、ATでの解釈が不正確になる（WCAG 4.1.2） | `role="listbox"`/`role="option"` を除去し、単純なボタンリスト構造にするか、`<div role="option" tabIndex={0} onClick={...}>` に変更 |
| 2 | UX・アクセシビリティ | `ScenarioSearchModal.tsx:191-193` | 「検索中...」テキストに `aria-live` がないため、スクリーンリーダーが状態変化を読み上げない（WCAG 4.1.3 Status Messages） | `<p role="status" aria-live="polite">検索中...</p>` に変更 |
| 3 | UX・アクセシビリティ | `scenarioSearchStyles.ts:33-51` | `scenarioList_item` ボタンに `_focusVisible` / focusRingトークンが定義されておらず、キーボードフォーカス時の視覚的フィードバックが欠如（WCAG 2.4.7） | `_focusVisible` スタイルを追加しフォーカスリングを表示 |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 4 | 設計・保守性 | `actions.ts:184-187` | `SystemSummary` 型が独自定義。`ScenarioSystemRow` から `Pick` で導出可能であり、Single Source of Truth 原則に反する | `Pick<ScenarioSystemRow, 'systemId' \| 'name'>` に変更 |
| 5 | 設計・保守性 | `page.tsx:27-30` | `getAllSystems()` 直接呼び出し + マッピングが `getSystemsAction` と重複 | `getSystemsAction()` を利用するか、共通関数を抽出 |
| 6 | 設計・保守性 | `ScenarioSearchModal.tsx:27-44`, `ScenarioSelectedCard.tsx:18-35` | `formatPlayerCount`/`formatPlaytime` が2ファイルに重複定義 | 共通ユーティリティに切り出し |
| 7 | セキュリティ | `actions.ts:192` | `getSystemsAction` に認証チェックがない。他Actionとの一貫性に問題 | `supabase.auth.getUser()` による認証チェックを追加 |
| 8 | UX・アクセシビリティ | `ScenarioSelectedCard.tsx:61-67` | 「変更」ボタンに `aria-label` がなく、何を変更するかスクリーンリーダーで判別できない | `aria-label="シナリオを変更"` を追加 |
| 9 | UX・アクセシビリティ | `scenarioCardStyles.ts:62-71` | `scenarioCard_changeLink` ボタンに `_focusVisible` スタイルが未定義 | `_focusVisible` でフォーカスリングを追加 |
| 10 | バグ・ロジックエラー | `ScenarioSearchModal.tsx:64` | `setTimeout` のタイマーがアンマウント時にクリアされない。不要なネットワーク呼び出しが発生する可能性 | `useEffect` でクリーンアップ関数を返し `clearTimeout` を実行 |
| 11 | パフォーマンス | `ScenarioSearchModal.tsx:78,84` | `handleQueryChange`/`handleSystemChange` が `useCallback` 未使用で毎レンダー再生成 | `useCallback` でラップ |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 12 | コーディング規約準拠 | `scenarioSearchStyles.ts:14,22` | `w: '[200px]'`、`maxH: '[400px]'` がハードコード固定値 | セマンティックトークンまたは定数化を検討 |
| 13 | セキュリティ | `page.tsx:27` | `systemsResult` 失敗時にエラーがサイレントにフォールバック | `getAppLogger` でエラーログを記録 |
| 14 | セキュリティ | `SessionForm.tsx:284` | IDタブの `scenarioId` 入力にクライアント側フォーマットバリデーション（ULID形式）がない | Zodスキーマにフォーマット検証を追加 |

## 良い点

- `interface.ts` で `ScenarioSummary`/`SelectedScenario` が `ScenarioRow`/`ScenarioSystemRow` から `Pick` で導出されており、型の Single Source of Truth が守られている
- Result型パターン（`ok`/`err`）と `isNil` が `actions.ts` 全体で一貫して使用されている
- `<search>` セマンティック要素、`<h2>` セクション見出し、`<hr>` 区切り線など、セマンティックHTMLが全体的に適切
- Server Component でシステム一覧を1回だけ取得し、Client Component への props として渡す効率的なデータフロー
- `useTransition` + デバウンスによる非ブロッキング検索の実装が適切
- 空状態のメッセージが適切に実装され、ユーザーに次のアクションを示している
- 「URLで指定」タブを `disabled: true` で準備中として明示しており、利用不可能な機能への迷い込みを防止
- すべてのアイコンに `aria-hidden="true"` が付与され、スクリーンリーダーの二重読み上げを防止

## 総合所見

シナリオ選択機能の全体的な設計と実装品質は良好で、型安全性・セマンティックHTML・Result型パターンなど既存の規約に概ね準拠している。ただし、アクセシビリティ面で3件の必須修正（ARIAロール、aria-live、フォーカスリング）が必要。これらは修正自体は軽微なため、修正後に総合評価はBレベルに改善される見込み。設計面では `formatPlayerCount`/`formatPlaytime` の重複と `SystemSummary` 型の導出を改善すべき。
