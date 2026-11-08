# 既存E2Eのdesktop／mobile分割計画

## Context

PR #9は `0a5133d489d14e0a94c6fded66ebb656c6f8869b` で全CIと独立artifact照合を通過した。tools区間は130.174秒まで短縮したが、CI全体は23分54秒、直列legacyは16分2秒だった。4つの既存Playwright projectを2つのHosted jobへ分け、検査集合と合否の強さを保って待ち時間を減らす。

## 決定事項

| 項目 | 方針 |
| --- | --- |
| 作業場所 | 既存専用worktree、別ブランチ `perf/e2e-legacy-shards` |
| 固定比較元 | `0a5133d489d14e0a94c6fded66ebb656c6f8869b` |
| 公開 | PR9未マージなら `perf/e2e-tools` 向けの後続PR。公開・検証まで進める |
| 分割 | desktop／mobileの固定2job、projectごとのDB/build/cleanupを維持 |
| 判定 | 既存必須gate名と全結果照合を維持。wall時間とrunner消費時間を別評価 |
| 実装・レビュー | exec-planに沿ってBatchごとに検査・レビュー・コミット。通常サブエージェントはSol / medium |

## 前提条件

PR9の全CI成功と同一head/run/attemptの成果物照合は完了（run42330826829 attempt1、required verification4686a0772cf7、legacy verification65b153ae127a）。本番マージはこの実装計画に含めない。

## 維持する契約

desktop は `chromium` と `chromium-auth`、mobile は `mobile-chrome` と `mobile-chrome-auth`。それぞれ独立した Hosted runner で、割当の2 project を既存と同じ project 別 DB・seed・Next build/start・browser・cleanup の境界で直列実行する。

| 固定 shard | app 必須 | 旧 extras | 非 deferred 結果 |
| --- | ---: | ---: | ---: |
| `legacy-desktop` | 9 | 156 | 165 |
| `legacy-mobile` | 9 | 156 | 165 |
| 合計 | 18 | 312 | 330 |

現行 catalog 348件は各 worker の guarded discovery で照合する。deferred-live 18件は catalog へ残し、実行結果としては拒否する。旧 extras 312件には既存 skip/fixme 11件を含む。実装はこれらの固定件数を受入時の確認に使い、合否は trusted catalog／execution と exact key、現・置換元 fingerprint、期待状態、承認済み skip 理由、置換 claim に基づいて決める。現行の `required` shard、PR 固定 smoke、push 全件、bootstrap／静的台帳・履歴検証、runner dependency と executionGroup の閉包、公開必須 check `E2E verification gate` を保つ。

## Batch 1: 割当実行と安全な結果の準備

**依存**は PR #9 の確定のみ。この Batch では Hosted workflow と CI shard 契約を切り替えない。

### Step 1-1. 割当projectの実行入口

実行担当は `runLegacy.ts`、`runVerificationStages.ts`、`verificationRun.ts` と対応する既存テストを担当。既存 CLI `runLegacy.ts [--project <project>]` と公開関数の既定挙動を維持し、検査済み project 集合を渡せる内部入口だけを追加する。全4件は従来の全件成功を返し、診断単体は従来の `partial-passed` を返す。CI 用の割当成功は、対象2件が未起動・失敗・中断・未回収なしで完了した場合だけ成立させ、全件成功とは区別する。割当 scope と plan から用意した `app-<project>` stage の集合を起動前に照合する。追加入口でも全 catalog の discovery と source/origin 検査を先に通し、先行 project に未回収があれば次を起動しない。
### Step 1-2. 検査済み結果の安全な保存

証跡担当は `legacyResults.ts` と `verificationSchema.ts`、`legacyResults.test.ts`、`verificationReceipt.test.ts` を担当。既存の公式 JSON 検査が作る normalized rows から、キー・現/置換元 fingerprint・状態・期待状態・trusted execution と一致した既存 skip/fixme 注釈だけを残す。成功行に任意の実行時 annotation を出さない。共同接点は legacy stage の任意フィールド1つ。対象 scope の成功後だけ保存し、既存 receipt を読む経路はフィールドなしも扱う。非 legacy stage への混入は拒否する。既存5 artifact のパスを維持し、raw reporter、資格情報、環境ログを追加公開しない。
### Step 1-3. 回帰・共通品質ゲート・レビュー

完了条件は既定ローカル全4件と診断1件の契約、2件 scope の exact 実行順、scope/plan 不一致・欠落・重複・abort・cleanup 不備の拒否がテストで確認できること。公式 JSON 検査由来の fingerprint と固定 skip 理由を保持し、任意注釈の非公開を回帰化する。必要最小は `runLegacy.test.ts`、`runVerificationStages.test.ts`、`legacyResults.test.ts`、`verificationReceipt.test.ts` と型・変更範囲 lint。既定の receipt／計画を作る入口と schema の後方互換も確認する。

## Batch 2: planner・worker・aggregate・workflow の一括切替

**依存**は Batch 1 の受入。以下はレビュー担当を分けられるが、片側だけを公開しない。同じ revision の producer、consumer、workflow と fixtures を一括で切り替える。

### Step 2-1. 固定2shardへの計画分割

分割担当は `ciPartitionSchema.ts`、`ciPartition.ts`、必要な `ciPlan.ts`、planner fixture を担当。固定 ID と project 所有表を一箇所に置く。全 app plan と正本を照合してから profile/project で分け、2 shard の exact 和集合が旧 app plan と一致すること、未知・未割当・重複・runner dependency 跨ぎを拒否することを検証する。各 shard のキーと plan digest を固定し、既存の全収集・全計画・実効計画・選択の digest を維持する。固定 shard tuple の変更は非互換なので manifest schema の版を明示し、旧 tuple は新 gate で拒否する。
### Step 2-2. workerとaggregateの証跡照合

証跡照合担当は `ciShard.ts`、`ciShardArtifacts.ts`、`ciAggregate.ts`、`ciPartitionAggregate.ts` と必要な trusted ledger 読み取り接点を担当。worker は各自の全件再収集を planner と照合した後、固定 scope を渡す。新 CI の worker と aggregate は legacy stage の正規化結果を必須にし、trusted catalog の project と非 deferred の exact set、plan の required/extra、共通 runner report のキー・状態を一致させる。aggregate は既存の `validateLegacyExecution` で全330件を再照合する。正本から runtime 結果を作り直さない。両 shard の verification ID と owner run ID の重複を拒否し、各 stage の process exit、checkpoints、完全 cleanup、空の remaining を既存 receipt で再検証する。
### Step 2-3. workflowと公開コマンドの切替

workflow/CLI 担当は `.github/workflows/test.yml`、`ci.ts` と `ciDiagnostics.ts` の固定 ID、CI fixture を担当。desktop/mobile を2つの固定 job にし、同一 checkout と既存 setup を使う。aggregate は planner、OS fixtures、required、両 legacy の成功を要求する。artifact 名・保存先は shard/run/attempt を分離し、exact 名で別ディレクトリへ取得する。artifact の envelope と manifest で同一 event/head、run/attempt、全計画、snapshot、前後入力、選択を照合する。既存の safe failure marker を保つ。内部コマンド `e2e:ci shard legacy-local` の廃止はこの一括切替に含め、互換 alias、latest fallback、別 attempt の救済は作らない。ローカルの `runLegacy.ts [--project <project>]`、`quality:changed`、必須 status 名は従来どおり。既存の運用文書 `docs/testing/e2e-quality.md` にある旧 job 名と artifact 取得手順も同時に更新する。 後続PRのbaseとなる `perf/e2e-tools` は現在のtest／duplicates workflow branchesと `githubEventSchema.ts` のPR base許可集合にないため、同じ固定文字列を両方へ追加してイベントfixtureで検証する。任意branchは許可しない。PR9マージ後にmainへretargetして再検証する際、専用base許可の削除もまとめて行う。
### Step 2-4. 全回帰・共通品質ゲート・レビュー

完了条件は PR 固定 smoke、bootstrap/full と通常 push の projection、旧 app plan との exact 和集合、全必須18と全 extras の保持、worker ごとの全348登録照合が機械的に確認できること。片側 failure/cancel/skip、欠落・余分・入替 artifact、別 head/run/attempt、verification ID／owner run ID 重複、deferred 実行、replacement fingerprint／claim、skip 理由、cleanup 改変を fail closed にする。必要最小は `ciPartition.test.ts`、`ciPlan.test.ts`、`ciPartitionAggregate.test.ts`、`ciRuntime.test.ts`、`ciCli.test.ts` と workflow lint、型・変更範囲 lint。既存synthetic fixtureは2 shardに各必須行を持ち、固定scopeの各2projectが実planへ含まれる構成へ拡張する。auth側は正当なextrasでもよい。bootstrapの固定smoke14キーを維持し、workerのscopeと実planのproject集合をruntime fixtureでも直接照合してmockが不一致を隠さないようにする。公開前に全 tools と従来入口のローカル品質ゲートを通す。

## Batch 3: Hosted 受入と性能判定

**依存**は Batch 2 のローカル受入。専用ブランチでのPR公開とHosted検証は既存の継続依頼の範囲として進める。測定・証跡照合が中心で、必要な修正は該当 Batch に戻す。

### Step 3-1. Hosted成果物の独立受入

Hosted PR の同一 head/run/attempt から planner、required、desktop/mobile、aggregate の artifact を独立に照合する。各165件、必須9件、全体330件、必須18件、catalog 348件の集合を確認し、同じ commit を検査した proof と全所有環境の cleanup を確認する。PR では差分選択の coverage 状態も記録する。通常 push／bootstrap 分岐はイベント fixture で維持し、実 push での検証は承認済み経路だけで行う。失敗時に片方だけ rerun した旧 attempt artifact を取り込めないことは否定 fixture で確認する。
### Step 3-2. 性能比較と消費時間の記録

PR #9 完了後の直列 run と分割後 run から、runner OS・suite 集合・event 選択モード・依存条件が揃う比較を選ぶ。各条件3回を目安とし、測定が成立した run 数と失敗・中断を分けて記録する。planner、required、旧 legacy または両 shard、aggregate と queue gap を UTC step 時刻で分ける。DB 初回/後続、各 Next build、ブラウザー実行、cleanup、setup/収集の区間も採取する。クリティカルパスは2 shard と required の最大側で評価し、ジョブ時間の和は消費 runner 分数として別集計する。PR #8 との直接比較だけで PR #9 の改善と分割の効果を合算しない。
### Step 3-3. 最終レビューと運用記録

正しさの受入は上記 artifact 照合と必須 gate 成功が条件。性能の評価では同条件の成功サンプルでgateの経過時間を比較し、追加runner分数とqueue／失敗の増分も公開する。2分短縮は検討上の目安であり、ユーザー指定の受入条件や既存SLOではない。比較可能な試行が揃わなければ時間改善の受入を保留し、サンプル数と未確定の条件を残す。PR9の実測はplanner432秒・required611秒・legacy962秒・aggregate37秒だった。各projectの区間を2組へ分け、両runnerでDB初回起動が必要になる点も見込むと、legacyの長い側は約10分となり、required611秒が次の下限になるという仮説を置く。planner／aggregateが同程度なら全体約18分・約5〜6分短縮だが未検証であり、新しいCIの実績には数えない。
- DB・build・receipt をジョブ間で再利用しない。Next build の run ID と公開 Supabase 設定、出力とプロセスの所有境界を維持する。受入できなければ Batch 2 の producer/consumer/workflow をセットで戻す。旧 artifact を新 workflow に流用しない。

## 親レビューで固定した実装接点

- 追加するnormalized rowsはproducerが検証済みの実結果から投影し、consumerでも同じ安全な形を要求する。成功行のannotationsは空配列、既存skip/fixme行はtrusted executionの既存宣言と一致する制御注釈だけを許可する。strict schemaや既存全件validatorだけでは任意custom annotationの混入を防げない。既存の共通reportには現在の注釈経路があるため、新フィールドの公開範囲を既存全体の非公開保証へ読み替えない。今回はraw reportやenvを追加でuploadしない。
- `ciContext.ts` に独立した `readCiLegacyExecution(root, head)` を置き、確認済みイベントHEADの `e2e/ledger/legacy-execution.json` を `readRevisionFile` で取得・parseしてlegacy workerとaggregateへ渡す。planner／requiredへ不要な読取依存を加えず、working treeやlatest receiptから正本を補わない。全件の登録収集はworkerで従来どおり行い、aggregateは収集結果のdigest拘束とtrusted正本による結果検査を組み合わせる。
- `runLegacy` の既存返却は全件passed／単独partial-passedを維持する。内部scoped入口では割当project exact setと各projectの実結果を検査してから、全件と区別した成功状態とnormalized resultsを返す。`runVerificationStages.ts` は新入口の成功状態・results非null・project成功をそろえて初めて `resultsChecked` を立てる。projectsだけ絞った旧 `legacy.status === passed` 判定の流用や、未検査の結果へのboolean付与はしない。
- 同HEADのCI受入前にPR9の追跡ファイルを変更しない。次段は受入済みheadから別ブランチへ切り替え、PR9とは別PRにする。

## ファイル一覧

| Batch | 対象 |
| --- | --- |
| 1 | scripts/e2e/runLegacy.ts、runVerificationStages.ts、verificationRun.ts、legacyResults.ts、verificationSchema.ts、関連テストと必要な安全な結果schema |
| 2 | scripts/e2e/ciPartitionSchema.ts、ciPartition.ts、ciPlan.ts、ciContext.ts、ciShard.ts、ciShardArtifacts.ts、ciAggregate.ts、ciPartitionAggregate.ts、ci.ts、ciDiagnostics.ts、関連fixture/test、.github/workflows/test.yml、.github/workflows/duplicates.yml、githubEventSchema.tsと関連テスト、docs/testing/e2e-quality.md |
| 3 | docs/plans/本計画、docs/reviews/レビュー記録。取得した実行成果物は既存ignored test-results/quality配下 |

## 検証方法

固定比較元0a5133dに対する `pnpm quality:changed --base 0a5133d489d14e0a94c6fded66ebb656c6f8869b` を各Batchの判定に使う。関連tools単体、型・lint、反例レビューは実装中の早期確認に使う。Batch2までworkflowを公開しない。Hostedは最終head/run/attemptの結果を保存物から再計算し、各165行と全330行、必須67件・追加312件を正本と照合する。coverageStatus=insufficientは継続し、全アプリ網羅を意味しない。

## 進捗

- [x] PR9受入、計画の独立レビューと指摘反映、専用ブランチへ分離
- [x] Batch1: 割当実行と結果保存の準備（quality f257bf5335a2／verification 7647f9368f10、独立照合成功）
- [x] Batch2: CI契約の一括切替（quality 6abfabb844e4／verification 2feb1eeff6b7、独立照合成功）
- [x] Batch3: 実装headのHosted受入・性能観測・最終レビュー・ローカル回収（記録コミットのCIはPR本文で管理）
- [ ] 追加対応: 最終headの繰り返すdesktop失敗を安全な診断で特定し、修正後のHosted受入を完了
### Batch 1受入（2026-11-07）

共通quality `f257bf5335a2`、selection `4e6a57a425dc`、verification `7647f9368f10` が成功。lint・型、unit1,097成功/既存skip8、tools146ファイル2,132成功、必須67・extras312を7stageで照合した。入力前後は `82764a6a6313f37b405153311def99549d838c3b611f44cad8ae014e84703e6c` で一致。保存したlegacyResultsを正本validatorへ独立に再投入し、330件（成功319・既存例外11）、project別57/57/108/108を確認。DB環境6件のcleanup complete、全7stage process終了/エラー0、native確認で専用port・テスト用Node残留0。coverageStatus=insufficientは継続する。

レビューはSol / mediumの3担当で全6観点OK。scope逆順のstage/checkpoint順を修正し、公開schemaの責務をJSDocへ追記した。共通gate後に変更したのは本計画の進捗・接点整理とレビュー記録だけ。CIの契約切替と分割の実測は未実施で、次Batchへ進める。

### Batch 2受入（2026-11-07）

共通quality `6abfabb844e4`、selection `b790dc153481`、verification `2feb1eeff6b7` が成功。lint・型、unit91ファイル1,097成功/既存skip8、tools147ファイル2,181成功、必須67・extras312を全7stageで照合した。入力前後は `8d7f7e4ed61e45353f3f9c7f97a1a7622d63de79b8787be3df58636345df92e9` で一致。保存した330件を新しいCI consumerにもdesktop/mobile各165件として再投入し、共通reportの制御注釈を含めて独立照合した。成功319・既存例外11、project別57/57/108/108、6 DB環境cleanup complete、7 process終了/エラー0。native確認で専用portとテスト用Node残留0。MCP・言語ツールは作業用に稼働中であり、全Node残留0の意味ではない。

Sol / mediumの独立3担当レビューで見つかった共通report側の制御注釈不一致を修正。理由違い・欠落・重複・余分な制御注釈をtest/attempt別に改変する10反例が、修正前に失敗し修正後に成功した。最終helper/aggregate/runtime72テスト、統合型検査、workflow lintと再レビューも成功。詳細は[Batch 2レビュー](../reviews/diff-review-2026-11-07-2.md)。gate完了後の編集は本受入記録と進捗・計時基準の補足だけで、コードは変更していない。

Hosted比較用のPR9基準はraw jobsの最初の開始からaggregate job完了まで **1,434秒（23分54秒）**、全job時間の合計 **2,398 runner秒**。以前の1,435秒は最初の開始からrunメタデータのupdated_atまでの値で、job完了基準とは1秒異なる。Batch 3ではjob完了基準を揃えて比較する。

### Batch 3のHosted受入と性能観測（2026-11-07）

[PR #10](https://github.com/kotyabuchi/scenario-manager/pull/10) の実装head `58f993019e0ef36abeb9f67e4cf78883eaddfbd5`、[run42340586935 attempt1](https://github.com/kotyabuchi/scenario-manager/actions/runs/42340586935) は全7job成功、重複検査も成功。6組のartifactを取得し、同一PR/base/head/run/attempt、manifest、入力、固定履歴を独立に検証した。保存した結果を正本と再照合し、desktop/mobile各165件、全330件（成功319・既存例外11）、必須67件・extras312を確認。6 DB環境のcleanup complete・remaining空、7 stageのprocess終了・エラー0・exit code 0を確認した。required verificationは `2df6bc97dd4c`、desktopは `7b0b1edb16b2`、mobileは `fd899508f3de`。coverageStatus=insufficient、core pending435、surface pending658、deferred18を維持する。

比較対象はPR9のrun42330826829 attempt1。双方ともpull_request、changed-plus-smokeで実効計画は全必須67・extras312、同じrunnerラベルを使用している。ソースと証跡の照合で検査集合の維持も確認した。以下は**各条件1回の成功観測**であり、安定した改善率や性能分布の確定ではない。

| 観測区間 | PR9・直列 | PR10・分割 |
| --- | ---: | ---: |
| 最初のjob開始→aggregate完了 | 1,434秒（23分54秒） | 1,131秒（18分51秒） |
| 全jobの時間の和 | 2,398 runner秒 | 2,664 runner秒 |
| planner | 432秒 | 457秒 |
| required | 611秒 | 543秒 |
| legacy最長job | 962秒 | desktop635秒／mobile625秒 |
| legacyの時間の和 | 962 runner秒 | 1,260 runner秒 |
| aggregate | 37秒 | 35秒 |
| Ubuntu／Windows fixtures | 230秒／126秒 | 249秒／120秒 |

待ち時間は303秒（約21.1%）短縮し、runner時間は266秒（約11.1%）増加した。runner時間は観測したjob秒数の和で、課金分数ではない。worker同士の開始差は0秒、依存完了からworker開始とaggregate開始の間隔はいずれも2秒だった。この間隔を純粋なscheduler待ちとは断定しない。最長経路はplanner→desktop→aggregateで、requiredにはまだ92秒の余裕がある。

公開済みの安全なplanner計時ではlint3.346秒、型34.261秒、unit85.493秒、tools145.271秒、静的台帳41.524秒、収集39.889秒、選択70.396秒。子プロセス終了・保存・入力照合を含む区間であり、Vitest単体時間とは異なる。成功artifactには内部所要時間の専用フィールドがないが、公開jobログの固定進捗時刻から粗区間を復元できる。「公開ログにも時刻がない」という当初の記録は再調査で訂正した。

初回成功run42340586935のdesktopでは、`starting`→`inspecting` がchromium139.973秒／chromium-auth26.478秒、`build`→`readiness` が44.734秒／44.422秒、`browser`→`evidence` が76.277秒／153.456秒だった。順にSupabase環境起動、Next build、Playwright実行を中心とする区間で、CLI処理やcheckpoint等も含む。GitHubログのwall時刻に基づく粗い観測であり、migration単体・純粋なコンパイル・テスト本体の時間ではない。cleanupの開始境界はあるが、環境cleanup終了の専用markerはない。DB起動/migration/seed/catalogの各内訳、build内訳、完全cleanupの総時間は追加計測が必要。ローカルのDB lifecycle全体もmigration時間へ読み替えない。

独立レビューで受入を覆す指摘はなかった。時間比較の前提は今回すべて真であることを確認した。artifact APIのdigestはZIPのdigestであり、展開後のJSONを同じdigestに直接照合したものではない。出所はGitHubからの取得手順、内容は正本・receiptの独立再検証で確認している。比較対象の増加と、既存ログでは分離できない内部の細区間計測を次段へ記録し、継続的な性能改善の確定判断は保留する。詳細は[最終レビュー](../reviews/diff-review-2026-11-07-3.md)、候補は[次段の改善調査](./e2e-tools-performance-todo.md#次段の改善調査)を参照。

本節は実装headの受入記録である。記録用コミットを公開した場合は、その最終headのCIと同一run/attemptの成果物を再照合してからPRをReadyにする。最終headの結果はPR本文に追記し、測定記録の追記だけで次のCIを繰り返し発火させない。本番マージとデプロイは未実施。

最終ローカルgateはquality `2e4ed912d1d0`、selection `4b916061567c`、verification `20e6352d336f` で成功。lint・型、unit1,097成功/既存skip8、tools2,181成功、必須67/67・extras312を確認した。保存した330行を新consumerで各165行として再照合し、入力前後はBatch 2と同じ `8d7f7e4ed61e45353f3f9c7f97a1a7622d63de79b8787be3df58636345df92e9` で一致。6 DB cleanup complete、7 process終了/エラー0、native確認で専用port・テスト用Node・所有containerの残留0だった。作業用MCP・言語ツールはこの確認に含めない。

最初のローカル再確認 `79245388aa54` はDockerエンジン停止のため、DB所有環境の作成前に失敗した。Supabase CLIは指定の2.75.0で、Docker Desktopを起動してserver29.5.3と専用port解放を確認後、新しい上記gateを最初から実行した。失敗記録を成功へ書き換えたり結果を混ぜたりしていない。gate後の追記はこの受入・進捗とレビュー記録のみ。

### 最終headの繰り返す失敗と追加対応（2026-11-07）

記録コミット `bbe7443e61af24e254a4be746237d7527e5efd09` のrun42362035321は、attempt1と全jobを再実行したattempt2の双方でdesktopが失敗した。planner、Windows/Ubuntu fixtures、required、mobileは両方成功し、aggregateはdesktopの失敗を受けて正しく失敗した。どちらもchromiumのbrowser実行後にreceipt照合が116件の指摘で失敗し、chromium-authは未起動だった。116は失敗テスト数ではなく、未実行結果などを含む検証指摘数である。cleanup unknownも回収漏れの断定ではない。

attempt1は最初のjob開始からaggregate完了まで872秒、全job合計1,993 runner秒。attempt2は895秒、1,855 runner秒。失敗2回の合計3,848 runner秒を追加コストとして記録する。失敗試行を性能改善の成功サンプルには含めず、初回成功だけで安定性を主張しない。各attemptのrawメタデータと成果物は混ぜずに保存した。PRはDraftを維持し、本番反映はしていない。

既存の公開診断には詳細な指摘種別や対象ケースがなく、原因は未特定。時刻に応じたfixture日時生成は存在するが、今回の匿名chromium失敗と結び付く証拠は得られていない。これ以上の同条件再試行より先に、workerのreceipt段階へ固定語彙・件数・登録済みキーのハッシュだけの診断を追加する。raw reportや任意エラー文は公開せず、合否・cleanup・artifactの受入条件を維持する。限定反例テスト、独立レビュー、固定baseの共通gateを経て公開し、新しいheadのHosted結果から失敗ケースを特定する。原因修正と同一head/run/attemptの再受入まで追加対応を完了扱いにしない。

診断追加の限定56テスト・型・Biomeと、Sol / mediumの独立3担当レビューが成功。指摘の検証結果未取得・timeout/中断の区別、欠落ケースの低優先表示を反映した。共通quality `4d49d90c882c` / selection `35b57d4c8377` / verification `e3623baa655a` も成功し、unit1,097成功/既存skip8、tools2,192成功、必須67・extras312・全330行を再照合。入力前後は `d2da5de5614ff218626aff760c445a58179fedf6d3b3724438d1e269ee3fe10b` で一致し、6 DB cleanup・7 process終了、専用port・所有container・テスト用Node残留0を確認した。ローカルの匿名Chromium57件ではHostedの失敗は再現しなかった。詳細は[診断追加レビュー](../reviews/diff-review-2026-11-07-4.md)。次は診断を含む新しいheadのHosted結果を取得し、原因を特定する。

診断head `7064c41e9af547d10f31d0fc41e33ad18cf1c570` のrun42367955939 attempt1は全7jobと重複検査が成功し、同じhead/run/attemptの6組のartifactを独立再検証した。必須67・extras312、全330行、6 DB cleanup・7 process終了、固定履歴も一致。required verificationは `188ec1a5e578`、desktopは `ba1f264488a7`、mobileは `329ecd4acb31`。この試行では失敗が再現しなかったため、診断の公開経路は限定反例テストで検証済みだが、実際のHosted失敗ケースの特定・原因解消は未完了である。

この成功観測の最初のjob開始→aggregate完了は1,070秒（17分50秒）、全job和は2,406 runner秒。PR9基準との差は-364秒・+8 runner秒。planner379秒、required563秒、desktop640秒、mobile452秒、aggregate47秒、Ubuntu229秒、Windows96秒だった。初回成功観測と別の試行として扱い、前述の失敗2回の合計3,848 runner秒を除外して安定性を主張しない。計時記録の訂正後の最終headでもCIと成果物を確認し、結果はPR本文へ記録する。

### PR9本番反映とPR10のmain向け再検証（2026-11-07）

ユーザーがPR #9のmainマージ・本番デプロイと、PR #10のmain向け再検証を承認した。PR #9はmerge commit `e9427ba2fb1fbeb8ead90970d45bd24c47bf9fa0` で取り込まれ、Cloudflare deploy run42372091931は成功。main Test run42372091782と本番疎通を確認後、PR #10をmainへ切り替える。PR #10の本番マージは今回の承認範囲に含めない。

一時base `perf/e2e-tools` を両workflowとPRイベントschemaから削除し、旧base・類似名・pushの拒否、main/developと既存前提baseの受理を回帰確認する。この再検証Batchの比較元は上記main merge commitに固定する。旧固定base `0a5133d489d14e0a94c6fded66ebb656c6f8869b` とmainのtreeは同一だが、PR event baseはmain merge commit、履歴上のmerge-baseは旧固定baseであり区別する。過去の測定・受入記録は変更しない。新しいhead/run/attemptのCI、成果物、完全cleanupを確認するまで再検証は完了扱いにしない。以前のdesktop間欠失敗の原因未特定という制限は維持する。

再検証の初回quality `1ef0edde6514` はlint・型を通過したが、unit1件（AvailabilityWorkspacesの通常位置／固定バーの確定保存）で失敗した。1,096成功・既存skip8・1失敗、tools以降とDB環境起動には進んでいない。限定再現ではエラー表示後も保存中が続くことと、待機中の全画面role探索に約113〜234msかかることを観測した。単発の元失敗はDOM出力が途中で切れており原因確定とは扱わず、待機ループは安価なbuttonラベル・有効状態で確認し、成立後にアクセシブルなroleを一度照合してクリックする限定テスト修正を行う。両位置からの操作と1／2回目のエラー表示を維持し、製品処理・既定timeout・retry・skipを変更しない。失敗receiptは保存し、新しい共通gateで全体を再確認する。

2026-11-08の再開時にmain Test run42372091782 attempt1の全6job成功を確認。5組のartifactはGitHub metadataとZIP SHA256を照合し、承認main revisionの未変更schema1 validatorで独立再集約した。実効計画67必須・extras312、catalog348、legacy330行（成功319・既存skip11のidentity一致）、6 DB cleanup・7 process終了、固定履歴digestを確認。required verificationは `642b74d1ab04`、legacyは `e813ff79985e`。現在のcheckout HEADをmainへ変更せず、歴史pushの固定before/headと実Git objects、取得元metadataを分けて検証した。

PR #10のbaseをmainへ変更し、Draftと未マージを維持した。現在headは `eae61a7273dd60e7c29fca908973f27321c19a20` で、main向けの新しい変更headは未公開。strict status設定により現在のmergeStateStatusはBEHINDだが、PR head検証はevent baseとmerge-baseを分離して実行できる。本番マージ前のmain追従とその後の再検証は別途必要であり、今回の承認範囲に本番マージは含めない。

### main向け再検証でのfixture診断（2026-11-08）

再開後のquality `6108c6a505fd` / selection `3d1e90be78ff` / verification `088f45a0f397` はlint・型・unit1,097成功/既存skip8・tools2,194成功・台帳を通過。integration30件とStorybook9件は成功したが、isolatedの日程調整10件のうち `schedule-confirm-persist / keeper-only / main` が画面操作前の参加者作成で失敗し、legacy4projectには進まなかった。失敗runを成功扱いにせず保存し、所有DB cleanupと専用port・container・テスト用Node残留0を確認した。

元の例外はINSERTエラーと返却row不一致をまとめていたため、保存証跡から原因を判別できなかった。両方の厳格な失敗条件を保持したまま分岐を分け、HTTP status・形式検証済みSQLSTATE/PGRST code・ローカルで決まる参加者種別だけを記録する。DB本文・接続情報・IDは出さず、timeout/retry/skipも変更しない。これは診断改善であり、原因解消を示すものではない。

また、要約の固定方針 `shadowFailureClassification` が実際の失敗分類に見えるため、`shadowFailureAttributionPolicy` へ改名した。今回shadow比較は未実行で、Storybook失敗という当初の読み取りは誤りだった。実runの合否判定は変更しない。追加修正の限定50テストとBiome、[全9コードファイルの6観点レビュー](../reviews/diff-review-2026-11-08-2.md) は成功。対象の所有環境での再実行と、新しい共通qualityは別途必要。

共通gate受入後、変更を通常hook付きでコミットし、固定main `e9427ba2fb1fbeb8ead90970d45bd24c47bf9fa0` を検証ブランチへ通常mergeする。merge前後のtree完全一致、merge parentと新merge-baseの固定SHA一致を確認し、一括push後の最終headで全7job・6組のartifactを再受入する。merge前のローカルreceiptとmerge後のHosted証跡を区別する。このmain追従はPR #10の本番マージではない。

### main向けローカル共通gateの受入（2026-11-08）

診断追加後のquality `f0187e70242a` / selection `240bd4bb92ae` / verification `306d2bf199f5` が成功した。lint・型、unit91ファイル1,097成功/既存skip8、tools148ファイル2,199成功、全台帳・登録収集・差分選択・7実行stageを通過。保存物を独立に再検証し、必須67・extras312、legacy330行（成功319・既存例外11、project別57/57/108/108）、desktop/mobileのCI consumer各165行と一致した。開始・終了のinput digestは `f5210929354adaeb7e4552dc43c39f69ca5c2a8196943dd99160adb8c4caffb0` で同一。6 DB環境のcleanup complete、7 processの終了・エラー0を確認し、ホスト側でもNodeと稼働containerの残留0を確認した。

日程調整10件はすべて成功し、先の参加者INSERT/row照合失敗は再現しなかった。以前のHosted desktop失敗も含め、原因解消が証明されたとは扱わない。今回の受入はmerge前HEADと未コミット入力に対するローカル証跡であり、main追従後の最終headのHosted受入は別途必要。

単独診断入口 `scheduleCheck.ts` には、画面部品由来のsurface契約を解決できない既存不整合も見つかった。discovery10件とbindingは成功するが、surface projectionを含まないinventoryによりMISSING_TARGET2件・UNEXPECTED_CHECK8件となる。surface対応済みの正規共通gateとは別経路で、今回のE2E失敗原因ではない。

- [ ] 後続変更で単独scheduleCheckのinventoryをsurface対応へ揃え、surface生成をmockで省かない回帰を追加する。今回の受入では単独入口の成功や修復を主張しない。
