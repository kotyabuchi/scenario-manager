# BOOTH/TALTO URL検知とインポートページ自動遷移

## Context

シナリオ手動登録フォーム（`/scenarios/new`）の配布URLフィールドにBOOTH/TALTO URLが入力された場合、インポート機能への誘導を行う。また、インポートページ（`/scenarios/import`）がURLクエリパラメータを受け取り、自動的にURL解析を実行してフォーム入力フェーズに遷移できるようにする。

## 決定事項

| 項目 | 決定 | 理由 |
|------|------|------|
| ドメイン判定の場所 | クライアント側（ScenarioForm内） | SSRF不要、即時フィードバック |
| ALLOWED_DOMAINSの共有 | url-validator.tsからexport | Single Source of Truth |
| クエリパラメータ管理 | nuqs（searchParams.ts） | プロジェクト既存パターンに準拠 |
| 自動解析の起点 | ImportPageContentのuseEffect | マウント時に1回だけ実行 |
| エラー時の挙動 | UrlInputStepにURL入力済み＋エラー表示 | ユーザーが修正して再試行可能 |

## 前提条件

なし。既存の依存パッケージで実現可能。

---

## Batch 1: ALLOWED_DOMAINSのexportとクライアント用ユーティリティ

### Step 1-1. ALLOWED_DOMAINSをexportする

**ファイル**: `src/lib/scenario-fetcher/url-validator.ts`

- `const ALLOWED_DOMAINS` → `export const ALLOWED_DOMAINS` に変更
- `AllowedDomain` 型もexport

### Step 1-2. クライアント用ドメイン判定関数を追加

**ファイル**: `src/lib/scenario-fetcher/url-validator.ts`

```typescript
/**
 * URLがインポート対応サイト（BOOTH/TALTO）かどうかを判定する（クライアント用）
 * SSRF検証は行わない。UIでの表示判定のみに使用すること。
 */
export const isImportableUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString)
    return ALLOWED_DOMAINS.some(
      (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}
```

---

## Batch 2: 手動登録フォームにインポート誘導バナーを追加

### Step 2-1. ScenarioFormにURL検知ロジックとバナーを追加

**ファイル**: `src/app/(main)/scenarios/new/_components/ScenarioForm.tsx`

- `isImportableUrl` をインポート
- `import { Info } from '@phosphor-icons/react/ssr'` でアイコンをインポート
- `watch('distributeUrl')` で配布URLを監視し、**デバウンス（300ms）を適用**して入力途中のバナー点滅を防止
  - `useEffect` + `setTimeout` / `clearTimeout` で実装（追加ライブラリ不要）
  - デバウンス後の値に対して `isImportableUrl` を実行し、結果を `showImportBanner` 状態に反映
- `showImportBanner` が true の場合、配布URLフィールド直下にバナーを表示
- バナー内容:
  - Infoアイコン + メッセージ「このサイトで配布されているシナリオはインポートから登録してください」
  - `<Link href={/scenarios/import?url=${encodeURIComponent(distributeUrl)}}>` のボタン
- `<aside role="note" aria-live="polite">` で実装（情報補足を示すセマンティック要素 + スクリーンリーダーへの動的通知）
- **データ喪失について**: 配布URLフィールドの入力をトリガーとしてバナーが表示されるため、他フィールドに大量入力した後にバナーが出現する可能性は低い。確認ダイアログは現時点では不要と判断し、対応を見送る

### Step 2-2. バナー用スタイルを追加

**ファイル**: `src/app/(main)/scenarios/new/_components/styles.ts`

- `form_importBanner` - flexレイアウト、`bg: 'primary.50'`、`borderRadius: 'lg'`
- `form_importBanner_content` - アイコン+テキストのflex行
- `form_importBanner_icon` - `color: 'primary.700'`
- `form_importBanner_text` - `color: 'primary.700'`、14px
- バナーの出現/消失に **height + opacity のCSSトランジション（200ms）** を適用し、唐突な表示切替を防止

既存の `form_sourceBanner`（import/styles.ts）と同じトーンで統一。`primary.50` はバナー用セマンティックトークンとしての抽出は現時点では不要だが、将来バナー系コンポーネントが増えた場合に `banner.info.bg` 等への移行を検討する。

---

## Batch 3: インポートページのクエリパラメータ対応

### Step 3-1. searchParams.tsを作成

**ファイル（新規）**: `src/app/(main)/scenarios/import/searchParams.ts`

```typescript
import { createSearchParamsCache, parseAsString } from 'nuqs/server'

export const importSearchParamsParsers = {
  url: parseAsString,
}

export const importSearchParamsCache = createSearchParamsCache(
  importSearchParamsParsers,
)
```

### Step 3-2. page.tsxでsearchParamsを受け取りImportPageContentに渡す

**ファイル**: `src/app/(main)/scenarios/import/page.tsx`

- `searchParams` propを受け取る（Next.js 16: `Promise<SearchParams>`）
- `importSearchParamsCache.parse(searchParams)` でパース
- `initialUrl` として `ImportPageContent` に渡す

### Step 3-3. ImportPageContentで自動解析を実行

**ファイル**: `src/app/(main)/scenarios/import/_components/ImportPageContent.tsx`

- Props に `initialUrl?: string` を追加
- `parseScenarioUrlAction` をインポート
- `useEffect` で `initialUrl` がある場合に自動解析を実行
  - **`isMounted` refガード**を使用し、コンポーネントアンマウント後の状態更新を防止
  - クリーンアップ関数で `isMounted.current = false` を設定
- **状態遷移**: `idle` → `autoParsing` → `success` | `error` → `manualInput`
  - `idle`: 初期状態。`initialUrl` なしの場合はこのまま
  - `autoParsing`: 自動解析中。UrlInputStepにローディング表示
  - `success`: 解析成功。`parsedData` をセットしてImportScenarioFormへ遷移
  - `error`: 解析失敗。UrlInputStepにエラーバナー + URL入力済みで表示
  - `manualInput`: ユーザーが手動入力モードに切り替えた場合
- 状態管理: `isAutoParsing`, `autoParseError`
- **フォーカス管理**: 解析完了時にフォーカスを適切な要素に移動
  - 成功時: フォームの最初の編集可能フィールドにフォーカス（`useRef` + `ref.current?.focus()`）
  - 失敗時: エラーメッセージにフォーカス

### Step 3-4. UrlInputStepで初期値とエラー・ローディング状態を表示

**ファイル**: `src/app/(main)/scenarios/import/_components/UrlInputStep.tsx`

- Props追加: `initialUrl?: string`, `autoParseError?: string | null`, `isAutoParsing?: boolean`
- `defaultValues.url` を `initialUrl ?? ''` に設定
- `isAutoParsing` 中はフォームをdisabled + ボタンをloading状態に
- `autoParseError` がある場合、フォーム上部にエラーバナー表示（**`tabIndex={-1}` + `ref`** でフォーカス受け取り可能にする）

### Step 3-5. エラーバナー・ローディング用スタイルを追加

**ファイル**: `src/app/(main)/scenarios/import/_components/styles.ts`

- `urlStep_autoParseError` - `bg: 'red.50'`ベースのエラーバナー（既存の`urlStep_error`を参考）
- `urlStep_loading` - 中央揃えのローディング表示

---

## ファイル一覧

| ファイル | 種別 | 変更内容 |
|---------|------|---------|
| `src/lib/scenario-fetcher/url-validator.ts` | 変更 | ALLOWED_DOMAINS export + isImportableUrl追加 |
| `src/app/(main)/scenarios/new/_components/ScenarioForm.tsx` | 変更 | URL検知 + バナー表示 |
| `src/app/(main)/scenarios/new/_components/styles.ts` | 変更 | バナースタイル追加 |
| `src/app/(main)/scenarios/import/searchParams.ts` | **新規** | nuqsパーサー定義 |
| `src/app/(main)/scenarios/import/page.tsx` | 変更 | searchParams受け取り + initialUrl渡し |
| `src/app/(main)/scenarios/import/_components/ImportPageContent.tsx` | 変更 | 自動解析ロジック |
| `src/app/(main)/scenarios/import/_components/UrlInputStep.tsx` | 変更 | 初期値・エラー・ローディング対応 |
| `src/app/(main)/scenarios/import/_components/styles.ts` | 変更 | エラーバナー・ローディングスタイル |

## 検証方法

1. `/scenarios/new` で配布URLに `https://booth.pm/ja/items/12345` を入力 → バナー表示確認
2. 非BOOTH/TALTO URLを入力 → バナー非表示確認
3. バナーの「インポートへ移動」クリック → `/scenarios/import?url=...` に遷移確認
4. `/scenarios/import?url=https://booth.pm/ja/items/5723060`（実在URL）→ 自動解析→フォーム表示
5. `/scenarios/import?url=https://booth.pm/invalid` → エラー表示 + URL入力済みで手動リトライ可能
6. `/scenarios/import`（クエリなし）→ 従来通りのURL入力フロー
7. `pnpm check` + `pnpm build` でエラーなし
8. `/scenarios/import?url=https://booth.pm/ja/items/5723060` → 自動解析中のローディング表示 → 解析完了後にフォームの最初の編集可能フィールドにフォーカスが移動することを確認（Playwright統合テスト対象）
9. `/scenarios/import?url=https://booth.pm/invalid` → エラーバナーにフォーカスが移動することを確認
