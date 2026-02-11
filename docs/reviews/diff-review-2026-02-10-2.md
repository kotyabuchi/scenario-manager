> **反映ステータス**: 反映済み（2026-02-10）
> **反映内容**: 必須 0件 + 推奨 5件 + 検討 5件

# コード差分レビュー

> **レビュー日時**: 2026-02-10
> **対象範囲**: HEAD (`f9c22ec`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 36 files（14 tracked + 22 untracked）
> **総合評価**: B

## 変更サマリー

シナリオ自動インポート機能の実装。外部サイト（Booth / TALTO）のURLからシナリオ情報を自動取得し、フォームに事前入力して登録する機能一式。パーサー、URL検証、サニタイザー、インポートUI、Server Actions、DBスキーマ変更を含む大規模追加。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `package.json` | +1 | -0 | 変更 |
| `pnpm-lock.yaml` | +893 | -568 | 変更 |
| `src/app/(main)/scenarios/[id]/_components/ScenarioInfo.tsx` | +25 | -4 | 変更 |
| `src/app/(main)/scenarios/[id]/_components/styles.ts` | +20 | -0 | 変更 |
| `src/app/(main)/scenarios/_components/ScenarioList.tsx` | +8 | -0 | 変更 |
| `src/app/(main)/scenarios/_components/styles.ts` | +1 | -1 | 変更 |
| `src/app/(main)/scenarios/adapter.ts` | +3 | -0 | 変更 |
| `src/app/(main)/scenarios/interface.ts` | +3 | -0 | 変更 |
| `src/app/(main)/scenarios/new/page.tsx` | +4 | -2 | 変更 |
| `src/app/(main)/scenarios/new/styles.ts` | +14 | -0 | 変更 |
| `src/db/enum.ts` | +15 | -0 | 変更 |
| `src/db/types.ts` | +17 | -0 | 変更 |
| `src/lib/rateLimit.ts` | +1 | -0 | 変更 |
| `src/styles/semanticTokens.ts` | +1 | -0 | 変更 |
| `src/app/(main)/scenarios/import/_components/ImportPageContent.tsx` | +42 | -0 | 新規 |
| `src/app/(main)/scenarios/import/_components/ImportScenarioForm.tsx` | +659 | -0 | 新規 |
| `src/app/(main)/scenarios/import/_components/UrlInputStep.tsx` | +90 | -0 | 新規 |
| `src/app/(main)/scenarios/import/_components/index.ts` | +1 | -0 | 新規 |
| `src/app/(main)/scenarios/import/_components/schema.ts` | +135 | -0 | 新規 |
| `src/app/(main)/scenarios/import/_components/styles.ts` | +332 | -0 | 新規 |
| `src/app/(main)/scenarios/import/actions.ts` | +187 | -0 | 新規 |
| `src/app/(main)/scenarios/import/page.tsx` | +59 | -0 | 新規 |
| `src/app/(main)/scenarios/import/styles.ts` | +62 | -0 | 新規 |
| `src/lib/scenario-fetcher/index.ts` | +99 | -0 | 新規 |
| `src/lib/scenario-fetcher/booth-parser.ts` | +215 | -0 | 新規 |
| `src/lib/scenario-fetcher/talto-parser.ts` | +126 | -0 | 新規 |
| `src/lib/scenario-fetcher/types.ts` | +43 | -0 | 新規 |
| `src/lib/scenario-fetcher/url-validator.ts` | +64 | -0 | 新規 |
| `src/lib/scenario-fetcher/sanitizer.ts` | +35 | -0 | 新規 |
| `src/lib/scenario-fetcher/__tests__/booth-parser.test.ts` | +139 | -0 | 新規 |
| `src/lib/scenario-fetcher/__tests__/sanitizer.test.ts` | +60 | -0 | 新規 |
| `src/lib/scenario-fetcher/__tests__/talto-parser.test.ts` | +104 | -0 | 新規 |
| `src/lib/scenario-fetcher/__tests__/url-validator.test.ts` | +73 | -0 | 新規 |
| `src/lib/scenario-fetcher/__fixtures__/booth-product-page.html` | - | - | 新規 |
| `src/lib/scenario-fetcher/__fixtures__/booth-no-playtime.html` | - | - | 新規 |
| `supabase/migrations/0003_add_scenario_source.sql` | +7 | -0 | 新規 |

## 評価詳細

### 1. コーディング規約準拠 WARN

全体的によく準拠している。命名規則、スタイル分離、エクスポート形式、PandaCSSトークン使用はルール通り。

**問題点:**
- `scenarioInfo_readMore`（styles.ts:213）の `color: 'primary.500'` はクリッカブルテキスト。アクセシビリティルールでは primary.500 の白背景での使用は WCAG AA を満たさない（2.51:1）。ただし背景が gray.50 系の場合は要確認。
- `form_imageRemove`（import styles.ts:252）で `bg: '[rgba(0, 0, 0, 0.6)]'` がハードコードされている。`overlay` セマンティックトークンを使用すべき。
- `form_sliderValue`（import styles.ts:183）で `color: 'primary.500'` を通常テキストに使用。コントラスト問題の可能性（白背景の場合 2.51:1）。

### 2. 設計・保守性 OK

- 責務分離が明確（パーサー / バリデータ / サニタイザー / UI / Server Actions）
- 型定義は Supabase 生成型・Zod 推論型から正しく導出（`z.input` / `z.output` の使い分けも適切）
- Result 型パターンを一貫して使用
- `isNil` による Null チェックも適切

**軽微な懸念:**
- `ImportScenarioForm.tsx` が 659 行と大きい。既存の `ScenarioForm` との共通ハンドラー（画像アップロード、スライダー操作等）の重複がある。将来的にカスタムフックへの切り出しが望ましい。
- `import/styles.ts` と `new/styles.ts` にページレイアウト（`pageContainer`, `pageHeader` 等）のスタイル重複がある。

### 3. セキュリティ OK

- **SSRF対策**: ホワイトリスト方式 + HTTPS only + プライベートIPブロック + localhost拒否。適切。
- **XSS対策**: サニタイザーでHTMLタグ・制御文字を除去。cheerio でのパースも安全。
- **レートリミット**: URL解析（1分5回）、シナリオ作成（1時間5件）で適用。
- **入力バリデーション**: Server側でZodによる再バリデーション実施。
- **認証**: 両Server Actionsで認証確認あり。
- **Content-Length チェック**: 5MBのレスポンスサイズ制限あり。

**懸念:**
- `fetchTaltoProject` に Content-Length チェックがない。TALTO API レスポンスが巨大になった場合のDoSリスクは低いが、Booth と同等の防御が望ましい。

### 4. パフォーマンス OK

- `cheerio` はサーバーサイドのみで使用（クライアントバンドルに含まれない）
- Server Actions で非同期処理を適切に分離
- `useTransition` によるUI非ブロッキング

**問題なし。**

### 5. UX・アクセシビリティ WARN

- ソースバッジ（`scenarioInfo_sourceBadge`）は `primary.50` 背景に `primary.800` テキストで良好なコントラスト。
- フォームは `FormField` + `FieldError` コンポーネントで統一的なエラー表示。
- `readOnly` フィールドに Lock アイコンで視覚的区別を提供。

**問題点:**
- `UrlInputStep` でローディング中に `<Loader2>` と `<Link2>` を切り替えているが、ボタンテキスト（`取り込む`）は `loadingText="解析中..."` で切り替わるので、`{isPending ? <Loader2 size={18} /> : <Link2 size={18} />}` はボタンの `loading` prop と重複している可能性がある（Button コンポーネントの実装次第）。
- `ImportScenarioForm` の readOnly プレイ人数表示で `FormField` に `id` が未設定。スクリーンリーダーでのラベル紐付けが弱い可能性。

### 6. バグ・ロジックエラー WARN

**潜在的な問題:**

1. **プレイ時間の単位変換の不整合** (`ImportScenarioForm.tsx:87-92`):
   ```
   const initialMinPlaytime = fieldValue(parsedData.minPlaytime)
     ? Math.round((fieldValue(parsedData.minPlaytime) ?? 60) / 60)
     : 60;
   ```
   パーサーは秒単位で返す。`fieldValue` が `undefined` の場合のフォールバック `60` は 60秒ではなく「60分」として扱われている（`initialMinPlaytime` はスライダーの初期値として分単位で使用）。パーサーから値が取れた場合の変換（秒→分）は `/ 60` で正しいが、フォールバック値の意味が混在している。ただしフォールバック時のロジック自体は `fieldValue` が truthy でない場合に `60`（分）を返すので動作上は問題ないが、可読性が低い。

2. **`sanitizeText` の XSS 対策の潜在的隙間** (`sanitizer.ts:8-14`):
   HTMLタグ除去後にエンティティをデコードしている。`&lt;script&gt;alert(1)&lt;/script&gt;` のようなダブルエンコードされた入力で `<script>alert(1)</script>` が復元される。ただし React は JSX テキストコンテンツを自動エスケープするため、実際の XSS リスクは低い。

3. **`boothParser` の正規表現マッチング精度**:
   `PLAYER_COUNT_PATTERNS` の「1〜4人」パターンは説明文中の「10〜40人分のオフィス」のような文脈でも誤マッチする可能性がある。confidence が `low` なので UI上で編集可能だが、初期値としての精度に影響。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| - | - | - | 必須指摘なし | - |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 規約 | `import/_components/styles.ts:252` | `bg: '[rgba(0, 0, 0, 0.6)]'` がハードコード | `overlay` セマンティックトークンを使用 |
| 2 | 規約 | `import/_components/styles.ts:183` | `color: 'primary.500'` は白背景でコントラスト不足の可能性 | `primary.700` または `primary.800` に変更 |
| 3 | 規約 | `[id]/_components/styles.ts:213` | `scenarioInfo_readMore` の `color: 'primary.500'` | `primary.700` に変更（クリッカブルテキスト基準） |
| 4 | セキュリティ | `talto-parser.ts:45-54` | TALTO API レスポンスのサイズ制限なし | Content-Length チェックまたはストリーム制限の追加 |
| 5 | バグ | `sanitizer.ts:8-14` | ダブルエンコードされた HTML で XSS 文字列が復元される | タグ除去とエンティティデコードの順序を逆にするか、デコード後に再度タグ除去 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 設計 | `import/_components/ImportScenarioForm.tsx` | 659行と大きく、既存フォームとハンドラーが重複 | 共通カスタムフックの切り出し |
| 2 | 設計 | `import/styles.ts` + `new/styles.ts` | ページレイアウトスタイルの重複 | 共通ページレイアウトスタイルの抽出 |
| 3 | UX | `import/_components/UrlInputStep.tsx:82` | ローディングアイコンが Button の loading prop と重複する可能性 | Button の loading 挙動を確認し、不要なら削除 |
| 4 | UX | `import/_components/ImportScenarioForm.tsx:463-504` | readOnly 表示時の FormField に id 未設定 | `id` prop を追加してアクセシビリティ向上 |
| 5 | バグ | `booth-parser.ts:40` | プレイ人数パターンが文脈を考慮しない正規表現 | パターンの前後に境界条件（`\b` やTRPG文脈語）を追加 |

## 良い点

- **セキュリティの多層防御**: SSRF対策（ホワイトリスト + プライベートIP拒否 + HTTPS強制）、XSSサニタイズ、レートリミット、入力バリデーション（クライアント + サーバー）が適切に組み合わされている
- **confidence ベースの編集可否制御**: パーサーの信頼度に応じてフィールドを readOnly / 編集可能に切り替える設計は、UXとデータ品質のバランスが良い
- **テストカバレッジ**: パーサー・サニタイザー・URLバリデータの全てにユニットテストが用意されている
- **著作権への配慮**: 概要文・画像を自動取得せず、事実情報（タイトル・作者・人数・時間）のみを抽出する設計が適切
- **既存パターンとの一貫性**: Result型、isNil、styles.ts分離、Zodスキーマ分離など、プロジェクト規約に忠実

## 総合所見

シナリオ自動インポート機能として、パーサー層（Booth HTML / TALTO API）、セキュリティ層（SSRF / XSS / レートリミット）、UI層（2ステップフォーム）が適切に設計・実装されている。必須の修正事項はなく、推奨指摘も軽微。特にセキュリティ面の多層防御と著作権への配慮が際立つ。サニタイザーのダブルエンコード問題とカラーコントラストの対応を推奨する。
