# Playwrightを活かした実装抽出・テスト台帳・品質ゲート 実装レビュー

- レビュー日: 2026-11-06
- 計画: `docs/plans/e2e-ledger-quality-gates.md`
- 判定時点: code HEAD `3a40bfe` の全件quality受入後、ユーザー指示による一時停止。部分/全件shadowは未受入。
- 計画充足度: 96.7%（29/30 Steps）。Step 14-2の受入が未完了。
- サービス品質: B。Part Aは親、Part BはSol/mediumの3担当で並列レビュー。

## サマリー

Batch 1–13は過去の固定HEADでの実受入と現在の実装を照合した。Batch 14は実ページの2操作からAction/RPCまで追跡でき、UI不足の移行と通常増加拒否を接続した。Windowsの共通品質前段4検査とLinux重点fixtureは成功している。最初の共通qualityは登録済み日程確定4実行のfingerprint未同期を検出して停止した。その後writerの限定修正とWindows/Linux各24件、型、Biome、独立レビュー、実移行再実行に成功。その後の共通qualityと全件runtimeも成功した。raw改行差によりfull-requiredへ拡大したため、部分/全件shadowだけを残す。全既存不足の解消、全legacyのcase化、live外部サービス、公開設定は計画の非目標として区別する。

## Part A: 計画充足度

計画にある責務の統合・改名は許容し、実在するファイルで追跡した。過去Batchの検証は実行ログと `docs/testing/e2e-{environment,fixtures,selection,quality}.md`、各Batchのacceptance receiptを再利用した。

| Step | 仕様 | 判定 | 実装・証拠 |
| --- | --- | --- | --- |
| 1-1 | 非書込み検査・tools project | DONE | package.json、scripts/e2e/vitest.config.ts。最新check:ci/type/unit/tools成功 |
| 1-2 | DBテスト分類 | DONE | db-test-files.json、vitest.integration.config/setup、testClientのpreflight。pure 1090成功、既存8skip |
| 2-1 | 決定的source列挙 | DONE | source/sourceFiles/sourceSnapshotSystem、snapshotInventory。Git表記・範囲外・LF/path fixture |
| 2-2 | Nextルート | DONE | extractors/routes、slot/route group/interception fixture。実source観測 |
| 3-1 | Action/API | DONE | extractors/actions/apis。inlineとexport別入口、公開alias、同名負例 |
| 3-2 | 依存・RPC | DONE | extractors/dependencies。既知client由来と未解決診断、日程のRPC経路 |
| 4-1 | 台帳schema | DONE | e2e/ledger/schema、contracts/scenarios。役割・layer・execution・ID整合 |
| 4-2 | 契約validator | DONE | ledger、requirements。新規対象・削除・不正layer・非適用の拒否fixture |
| 5-1 | 実登録列挙 | DONE | discover/discoverIntegration、discoveryBindings、reporters/discovery。全登録55 |
| 5-2 | IDと旧test | DONE | legacy/legacySource、legacy-tests.generated、scenario-panels tags。本文fingerprint・serial group |
| 6-1 | baseline固定 | DONE | baseline/staticGate/trustedRevision。core不足437・digest不変、新規/入替/再追加拒否 |
| 6-2 | 静的CI | DONE | ledgerCheckとtest.ymlへ統合。event由来比較とbootstrap外部承認、readonly検査 |
| 7-1 | 空DB再現 | DONE | supabase migrations/seed、environmentCatalog。承認済み過去SQL修復、fresh再現記録 |
| 7-2 | 環境所有権 | DONE | environmentSchema/Ownership/Lock/Cleanup。remote拒否・競合・中断fixtureと残留照合 |
| 8-1 | actor/data分離 | DONE | e2e/fixtures actors/sessions/authState。独立JWT、UUID/ULID照合、case journal |
| 8-2 | config/cleanup | DONE | playwright.isolated.config、fixtureCleanup、owner。production build、exact ID回収 |
| 8-3 | 旧suite互換 | DONE | runLegacy/legacyProjectRun、legacySeed、legacy-execution。4project受入・例外目録 |
| 9-1 | UI保存/再表示 | DONE | schedule-confirmation.spec、POM、schedule contracts。M2/M3のcreator/keeper×PC/mobile成功 |
| 9-2 | UI失敗境界 | DONE | schedule-confirmation-errors.spec、既存Storybook。拒否・旧値保持・再試行 |
| 10-1 | Action/RPC認可 | DONE | 日程確定integration suite、利用者JWT fixture。匿名/outsider/phase拒否と原子性 |
| 10-2 | integration evidence | DONE | evidence/vitest、discoverIntegration。旧11suiteは未移行目録で区別 |
| 11-1 | 結果照合 | DONE | verifyResults、reporters/results。skip/retry/欠落/cleanup失敗の否定fixture |
| 11-2 | 入力/実行入口 | DONE | fingerprint/run、verificationReceipt/verificationRun。固定入力・個別receipt・owner後始末 |
| 12-1 | 差分選択 | DONE | gitSnapshot/select/snapshotInventory/impact-rules。base/head/dirty/rename/unknown |
| 12-2 | group/shadow | DONE | runChangedVerification/selectionShadow/selectionObservation、Batch12実部分と全件比較。今回v2再受入は14-2に残す |
| 13-1 | 共通quality/hook | DONE | qualityChanged、stagedLedger、lefthook。index構造検査と重い共通gateの分離 |
| 13-2 | CI切替 | DONE | test.yml、ciContext/Partition/Aggregate。Windows CI相当55必須成功・legacy301成功11既存例外 |
| 13-3 | 規約同期 | DONE | testing-patterns、exec-plan正本・export、AGENTS。M3同期検査済み |
| 14-1 | UI/props追跡 | DONE | surface/callback抽出群、product/story別Program。384sites/155bindings、基準2操作からRPCへspot check |
| 14-2 | UI移行と必須化 | PARTIAL | v1投影一致、UI不足660→658、再追加/改変拒否済み。登録metadata同期まで成功。実両配置と全件quality成功。同一snapshotの部分/全件shadow受入待ち |

計画段階のTerraレビューは `e2e-ledger-quality-gates-terra-review.md` と計画r2に対応を記録済み。実装では専用DB・既存suite維持・外部bootstrap承認・group選択・結果欠落検出を実際の入口へ接続している。

## Part B: サービス品質

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| B1 エラー処理 | OK | 初期writerを修正し実再実行・最終qualityに成功。不一致の拒否条件は維持 |
| B2 エッジケース | OK | 不明/0件/部分保存/欠落は拒否または診断。今回の両配置4実行と失敗系4実行も成功 |
| B3 進捗表示 | WARN | running/terminal receiptあり。selection preparationの下位段階通知が接続されていない |
| B4 セキュリティ | OK | local所有権、JWTとservice-role分離、公開artifact許可リスト、CI writer拒否 |
| B5 性能 | WARN | 訪問深さ/数上限あり。同一snapshotのProgram/列挙/checkpoint再構築は改善余地あり |
| B6 a11y | OK | role/nameで両配置を実操作し、既存suiteも受入。新しい製品UIは追加していない |
| B7 テスト | WARN | Windows129 suites/1919件、Linux27/332・3/19・writer2/24成功。全件quality必須55/55成功、部分/全件shadowだけ未了 |
| B8 規約 | OK | TS/TSX各500行以内、Zod型導出、生成物分離、変更製品UIなし |

## 改善提案

### 必須

| # | 対象 | 内容 | 解消条件 |
| --- | --- | --- | --- |
| R1（修正済み） | ledgerRefresh/staticGate | 初期移行で登録済み4実行の本文fingerprintを同期できない | Windows/Linux各24件、独立レビュー、実移行再実行、最終qualityのM1再照合も成功 |
| R2 | Batch14受入 | 両配置・全件・cleanupは成功したが、v2の部分/全件shadow比較が未了 | raw入力の変更をspec1件だけと事前照合し、独立partial/fullの同一snapshot・欠落0を確認する |

### 推奨

| # | 対象 | 内容 |
| --- | --- | --- |
| C1 | runChangedVerification.ts | static-ledger/collection/selectionの進捗通知をreceiptに反映する |
| C2 | prepareChangedVerification.ts、snapshotInventory.ts | 内容一致を証明したsnapshotのinventory/列挙を再利用し、checkpoint重複を減らす。固定入力の独立照合を維持する |
| C3 | extractors/surfaces.ts | 定数false等の描画されないJSX枝の過剰抽出を抑える。未解決の保守的扱いを維持する |
| C4 | surfaceMigration.ts | UI不足増加エラーに追加キーの安全な抜粋を示し、修正対象を探しやすくする |

## 良い点

- source観測と業務契約・実test・実行証拠を区別し、静的な存在確認だけで保存や認可をverifiedにしない。
- v1 coreとv2 UIの不足履歴を分離し、初回移行・通常増加拒否・過去receipt拒否を同じ入口に接続している。
- 実Buttonの構文をfixtureへ使い、抽象fixtureだけでは見落とした描画回帰を検出した。
- 既存suiteをlocal互換経路へ移し、未登録・既存例外・未実行・必須成功の数を混同しない。

## 総合所見

実装の主な責務は揃っている。実装系列25コミットと全件受入は完了した。M4はR2のshadow実証を閉じてから確定する。ユーザーの一時停止指示により追加実行はしていない。GitHub hosted workflow、push/PR、運用DB適用、branch protection変更は今回実行していない。
