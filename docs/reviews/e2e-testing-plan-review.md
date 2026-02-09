# E2Eテスト基盤構築計画 レビューレポート

> **レビュー日時**: 2026-02-08
> **対象ファイル**: `docs/plans/e2e-testing-plan.md`
> **総合評価**: C
> **反映ステータス**: 反映済み（2026-02-08）
> **反映内容**: 必須 4件 + 推奨 5件 + 検討 3件

## サマリー

E2Eテスト基盤の段階的構築という方向性は適切で、Playwright設定・CI/CDの設計は堅実。しかし、**`/sessions` が認証保護されている事実の見落とし**と、**Page Objectのロケータが実装と大きく乖離している**点が重要な問題。テストが実行時に即座に失敗する箇所が複数あり、計画修正が必要。

## 評価詳細

### 1. 技術的妥当性 WARN

**良い点**:
- Playwright設定のタイムアウト3層構造（テスト全体30s / アクション5s / アサーション10s）は適切
- CI環境でのworker=1、retry=2は安定性重視で妥当
- `webServer`設定で開発サーバーの自動起動をサポート

**問題点**:
- **CI環境でのビルドコマンド**: `webServer.command` が `pnpm dev` だが、CI環境では `pnpm build && pnpm start` でプロダクションビルドをテストすべき。Turbopackの開発サーバーとプロダクションビルドで挙動が異なる可能性がある
- **Chromiumのみ**: 初期フェーズとしては妥当だが、Cloudflare Pages上のプロダクション環境はモバイルユーザーも多い。将来的にmobileプロジェクトの追加を検討すべき旨の記載がない
- **`pnpm prepare`（PandaCSS codegen）**: CIのE2Eジョブで `pnpm prepare` を実行しているが、`pnpm dev` 実行時にもcodegenが走るため二重実行になる可能性。ただし冪等なので実害はない

### 2. 網羅性・考慮漏れ NG

**重大な見落とし**:

1. **`/sessions` は認証保護されている**: `src/middleware.ts` で `/sessions` は保護ルートとして定義されており、未認証ユーザーは `/` にリダイレクトされる。Step 9の「公開セッション一覧テスト」は、認証なしでは `/sessions` にアクセスできないため**全テスト失敗**する

   ```typescript
   // src/middleware.ts
   const isProtectedRoute =
     request.nextUrl.pathname.startsWith('/home') ||
     request.nextUrl.pathname.startsWith('/sessions') ||  // ← 保護されている
     request.nextUrl.pathname.startsWith('/profile');
   ```

2. **ランディングページのタイトル確認**: Step 4のスモークテストで `toHaveTitle(/scenario-manager/i)` としているが、実際の `<title>` がこのパターンに一致するか未確認。Next.jsの `metadata` 設定次第では失敗する

3. **既存DBデータへの依存リスク**: 「既存DBデータを使った読み取り専用テスト」と記載しているが、開発環境・CI環境でDBにシナリオデータが1件も存在しない場合、「シナリオカードが表示される」テストが失敗する。CI環境の接続先DB（本番 or ステージング）が明記されていない

4. **テスト間の順序依存**: Step 6の「シナリオカードをクリックすると詳細ページに遷移する」はDBにデータがある前提。`fullyParallel: true` で並列実行されるため、テスト間の暗黙的な依存に注意が必要

**軽微な見落とし**:
- `.gitignore` への `playwright-report/` と `test-results/` の追加が計画にない
- E2Eテスト実行後のアーティファクト（スクリーンショット、トレース）のローカル保存先の整理

### 3. セキュリティ OK

- E2Eテストは読み取り専用で、書き込み操作を含まない
- GitHub Secretsで環境変数を管理しており、ハードコードなし
- `SUPABASE_SERVICE_ROLE_KEY` を意図的に除外している点は適切
- CI環境から本番DBへの接続は読み取り専用でも注意が必要だが、Supabase Anon Keyの権限範囲（RLS適用）で制限されるため問題なし

### 4. UX・アクセシビリティ WARN

**問題点**:
- Page Objectのロケータがアクセシビリティ属性に依存しているが、**実際の実装にはラベルが欠けている箇所がある**:
  - 検索インプット: `<label>` なし、プレースホルダーのみ（`"シナリオを検索..."`）
  - ソートセレクト: Ark UIの `Select` コンポーネントで、`getByRole('combobox', { name: /ソート/i })` が機能するか未確認
- テストがアクセシビリティの問題を間接的に検出する機会を活かせていない。将来の拡張に `axe-playwright` を挙げているが、スモークテストの段階から `toBeAccessible()` を入れる価値がある

**良い点**:
- `getByRole`、`getByText` を優先する方針は Playwright のベストプラクティスに沿っている
- セマンティックロケータの使用はアクセシビリティ改善のドライバーになる

### 5. 保守性・拡張性 OK

**良い点**:
- Page Objectパターンの採用（3件以上のテストで導入）は適切なバランス
- テストファイルの分割粒度（smoke / scenarios / sessions）は拡張しやすい
- CI ワークフローの lint-and-unit → e2e の依存関係は合理的

**改善の余地**:
- Page Objectの基底クラスやユーティリティ（共通の待機処理、ナビゲーションヘルパー等）の設計は将来の拡張に備えて検討しておくとよい
- テストデータのセットアップ戦略が「既存DBデータ依存」のみ。テストの安定性のため、将来的にシードデータやフィクスチャの仕組みが必要になる

### 6. プロジェクト整合性 WARN

**問題点**:
- **ロケータと実装の不一致**: 計画内のPage Objectが `data-testid` に依存（`scenario-card`, `scenario-system`, `scenario-player-count`, `scenario-play-time`, `scenario-tags`）しているが、プロジェクトでは `data-testid` をほぼ使用していない。これらを追加するなら計画に明記すべき
- **検索入力のロケータ不一致**: `getByRole('textbox', { name: /シナリオ名/i })` としているが、実際の入力フィールドにはラベルがなく、プレースホルダーは `"シナリオを検索..."` 。`getByPlaceholder('シナリオを検索...')` が正しいロケータ
- **コメント言語**: 計画内のコードコメントは日本語で統一されており、`coding-standards.md` に準拠（OK）
- **`vitest` スクリプト**: 既に `package.json` に存在しないが、`vitest run` は `pnpm vitest` で実行可能（CLAUDE.mdのコマンド表を参照）。計画に `"vitest": "vitest run"` を追加する記述があるが、これは冗長ではないか確認が必要

### 7. 実行可能性 WARN

**問題点**:
- **Step 5-8のロケータ調整**: 「実装時にdev serverで要素を確認しながら修正すること」と注記があるが、調整が必要な箇所が多い。具体的に何を確認すべきかのチェックリストがないと、実装者の負担が大きい
- **CI環境のDB接続**: E2Eテストが既存DBデータに依存するが、CI環境でどのDBに接続するかが不明確。GitHub Secretsの `NEXT_PUBLIC_SUPABASE_URL` が本番DBを指す場合、本番環境への依存が生じる
- **Playwright browserのキャッシュ**: CIでの `pnpm exec playwright install --with-deps chromium` は毎回ダウンロードが走る。`actions/cache` を使ったキャッシュ戦略がないため、CI実行時間が長くなる可能性
- **`pnpm dev` のCI環境での動作**: Turbopackの開発サーバーをCI環境で使う場合、初回起動が遅い（コンパイル待ち）。`webServer.timeout` のデフォルト（120s）で足りるか検証が必要

**良い点**:
- 検証方法セクションが具体的で、ローカル・CI両方のステップが明記されている
- Page Objectロケータの調整手順も記載されている

## 改善提案

### 必須（実装前に対処すべき）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 網羅性 | `/sessions` は Middleware で認証保護されており、未認証E2Eテストではアクセス不可 | Step 9を削除するか、認証テスト（Phase 2）に移動。または `/sessions` を保護対象から外す検討（`/sessions?tab=public` は公開想定のため） |
| 2 | 整合性 | `ScenariosPage` の `searchInput` ロケータが実装と不一致（`/シナリオ名/i` → 実際は `"シナリオを検索..."` プレースホルダー） | `page.getByPlaceholder('シナリオを検索...')` に変更 |
| 3 | 整合性 | `ScenarioDetailPage` が `getByTestId` に全面依存しているが、`data-testid` が実装に存在しない | セマンティックロケータに変更するか、`data-testid` 追加のステップを計画に明記 |
| 4 | 網羅性 | CI環境の接続先DBが不明確。既存データ依存テストの安定性に直結 | 接続先DB（本番 / ステージング / テスト用）を明記し、最低限必要なデータの前提条件を文書化 |

### 推奨（対応が望ましい）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 技術的 | CI環境で `pnpm dev`（Turbopack）を使うのはプロダクションとの乖離リスク | CI用の `webServer.command` を `pnpm build && pnpm start` に変更し、環境変数で分岐を検討 |
| 2 | 網羅性 | `playwright-report/` と `test-results/` が `.gitignore` に未追加 | `.gitignore` への追加ステップを計画に含める |
| 3 | 実行可能性 | CI で Playwright ブラウザのキャッシュが効かず毎回ダウンロード | `actions/cache` を使った Playwright ブラウザのキャッシュを追加 |
| 4 | 整合性 | `ScenariosPage.sortSelect` の `getByRole('combobox', { name: /ソート/i })` が Ark UI の `Select` で機能するか不明 | 実装確認後にロケータを確定するか、仮ロケータであることを明示 |
| 5 | 網羅性 | ランディングページの `<title>` が `/scenario-manager/i` に一致するか未確認 | `src/app/layout.tsx` の `metadata.title` を確認し、スモークテストのアサーションを実態に合わせる |

### 検討（余裕があれば）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | UX | スモークテスト段階から `axe-playwright` でアクセシビリティチェックを導入 | 各スモークテストに `expect(accessibilityScanResults.violations).toEqual([])` を追加 |
| 2 | 技術的 | mobileビューポートのテストプロジェクト追加 | レスポンシブ対応のフィルターUI（BottomSheet / ChipBar / Sidebar）がブレークポイントごとに正しく切り替わるか検証 |
| 3 | 保守性 | Page Object の基底クラス（共通ナビゲーション、待機処理）の設計 | `e2e/pages/base-page.ts` に共通メソッドを集約し、各Page Objectが継承する構造を検討 |
| 4 | 実行可能性 | テストデータのシード戦略 | 将来的に `globalSetup` でテストデータを投入し、`globalTeardown` でクリーンアップする仕組みを検討 |

## 総合所見

計画全体の構造は明確で、段階的な導入アプローチ（スモークテスト → Page Object → 機能テスト → CI）は堅実。特にPlaywright設定のタイムアウト設計やCI/CDワークフローの構成は実用的。

最大の問題は **`/sessions` が認証保護されている事実の見落とし** で、Step 9のテストはそのまま実行すると確実に失敗する。また、Page Objectのロケータが実際のDOM構造と乖離している箇所が多く、「実装時に調整」の範囲を超えている。特に `ScenarioDetailPage` は `data-testid` 全面依存で、プロジェクトの現状と合わない。

これらの必須指摘4件を修正すれば、実装に着手可能な品質になる。
