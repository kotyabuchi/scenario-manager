# BOOTH/TALTO URL検知とインポートページ自動遷移 レビューレポート

> **反映ステータス**: 反映済み（2026-02-15）
> **反映内容**: 必須 3件 + 推奨 4件 + 検討 3件

> **レビュー日時**: 2026-02-15
> **対象ファイル**: `docs/plans/import-url-detection.md`
> **総合評価**: B

## サマリー

計画はURL検知からインポート誘導までのフローを3バッチに分けて具体的に記述しており、既存のコードベースパターン（nuqs、styles.ts分離、Result型）に準拠した堅実な設計。ただし、UX面でのデバウンス処理の欠如、useEffect競合状態への対処、アクセシビリティのライブリージョン不足など、実装時に対処すべき考慮漏れがある。

## 評価詳細

### 1. 技術的妥当性 OK

- `isImportableUrl` のクライアント側ドメインチェックは適切。SSRF検証を行わないことを明記しており、セキュリティ境界が明確
- `ALLOWED_DOMAINS` を `url-validator.ts` からexportしてSingle Source of Truthを維持する方針は正しい
- nuqsによるsearchParams管理は既存の `scenarios/searchParams.ts` パターンと完全に一致
- `useEffect` での自動解析は、マウント時1回実行の要件に対して妥当なアプローチ

### 2. 網羅性・考慮漏れ WARN

以下のエッジケースが未考慮：

- **URL入力のデバウンス**: `watch('distributeUrl')` はキー入力ごとに値が更新される。`isImportableUrl` 自体は軽量だが、入力途中で `https://boo` のようなURLが `isImportableUrl` に渡されるたびにバナーが点滅するUX問題が起こりうる。デバウンスまたは入力完了（blur）時のチェックが望ましい
- **useEffect競合**: `initialUrl` による自動解析中にユーザーがURL入力フィールドを操作した場合の挙動が未定義。`isAutoParsing` でフォームをdisabledにする計画だが、useEffectのクリーンアップ（AbortController等）について言及がない
- **フォームデータの喪失**: ScenarioFormで配布URL以外のフィールドも入力済みの状態でバナーの「インポートへ移動」をクリックすると、入力途中のデータが失われる。確認ダイアログの有無について言及がない
- **ブラウザの戻る操作**: インポートページから戻った際、ScenarioFormの入力状態が復元されるかの考慮がない（Next.js App Routerのデフォルト動作でServer Componentが再レンダリングされる）

### 3. セキュリティ OK

- クライアント側の `isImportableUrl` はUI表示用のみで、セキュリティバリデーションはサーバー側の `parseScenarioUrlAction` → `fetchAndParseScenario` で実施。二重防御が適切に設計されている
- URLクエリパラメータ経由の入力もサーバーアクションを通過するため、SSRF対策は既存実装で担保
- `encodeURIComponent` でURLエンコードする計画も適切

### 4. UX・アクセシビリティ WARN

- `<aside role="note">` のセマンティクスは適切
- `primary.50` 背景 + `primary.700` テキストのコントラストは十分（primary.700 = #047857、primary.50は淡い背景で7:1以上）

改善が必要な点：
- **aria-liveリージョン**: バナーの動的な表示/非表示がスクリーンリーダーに通知されない。`aria-live="polite"` の追加が必要
- **自動解析のフィードバック**: Step 3-4でローディング状態を表示する計画はあるが、解析完了時のフォーカス移動（成功時はフォームの最初の入力フィールド、失敗時はエラーバナー）の記載がない
- **バナー表示アニメーション**: バナーの出現/消失が唐突にならないよう、height/opacityのトランジションを検討すべき

### 5. 保守性・拡張性 OK

- `isImportableUrl` は `ALLOWED_DOMAINS` に新ドメインを追加するだけで自動的に対応サイトが増える
- nuqsパーサー定義を独立ファイルにする設計は既存パターンと統一されており保守しやすい
- バッチ分割により段階的な実装・テストが可能

### 6. プロジェクト整合性 WARN

- nuqsパターン、styles.ts分離、Result型はすべて既存規約に準拠
- セマンティックHTML（`<aside>`）の使用は `coding-standards.md` に沿っている

改善が必要な点：
- **アイコンのインポートパス**: Step 2-1で「Infoアイコン」を使用する計画だが、`@phosphor-icons/react/ssr` からのインポートが明記されていない。`icons.md` ルールで必須
- **スタイルのセマンティックトークン**: Step 2-2の `bg: 'primary.50'` はPandaCSSのカラートークンだが、`styling-rules.md` では「新しい色・影を追加する場合はセマンティックトークンに定義」とある。バナー用のセマンティックトークン（例: `banner.info.bg`, `banner.info.text`）の定義を検討すべき。ただし、既存の `form_sourceBanner`（import/styles.ts）が同じ `primary.50` を直接使用しているため、既存パターンとの整合性は取れている
- **page.tsx の searchParams 型**: Step 3-2 で `searchParams` propを受け取る際、Next.js 16の `Promise<SearchParams>` 型の具体的なインポート先・型定義が不足

### 7. 実行可能性 OK

- 各ステップにファイルパスとコード例が記載されており、そのまま実装可能
- 3バッチの依存関係が明確（Batch 1 → Batch 2 → Batch 3）
- 検証方法が7項目で手動テストシナリオとして十分な網羅性

軽微な懸念：
- Step 3-3 の状態管理（`isAutoParsing`, `autoParseError`, `parsedData`）は現在の `ImportPageContent` の単純な `useState<ParsedScenario | null>` から大幅に複雑化する。状態遷移図またはステートマシンの定義があると実装ミスを防ぎやすい

## 改善提案

### 必須（実装前に対処すべき）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | UX・a11y | バナー表示/非表示がスクリーンリーダーに通知されない | `<aside>` に `aria-live="polite"` を追加 |
| 2 | 網羅性 | URL入力途中でバナーが点滅する可能性 | `watch` の値変更にデバウンス（300ms程度）を適用、または `onBlur` イベントでチェック |
| 3 | プロジェクト整合性 | Infoアイコンのインポートパスが未指定 | `import { Info } from '@phosphor-icons/react/ssr'` を明記 |

### 推奨（対応が望ましい）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 網羅性 | useEffect自動解析中のクリーンアップが未定義 | AbortControllerを使用し、コンポーネントアンマウント時にリクエストをキャンセル。ただし `parseScenarioUrlAction` はServer Actionなのでクライアント側キャンセルは限定的。`isMounted` refガードを追加 |
| 2 | UX | 自動解析完了後のフォーカス管理が未定義 | 成功時: フォームの最初の編集可能フィールドにフォーカス。失敗時: エラーメッセージにフォーカス |
| 3 | 網羅性 | ScenarioFormの入力途中データがバナークリックで喪失 | バナーのリンクにナビゲーション確認を追加（`window.confirm` または独自ダイアログ）。もしくは、配布URLのみを監視しバナーを表示するため、大量のデータ入力後に発生する可能性は低いと判断し、対応を見送る旨を明記 |
| 4 | 実行可能性 | ImportPageContentの状態管理が複雑化 | `idle` → `autoParsing` → `success`/`error` → `manualInput` の状態遷移を明記。もしくは `useReducer` の採用を検討 |

### 検討（余裕があれば）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | UX | バナー表示アニメーションの言及なし | height + opacity のCSSトランジション（200ms程度）でスムーズな出現/消失 |
| 2 | プロジェクト整合性 | `primary.50` をバナーに直接使用 | 既存の `form_sourceBanner` と統一パターンであるため現状で問題ないが、将来的にバナー系コンポーネントが増える場合は `banner.info.bg` 等のセマンティックトークン化を検討 |
| 3 | 保守性 | 自動解析の挙動をテストしにくい | `initialUrl` を受け取る `ImportPageContent` の自動解析ロジックに対する統合テスト（Playwright）を検証方法に追加 |

## 総合所見

計画は既存のコードベースアーキテクチャ（nuqs、styles.ts分離、Server Action、Result型）を的確に活用しており、プロジェクトの規約・パターンとの整合性が高い。3バッチの分割も適切で、段階的に実装・検証が可能な構成になっている。

特に良い点として、`ALLOWED_DOMAINS` のSingle Source of Truth維持、クライアント側チェックとサーバー側検証の責務分離、エラー時のリカバリーフロー（URL事前入力での手動リトライ）が挙げられる。

一方で、UX面のデバウンス処理とアクセシビリティのaria-live属性は実装品質に直接影響するため、実装前に対処を推奨する。状態管理の複雑化についても、実装時に混乱しないよう状態遷移を明確にしておくとよい。
