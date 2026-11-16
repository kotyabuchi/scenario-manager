# Supabase image 準備の比較結果と A2 取り込み

2026-11-15。ユーザー承認により A2 を PR #10 に取り込む。Draft・未マージを維持し、本番デプロイは行わない。

## 採用範囲

- 隔離 E2E の生成設定だけ `[storage] enabled = false` とし、起動対象から `storage-api` を除外する。通常開発の `supabase/config.toml`、本番、migration/seed は変更しない。
- 再現検査の必須 image 集合を DB / PostgREST / Kong / GoTrue の4サービスに合わせる。DB入力・catalog期待値・認証・所有権・cleanup の検査は維持する。
- 固定対象の直接参照検索と既存検査では Storage の使用を確認していない。ただし動的・間接利用の完全な不在は未保証。Storage を使うテストの追加時は、有効化した専用環境と検査対象を設計する。
- 比較実験で使った共通 image 観測を維持する。起動後の所有 image ID/tag/RepoDigest と runner 情報を制限された形式で記録する。秘密や Docker inspect の生出力は公開しない。観測失敗は既存の必須検査を成功扱いする理由にしない。
- registry は `public.ecr.aws`、CLI は `2.75.0`、PostgreSQL は17を維持する。GHCR 切替・tar/save/load cache・先読みは取り込まない。

## 実験条件と結果

固定 source `cc5830aaf9e364ea3d6134e94dc25eac44544876`、共通観測 `723a0458b6cb085792466248886fb8e38969857e`、main base `e9427ba2fb1fbeb8ead90970d45bd24c47bf9fa0`。各条件を独立 branch/worktree/Draft PR で実装・検証した。各PRの表示差分には未マージ PR #10 の共通履歴も含まれる。

事前の除外は realtime / imgproxy / mailpit / postgres-meta / studio / edge-runtime / logflare / vector / supavisor。基準の稼働対象は上記4サービスとStorage。Cloudflare workflowは main push または明示的workflow_dispatchだけで起動することを確認した。

各試行は workflow 全体の再実行。3 shard を独立した3反復には数えない。Bは attempt1/3/5を新しいキーのmiss/save、2/4/6をexact hitとした。基準は6回、他の単独条件は各3回。組合せは単独A2/Cを各3回受け入れた後に3回実施した。

| 条件 / PR | Test run / attempt | workflow wall 中央値 [範囲] 秒 | 判断 |
|---|---|---:|---|
| [基準 #12](https://github.com/kotyabuchi/scenario-manager/pull/12) | [43683511709](https://github.com/kotyabuchi/scenario-manager/actions/runs/43683511709) / 1–6 | 900 [753–997] | 基準保持 |
| [A: 常駐Storage除外 #11](https://github.com/kotyabuchi/scenario-manager/pull/11) | [43683429484](https://github.com/kotyabuchi/scenario-manager/actions/runs/43683429484) / 1–3 | 967 [918–983] | 初期化用取得が残るため単独不採用 |
| [A2: Storage設定も無効化 #15](https://github.com/kotyabuchi/scenario-manager/pull/15) | [43687416350](https://github.com/kotyabuchi/scenario-manager/actions/runs/43687416350) / 1–3 | 808 [797–943] | 今回採用する対象 |
| [B: image cache #13](https://github.com/kotyabuchi/scenario-manager/pull/13) | [43683581203](https://github.com/kotyabuchi/scenario-manager/actions/runs/43683581203) / 1–6 | miss1102 [987–1135] / hit949 [937–1087] | 今回の方式は不採用 |
| [C: GHCR #14](https://github.com/kotyabuchi/scenario-manager/pull/14) | [43683919200](https://github.com/kotyabuchi/scenario-manager/actions/runs/43683919200) / 1–3 | 939 [897–989] | 保留 |
| [A2+C #16](https://github.com/kotyabuchi/scenario-manager/pull/16) | [43691741443](https://github.com/kotyabuchi/scenario-manager/actions/runs/43691741443) / 1–3 | 825 [811–872] | A2への追加効果が不明確で保留 |

workflow wall は最初のjob開始〜最後のjob終了で、初期queueを含まない。Azure系 image `20261111.370.1` / kernel `7.0.0-1017-azure` とAWS系 `20261111.127.1` / `7.0.0-1014-aws` が混在する。Cの9 shardだけはすべてAzure系だった。物理ホスト・ネットワーク・I/O負荷を固定できず、時刻・並行負荷・順序も無作為化されていない。全体中央値差を因果的な改善率にしない。

### A2を選んだ根拠と限界

同じ job/image/kernel 層の初回start中央値は次のとおり。括弧は試行数。A2は小標本で、確定改善率ではない。

| job / 層 | 基準 秒 (n) | A2 秒 (n) | A2+C 秒 (n) |
|---|---:|---:|---:|
| required / Azure | 121.867 (6) | 99.760 (1) | 100.987 (1) |
| desktop / Azure | 115.932 (3) | 103.060 (2) | 106.380 (1) |
| mobile / Azure | 118.583 (4) | 103.043 (2) | 106.301 (2) |
| required / AWS | 未観測 (0) | 59.231 (2) | 58.888 (2) |
| desktop / AWS | 66.935 (3) | 59.914 (1) | 60.162 (2) |
| mobile / AWS | 66.868 (2) | 60.306 (1) | 58.927 (1) |

Aは初回9起動すべてでStorage migration用fallback pullを観測した。[CLI 2.75.0のinitSchema15](https://github.com/supabase/cli/blob/v2.75.0/internal/db/start/start.go#L316-L335)はStorage.Enabledを参照するため、常駐コンテナ除外だけではこの取得を止めない。A2と組合せは各18起動の観測でStorage pull markerが0。ログにない通信の不存在までは保証しない。A2はこの処理除去、既存検査成功、対応する層で短い観測を合わせて採用し、追加効果の方向が揃わないGHCR変更は保留した。

### cache・CLI・97秒待ち

Bの5 imageの生tarは4,540,481,536 bytes、圧縮cacheは約1.29GB/entry。miss側の保存・検証・圧縮/uploadは51.7–71.7秒/shard。hit側の復元・検証・load・inspectは86.1–160.5秒、うちdocker loadは61.4–128.5秒だった。初回startだけなら約25秒でも、前後のcache費用を加えると対応する基準より大きい。同一run内の制御miss/hitであり、新run・別PRのhit率や自然失効は未評価。今回の方式を不採用とし、所有cache9件を削除して固有namespace残存0を確認した。

CLIバイナリ導入stepは72 E2E jobで2–3秒、中央値3秒。Docker image準備とは別である。整数秒の0表示をゼロコストとは解釈しない。

基準attempt1 requiredでdatabase→schema96.933秒を再現した。database marker20.257秒、postgres fallback20.647秒、最終Download complete24.339秒、最終Pull complete105.163秒、DB作成105.211秒。DB作成前が84.954秒、DB起動→healthyは約10–11秒だった。Download complete→Pull completeの80.824秒を正味展開時間とは断定できない。layerの並行処理・開始表示欠落があり、fallback直接原因と転送/展開の完全分離は残件。

## 同等性・レビュー

全24試行でhead/base/run/attempt、7 job成功、6組artifactの集合・SHA256を独立照合。required67/extras312/legacy330行/既存例外11、3 planDigest、migration25+metadata3+seed1の29入力が各shard開始/終了で一致した。DB cleanup144件・process exit168件・image観測144回を確認。テスト結果9,096記録はexpected8,832/既存skip264、記録上のretry/flaky/不明0。fixture内部の通信retryは別である。

この24試行のHosted実行時catalog fingerprintはartifactに未保存。固定期待値検査の成功は確認できるが直接fingerprint比較と同一視しない。coverageStatus=insufficient、pending core435/UI658、Storage API/schema・認可全体の未証明を維持する。A2のnative2回は最終コミット前の2行差分で実行したため、最終HEADのnative証拠とは扱わない。PR #10への取り込み後は新しい固定HEADで別途検証する。

実装・検証・専門レビューはTerra/high、親が受入・比較・採否を判断した。ローカル詳細証跡は元worktreeの `test-results/quality/image-experiments/`、公開結果は各Draft PR本文に保持する。実験の成功反復を、従来のNext.js chunk取得等の間欠失敗の根治と解釈しない。

## 取り込み後の検証と残件

取り込み元A2は `3c754c12d6c644ff01652f4a0cd5b5b78fa1d19c`。機能・観測7ファイルを同一内容で取り込んだ後、レビューで見つかった規約違反を直すため、観測モジュールの3つのnull/undefined存在判定を既存規約の `ramda.isNil` に統一した。判定対象の型と意味は維持する。実験専用の計画文書はこの結果文書へ整理し、比較元は `cc5830aaf9e364ea3d6134e94dc25eac44544876` に固定する。

1. 限定回帰、型・lint、差分レビューを通過後にcommitする。
2. 固定HEADで `pnpm quality:changed --base cc5830aaf9e364ea3d6134e94dc25eac44544876` を実行し、必須結果と所有cleanupを独立照合する。Docker Desktopは操作しない。
3. PR #10へpushし、同じ最終HEADのTest全7 job・Code Duplication Checkと6組artifactを確認する。失敗を隠すfail-only rerunは使わない。
4. 最終head/run/attempt・検証結果はPR #10本文へ記録する。結果追記だけのcommitでCIを再起動し続けない。Draft・未マージを維持し、本番デプロイを起動しない。

| 優先度 | 残件 | 次の判定条件 |
|---|---|---|
| 完了 | Hosted catalog fingerprintの証拠契約 | 固定HEAD `215fce8` の全体qualityとHosted 6 DB stage・改変拒否を独立受入。過去artifactの欠測は補完しない。詳細は[計画](e2e-hosted-catalog-evidence.md) |
| 高 | fallback直接理由とlayer別の転送/展開/I/O観測 | 秘密を含む生ログを公開せず、重複区間や欠測を残す |
| 中 | 既存の間欠失敗の原因調査 | 過去失敗と新HEAD成功を区別し、再現・反例で検証する |
| 中 | E2E責務移管・重複整理、固定500ms待機 | [テスト層の計画](e2e-test-layer-performance.md)の旧→新台帳契約・接続保証を先に満たす |
| 保留 | GHCR・別cache方式 | 同runner層の反復、追加費用込み、実運用hit率の根拠が必要 |
| 保留 | 常設runner | 今回導入しない。未信頼PR隔離、更新監視、所有cleanup、運用責任者、総費用の条件を満たしてから再検討 |
