# CI分割の最終レビュー

> レビュー日: 2026-11-07
> 実装head: 58f993019e0ef36abeb9f67e4cf78883eaddfbd5
> 対象: Batch 3のHosted受入、性能記録、次段候補の整理
> 未コミットのコード差分: 0件（docsを除外するreview-diffの対象なし）
> 判定: 正しさの受入成功。恒常的な性能改善の判断は追加観測待ち。

## 確認範囲

Batch 1/2の実装は3担当の独立レビューと固定比較元の共通品質ゲートを通過済み。最終Batchではコードを変えず、Sol / mediumの独立担当がHosted成果物の受入と時刻計算を点検し、別担当が次段候補の調査メモを監査した。親が保存結果と両レビューを確認し、記録を整理した。

PR10のrun42340586935 attempt1は全7job成功。受入スクリプトはPR/base/head/run/attemptとexact artifact集合、manifest/plan/input、同一HEADの正本、固定履歴を確認し、aggregateとlegacy結果を保存物から再検証した。必須67・extras312、330行（成功319・既存例外11）、6 DB環境cleanup complete・remaining空、7 process終了・exit code 0・エラー0が一致する。coverageStatus=insufficientを全体網羅へ読み替えていない。

## 評価

| 観点 | 結果 |
| --- | --- |
| 規約 | コード差分なし。計画・受入・未検証項目を区別した。 |
| 設計・保守性 | producer/consumer/workflowの一括切替と固定scope、既存ローカル入口の互換性を維持。新しい実装候補は調査として分離。 |
| セキュリティ | 検査は件数だけでなくキー、fingerprint、状態、制御注釈、所有ID、cleanupを照合。raw reporterや資格情報を追加公開していない。 |
| 性能 | raw jobsを別途再計算し1,434→1,131秒、runner和2,398→2,664秒を確認。単発値・追加消費・未計測区間を明記。 |
| UX・アクセシビリティ | UI変更なし。必須check名と失敗時の運用境界を維持。 |
| バグ・ロジック | 異なるhead/run/attempt、欠落・重複・余分な結果、既存例外理由、process/DB回収を検査。Batch 2の制御注釈の指摘は反例10件で修正済み。 |

未解消の必須指摘は0件。

## 観測と限界

- 待ち時間は303秒短縮、runner和は266秒増加。比較対象は同じevent・実行モード・67/312全体計画・runnerラベル。各条件1回で、runner image実版・CPU負荷・キャッシュ温度等の統制や改善分布までは確認していない。
- 時間比較スクリプトは前提をJSONへ出す分析用で、前提が偽でも自動失敗しない。今回は親・独立担当がすべて真と確認した。将来の自動性能ゲートへ流用するなら前提のassertが必要。
- artifact APIのdigestと展開JSONは直接バイト照合していない。GitHubからの取得を出所の根拠にし、内容を正本とreceiptで再検証した。ZIP検証を実施したという主張はしない。
- 成功artifactと公開ログにはDB/build/browser/cleanupを分離する時刻がない。plannerの安全な計時とjob/step時刻だけを実測とし、次段へ内部計測を記録した。
- 調査メモの誤ったquality IDと別runログの混入を訂正した。unitのworker別phase集計をwall時間に加算せず、現行Vitest v3と参考記事のv4を区別した。E2Eの将来移管では検出能力・ledger対応を維持し、今回の330件を永久条件にしない。

## 記録と公開

一次証跡は作業worktreeのignored `test-results/quality/hosted-42340586935-1/`、独立受入は `legacy-shards-hosted-acceptance-42340586935-1.json`、比較は `legacy-shards-timing-42340586935-1.json` に保存した。安全なplanner計時は `pr10-hosted-safe-timing-42340586935-1.json`。これらの生データをGitへ追加しない。

記録コミット後の最終headでも全CIとexact artifact照合を確認し、結果をPR本文へ記録してReadyにする。本番マージとデプロイは本レビューの受入範囲に含めない。

## 最終ローカルゲート

固定base `0a5133d489d14e0a94c6fded66ebb656c6f8869b` のquality `2e4ed912d1d0` / selection `4b916061567c` / verification `20e6352d336f` が成功した。unit91ファイル・1,097成功/既存skip8、tools147ファイル・2,181成功。必須67/67・extras312、legacy330行の新consumer再検証、入力前後一致、6 DB cleanup complete・7 process終了/エラー0を確認。native確認でも専用port・テスト用Node・所有containerは残留0。実装コードはBatch 2から変更していない。

初回のquality `79245388aa54` はDocker停止によりDB起動前に失敗した。CLI版の変更や検査省略は行わず、Docker Desktopを起動して正常性を確認し、新しいgateを全実行した。初回の失敗receiptは保持し、成功データとは分離した。gate後は受入ID・進捗を文書に追記しただけである。
