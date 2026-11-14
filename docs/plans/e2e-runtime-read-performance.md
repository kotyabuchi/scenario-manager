# DBライフサイクルの内訳計測と実read再照合の重複削減

## Context

開始base/headは `654314cc90c596902756a69e802bd49df085d5ba`。専用worktree `e2e-ui-prerequisite/scenario-manager`、branch `perf/e2e-legacy-shards` を継続する。PR #10はDraft・未マージを維持する。ユーザーの2026-11-14の指示により、DB準備・cleanupの内訳と実read照合を対象に進める。

直前のHosted run43577953212 attempt1は全7job成功、CLI導入2〜4秒、runtime版確認42〜57ms。全体wall996秒は単一観測で、DB内部の各処理の寄与は未分離。前の実repo準備計測ではinventory再照合約30秒が残った。

## Batch 1: 内訳を可視化し、同一再照合内の無駄を削減

### Step 1-1. DB準備・cleanupの計時

環境ownerとprobeの実経路を調査し、lock、入力準備、start、inspect、catalog、cleanupの観測・除去・残留確認・lock解放などを固定名で計る。単調時計・成否だけを記録し、資格情報・path・例外本文を出さない。診断失敗は処理結果・例外・cleanupの順序を変えない。親子spanと並行区間の和を総wallと見なさない。

### Step 1-2. 実read再照合の重複削減

operationと全引数、記録値の整合を確認する。同一再照合内の重複問い合わせだけを候補とし、fresh入力・Git入口・実内容・存在・realpath・列挙の検査を維持する。同じkeyで値が揺れた記録、変更・欠落・読み取り失敗は共有を拒否する。mtimeだけの照合・永続cache・境界を跨ぐ成功再利用は導入しない。実repoの前後計測で結果同一性と実read削減を確認する。

### Step 1-3. 回帰・レビュー・全体受入

限定回帰、型、readonly lint、独立レビューを行う。全体は `pnpm quality:changed --base 654314cc90c596902756a69e802bd49df085d5ba` に一本化し、必須67・extras312・legacy330行（319成功・既存例外11）、入力前後一致、6 DB cleanup・7 process終了を独立に照合する。通常commit/push後、同head/run/attemptのHosted成果物・計時を受け入れ、最終結果をPR本文へ記録する。

## 実装と局所検証（2026-11-14）

所有環境11operationを既存cliTimingへ追加した。開始時計の障害も隔離し、元の成功・失敗とcleanupを維持する。限定4 suiteと追加probe回帰が成功。read側はsource/sourceReadWitness/staticGateを含む通常環境の4 suite55件、最終witness12件が成功した。sandboxのjunction作成EPERMは通常環境で再検証し、失敗記録を保持する。

raw FS/TypeScript/Gitのoperationと全引数をkeyにし、初回は全read/hashを維持する。同key異値やread失敗は共有を拒否し、再照合時は初出queryの順に毎回実readする。永続cacheやmtimeのみの照合はない。product/Story両入口の実repo観測は203,956件、unique query67,826件となった。

同一captureの旧matches成功経路と新実装を各3回比較した（秒）。旧28.125 / 26.117 / 26.155、新12.109 / 11.961 / 11.957。中央値26.155→11.961秒。解析結果はbaselineと厳密一致を確認した。これは再照合だけの観測であり、初回capture・全準備wall・CI全体の改善率ではない。old→new固定順、OS cache・他処理負荷・Windows環境の制限がある。

最初の診断harnessには集計費用があるためwall改善値には採用しない。最終harnessの最初の試行も記録配列増殖を検知して中断・除外し、raw callbackを直接渡す修正版を独立監査した。採用成果物はignored `read-witness-candidate.json` / `read-witness-candidate-final.private.log`。3観点の独立コードレビューは必須指摘0。[差分レビュー](../reviews/diff-review-2026-11-14-2.md)を参照。

## 初回全体検証の失敗記録

quality `094053c93ec9` / selection `3593de497211` / verification `063694aa2616` は失敗した。lint・型・unit1,097成功/既存skip8・tools2,274成功/WindowsのLinux専用skip6は通過。新旧planは必須・extrasの内容を含め全項目一致した。

認証ありdesktopのセッション詳細a11yで、page.gotoが約17msで `net::ERR_CONNECTION_FAILED` になり、テストは242msで終了した。HTTP応答がなくAxeは未実行。Playwright結果は106成功・既存skip1・失敗1。未認証desktop57成功、mobile48成功/既存skip9で、mobile認証は未実行。同じサーバーで前後のテストは成功しており、後始末はテスト終了後だった。起動した5環境のcleanupはcomplete、専用ポートとコンテナ残留0を確認した。processCleanup.errorCount=1はproject失敗の集計値で、サーバーcleanupエラーではない。今回の実装との因果や接続失敗の根本原因は未確定で、成功扱いにはしない。

失敗成果物を保持し、コード・テスト・閾値を変えず新IDで全体再検証する。旧Hosted/参加者INSERTの間欠失敗と同一原因とは断定しない。

## ローカル全体受入

再実行quality `40f4d5f38c73` / selection `cb5934f5c2ec` / verification `7b454032703a` は成功。必須67・extras312・legacy330 unique行（319成功・既存例外11）、入力前後一致、6 DB cleanup・7 process終了/error0を独立照合した。コード9ファイルは計測開始時hashから不変。直前の成功verification `14f701f828e6` とplan全項目が完全一致した。unit1,097成功/既存skip8、tools2,274成功/Linux専用skip6。全体wallは1,702.494秒で、初回失敗は消さず保持する。

成功した再実行の6環境で、11 operationが各6回、CLI事前確認を含む全96計時が正常完了した。下表は単一ローカルrunの区間観測（秒）で、DB準備の短縮率ではない。親子spanと外側phaseを合算しない。

| operation（environment-接頭辞） | 中央値 | 最小〜最大 |
| --- | ---: | ---: |
| lock | 0.045 | 0.043〜0.051 |
| inputs | 0.121 | 0.113〜0.132 |
| preflight | 0.467 | 0.445〜0.491 |
| start | 25.599 | 24.969〜26.911 |
| inspect | 0.862 | 0.826〜1.099 |
| catalog | 0.134 | 0.131〜0.168 |
| cleanup-record | 0.844 | 0.826〜1.225 |
| cleanup-plan | 0.856 | 0.841〜0.957 |
| cleanup-remove | 5.726 | 4.591〜7.218 |
| cleanup-remaining | 0.220 | 0.211〜0.264 |
| release | 0.010 | 0.009〜0.014 |

受入正本はignored `runtime-read-quality-acceptance.json` / `runtime-read-local-timing.json`。新headのHosted結果・計時はPR #10本文で管理する。起動内のmigration/seedやapp fixture・build/browserはこの11区間だけでは分離し切れず、次の調査候補として残す。

## 制約と残件

Docker Desktopは起動・停止しない。テスト所有環境と解析LSPだけを後始末し、他アプリのNodeを停止しない。DB dump/cache、migration変更、テスト集合・品質閾値の変更、本番反映は今回の対象にしない。旧間欠失敗と未移行pendingは維持する。
