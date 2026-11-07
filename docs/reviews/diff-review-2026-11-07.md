# コード差分レビュー

> **レビュー日時**: 2026-11-07
> **対象範囲**: HEAD `0a5133d489d14e0a94c6fded66ebb656c6f8869b` からの未コミットBatch 1（docs除外・新規ファイル含む）
> **変更ファイル数**: 11 files、+714/-40 lines
> **総合評価**: A（推奨1件反映後）
> **レビューモード**: パラレル（Sol / medium 3エージェント）

## 変更サマリー

既存E2Eをdesktop／mobileへ分割する前段として、projectの割当実行と検証済み結果の安全な保存を追加した。既存の全4件実行・単独診断・旧receiptを維持し、新CIのworkflowと受信側契約は次Batchで切り替える。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
| --- | ---: | ---: | --- |
| scripts/e2e/legacyResults.test.ts | 188 | 0 | 変更 |
| scripts/e2e/legacyResults.ts | 48 | 0 | 変更 |
| scripts/e2e/run.test.ts | 3 | 0 | 変更 |
| scripts/e2e/runLegacy.test.ts | 122 | 1 | 変更 |
| scripts/e2e/runLegacy.ts | 41 | 8 | 変更 |
| scripts/e2e/runVerificationStages.test.ts | 152 | 3 | 変更 |
| scripts/e2e/runVerificationStages.ts | 44 | 7 | 変更 |
| scripts/e2e/verificationReceipt.test.ts | 45 | 0 | 変更 |
| scripts/e2e/verificationRun.ts | 6 | 0 | 変更 |
| scripts/e2e/verificationSchema.ts | 32 | 21 | 変更 |
| scripts/e2e/legacySafeResults.ts | 33 | 0 | 新規 |

## 評価詳細

### 1. コーディング規約準拠 OK

型は既存project・実行結果・Zod schemaから導出し、any/non-null assertionを追加していない。公開safe schemaの保証範囲を日本語JSDocに追記した。

### 2. 設計・保守性 OK

既存CLIの引数を維持し、内部入口runLegacyScopedとscoped-passedで全件・診断成功を区別する。全登録検査・trusted結果照合・公開可能な形状の役割を分け、旧receiptのoptional互換を維持する。

### 3. セキュリティ OK

全discoveryとproject別実結果を既存validatorへ通してから投影する。deferred実行、現/置換元fingerprint、既存skip/fixme理由、制御注釈の改変を先に拒否する。追加の公開行は成功時の注釈を空にし、例外時は正本の制御注釈だけ残す。既存共通reportの任意注釈経路は変更していないため、receipt全体の非公開保証とは扱わない。

### 4. パフォーマンス OK

割当外projectのDB/build/browserを起動せず、既存owner・cleanupを共有する。全件入口の二重集約は旧raw結果返却互換のため残す。小規模JSONの再検査を測定なしで削らない。CI全体の高速化実測はBatch 3に残る。

### 5. UX・アクセシビリティ OK

UIの変更なし。運用CLIの全件・単体診断を維持し、割当失敗や未起動stageを成功表示に変えない。scope/plan不一致は他profileを含む環境作成前に拒否する。

### 6. バグ・ロジックエラー OK

自己・親レビューでscope逆順時のstage/checkpoint順序不整合を発見し、parseした独立scope配列からapp stageと実行順を揃えた。非app順とscope省略時の順は維持する。失敗・abort・cleanup不備では後続を起動せず、集約成功区分・実結果・安全な結果・個別project成功が揃う場合だけresultsCheckedを付ける。

## 指摘一覧

### 必須（マージ前に修正すべき）

未解消0件。

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 対応 |
| --- | --- | --- | --- | --- |
| 1 | 規約・設計 | scripts/e2e/legacySafeResults.ts:4 | 形状schemaとtrusted集合/fingerprint/skip理由の照合境界を明記する | JSDoc追加済み、Biome成功 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 判断 |
| --- | --- | --- | --- | --- |
| 2 | パフォーマンス | scripts/e2e/runLegacy.ts:162 | 全件入口でscope集約と全件集約を両方行う | 全件exact照合と旧raw結果の互換を維持。実測で問題になった場合だけ共通投影を検討 |

## 検証

証跡側2スイート85件、runner側3スイート77件がホスト権限で成功。型検査と変更ファイルBiomeも成功した。初回sandboxでは既存TEMP fixtureのatomic renameがEPERMとなり、同じ検査を通常ホスト権限で再実行して解消した。レビュー担当はコードを静的照合し、テスト実行結果は実装担当と親の記録から確認した。共通品質ゲートはこのレビュー後に固定比較元0a5133dで実行する。

## 良い点

- 任意注釈を除去する前にtrusted検査するため、失敗を投影で隠せない。
- scope外も含めた全登録検査と、割当内のexact結果検査を併用している。
- 欠落・重複・入替・fingerprint・skip理由・cleanup・abortを個別の反例で検査している。
- 新CIのtrusted consumer照合はBatch 2の明示的作業として残し、optional schemaだけで独立受入済みとは扱っていない。

## 総合所見

Batch 1の実装・限定検証・最終差分レビューが完了した。共通品質ゲートを通過させてコミットし、その後にplanner/worker/aggregate/workflowの契約を同一revisionで切り替える。
## 共通品質ゲートの受入追記

quality f257bf5335a2 / selection 4e6a57a425dc / verification 7647f9368f10 が成功。unit1,097成功・既存skip8、tools146ファイル2,132成功、必須67/67・extras312。保存した330件のsafe legacy結果を正本validatorで独立再照合し、成功319・既存例外11とproject別57/57/108/108を確認した。入力前後一致、6 DB環境cleanup complete、7 stage process終了/エラー0。native確認で専用portとテスト用Nodeの残留0。独立受入記録はignored test-results/quality/sharding-batch1-acceptance.json。全アプリ網羅ではなく既存coverageStatus=insufficientを維持する。
