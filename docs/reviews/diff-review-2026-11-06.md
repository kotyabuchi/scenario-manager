# コード差分レビュー

> **レビュー日時**: 2026-11-06
> **対象範囲**: `8bbfed403163222a566589e56f4c83854219e56f` からの未コミット変更（staged + unstaged + untracked、docs除外）
> **総合評価**: B
> **レビューモード**: パラレル（3エージェント、Sol / medium）

## 変更サマリー

inventory v2にUI操作・描画・props・callbackの観測を追加し、既存Action/RPC graphと関連付ける。productとStorybookを分離し、未解決を記録したうえで既存機能規則と合わせてテストを選択する。v1再観測による専用移行、導入後の不足増加・再追加の拒否、staged/CI receiptへの接続、日程確定2配置の契約とE2Eを追加した。

初期移行は成功。core投影（1351 nodes、5785 edges、360診断）と旧baselineは変更していない。旧新UI観測digestは同じで、旧不足660件から基準2surfaceの契約不足だけを解消し、658件を保存した。この不足集合を検証済みの網羅として扱わない。

## 評価詳細

### 1. コーディング規約準拠 OK

型はZod等から導出し、source・診断・契約の責務を分けている。当初522行だったcallbackテストは共通fixtureを分離して399行に修正。変更した全TS/TSXは500行以内。新しい生成JSON2ファイルだけ、既存generated JSONと同様にBiome formatterを無効化し、writerの正規化形式を維持した。lintとschema・台帳検査は引き続き適用する。

### 2. 設計・保守性 OK

v1 schemaは履歴の正本として保持し、v2のcore投影を固定Git objectと比較する。UI不足とcore不足は保存を分け、変更影響の選択時には和集合で評価する。bindingの入口・mount・props経路を保持し、StorybookのmockをproductのActionに混ぜない。

### 3. セキュリティ OK

運用DB・本番認証処理は変更しない。専用writerはCIでの初期化と導入済みHEADの再生成を拒否する。初回公開は既存M1の外部承認と固定祖先を照合し、worker/aggregateもHEAD・event・attempt・入力・移行digestを独立に検査する。再現できる誤受理は未検出。

### 4. パフォーマンス WARN

訪問数・深さの上限と構文hashの再利用を持つ。一方、実ソース観測はWindowsで約2分、初期移行中の観測時点でCPU約270秒・Working Set約2.7GBを使用した。同一内容のrevisionも再構築するため改善余地がある。Linux fixtureの速度を実ソース解析の速度として代用しない。

### 5. UX・アクセシビリティ WARN

製品UIの要素・ARIA・フォーカスを変更していない。E2Eはroleとaccessible name、および実DOM構造で通常位置と固定バーを区別し、件数・表示・有効状態・他方の非表示を確認してクリックする。CLIの新規不足エラーは対象の手掛かりが不足する。

### 6. バグ・ロジックエラー WARN

callbackの公開alias、再代入、receiver変更、到達不能枝、optional receiver、classを独立再レビューした。実Buttonの括弧付きreturnを認定できない回帰も実ファイルfixtureで修正した。描画側では定数の到達不能JSXを抽出する過剰判定が残る。検証の誤受理とは区別する。

## 指摘一覧

### 必須（マージ前に修正すべき）

残存0件。callbackテストの500行超過は修正し、重点19件・型・Biomeで確認済み。実qualityで見つかった初期移行writerの登録metadata未同期も修正し、Windows/Linuxのwriter24件、型、Biome、独立再レビューを通過した。未登録test・setup・groupを固定し、登録identityを変えずfingerprintだけ同期する。

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
| --- | --- | --- | --- | --- |
| 1 | バグ・ロジックエラー | `scripts/e2e/extractors/surfaces.ts:192` | 定数で描画不能な論理式・条件式の枝もsiteとして観測し、必要以上の不足を作る。 | 真偽が確定する描画条件だけ枝を絞り、未知条件は両枝を保持する。 |
| 2 | パフォーマンス | `scripts/e2e/snapshotInventory.ts:67` | 同一内容のbase/head/indexでもproduct/story Programを毎回再構築する。 | 内容一致を証明できるsnapshotだけ再利用し、同じ入力で時間・メモリを比較する。 |
| 3 | UX | `scripts/e2e/surfaceMigration.ts:105` | UI不足追加エラーでentry/site/codeが表示されず、原因を特定しにくい。 | 追加総数と上限付きの対象サンプル、差異artifact pathを表示する。判定は変えない。 |

### 検討（余裕があれば）

なし。

## 良い点

- 初期移行は旧v1の同条件再観測、core一致、Panda由来、`H ⊆ O` を実検証した。
- 日程確定の2surfaceは各executionで両viewportを操作するテストに結び、同一Action/RPCへの到達も実ソースで確認した。
- 部分保存からの復旧は固定候補と一致するファイルだけ補完し、不一致は拒否する。
- UIの診断・不足は保守的な全件fallbackへ届き、既存の機能別規則を残す。

## 検証と総合所見

Windowsの全ツール回帰129 suites / 1914件、LinuxのCI重点27 suites / 332件が成功。fixture分割後のcallback重点19件、型検査、全体Biomeも成功した。初期移行の生成artifactを3観点で再照合した。

このレビューはコードと静的移行の評価。共通品質ゲート・実DB/browser受入は進行中で、完了の証拠は `test-results/quality/batch14-acceptance.json` と後続の運用記録へ記載する。推奨3件を残し、これらを理由に未実行の検査を成功扱いしない。

## 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
| --- | --- | --- | --- |
| `.github/workflows/test.yml` | +14 | -0 | 変更 |
| `biome.json` | +5 | -1 | 変更 |
| `e2e/isolated/schedule-confirmation.spec.ts` | +17 | -2 | 変更 |
| `e2e/ledger/contracts/schedule-surfaces.json` | +168 | -0 | 新規 |
| `e2e/ledger/inventory.generated.json` | +78029 | -3 | 変更 |
| `e2e/ledger/legacy-tests.generated.json` | +4 | -4 | 変更 |
| `e2e/ledger/scenarios/schedule.json` | +10 | -0 | 変更 |
| `e2e/ledger/surface-migration.json` | +19 | -0 | 新規 |
| `e2e/ledger/surface-pending.json` | +11748 | -0 | 新規 |
| `e2e/pages/schedule-confirm-page.ts` | +33 | -2 | 変更 |
| `scripts/e2e/ciAggregate.ts` | +4 | -0 | 変更 |
| `scripts/e2e/ciBootstrap.test.ts` | +8 | -0 | 変更 |
| `scripts/e2e/ciContext.ts` | +7 | -1 | 変更 |
| `scripts/e2e/ciPlan.test.ts` | +2 | -0 | 変更 |
| `scripts/e2e/ciPlan.ts` | +4 | -1 | 変更 |
| `scripts/e2e/ciRuntime.test.ts` | +17 | -3 | 変更 |
| `scripts/e2e/ciShard.ts` | +14 | -9 | 変更 |
| `scripts/e2e/ciStaticReport.ts` | +19 | -2 | 変更 |
| `scripts/e2e/extractors/callbackAdapters.ts` | +428 | -0 | 新規 |
| `scripts/e2e/extractors/callbackOptional.test.ts` | +125 | -0 | 新規 |
| `scripts/e2e/extractors/callbackResults.ts` | +127 | -0 | 新規 |
| `scripts/e2e/extractors/callbackTruth.ts` | +129 | -0 | 新規 |
| `scripts/e2e/extractors/callbacks.test.ts` | +399 | -0 | 新規 |
| `scripts/e2e/extractors/callbacks.ts` | +498 | -0 | 新規 |
| `scripts/e2e/extractors/dependencies.test.ts` | +16 | -4 | 変更 |
| `scripts/e2e/extractors/surfaceAdapters.ts` | +480 | -0 | 新規 |
| `scripts/e2e/extractors/surfaceChildForwarding.ts` | +77 | -0 | 新規 |
| `scripts/e2e/extractors/surfaceLocator.ts` | +62 | -0 | 新規 |
| `scripts/e2e/extractors/surfaceProps.ts` | +276 | -0 | 新規 |
| `scripts/e2e/extractors/surfaceRoots.ts` | +202 | -0 | 新規 |
| `scripts/e2e/extractors/surfaceSites.ts` | +138 | -0 | 新規 |
| `scripts/e2e/extractors/surfaceTypes.ts` | +74 | -0 | 新規 |
| `scripts/e2e/extractors/surfaces.test.ts` | +456 | -0 | 新規 |
| `scripts/e2e/extractors/surfaces.ts` | +456 | -0 | 新規 |
| `scripts/e2e/fixtures/selection.ts` | +8 | -2 | 変更 |
| `scripts/e2e/fixtures/surfaceCallbacks.ts` | +141 | -0 | 新規 |
| `scripts/e2e/fixtures/surfaceConfirm.ts` | +141 | -0 | 新規 |
| `scripts/e2e/fixtures/surfaceLedger.ts` | +29 | -0 | 新規 |
| `scripts/e2e/githubEventStatic.test.ts` | +17 | -2 | 変更 |
| `scripts/e2e/impactGraph.ts` | +7 | -2 | 変更 |
| `scripts/e2e/inventory.test.ts` | +8 | -2 | 変更 |
| `scripts/e2e/inventory.ts` | +60 | -6 | 変更 |
| `scripts/e2e/inventoryPrimitives.ts` | +18 | -0 | 新規 |
| `scripts/e2e/inventorySchema.ts` | +45 | -15 | 変更 |
| `scripts/e2e/ledgerRefresh.ts` | +250 | -21 | 変更 |
| `scripts/e2e/ledgerSurfaceRecovery.test.ts` | +380 | -0 | 新規 |
| `scripts/e2e/ledgerSurfaceRefresh.test.ts` | +500 | -0 | 新規 |
| `scripts/e2e/prepareChangedVerification.test.ts` | +13 | -6 | 変更 |
| `scripts/e2e/prepareChangedVerification.ts` | +2 | -1 | 変更 |
| `scripts/e2e/prepareVerification.test.ts` | +4 | -1 | 変更 |
| `scripts/e2e/prepareVerification.ts` | +5 | -1 | 変更 |
| `scripts/e2e/requirements.test.ts` | +8 | -2 | 変更 |
| `scripts/e2e/runChangedVerification.test.ts` | +2 | -0 | 変更 |
| `scripts/e2e/snapshotInventory.ts` | +11 | -8 | 変更 |
| `scripts/e2e/source.test.ts` | +26 | -0 | 変更 |
| `scripts/e2e/source.ts` | +19 | -6 | 変更 |
| `scripts/e2e/sourceFiles.ts` | +8 | -0 | 変更 |
| `scripts/e2e/stagedLedger.test.ts` | +20 | -0 | 変更 |
| `scripts/e2e/stagedLedger.ts` | +14 | -1 | 変更 |
| `scripts/e2e/staticGate.test.ts` | +10 | -1 | 変更 |
| `scripts/e2e/staticGate.ts` | +27 | -3 | 変更 |
| `scripts/e2e/surfaceGate.test.ts` | +273 | -0 | 新規 |
| `scripts/e2e/surfaceGate.ts` | +206 | -0 | 新規 |
| `scripts/e2e/surfaceInventory.test.ts` | +128 | -0 | 新規 |
| `scripts/e2e/surfaceInventory.ts` | +103 | -0 | 新規 |
| `scripts/e2e/surfaceMigration.test.ts` | +208 | -0 | 新規 |
| `scripts/e2e/surfaceMigration.ts` | +178 | -0 | 新規 |
| `scripts/e2e/surfaceMigrationObservation.test.ts` | +346 | -0 | 新規 |
| `scripts/e2e/surfaceMigrationObservation.ts` | +247 | -0 | 新規 |
| `scripts/e2e/surfaceMigrationSchema.ts` | +60 | -0 | 新規 |
| `scripts/e2e/surfacePending.ts` | +165 | -0 | 新規 |
| `scripts/e2e/surfacePolicy.test.ts` | +185 | -0 | 新規 |
| `scripts/e2e/surfaceProjection.ts` | +97 | -0 | 新規 |
| `scripts/e2e/surfaceReceipt.test.ts` | +264 | -0 | 新規 |
| `scripts/e2e/surfaceReceipt.ts` | +146 | -0 | 新規 |
| `scripts/e2e/surfaceReferences.ts` | +142 | -0 | 新規 |
| `scripts/e2e/surfaceSchema.ts` | +135 | -0 | 新規 |
| `scripts/e2e/surfaceSelection.test.ts` | +134 | -0 | 新規 |
