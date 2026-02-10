> **反映ステータス**: 反映済み（2026-02-10）
> **反映内容**: 必須 0件 + 推奨 5件 + 検討 2件

# コード差分レビュー

> **レビュー日時**: 2026-02-10
> **対象範囲**: コミット `dd85eeb` (test(e2e): E2Eテスト基盤を構築)
> **変更ファイル数**: 12 files (+274, -85)
> **総合評価**: B

## 変更サマリー

E2Eテスト基盤の構築。Page Objectパターンの導入、Playwright設定の強化、GitHub Actions CIワークフローの追加、既存テストのリファクタリング、スモークテスト・a11yテストの新規作成を含む。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `.github/workflows/test.yml` | +56 | -0 | 新規 |
| `.gitignore` | +2 | -1 | 変更 |
| `e2e/example.spec.ts` | -0 | -14 | 削除 |
| `e2e/pages/base-page.ts` | +14 | -0 | 新規 |
| `e2e/pages/scenario-detail-page.ts` | +27 | -0 | 新規 |
| `e2e/pages/scenarios-page.ts` | +46 | -0 | 新規 |
| `e2e/scenarios/detail.spec.ts` | +36 | -0 | 新規 |
| `e2e/scenarios/search.spec.ts` | +45 | -85 | 変更 |
| `e2e/smoke.spec.ts` | +34 | -0 | 新規 |
| `package.json` | +5 | -1 | 変更 |
| `playwright.config.ts` | +15 | -3 | 変更 |
| `pnpm-lock.yaml` | +19 | -0 | 変更 |

## 評価詳細

### 1. コーディング規約準拠 OK

- Import順序: 外部パッケージ → 内部モジュールの順で適切
- コメント: 日本語で記述されている
- JSDoc: 各Page Objectクラスとメソッドに記述あり
- 命名規則: PascalCaseクラス名、camelCaseメソッド名、すべて適切
- `any`型・Non-null assertion: 使用なし
- `console.log`: 使用なし

### 2. 設計・保守性 WARN

- Page Objectパターンの導入は保守性を大幅に向上させている
- BasePage抽象クラスで共通処理を集約している点は良い設計
- ただし、以下の改善点あり（後述）

### 3. セキュリティ WARN

- CIワークフローでSupabase環境変数を`secrets`から注入しており、ハードコードは避けている
- ただし`NEXT_PUBLIC_*`プレフィックスの変数はクライアントバンドルに含まれる性質のため、本来機密性は低い。実害は小さいが、不要にsecretsで管理するとCI設定忘れ時にテストが無言で失敗するリスクがある

### 4. パフォーマンス OK

- `fullyParallel: true` でローカル4ワーカー並列実行は適切
- CI環境では`workers: 1`で安定性を優先している
- ブラウザキャッシュ（`actions/cache`）でCI時間を短縮している
- CIでchromiumのみインストール（`--with-deps chromium`）でインストール時間を最適化

### 5. UX・アクセシビリティ OK

- a11y違反を`test.fixme()`で明示的に技術的負債として管理している
- axe-coreを導入し、将来的なWCAG準拠を目指す基盤が整っている

### 6. バグ・ロジックエラー WARN

- テストの堅牢性に関する指摘あり（後述）

## 指摘一覧

### 必須（マージ前に修正すべき）

（なし）

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 設計 | `e2e/scenarios/detail.spec.ts:10-35` | 2つのテストが同じ前処理（一覧→カードクリック）を重複実行している。`beforeEach`で共通化すれば、テスト実行時間とコードの重複を削減できる | `search.spec.ts`と同様に`beforeEach`で`scenariosPage`と`detailPage`を初期化し、カードクリックまでを共通化 |
| 2 | バグ | `e2e/pages/scenario-detail-page.ts:18` | `page.getByText(/\d+人/)` は「1人」「3〜5人」等にマッチするが、ページ内の他テキスト（例: レビュー「3人が評価」等）にも誤マッチする可能性がある | ScenarioInfoコンポーネント内に限定したロケータ（例: `page.locator('article').getByText(/\d+人/)`）に変更 |
| 3 | バグ | `e2e/pages/scenario-detail-page.ts:19` | `page.getByText(/時間|分/)` は「時間」「分」を含む任意のテキストにマッチするため、意図しない要素を選択する可能性が高い | より具体的なパターン（例: `/\d+[〜~]\d+時間/` や特定のセクション内に限定）に変更 |
| 4 | 設計 | `e2e/scenarios/search.spec.ts:28` | 検索キーワード`'山'`はDBのシードデータに依存している。データが変わるとテストが壊れる | テスト用の固定データに対するコメントを追加するか、テストヘルパーで定数管理 |
| 5 | セキュリティ | `.github/workflows/test.yml:48-50` | `NEXT_PUBLIC_*`環境変数が未設定の場合、ビルドは成功するがランタイムでSupabase接続エラーが発生し、E2Eテストが不明瞭な理由で失敗する | 環境変数の存在チェックステップを追加するか、READMEにGitHub Secrets設定手順を記載 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 6 | 設計 | `.github/workflows/test.yml:29-39` | `lint-and-unit`と`e2e`ジョブで`checkout` → `pnpm setup` → `node setup` → `install` → `prepare`が完全に重複している | 再利用可能なcomposite actionまたはジョブのartifact共有で重複を削減（ただしCI設定の複雑化とのトレードオフ） |
| 7 | 設計 | `e2e/pages/scenarios-page.ts:20` | `a[href^="/scenarios/0"]`はULID仕様に依存したセレクタ。将来ID生成方式が変わると壊れる | コメントでULID依存を明記済みなので現状維持でも可。`data-testid`の導入も検討 |
| 8 | 設計 | `playwright.config.ts:46` | CIでE2Eジョブはchromiumのみインストールしているが、`projects`にmobile-chromeが含まれている。CIではmobile-chromeプロジェクトも実行されるのか確認が必要 | mobile-chromeもchromiumエンジンなので動作するが、意図的であることをコメントで明記 |
| 9 | 設計 | `e2e/smoke.spec.ts:1` | `AxeBuilder`がimportされているが、スモークテストのdescribe内では使用されていない。`test.fixme`内でのみ使用 | fixmeテストが有効化されるまでimportは残して問題ないが、lint警告が出ないか確認 |

## 良い点

- **Page Objectパターンの導入**: UI変更時の修正箇所がPage Objectに集約され、テストの保守性が大幅に向上
- **`isVisible()` スキップパターンの排除**: 旧テストの条件分岐を廃止し、テストの信頼性が向上
- **`:visible` 疑似セレクタの活用**: レスポンシブUIでの2重要素問題を適切に解決
- **`domcontentloaded` の使用**: Next.js dev serverのHMR WebSocket問題を回避する適切な選択
- **CI/CDワークフローの設計**: lint→E2Eの依存関係、ブラウザキャッシュ、レポートのアーティファクト保存まで一通り網羅
- **a11yテストの技術的負債管理**: `test.fixme()`で明示的にスキップし、修正すべき違反内容をコメントで記録

## 総合所見

E2Eテスト基盤として必要な要素が一通り揃っており、全体的に良い品質。Page Objectパターンの導入と既存テストのリファクタリングにより、保守性の高いテスト構造が確立されている。

主な改善ポイントは、ScenarioDetailPageのロケータの曖昧さ（`/\d+人/`, `/時間|分/`）。これらは他の要素に誤マッチする可能性があり、テストの安定性に影響し得る。`article`内に限定するなどのスコーピングで対処可能。

CI環境変数の設定手順のドキュメント化も、チームでの運用を考えると早めに対応しておきたい。
