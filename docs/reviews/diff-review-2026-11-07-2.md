# コード差分レビュー

> **レビュー日時**: 2026-11-07
> **対象範囲**: HEAD `5d4988b140dff1ed8857300779dabb5a3624dfaf` からの未コミット差分（docsを除外、未追跡を含む）
> **変更ファイル数**: 21 files、追加1,112行・削除121行
> **総合評価**: A（必須指摘1件を修正、再確認済み）
> **レビューモード**: パラレル（Sol / medium、独立3担当）

## 変更サマリー

legacy CIをdesktopとmobileの固定2ジョブに分割し、planner・worker・aggregate・workflowを同じschemaVersion 2へ切り替える。各workerは全登録の照合を維持しながら割当2projectだけ実行する。追加した安全な結果行を同一HEADの正本と共通reportへ結び付け、全体の欠落・重複・例外理由・所有IDの混入を拒否する。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
| --- | --- | --- | --- |
| .github/workflows/duplicates.yml | 1 | 1 | 変更 |
| .github/workflows/test.yml | 61 | 18 | 変更 |
| scripts/e2e/ciAggregate.ts | 8 | 3 | 変更 |
| scripts/e2e/ciCli.test.ts | 10 | 3 | 変更 |
| scripts/e2e/ciContext.ts | 13 | 1 | 変更 |
| scripts/e2e/ciDiagnostics.ts | 2 | 3 | 変更 |
| scripts/e2e/ciPartition.test.ts | 201 | 11 | 変更 |
| scripts/e2e/ciPartition.ts | 50 | 13 | 変更 |
| scripts/e2e/ciPartitionAggregate.test.ts | 63 | 7 | 変更 |
| scripts/e2e/ciPartitionAggregate.ts | 33 | 2 | 変更 |
| scripts/e2e/ciPartitionSchema.ts | 25 | 5 | 変更 |
| scripts/e2e/ciPlan.test.ts | 4 | 3 | 変更 |
| scripts/e2e/ciRuntime.test.ts | 96 | 7 | 変更 |
| scripts/e2e/ciShard.ts | 27 | 11 | 変更 |
| scripts/e2e/ciShardArtifacts.ts | 26 | 2 | 変更 |
| scripts/e2e/fixtures/ciPartition.ts | 75 | 17 | 変更 |
| scripts/e2e/fixtures/ciPartitionArtifacts.ts | 65 | 9 | 変更 |
| scripts/e2e/githubEvent.test.ts | 13 | 4 | 変更 |
| scripts/e2e/githubEventSchema.ts | 6 | 1 | 変更 |
| scripts/e2e/ciLegacyResults.ts | 127 | 0 | 新規 |
| scripts/e2e/ciLegacyResults.test.ts | 206 | 0 | 新規 |

## 評価詳細

### 1. コーディング規約準拠 OK

既存Zod schemaと公開型を再利用し、固定所有表からscopeを導出する。any/non-null assertionや本番consoleを追加していない。統合型検査でテスト内のattempt未確認アクセスを検出し、存在確認へ修正した。UI変更はない。

### 2. 設計・保守性 OK

全app planの検査後に固定scopeへ分割し、各scopeの2projectと実planのexact一致を要求する。実行正本は確認済みイベントHEADのGit blobから独立helperで読み、required/plannerへ不要な依存を加えない。worker公開前とaggregateは同じvalidatorを使う。旧ローカルAPIは維持し、CIだけ旧aliasを廃止する。

### 3. セキュリティ OK

normalized行と共通reportのkey・project・唯一attempt・状態を照合し、現/置換元fingerprintと既存例外理由をtrusted正本に照合する。レビュー指摘を受け、testとattempt双方の制御注釈もnormalized行と同じ多重集合であることを要求した。任意custom注釈は従来のreport経路に残るため、receipt全体の秘匿を保証する変更とは扱わない。

### 4. パフォーマンス OK

desktop/mobileはplanner後にrequiredと並列で開始し、各2projectだけを実行する。DB/build/receiptを共有せず、所有環境とcleanupの境界を保持する。全登録再収集と348件規模の再照合は検証要件である。追加runnerのsetup・queue・DB初回起動を含む実測とrunner分数の評価はBatch 3に残る。

### 5. UX・アクセシビリティ OK

アプリUIは変更しない。公開必須check名は維持し、片側だけのrerunでは同attemptの証跡が揃わない旨の既存案内を残す。safe failure marker以外のログを追加公開しない。artifact名と保存先はshard/run/attemptを分離する。

### 6. バグ・ロジックエラー OK

全必須とextrasのexact分割、全体結果の再照合、verification/owner ID一意性を確認した。未知project、cross-shard runner依存、scope欠落、deferred実行、別head/run/attempt、片側failure/cancel/skip、cleanup不備を成功にしない。fixtureも各scopeに2projectを持ち、runtime mockへのscopeと実planの一致を直接検査する。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 対応 |
| --- | --- | --- | --- | --- |
| 1 | セキュリティ・バグ | scripts/e2e/ciLegacyResults.ts:88 | 共通report側だけskip/fixme理由を改変しても、正しいnormalized行のまま受理できた | test/attempt双方のskip・fixme・fail・only・todo注釈をexact比較。10反例の修正前失敗と修正後成功を確認 |

未解消0件。推奨・検討0件。

## 検証

partition24件、planner4件、event27件、CLI/diagnostics16件、最終helper/aggregate/runtime72件が成功。最初の統合型検査のattempt未確認アクセス1件を修正し、再検査が成功。変更コードのBiome、workflowのactionlint 1.7.12、git diff --checkも成功した。注釈の反例10件は修正前に失敗を確認し、任意custom追加を受け入れる肯定例も維持した。

本レビューは共通品質ゲート前に記録した。続けて固定比較元 `0a5133d489d14e0a94c6fded66ebb656c6f8869b` の全体gateを実行し、unique receiptとcleanupを独立に確認する。Hostedでの両165件・全330件と短縮時間はまだ受入済みではない。

## 良い点

- producer/consumer/workflowの契約を一括で切り替え、異なる版や別attemptへのfallbackを設けない。
- 結果を正本から生成して成功扱いせず、保存された実結果と共通reportを再照合する。
- 各workerの局所検査とaggregateの全体検査を併用し、所有ID・cleanupまで検証する。
- 並列化による経過時間短縮と追加runner消費を分けて評価する。

## 共通品質ゲートの受入追記

quality `6abfabb844e4` / selection `b790dc153481` / verification `2feb1eeff6b7` が成功。unit1,097成功・既存skip8、tools147ファイル2,181成功、必須67/67・extras312。保存されたlegacy330件を新consumerで各scope165件として再検査し、共通reportの注釈と正本が一致することを確認した。入力前後一致、6 DB cleanup complete、7 stage process終了/エラー0。native確認でも専用port・テスト用Nodeの残留0。作業用MCP・言語ツールはこの確認の対象外。coverageStatus=insufficientを維持する。

独立受入記録はignored `test-results/quality/sharding-batch2-acceptance.json`。gate後の編集は計画・レビューの受入記録と計時基準の補足だけ。Hosted分割の性能と最終artifact受入はBatch 3で確認する。
