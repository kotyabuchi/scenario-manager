# 選択・収集処理の計測と重複削減

## Context

開始base/headは `f8070302052f1a45b5f77419a4f8964ad7ecb974`。既存worktree `e2e-ui-prerequisite/scenario-manager` / branch `perf/e2e-legacy-shards` で進める。PR #10はDraft・未マージを維持する。ユーザーは選択・収集の内訳計測と重複処理削減を承認済み。

[前Batch](e2e-test-layer-performance.md)の新headは全8チェック・独立artifact照合が成功した。Hosted run42460832272 attempt1のplannerは313秒、static-ledger30.414秒、collection29.579秒、selection54.026秒。ただし各phaseは複数処理を含み、一観測から原因は決められない。

## 決定事項

| 項目 | 方針 | 理由 |
| --- | --- | --- |
| 順序 | 計測を先に加え、baseline後に再利用範囲を決める | 未計測の処理を効果の根拠にしない |
| 計時 | 固定phase/operation・単調時計・成功/失敗・固定revision・再利用有無だけ | path・環境変数・例外本文・資格情報を公開しない |
| 比較 | 同じ実repo・Node/lock/worker条件で各3回、初回と反復を分離 | 並行spanの和をwallへ加算しない |
| 再利用 | 同じ呼び出し内、同じ入力・設定を証明できた結果に限定 | 永続cacheや古いreceiptを成功根拠にしない |
| app列挙 | staticとruntimeの別設定を維持 | playwright.config.ts/auth-setupとlegacy-local/空setupは同じ結果ではない |
| 選択 | base/head/index/working、Panda由来、package安定検査、全件fallbackを維持 | 変更検出を高速化のために弱めない |
| 品質 | 共通quality、独立レビュー、最終headのHosted受入 | ローカル計時だけでCI成功を代替しない |

## 前提条件

- 作業開始時Git clean。旧間欠失敗は原因未確定、coverageStatus=insufficientと既存pendingを維持する。
- staticとcollectionはproduct/storyの解析と列挙を繰り返す。storybook/isolated/integrationは同じ有効引数の候補だが、appは異なる。
- snapshot inventoryは既に同一digestの再利用を行う。blob/OID cacheも既存。新たな再利用を入れる前に実際のbuild数を測る。
- Docker Desktopの起動停止は行わない。テスト実行系とこの作業の解析用LSPを所有関係で限定し、終了後に確認する。他chatのNodeは停止しない。

## Batch 1: 内訳を計り、同一処理の再実行を減らす

### Step 1-1. 測定契約を追加する

`prepareChangedVerification`からstatic、collection、snapshot inventoryへ任意の計測observerを渡す。既存APIはobserverなしでも同じ結果・失敗・終了待ちを保つ。計測は診断用途で、receiptの合否・digestには混ぜない。CI plannerの既存phaseログを保持し、内側の計測を別prefixで出す。ローカル比較harnessは同じ実処理を呼び、品質成功の代替にはしない。

測る対象はproduct source、storybook source、inventory、各collector、並行wait、登録照合、legacy/plan、snapshot、Panda証明、revisionごとのdigest/build/cache、decision、checkpoint。同期処理と非同期処理を区別し、`Promise.allSettled`と失敗伝播を維持する。観測処理の失敗が本来のエラーや結果を上書きしないことも確認する。

### Step 1-2. 実repoのbaselineを取得する

計測追加後・削減前の実処理を3回動かし、phase wallと内訳、同一digestのbuild/reuse回数を保存する。列挙やsnapshotの由来を切ったmockで速度を測らない。返却された静的検査、登録集合、full plan、選択結果の意味を比較できる要約を保存する。測定中に入力を編集しない。OS/dependency cacheと他chat負荷は統制しないため、その制限を記録する。

### Step 1-3. 実測に基づき重複を削減する

支配的な同一入力処理を限定して再利用する。候補はstatic→collectionのinventory、同じ設定のcollector、snapshot内の再解析。採用範囲と測定根拠はこの計画へ追記する。解析入口の統合によってproductとStorybookの意味が変わる案は、同等性を示せない限り採用しない。

再利用にはroot、固定入力digest、有効なconfig/setup/profile等の条件を明示する。境界のfresh capture/checkpointを残し、不一致・欠落・失敗を成功へ変換しない。collectorの副作用guard、全process終了待ち、各用途の台帳・登録・legacy検証は残す。公開APIの任意オブジェクト注入だけで検証済みと扱わない。

### Step 1-4. 回帰・再測定・共通品質検査

同じ条件で3回再測定し、結果集合・plan/選択意味を照合する。計測observerなし/ありの結果・例外の同等性、入力や設定の不一致、解析/collector失敗、途中変更、旧revisionのgraph復元失敗等の意味ある反例を検証する。単なるcall数だけで品質を証明しない。

最終コードを整形後、限定回帰と `pnpm quality:changed --base f8070302052f1a45b5f77419a4f8964ad7ecb974` を実行する。required67/extras312/legacy330と既存例外、固定入力、所有cleanupを照合する。最後に独立レビューを行い、通常commit/push後にPR10の新head/run/attemptのCI・artifact・計時を確認する。本番マージはしない。

### Review Checkpoint

- [x] observerによる意味変更・秘密漏えいなし
- [x] 実repo各3回のbaseline/candidateと測定限界を記録
- [x] 再利用条件の一致・不一致・失敗の反例を確認
- [x] 共通品質検査と固定入力・cleanupの独立照合
- [x] 独立差分レビュー

通常commit/push後の新head・Hosted受入・計時は、PR #10本文で実施結果を管理する。

## ファイル一覧

### 実測後の採用範囲

計測だけを追加した同一入力で3回実行した。準備処理のwallは278.495 / 268.310 / 266.996秒、中央値268.310秒。static inventoryは56.955 / 57.004 / 56.912秒、collection inventoryは57.011 / 57.122 / 57.027秒だった。full plan、登録集合、legacy、静的検査、graph、decision/effectiveと入力・Git digestは3回とも一致した。必須67/extras312、Panda proven、coverageStatus=insufficient、full-requiredを維持している。

今回は **static→collectionのraw inventoryだけ** を一度再利用する。全collectorの再列挙、用途ごとのwithSurfaceNodes/bindDiscovery/validateLedger、legacy照合、plan生成を維持する。selectionはbase/head/indexの既存共有が動いており、workingとの別解析は残す。新しい永続cacheや解析入口の統合は行わない。

独立検討で、rootと入力fingerprintだけではGitの追跡状態や依存型定義の変化を捕捉できないと判明した。product/Storybook両方の実読み取り（Git入口一覧、存在判定、realpath、source/package/標準型、ディレクトリ列挙）を記録する。再利用前に同じ順で再読し、不一致・例外なら通常の解析へ戻す。memoize済みisAllowed値の再参照で済ませず、その下の生のFS問い合わせを観測する。記録にはhashと再読関数だけを保持し、AST/Programやraw本文をcacheに保持しない。

static stateのidentityをmodule-private WeakMapのkeyとし、前後のfresh input一致、root、独立clone、読み取り証拠を紐付ける。collectionはfresh inputsと全collector終了後に一度だけ消費する。偽state、外へ返したinventoryの改変、別root/入力、再消費では再利用しない。証拠の再読費用と前後fingerprint/cloneの費用も含めてcandidateを3回測り、短縮と結果同一性を確認して採否を決める。

計時はWindows/Node24.12.0/Vitest3.2.4のlocal観測。OS/dependency cacheと別chat負荷は統制せず、Hostedの改善率へ外挿しない。

| 対象 | 用途 |
| --- | --- |
| 新規preparation timing helperと回帰 | 固定schema・同期/非同期計時・安全な出力 |
| staticGate.ts / prepareVerification.ts | source/collector/検証の内訳と条件付き再利用 |
| sourceReadWitness.ts / source.ts / extractors/surfaceRoots.ts | Git入口・物理readの証拠とproduct/Story両解析への接続 |
| prepareChangedVerification.ts / snapshotInventory.ts | selectionの内訳と呼び出し内の同一性 |
| ci.ts / ciPlan.ts と関連回帰 | 既存CI phaseとは別の内訳出力 |
| 各境界の既存回帰 | 同一性・途中変更・失敗・guardの維持 |
| 本計画・運用説明 | 採用範囲、計測、残件 |

## 検証方法

型・readonly Biome、対象tools回帰、実repoの登録/plan/decision比較、共通quality、Hostedの独立artifact再照合を順に行う。計時は診断情報であり、receipt成功条件を追加・省略しない。測定成果物は `test-results/quality/planner-perf-*` へ保存する。Hosted最終結果はPR本文へ記録し、文書追記だけでCIを再起動し続けない。

## ローカルの比較結果（2026-11-08）

同じ実repo・固定base/head・Node24.12.0・lockfileで、計測追加だけのbaselineと再利用追加後を各3回実行した。測定中の入力は変更していない。

| 条件 | 準備wall 1回目 | 2回目 | 3回目 | 中央値 |
| --- | ---: | ---: | ---: | ---: |
| baseline | 278.495秒 | 268.310秒 | 266.996秒 | 268.310秒 |
| inventory再利用 | 248.744秒 | 248.802秒 | 253.691秒 | 248.802秒 |

総時間の中央値差は19.508秒、約7.3%。collection全体は中央値70.847→43.632秒、同段階のinventory解析57.027秒がなくなり、代わりに実read再照合が29.533〜29.862秒かかった。static側の記録・clone・前後入力照合も総時間に含む。selectionは中央値125.131→125.937秒であり、改善したとは扱わない。並行collectorや内側spanを総wallへ加算していない。

全6試行でfull plan・全discovery・integration collection・legacy・static report・graph、effective選択は一致。必須67/extras312、full-required、coverageStatus=insufficientを維持した。同一条件内では入力・snapshot・decision・Panda proofも完全一致。条件間の入力/Git digest差はコード変更由来で、decisionのreasons/coverageGapsは意味キーを照合したうえで追加した6ファイルだけをpath差として許容した。Panda proofは入力/Git digest以外を厳密照合し、provenを確認した。

比較harnessと照合条件も独立監査済み。これは準備処理のみの測定であり、runtimeの成功receiptを代替しない。OS/dependency cache・別chat負荷・ピークメモリは統制または計測していない。Hostedへの外挿はしない。

型、readonly Biome、対象9ファイル107テストが成功。3エージェント（Sol/medium）の独立コードレビューは必須指摘0。初回のsandbox内テストは一時Git作成を拒否されたため中断し、通常環境で全対象を再実行して成功した。詳細は [差分レビュー](../reviews/diff-review-2026-11-08-5.md)。共通qualityと最終headのHostedは別途受け入れる。

## 次に評価する候補

実read再照合が約30秒残る。operationと全引数を明示keyにした重複問い合わせの削減は候補だが、未計測。同じkeyで観測値が揺れた場合は共有を拒否し、初回のguard/read順序を保持する必要がある。mtime/sizeだけの比較へ置換しない。product/Storyの共通package readや各fingerprint境界も、同一性と実costを確認してから判断する。

runnerのDB準備・cleanup区間、製品テストの重複整理、旧間欠失敗の原因調査は継続課題。今回の解析共有で解消したとは扱わない。

## 共通検証で見つかったソート操作の間欠失敗

最初のquality `591248798827` / selection `708f69640b8e` / verification `5e3169d7e4ad` は失敗。lint・型・unit91ファイル（1,097成功/既存skip8）・tools152ファイル（2,232成功）、非app必須49件は成功した。legacyは未認証desktop57件が成功、mobileは47成功/既存skip9/失敗1。認証あり2構成は未実行で、全体成功には扱わない。起動済み環境は後始末済み。

保存traceから、`e2e/sessions/public.spec.ts:46` のクリック時、Next.js streamingの `<div id="S:0" hidden>` に残るSSR版ソートと、表示中のクライアント版が一時共存していたと確認した。旧CSS locatorは両方を拾いstrict mode violationになった。`e2e/pages/sessions-page.ts` をアクセシブル名が完全一致する可視comboboxの取得へ変更した。操作・URL assertion・ケース数・既存例外は維持し、固定待機や `.first()` は追加していない。

独立のtrace調査・追加差分レビューを行い、mobile単独のowner `efc1a58672b1` は57行（48成功/既存skip9）、cleanup completeで成功した。これは部分診断なので、新しいIDで共通qualityを再実行する。前節の性能比較はこのセレクター修正前に固定した17コードファイルの測定であり、その17ファイルは変更していない。旧Hosted run42362035321や参加者INSERTの未特定原因と同一とは断定しない。

## 最終ローカル受入（2026-11-08）

quality `d949a26337f3` / selection `610797372d45` / verification `7e293b181035` が成功。固定base/headは `f8070302052f1a45b5f77419a4f8964ad7ecb974`、input digestは `ec01ea40f669bb4aa7b8ac1502cc550c6b251547e0a5f0070d26a5e2bd7f792f` で前後一致。共通qualityのwallは1,900.348秒で、準備処理だけの比較値とは区別する。

lint・型、unit91ファイル（1,097成功/既存skip8、46.49秒）、tools152ファイル（2,232成功、224.59秒）が成功。必須67/extras312、legacy330行（319成功/既存例外11）、6 DB cleanup complete、7 stageのprocess終了・エラー0を、固定IDとselection/verification receiptから独立再検証した。full-required、coverageStatus=insufficient、legacy-localを維持する。

後始末後の専用ポート・当該worktreeのNode・実行中コンテナは0。測定した17コードファイルのhashも再照合して不変を確認した。受入正本は `test-results/quality/planner-perf-quality-acceptance.json`、残留確認は `planner-perf-local-cleanup.json`。本節の文書更新後に通常commit/pushし、新headのHosted結果はPR本文へ記録する。
