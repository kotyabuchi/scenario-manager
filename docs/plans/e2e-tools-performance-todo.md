# 品質ゲート用ツールテストの高速化

## 対象と実装

専用worktree `e2e-ui-prerequisite/scenario-manager`、branch `perf/e2e-tools` で実装。比較元は PR #8 の merge commit `60e7d1e44d82af2e41427a57c227147c51302fbe`。元の計画を置いた `e2e-ledger-plan` と通常の開発checkoutは変更していない。PR #8のマージ、本番デプロイ、main CI、本番閲覧確認は完了済み。

- 静的ゲートの共通初期fixtureをテストファイル内で1回作り、各ケースへGit履歴・ファイルを通常コピーする。収集状態は `structuredClone` で分離する。変更後の収集、実CLI、承認・改変拒否の検査は保持した。
- Git fixtureは引き続き実Gitで初期化する。空templateを指定し、Gitが作った設定へNodeから固定4項目を追記する。SHA形式と既定ブランチ、設定の独立性を回帰テストで確認する。
- ツール検査のワーカー数を `min(4, availableParallelism())` にする。各ワーカーが起動する子プロセス数とは区別する。
- 新しいGit設定の回帰をCIのUbuntu／Windows共通のfixture検査にも追加する。既存の検査・固定履歴のnative replay・必須gateへの結び付きを維持する。

永続キャッシュは追加しない。初期fixtureは実行ごとに再構築し、合否・receipt・変更後の収集結果を使い回さない。既存の同一呼出内でのスナップショット解析再利用は変更しない。

## 全件測定

Windows、Intel Core i7-10700K（8コア／16論理）、Node 24.12.0、pnpm 10.33.0、Git 2.56.0。各群を順次3回実行し、別の重いテストを並行しなかった。測定中のHEAD・依存・対象ソースを固定し、候補の各runで入力SHA-256の前後一致を確認した。

| 比較群 | 1回目 | 2回目 | 3回目 | 中央値 |
| --- | ---: | ---: | ---: | ---: |
| 変更前・2ワーカー（11/06） | 385.244秒 | 375.504秒 | 373.146秒 | 375.504秒 |
| fixture改善・2ワーカー（11/06） | 334.579秒 | 334.674秒 | 342.380秒 | 334.674秒 |
| fixture改善・2ワーカー対照（11/07） | 332.212秒 | 334.545秒 | 334.553秒 | 334.545秒 |
| fixture改善・4ワーカー（11/07） | 201.797秒 | 200.391秒 | 199.339秒 | 200.391秒 |

fixture改善は同日の2ワーカー比較で中央値約10.9%短縮。中断時にNode.jsの残存プロセスを整理して空きメモリが変わったため、再開後に2ワーカーの対照も測り直した。その同一環境・同一候補入力で、2→4ワーカーは約40.1%短縮した。CI全体の改善率へ読み替えない。

変更前は145ファイル・2,087件、候補は146ファイル・2,089件で全回成功、skipなし。元の2,087件をファイル・階層名・タイトル・結果のmultisetとして照合し、同名の重複も保持した。差分は追加1ファイル・2ケースのみ。全候補runで出力のclose、観測した子プロセスの残留0を確認し、stderrに新たなポート競合はなかった。

| 同じ再開環境での資源観測 | 2ワーカー | 4ワーカー |
| --- | ---: | ---: |
| working set合計ピークの中央値 | 1.571 GiB | 2.084 GiB |
| working set合計ピークの最大 | 1.600 GiB | 2.111 GiB |
| 観測した子プロセス開始数の中央値 | 637 | 674 |

メモリは約1秒ごとのCIMサンプルから得たVitestと帰属できる子孫のworking set合計で、厳密な最大RSSではない。開始数は短命プロセスを取りこぼす下限値で、並列度によって捕捉率も変わる。実呼出数の削減は次の個別計測で判断する。CPU使用率は未計測。経過時間は終了を検知するまでの遅延（候補では約0.3～1.3秒）を含む。

測定器v2では、PID・作成時刻による追跡、入力の前後照合、出力closeの5秒期限、実プロセスの開始・終了時刻を追加した。旧方式のメモリ比較値も同じCIMサンプルから別に計算し、終了処理の対象選択には使わない。生データは作業worktree内の `test-results/quality/performance/{baseline-w2-sampled,candidate-w2,candidate-w2-resumed,candidate-w4}/`、集合・stderr・入力の監査は `comparison-audit.json` に保存した。

## CI初回の観測と追加計測

[PR #9の初回CI](https://github.com/kotyabuchi/scenario-manager/actions/runs/42327439399) のPlannerは成功したが、job全体456秒、品質・静的検査・計画のstepは424秒だった。PR #8の単発観測327秒／300秒より長い。UbuntuイメージとNode/pnpmは同じで、別ジョブのUbuntu fixtureは18→17秒、native履歴検証は198→201秒、Windows fixtureは50→47秒。異なるVM上の1回ずつの観測であり、4ワーカーが原因とはまだ断定できない。現時点でCIの高速化は確認できていない。

従来の成功artifactと公開ログには品質検査の内訳がないため、GitHub ActionsのPlannerだけに固定phase／qualityCheckと整数の経過ms、利用可能な並列度をstderrへ記録する。同じ区間の連続通知は統合し、成功・失敗のどちらでも最後の区間を閉じる。品質区間には子プロセスの終了、private log保存、入力checkpointも含み、純粋なVitest実行時間とは区別する。環境変数、秘密、例外本文、生の子出力は公開せず、stdoutのJSON・artifact・合否条件を維持する。

前掲のローカル全件測定と品質ゲートは、この計時ログ追加前の実装に対する記録。計時ログには専用の成功／失敗・秘密除外・非対象job回帰を加え、最終headの全件検証をCIで行う。追加観測を経て上限4を採用した。

[計時追加後のrun](https://github.com/kotyabuchi/scenario-manager/actions/runs/42329131950) では利用可能並列度4を観測し、lint 3.231秒、型31.276秒、unit 83.263秒、tools 138.006秒、静的台帳41.191秒、収集39.188秒、選択69.180秒だった。これを4ワーカーの比較点として、子プロセスの負荷を考慮した2ワーカー候補を同じ入口で測った。[2ワーカーrun](https://github.com/kotyabuchi/scenario-manager/actions/runs/42329962936) も利用可能並列度4で、lint 3.481秒、型33.964秒、unit 89.721秒、tools 170.849秒、静的台帳44.997秒、収集42.869秒、選択76.201秒だった。toolsは2ワーカーの方が32.843秒長く、他区間も7～10%程度長かったため、別VMの差も混ざる。2ワーカーへ抑える利点は確認できず、上限4を採用した。どちらも品質検査は成功。比較用の旧runは新しい候補を公開した後に停止し、全体合格としては扱わない。最終コミットの全CIと証跡を別途受け入れる。単発のHosted比較をCI全体の改善率として一般化しない。

### PR #9の最終受入（2026-11-07）

head `0a5133d489d14e0a94c6fded66ebb656c6f8869b` の [run42330826829](https://github.com/kotyabuchi/scenario-manager/actions/runs/42330826829) は全6job成功、重複検査も成功した。5組の成果物を独立に再照合し、必須67件・extras312、固定履歴、同一head/run/attempt、入力、6 DB環境と7 stageの回収を確認した。required verification `4686a0772cf7`、legacy verification `65b153ae127a` の再計算aggregateは保存物と一致した。

最終tools区間は130.174秒、planner432秒、required611秒、legacy962秒、aggregate37秒。raw jobsの最初の開始からaggregate job完了までは23分54秒（1,434秒）、job時間の合計は2,398 runner秒だった。以前の23分55秒はrunメタデータのupdated_atまでを終点としていたため、以後はjob完了時刻に揃える。PR #8の21分29秒より長く、CI全体の改善はまだ達成していない。PR #9はレビュー可能にし、支配的なlegacy直列実行の改善を[desktop／mobile分割計画](./e2e-legacy-ci-sharding.md)として別ブランチで進める。比較元をこの受入済みheadへ固定し、次段の効果とtoolsの効果を混同しない。

## 後続PR #10の観測

[PR #10の実装headのCI](https://github.com/kotyabuchi/scenario-manager/actions/runs/42340586935) は全7jobと重複検査が成功し、同一head/run/attemptの6組の成果物も独立受入を通過した。legacyをdesktop/mobileへ分割し、必須67件・extras312と全330行の結果、6 DB cleanup・7 process終了を維持した。

PR9の23分54秒から18分51秒へ、待ち時間は5分3秒短縮した。job時間の和は2,398から2,664 runner秒へ増えた。各条件1回の観測であり、恒常的な改善率や課金額の比較ではない。詳細な区間、計測できていない項目、最終headの受入手順は[分割計画のBatch 3記録](./e2e-legacy-ci-sharding.md#batch-3のhosted受入と性能観測2026-11-07)を参照。PR9とPR10の本番マージは未実施。

## 次段の改善調査

ユーザーから追加された[CI短縮の事例記事](https://zenn.dev/edash_tech_blog/articles/5b90aa33bd8d49)を参考に、現コードとの差分を棚卸しした。当初は調査・実験候補としPR10へ追加しなかったが、2026-11-08の高速化継続指示を受け、[テスト層の改善計画](e2e-test-layer-performance.md)として小Batchで進める。記事のVitest 4.1に対し、このプロジェクトの正本ログはVitest 3.2.4。記事の速度改善率や設定をそのまま適用しない。

| 順序 | 候補と現在の状態 | 実験の判定条件 |
| --- | --- | --- |
| 1 | **既存の区間を整理し、細区間の計測を補う。** plannerに加え、公開ログの固定進捗時刻からSupabase環境起動・Next build・browserの粗いwall区間を復元できる。setup内のinstall/Panda、DB起動/migration/seed/catalog各内訳、build内訳、環境cleanup完了時間は未分離。 | 既存ログで測れる部分に重複した計測を増やさず、必要な細区間だけ固定phaseと単調時計で記録する。秘密・生ログを追加公開しない。同条件の複数回、初回/再実行、cache hit/miss、wall時間とrunner時間を区別する。環境起動時間をmigration単体とみなしてdump化を先行しない。 |
| 2 | **E2Eの責務と重複を整理する。** `e2e/auth/session-create.spec.ts` の必須入力はschemaテストと重なるが、空送信→resolver→error表示の連携はcomponent側で未検出。`e2e/scenarios/search.spec.ts` も一覧遷移を反復。 | 移管先のassertionと旧→新のledger対応を先に作り、作成→詳細・検索→URL/詳細など代表接続を維持する。今回の330件固定は分割の同等性条件であり、将来の適切な移管・統合による件数変更を禁止しない。 |
| 3 | **固定500ms待ちを見直す。** `e2e/auth/feedback-detail.spec.ts` の投票、`e2e/auth/scenario-new-banner.spec.ts` の非対応URL/clearに存在。 | 状態確定やdebounce完了を観測できる条件を確認して置換する。初めから非表示のassertionだけで成功する偽陽性を避け、失敗検出とflaky率・時間を比較する。 |
| 4 | **unit setup/collectionを調べる。** node、unit-dom、componentとDBは分離済み。共通 `vitest.setup.ts` とcomponentのStorybook setupの適用が調査対象。 | project別の壁時計時間と必要な初期化を確認する。DB access guardなどの検査境界を維持し、集計phase秒をそのまま短縮見込みにしない。 |
| 条件付き | **pristine DB dumpを新規所有DBへ復元する。** 現在は毎回fresh DBでmigration/固定seedを全再生。dump cacheは未実装。 | replayが最長経路を支配すると計測できたら優先する。CLI・DB image/extension・生成設定・全migration順序/内容・固定seed・dumpの出所と完全性をキーと照合へ含める。API/Auth等を含む起動手順を固定CLIで検証。動的Auth/fixture前を保存境界とし、実行中DB/volume/認証情報を共有しない。失敗時は回収後に別fresh runで全再生し、全migration replay自体の検証を維持する。 |
| 後順位 | **node_modules cacheを比較する。** pnpm store cache、frozen install、Panda生成は既にある。 | install/Panda節約と圧縮・転送・復元・容量の費用を比較し、OS/Node/pnpm/lockfile/ネイティブ依存の不一致とmissを検証する。生成処理の一律省略は採用しない。 |

ローカルの正本quality `6abfabb844e4` はunit91ファイル・1,097成功・既存skip8、100.87秒、tools147ファイル・2,181成功、213.44秒。unitのsetup154.97秒・collect818.38秒等はworker間で重なる集計で、100.87秒へ足したり、そのまま節約可能時間にしたりしない。別runのログを混ぜない。HostedのPR9 setup compositeはLinuxで21～25秒、Windowsで63秒だが、installとPandaの内訳は不明。PR10の計測結果を基準に、次の実装計画を決める。

## 初期準備の内訳（ローカル実験）

全件測定と別に、実関数へ委譲する計測wrapperで各版1回ずつ測った。基準版8件、候補版9件がすべて成功。計測用の一時テストは通常の全件検査へ混ざらないよう回収した。

| 静的ゲートの初期準備 | 変更前 | 候補 |
| --- | ---: | ---: |
| fixture構築 | 8回 | 1回 |
| ソース収集 | 16回 | 2回 |
| Playwright登録収集（3プロファイル合計） | 48回 | 6回 |
| 実Git呼出 | 56回 | 7回 |
| 初期化の経過時間 | 92.062秒 | 11.803秒 |
| TypeScript解析区間の和集合 | 3.310秒 | 0.431秒 |
| Playwright登録収集区間の和集合 | 78.679秒 | 10.146秒 |
| Git | 9.586秒 | 1.153秒 |

並行するプロファイルの時間は加算せず区間の和集合にした。内訳は単発値で、全体の短縮率には使わない。成果物のserialize・書き出しは0.143→0.019秒、fixture書き出しは0.217→0.022秒で、主因は登録収集の繰り返しだった。

実Gitの既存2スイートでは、fixture wrapperの成功した実呼出を数え、51件すべての成功と同一テスト集合を確認した。

| 既存fixture内の実Git呼出 | 変更前 | 候補 |
| --- | ---: | ---: |
| `gitSnapshot.test.ts` | 165回 | 105回 |
| `trustedRevision.test.ts` | 295回 | 195回 |
| 合計 | 460回 | 300回 |

160回の削減はこの2スイートのwrapperの値で、実装内部の別wrapperやOSのサンプリング値とは区別する。新規の設定・SHA形式・独立性回帰には別途15回の実Git呼出がある。

## 検証と採用判断

- 正常系に加え、共通seedの初回収集直前に所有fixtureのPlaywright設定を壊す故障注入を実施。実collectorが非タイムアウトのエラーを返し、Vitest全体は終了コード1・失敗suiteとして報告した。一時root・関連子プロセス・注入用テストの残留は0。通常版のreadonly CLIケースを再実行し、別のseedを再構築して成功した。選択実行の対象外8件のskipは全件検査の成功数へ含めない。
- 7コードファイルを独立レビューし、機能・安全性の必須指摘は0件。ワーカー数と子プロセス数を区別するコメントへ正確化した。
- 実装に対する `pnpm quality:changed --base 60e7d1e44d82af2e41427a57c227147c51302fbe` が成功。quality `5db957a8d3ec`、selection `fae7b9ace6c5`、verification `767d32e33c63`。lint・型、unit 1,097件（既存skip 8件）、tools 146ファイル・2,089件が成功し、必須67件・追加312件を7ステージで照合した。入力前後一致、28チェックポイントの変更0、検証issue 0。6つのDB環境のcleanup完了、7ステージの子プロセス終了・エラー0、専用ポート解放を確認した。成功後のコード変更は説明コメントだけで、限定Biome検査を実施。既存の `coverageStatus=insufficient` は継続しており、全アプリ領域の網羅を意味しない。
- 公開後のコミット単位の検証はPRの必須 `E2E verification gate` を正とする。ローカルの測定をCIの合格や所要時間の代用にはしない。

本リポジトリはpublicで、現在使っているGitHub標準Ubuntu／Windows runnerの公称仕様は4 CPU・16 GB。[GitHub公式仕様](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)を2026-11-07に確認した。ローカル実測のメモリ増とCIの2／4ワーカー比較を記録した上で、利用可能並列度と4の小さい方をテストワーカー上限に採用する。検査内容の削除、タイムアウト延長、suite全体の分離解除は行わない。

### 再現する入口

以下は実測と同じVitest入口と設定。`--maxWorkers` を2／4へ切り替え、出力名を変えて各3回実行する。計測器のCIM観測は別に必要で、このコマンド自体はメモリや全子プロセス数を測定しない。

```powershell
node node_modules/vitest/vitest.mjs run --config scripts/e2e/vitest.config.ts --maxWorkers=4 --reporter=default --reporter=json --outputFile=test-results/quality/benchmark-w4-run1.json
```

日常の限定確認は `pnpm test:e2e-tools scripts/e2e/staticGate.test.ts` のようにファイル指定で行う。Batch判定は従来どおり `pnpm quality:changed --base <比較元>` に一本化し、全件の必須判定と混同しない。

## 維持した境界と次のCI改善候補

- `reporters/results.test.ts`（実起動7回）、`runnerSelection.test.ts`（13回）、`discoverIntegration.test.ts`（12回）は個別起動を維持。早期終了、出力失敗、公開preflightでの再収集、各副作用を単独で拒否する境界を検証している。副作用6種をまとめてmarkerを照合する案では、集約拒否だけで各種の単独拒否を保証できないため採用しない。
- Ubuntu fixtureの重複検査は観測したrunで18秒、CIの最長経路には入らなかった。Windows固有の検査と固定履歴のnative replay、必須gateとの結び付きを維持し、削除しない。
- [PR #8のCI run](https://github.com/kotyabuchi/scenario-manager/actions/runs/42221448685) はplanner327秒→legacy-local913秒→aggregate44秒が最長経路（待ち時間込み1,289秒）。PR9受入時には、各回のDB起動とNext buildを含むlegacy4プロジェクトの直列実行を次の改善対象とした。desktop／mobileの2ジョブへの分割は後続PR10で実施し、330件の非deferred結果の和集合、必須18件、全登録catalog、同一head/run/attempt、cleanup証跡を維持した受入結果を前掲節に記録した。
- Next buildは所有run IDとローカルSupabase設定を含むため、別runの生成物を無条件に共有しない。

2026-11-07の停止時も用途を確認したNode.jsを終了し、残存0と専用ポート解放を確認した。再開時には保存した2,173ファイルのSHA-256がすべて一致した。必要なツールだけを起動し、テストごとの後始末を継続して確認する。

## 事前調査（2026-11-06）

計測元は `test-results/verification/524495c4959c/test-e2e-tools.log`。経過時間は473.12秒で、Vitestが報告したテスト時間の合計は747.24秒、収集の合計は123.86秒、変換の合計は2.74秒。ワーカー間で重なるため、各内訳の秒数をそのまま短縮見込みには使わない。過去の説明に出したレポーターテスト約70秒は別実行の値。このrunでは58.34秒だった。

| テストファイル | テスト数 | 報告時間 |
| --- | ---: | ---: |
| `staticGate.test.ts` | 8 | 160.09秒 |
| `gitSnapshot.test.ts` | 16 | 67.15秒 |
| `trustedRevision.test.ts` | 35 | 63.25秒 |
| `reporters/results.test.ts` | 5 | 58.34秒 |
| `runnerSelection.test.ts` | 4 | 49.92秒 |
| `githubEventStatic.test.ts` | 6 | 47.76秒 |
| `discoverIntegration.test.ts` | 12 | 44.84秒 |

上位7ファイルで報告されたテスト時間の約66%を占める。変換キャッシュより、これらの準備や子プロセスの回数を減らす方が先に検証する価値がある。スクリプト内で起動した子プロセスの変換や収集は親Vitestの「変換」時間では識別できない。

### 試す順番

1. **静的ゲートの共通初期状態を再利用する。** `scripts/e2e/staticGate.test.ts` の8ケースは毎回、一時Gitリポジトリと同じ初期ファイル群を作り、初期成果物の生成前後に `collectStaticState` を2回呼ぶ。まず計16回の初期収集を、解析・runner登録収集・Git・書き出しに分けて測る。共通初期リポジトリをテストファイルの実行中に一度作り、独立したコピーで各ケースを開始する候補を試す。収集結果を共有する場合は、絶対パスや生成物、HEADへの依存を確認し、コピー後に同じ意味を持つデータだけを再利用する。変更後の再収集、改変検出、ケースごとの回収は引き続き実行する。既存のスナップショット解析再利用は同一呼び出し内が対象で、このfixture間の繰り返しとは別。
2. **実Gitの準備コマンドを減らす。** `gitSnapshot.test.ts` と `trustedRevision.test.ts` は、fixtureを作るたびに `git init` と4回の `git config` を別々に呼ぶ。まずGit呼び出しを数え、固定設定を少ない起動で反映できるか比較する。その次に、SHA-1/SHA-256ごとの初期オブジェクトを用意して、ケース専用のリポジトリにコピーする案を試す。refs、index、replace、config、未追跡ファイルをケース間で共有せず、実Gitによる異常系を維持する。
3. **runner起動を減らせるケースを絞る。** `reporters/results.test.ts` と `runnerSelection.test.ts` は実Playwright CLIを起動する。呼び出しごとに列挙・実行・出力検査を計測し、同じ設定で独立して観測できるケースだけ同一起動にまとめられるか確認する。早期打切り、失敗終了、出力不能などの起動単位の条件は独立して検証する。`discoverIntegration.test.ts` の副作用拒否も、ガードの初期化やプロセス終了自体が検証対象のケースを分けて扱う。
4. **並列度と日常の入口を分けて比較する。** 上記を基準に2ワーカーと増やした設定を比較し、重い処理の同時起動によるCPU・メモリ・ポート競合・timeoutも記録する。CIでは現行plannerの全ツール検査とOS別のfixture検査に重なるファイルがある。Ubuntu側の重複実行を整理できるか、Windows検査や必須checkとの紐づけを含めて確認する。ローカルの反復確認は既存のファイル指定によるVitest実行を使い、必須ゲートの全件判定と区別する。

実験は同じrevision・依存・マシンで候補ごとに3回以上比較し、中央値・最大RSS・起動回数・失敗数を残す。初回と再実行を分け、キャッシュを採用する場合は破棄後も同じ結果になることを確認する。合格結果、失敗判定、run固有の証跡は再利用対象から外す。並列化で起動が重なる場合は、ポートと一時ディレクトリの分離も計測する。

### 参考資料と適用範囲

- [元記事「最近の E2E 戦略（2026 年 10 月現在）」](https://zenn.dev/polyco/articles/26624b38c951b5) の本文は今回取得できなかった。[導入時の調査記録](../research/e2e-strategy-2026-11-04.md) を参照し、変更に関係する検証を日常の開発フローで回す考え方を、上記のローカル反復確認に適用した。fixture再利用やキャッシュの案は、このプロジェクトのログとコードから立てた仮説。
- [Vitest v3のパフォーマンスガイド](https://v3.vitest.dev/guide/improving-performance) にあるpool、分離、shardも比較候補。現状では上位の実プロセス系テストを優先し、suite全体の分離解除や新しいVitest版への更新は今回の初手に含めない。

### 追加調査

| 既存run | 全体経過時間 | 静的ゲート8件 | 結果 |
| --- | ---: | ---: | --- |
| `524495c4959c` | 473.12秒 | 160.09秒 | 2,051件成功 |
| Batch 6の単独tools実行 | 504.92秒 | 192.14秒 | 2,074件成功・2件失敗 |
| `1f43a7c0543e` | 412.62秒 | 135.76秒 | 2,087件成功 |

3実行とも `staticGate.test.ts` が最長。入力や同時負荷が異なるため、この差を改善量としては扱わない。Batch 6のログは前提worktreeの `test-results/quality/batch6-tools.log` と `test-results/verification/1f43a7c0543e/test-e2e-tools.log`。

静的ゲートの初期fixtureは、8ケースそれぞれで同じ初期化をし、成果物を書き出す前と初期コミットを作った後に1回ずつ `collectStaticState` を呼ぶ。1回の収集はTypeScriptのinventory構築に加え、app、Storybook、isolatedの3つのPlaywright登録収集を起動する。初期fixtureのDBテスト一覧は空で、integration収集は早期returnする。したがって、変更後の収集やCLI検証を除いた初期準備だけで、ソース解析16回とPlaywrightの登録収集48回が発生する。

最初の比較実験は、現行の初期化をそのまま1回だけ行い、その状態をケース専用ディレクトリに複製する案に絞る。コピーしたfixtureで同一のbase/head、保存物のバイト列、登録キー、ソース位置が得られることを確認し、キャッシュされたパスや可変オブジェクトが他ケースへ漏れない形で初期状態を渡す。この案なら準備の登録収集は計算上48回から6回まで減らせる。これは呼び出し数の見込みで、秒数の削減量は未計測。改変後の収集とCLIの起動は現行どおり行う。絶対パスなどの制約で収集済み状態を移せない場合は、初期Gitリポジトリだけを複製し、各コピーで収集を1回行う案を比較する。

## 追加CI効率化の実施状況（2026-11-08）

サイドチャットから追加されたCI短縮記事に基づく残件は、[テスト層の改善計画](e2e-test-layer-performance.md)へ実施順と判定条件を集約した。2026-11-08に両記事の本文を取得し、単独診断修復の受入後、初期化の軽量化から実装を再開した。全候補の実装完了ではない。

| 項目 | 現在の状態 |
| --- | --- |
| PR9: toolsの共通fixture再利用・Git起動削減・最大4worker | 実装・検証・main反映済み |
| PR10: legacyのdesktop/mobile分割 | 実装・ローカル/Hosted受入済み、Draft・本番未反映 |
| 細区間の追加計測 | 既存公開ログの粗区間は整理済み、細区間の計測実装は未実施 |
| E2Eの責務移管・重複整理 | 未実施。移管先assertionと旧→新の台帳対応が先決 |
| 固定500ms待ちの置換 | 未実施 |
| unit setup/collectionの最適化 | 初期化分離とSSRアイコンのbundleを実装、同19ファイルのwall中央値91.361→46.479秒。全91ファイル・共通quality成功。Hosted結果はPR10で管理 |
| CIのPanda生成重複 | install内prepareの実行を固定Hostedログで確認し、明示prepareの重複stepを除去 |
| pristine DB dump・node_modules cache | 未実施。内訳の計測と採用条件の確認後に判断 |

最新の既受入head7226ebc、run42448751791 attempt1は18分55秒、PR9比較元23分54秒より4分59秒短縮し、runner時間和は2,398→2,593秒（+195秒）だった。これは分割までの一観測で、追加候補の実装成果ではない。単独診断入口は修復・受入済み。旧Hostedとローカル参加者作成の間欠失敗は原因未確定で、再現しなかったことを修正済みとは扱わない。
