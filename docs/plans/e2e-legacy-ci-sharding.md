# 既存E2Eのdesktop／mobile分割計画

## Context

PR #9は `0a5133d489d14e0a94c6fded66ebb656c6f8869b` で全CIと独立artifact照合を通過した。tools区間は130.174秒まで短縮したが、CI全体は23分55秒、直列legacyは16分2秒だった。4つの既存Playwright projectを2つのHosted jobへ分け、検査集合と合否の強さを保って待ち時間を減らす。

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
- [ ] Batch2: CI契約の一括切替
- [ ] Batch3: Hosted受入・性能判定・片付け
### Batch 1受入（2026-11-07）

共通quality `f257bf5335a2`、selection `4e6a57a425dc`、verification `7647f9368f10` が成功。lint・型、unit1,097成功/既存skip8、tools146ファイル2,132成功、必須67・extras312を7stageで照合した。入力前後は `82764a6a6313f37b405153311def99549d838c3b611f44cad8ae014e84703e6c` で一致。保存したlegacyResultsを正本validatorへ独立に再投入し、330件（成功319・既存例外11）、project別57/57/108/108を確認。DB環境6件のcleanup complete、全7stage process終了/エラー0、native確認で専用port・テスト用Node残留0。coverageStatus=insufficientは継続する。

レビューはSol / mediumの3担当で全6観点OK。scope逆順のstage/checkpoint順を修正し、公開schemaの責務をJSDocへ追記した。共通gate後に変更したのは本計画の進捗・接点整理とレビュー記録だけ。CIの契約切替と分割の実測は未実施で、次Batchへ進める。