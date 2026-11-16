# DBのimage取得・展開と起動待ちの切り分け

## Context

2026-11-15の続行指示。既存の専用worktreeとPR #10を継続し、今回の固定baseは `448990008d4684364d3cf2e3abf9a1c6588ba993`。PRはDraft・未マージ。先読みを撤去したrun43673774698のmobileは初回132.014秒、database→schemaが97.363秒、2回目26.097秒だった。requiredは初回118.719秒のうちdatabase前88.412秒。以前の速度改善案の不採用は覆さない。

## 一次調査と方針

固定Supabase CLI2.75.0の一括Compose pullは `IgnoreFailures:true`。`Starting database...` 後のDockerStartにもimage inspect→NotFound時のpullがあり、4秒/8秒間隔の再試行を含み得る。97秒はhealth待ちだけではなく、再pull・network/volume/container生成・initdb・health・接続を含む。この区間をDB health所要時間と呼ばない。

非TTYのCompose plain出力はlayerの親image情報を失い、fallbackのMoby表示は一部progressを抑制する。通常出力から正確なimage別download/extract時間を再構成できない。観測した状態・件数・最初/最後の時刻を記録し、未観測をゼロや成功としない。追加pull、PTY、CLI更新・改造、Docker API proxy、health省略は行わない。

根拠: [CLIのpull](https://github.com/supabase/cli/blob/v2.75.0/internal/start/start.go#L186)、[DockerStart](https://github.com/supabase/cli/blob/v2.75.0/internal/utils/docker.go#L195)、[DB起動](https://github.com/supabase/cli/blob/v2.75.0/internal/db/start/start.go#L158)、[Compose plain](https://github.com/docker/compose/blob/v2.40.3/pkg/progress/plain.go#L39)、[Moby表示](https://github.com/moby/moby/blob/v28.5.2/pkg/jsonmessage/jsonmessage.go#L168)、[Docker events](https://docs.docker.com/reference/cli/docker/system/events/)。

## Batch 1: 同一起動の安全な観測を増やす

### Step 1-1. pull状態を分離して観測

既存stderr observerのbounded行処理を再利用する。Compose/fallbackとdatabaseマーカー前後を分け、固定image役割の到達点、全layerのdownload/extract等の件数と観測範囲を記録する。IDは上限付きメモリ内だけ、公開出力は固定schema・列挙値・有限数のみ。途中のエラーは固定分類し、診断の例外・未観測が本処理に影響しないようにする。並列区間を合算せず、観測幅を正確な処理時間と呼ばない。

### Step 1-2. 所有DBのlifecycleを照合

CLI呼出前後の時計を保持し、既存verifyで所有ID/labelの一致を確認したDBだけを対象とする。必要項目に絞ったinspectと、since/until付き有限events読取でcreated/start/healthyとrestart/die/oomを観測する。health output・Env・生ログ・識別子は公開しない。events履歴上限による欠落や時計ずれを明示し、create前をすべてpullと推定しない。

診断は合計2秒deadline、親取消を伝播し、既存runnerのclose確認まで待つ。timer/listenerを解放し、background processを残さない。診断の失敗は環境検証の成否やcleanupを変えない。診断読取の追加時間は本来のstart command計測へ含めない。

### Step 1-3. 検証・レビュー・実CI受入

独立するparserとlifecycle helperをSol / mediumで並行実装し、親が統合する。秘密混入・上限・disabled・取消・終了待ち・不一致・欠落の回帰、型・readonly lint、所有環境の新規復元を確認する。共通qualityは固定baseに対して実行し、67必須・312extras・legacy330行・入力一致・6 cleanup・7 process終了を維持する。差分を独立レビュー後にcommit/pushし、同じ最終headのHosted全チェックとartifactを独立照合する。

計測用の限定検証commitで必要なHosted観測を行う場合も、最終受入とは区別する。遅延が再現しなければ原因確定とせず、得られた観測と残る不確実性をPR本文へ記録する。Docker Desktopは起動停止せず、今回所有のテスト資源・LSPだけを後始末する。

## 2026-11-15: 保存済み72初回 start の再集計

独立比較の受入済み24 workflow attempt × 3 shardについて、保存された各 job の**初回** `supabase-pull-timing` summary を集計した。同じ summary のlayer更新を重複して数えず、件数は時間ではなく「少なくとも1件の表示を観測した初回 start の数」。各3 shard は workflow attempt 内の job であり、72件を独立した72 workflow試行とみなさない。元の観測・artifactは変更していない。

| 条件 | 初回 start／summary観測 | database後 fallback Pulling観測 | うち postgres観測 | retry表示観測 | Downloading開始欠落あり | Extracting開始欠落あり |
|---|---:|---:|---:|---:|---:|---:|
| 基準 ECR | 18 / 18 | 10 | 3 | 2 | 16 | 10 |
| A 常駐Storage除外 ECR | 9 / 9 | 9 | 0 | 1 | 9 | 9 |
| A2 Storage無効 ECR | 9 / 9 | 4 | 3 | 1 | 9 | 4 |
| B cache miss/save ECR | 9 / 9 | 6 | 2 | 1 | 9 | 6 |
| B cache hit/load ECR | 9 / 9 | 0 | 0 | 0 | 0 | 0 |
| C GHCR | 9 / 9 | 0 | 0 | 未確認 | 8 | 0 |
| A2＋GHCR | 9 / 9 | 0 | 0 | 未確認 | 9 | 0 |

「0」はその固定 parser が対象表示を記録した件数が0であり、処理・通信・retryや失敗がなかった証明ではない。特に当時のretry parserは `ghcr.io/supabase/` を認識せず、GHCR 18起動のretry件数は欠測として扱う。ECRでも非TTY出力の省略・解析対象外・summaryの上限があり、観測されないretryやエラーの不存在は証明できない。保存済み summary の固定エラー分類には該当表示がなかったが、成功と推定しない。開始欠落は対応する完了表示を認識したlayerのうち開始表示を見なかったというフラグであり、全layerの正確な時間ではない。layerとimageの対応、転送・展開・I/Oの排他的な時間、fallbackの直接原因は引き続き不明。

本修正では今後の `ghcr.io/supabase/` と既存 `public.ecr.aws/supabase/` の固定roleに限り4秒・8秒retry表示を同じ安全な列挙値へ縮約する。tag・registry・生行・未知roleは公開しない。既存のエラー分類を追加・変更せず、欠測を0へ変換しない。旧summaryを新parserで取得した証拠に書き換えず、修正後の実環境で新たに確認する必要がある。

## 2026-11-16: fallbackの直接原因を絞る追加診断

固定CLI 2.75.0はCompose 2.40.3を内包し、ImagePullのAPI直後エラーをrole付きprogressにする一方、開始済みstreamのdecode/errorはprogressなしで返し、IgnoreFailuresにより個別エラーが破棄される。`--debug`はDocker独立transportのstream errorを復元しない。daemon 28.0.4の一部layer error/retryはjournalへ出るため、Hosted Linuxで `GITHUB_ACTIONS=true` のstart直後にだけ固定docker.service・現在boot・同start壁時計窓のread-only journalctlを限定採取する。固定 `/usr/bin/journalctl --no-pager` を直接所有childとして起動し、sudoへのfallbackは行わない。子プロセス所有、2秒で終了要求し実closeまで待機、5秒後追加終了要求。出力256KiB・512行・1行16KiB上限、未知/空/unit不明/時計不整合/権限不足/timeout/超過はunknown。raw journal・任意error・URL・layer IDは出さず、許可event enumと時刻だけ、全てunattributed。他imageの並行pullやdaemon全体の影響を区別できず、表示ゼロは失敗不在の証明ではない。reader時間はstart command計測と別記し、診断失敗で起動結果/cleanupを変えない。daemon設定・Docker Desktop操作・追加pullは行わない。

通常CLI stderrではComposeのrole付きInterruptedとMobyの匿名layer `Retrying in Ns` だけ別markerで観測する。layer IDを保存せず、非TTYのparent情報欠落によりroleは不明、retry表示は最終失敗を意味しない。非Linux/Hosted外ではjournal childを起動しない。固定範囲の純粋testと所有child abort/上限testで安全性を確認した。当時は実journal可用性が未検証だった。参照: [Compose pull](https://github.com/docker/compose/blob/v2.40.3/pkg/compose/pull.go)、[Moby download](https://github.com/moby/moby/blob/v28.0.4/distribution/xfer/download.go)、[systemd時間形式](https://www.freedesktop.org/software/systemd/man/latest/systemd.time.html)。

## 2026-11-16 継続診断の実装・検証境界

所有serverの開始要求、実close、停止要求、browser実closeを親の単調経過とUTCで記録する。next-envは既知templateの前後hash・欠測・不明を区別し復元しない。Playwright reportの固定文字列検出は同文字列の存在のみを示し、request発生時刻やtransport原因を証明しない。traceと壁時計の原点は未較正で、close未観測はrequest瞬間の健康状態を保証しない。

Docker journalの同窓診断はLinux Hosted限定、固定対象・出力上限・子の実closeを維持し、情報取得不能はunknownとして本処理の判定に混ぜない。daemon全体の未帰属情報であり該当pullの原因とは限らない。導入時点で関連239テスト、型検査、Biome、ledger検査は成功した。後に固定HEAD `2a804f3` のHosted Test run `43729605534` は独立受入済み（69 required / 310 extras / legacy 330、catalog・cleanupを照合）。local quality `b18c369c9d2c` はユーザー指定の安全停止に伴う入力変更で未合格。今回の追加enumとcheckpoint分類は別HEADであり、そのfull qualityとHostedはこれから検証する。

## 2026-11-16: journalの2種類の追加分類

固定Moby v28.0.4の `distribution/pull.go:124-135` は、endpointを次へ進める際のinfoと、pull継続を打ち切る際のinfo/errorを出す経路を持つ。`dockerJournalTiming` のversion 1出力に `pull-next-endpoint` / `pull-not-continuing` の固定enumを加え、同一窓の相対時刻と `unattributed` だけ記録する。log messageの固定形式だけに一致させ、URL・任意error・識別子を公開しない。旧4 enumとfieldsを維持し、検索対象は外側msgに限定して従来の部分一致を適用する。別error field内の文言は分類しない。列挙値を閉じていた旧consumerは新値を拒否するため受入collector側も更新する。旧runの原記録は変更せず、新分類を過去の空eventsへ遡及しない。出力0は両messageやerrorが存在しなかった証明ではなく、記録されても別imageの並行pullと区別できない。sudo/daemon変更・追加pullや品質/cleanupの緩和は行わない。

## 2026-11-16: checkpoint失敗の分類

停止markerによる入力checkpoint失敗がbrowser phaseと記録されたため、before/after-testsの失敗をinput-checkとして区別する。実browser失敗が同時に起きた場合も保持し、構造化した所有app失敗からserver-exit・server-stop・reportの独立した失敗も失わない。入力検査・失敗判定・実close・cleanupは従来どおり。before-environment失敗は元例外を再throwして環境を作らない。実appおよび複合失敗を含むnative限定6 suite・117 testsとBiomeは成功。最新変更の全体quality・Hosted検証は未実施。

## 2026-11-16: 所有manifest保存のEPERM

固定HEAD `4f2c9bf` のlocal quality `71a332bbf9b8` はauth環境の `mark-running` で systemCode `EPERM`、browser起動・catalog照合前に失敗した。5所有DBのcleanupはcomplete。旧receiptには対象syscallが残らず、当時のrename失敗や原因は確定できない。別途、同じFSの新しい所有一時領域で有限回の書込を行い、旧実装・候補の両方でrenameのEPERMを直接観測したが、過去のsyscallの証明ではない。

保存helperは固定operationと許可systemCodeだけを診断に残し、primary失敗と一時file cleanup失敗を区別する。排他作成成功とidentityを確認した一時fileだけをcleanupし、置換・不明なら触れない。environment manifest保存のみWindowsのrename EPERM/EBUSYに限定して最大5回、25/50/100/200/400ms後の再試行を許可する。初回前に親・targetのownership snapshotを採り、snapshotが取得できなければ従来の初回renameのみ、失敗後の再試行は禁止する。retry前に親・target・temporaryのidentityと必要な内容を再照合し不一致なら元の失敗を維持する。確認とrenameの間は原子的なCASではなく競合は残る。同期待機の合計最大775ms中はevent loopとabort通知も待つ。他のartifactやsidecarはretryせず、既存manifest/receiptのstrict schemaは変更しない。実行前には固定HEADの全体quality・Hostedと所有cleanupを改めて受入する。

統合時、関連4 suiteの98 testsとBiomeは成功。全体型検査はBigInt表記・テスト戻り値を修正後に成功し、修正後のartifact 18 testsも成功。台帳checkはその意味不変の型互換修正前に69登録・issues/policy delta 0で成功、コミットhookと固定後qualityでも確認する。同FS・各600回の単発比較では旧1,433ms、対象retry opt-in 2,184msで候補側に待機1回・最終例外0。固定順・小標本であり、性能差や再発率、旧ownerの原因・根治を証明しない。3独立レビューで未解消必須・推奨0。旧71a試行は未受入のまま、新固定HEADの全体quality・Hostedはまだ未実施。

## 2026-11-16: 一時file identityのLinux反例

Hosted tools failure候補の静的調査中、Linuxの所有containerでtmp unlink後のinode即再利用を確認し、実moduleの同名・同size差替えが旧dev/ino確認を通過して他者内容をpublishする反例を再現した。Hostedの個別失敗caseそのものはログ欠測で未確定。writer open中に別guard handleを取得・照合し、writer close成功後もrename/cleanupまでguardを保持することで旧inodeをpinする。writerが未確認のguardに移行する前に失敗した場合はwriterが開いている間だけ所有tmpをcleanupする。guard closeがpublish後に失敗した場合は `published=true` を固定診断として記録し、失敗を成功に変換しない。

POSIXのguardおよびretry対象readは `O_NONBLOCK` と `O_NOFOLLOW` の両方が使える環境を対象とし、利用不能は安全側に失敗する。inode 0は所有identityを識別できないためfail-closedとする。read-only guardの追加権限が得られない環境でも保存は失敗する。Linux native FIFO差替えは8秒上限内に拒否し、FIFO・targetを保持してwriter/guardをcloseした。Windows native guard中rename/unlink、Linux通常保存および同size差替え拒否は個別に確認済み。これらは有限のOS/FS観測であり全環境のsharing保証ではない。所有確認とrename/removeの間はOSによるCASではなく競合は残る。

統合時の3独立レビューでは未解消必須・推奨0。Windows限定4 suiteの105 tests、全体typecheck、Biome、静的台帳（登録69・issues/policy delta 0）は成功。Linux同size差替えとFIFOのnative限定試験、およびWindows guard保持中rename/unlinkは個別確認済み。前HEAD `4f483a` のlocal quality `82587dae9755` は受入済みだが、今回の新HEADの全体成功には転記しない。旧Hosted tools failureの個別caseは候補であり、固定後のHosted全体検証は未実施。
