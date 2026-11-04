# 専用E2E環境の復元と所有権

## 現在の到達点

Batch 1–6（M1）の静的ゲートに加え、Batch 7の専用環境復元を完了した。2026-11-04、破綻した過去migrationの修復をユーザーが許可したため、0004を最小修正し、固定コミットから独立した空DBを2回復元した。ブラウザ・利用者別認可・結果照合を含むM2全体の完了ではない。

2026-11-04、Supabase CLI **2.75.0** / Docker Server **29.5.3** / PostgreSQL 17用の専用設定で、既存23 migrationの空DB復元を実行した。0000–0003を通過し、0004で次のエラーになった。

```text
Applying migration 0004_session_flow_schema.sql...
ERROR: unsafe use of new value "WITHDRAWN" of enum type participant_status (SQLSTATE 55P04)
```

0004は`participant_status`へ`WITHDRAWN`を追加した後、同じmigration内のpolicyでその値を使用していた。この初回実行ではseed・最終catalog・ブラウザテストには到達していない。後続migrationだけを追加しても、この先行エラーは修復できない。履歴の偽装やエラーを無視した適用はせず、後述の承認後に比較式を修復した。

この初回失敗は復元成功として扱わない。以下の修復・再検証でも、schema一致を権限契約のverified証拠には転用しない。

修復後のdebug run `40cc8dace77d`では24 migrationとseedが成功し、17 table・8 policy・8関数・合成seed 1件の存在、5サービスのimage ID、cleanup残留0を確認した。ただしこの時点のcatalogは一覧採取のみ。完全な検査を接続した`d235a8550b77`では、取得条件の違い（後述）と追加の既定値差を失敗として検出した。

修正後のdebug run `945e7feb76f0`は24 migration・seed・完全catalog検査がすべて成功し、cleanup complete・残留0となった。固定HEADでの正式な2回検証は `pnpm e2e:environment:check` で行う。各runの独立性、同一commit・migration/seed hash・catalog fingerprint・5サービスimage ID、双方のcleanup完了を照合し、開始時に旧receiptをrunningへ置き換える。run IDが入るconfigは互いのhashを比較せず、それぞれの固定renderとの一致を検証する。結果は `test-results/quality/environment-reproduction.json` に保存する。

正式受入はHEAD `524a5d1b4e3af9ec0d0aed645216f27216266063`、run `77b7c2fb0dc0` / `8104753284e9` で成功した。両方とも24 migration→seed→全catalog一致、5サービスimage一致、cleanup complete・issues 0。終了後の独立した読取確認でもcontainer/network/volume/lock/CLIプロセスは各0だった。

| 共通証跡 | SHA-256 |
|---|---|
| migration入力 | `50170e59589338e88f2189453760df38a8299eebd2f4769060504e6f24f53f7a` |
| seed入力 | `557a8ef210e7f9adc58c5bc8efc34d5be0fb4ec1a468f3a429c51d9b8fad6148` |
| catalog | `ff3d809e33237e924320cd5a9ad2c7f52e6f8a7e77ef0bd2a7cb5e576c7c1500` |

全体38 files / 746 tests、lint 916 files・型検査成功。最終の診断表示修正は対象Reproduce 29 tests（1件追加）・Biome・型検査で再確認した。レビュー8は初回の必須1・推奨3を全解消して最終A。実port競合の検証では既存serverが待受を続けたままlockingで拒否した。二重起動・不正URL・所有権不一致・起動途中失敗は基盤回帰も維持する。

## 診断用の実行

Docker Desktopを起動し、Supabase CLI 2.75.0がPATHから利用できる状態で実行する。

```powershell
supabase --version
docker info --format '{{.ServerVersion}}'
pnpm exec tsx scripts/e2e/environmentProbe.ts
```

これは**migration復元の診断コマンド**であり、完成したE2E品質ゲートではない。catalogの取得と、その内容が必要な仕様を満たすことの検証を区別する。接続成功やcatalog取得だけではBatch 7完了にならない。

診断はAPI 57321 / DB 57322 / shadow 57320を使う。他worktreeと重複すれば起動を拒否する。入力生成・ロックのAPIは別port集合を受け取るが、診断CLIの既定portを勝手に空きportへ変更しない。既存開発環境の5432x系portは専用環境の入力schemaで拒否する。

## 入力と接続の境界

- `test-results/environments/run-<12桁runId>`を新規作成し、`supabase/migrations/*.sql`とGitで追跡した`supabase/seed.sql`だけをコピーする。既存runは再利用しない。
- configは固定CLI用の最小設定から生成する。元の`.env`、`.temp`、project-ref、クラウドデータはコピーしない。
- config・migration名/bytes・seedのSHA-256を記録する。seedは合成したシステム1件のみ。ユーザー・Auth・ケース固有行は後続Batchのfixtureが作る。
- Docker接続は検査済みのlocal unix socket / Windows named pipeへ固定する。remote TCP daemonは拒否する。
- Supabase・DB URL・クラウド資格情報・実験flag・Git overrideの環境変数は子プロセスへ引き継がない。shell文字列を介さず引数配列でCLIを実行する。
- PATHのScoop shimはpath-only記録からnative CLI実体へ解決する。script wrapper・引数付きshim・循環は拒否する。中断callbackだけでは終了と判断せず、childのcloseを待つ。停止猶予後も終了しなければ所有childにだけSIGKILLを送り、終了未確認の間はlockを保持する。
- 起動前に所有markerとconfig hashを照合する。DB参照は所有journalに記録したDB containerの完全IDを用いる。

manifestの`127.0.0.1`は接続先の制約であり、ネットワーク隔離そのものではない。CLI 2.75.0はDocker公開portのHostIPを明示しないため、公開interfaceはDocker側設定に従う。runnerはネットワーク隔離を保証したと扱わない。

## ロック・所有権・後始末

OSの物理temp配下にworktree / project / port単位の排他ファイルを`wx`で作る。projectとportの予約は別repo間でも共通。portはIPv4/IPv6の実interfaceでもbind確認し、使用中プロセスは停止しない。root・入力・出力・lock directoryのjunction/symlinkは拒否する。

起動前にはproject labelだけでなく、全container/network/volumeの名前も読み、同じ`_<projectId>`で終わる既存資源を拒否する。CLIが無labelの同名network/volumeを再利用する経路を防ぐためであり、名前による所有推定・削除はしない。

manifestにrunId、worktree/repo/commit、CLI版、入力hash、port、local接続先、状態、観測した資源の完全ID・生成日時・project label・image IDを記録する。runtime記録はDocker版/socketと取得したlockのidentityを持つ。秘密値はmanifestへ含めない。

停止はjournalと現在の資源・leaseを照合し、さらに削除直前にもidentityを確認する。対象はcontainer→network→volumeの順。存在確認に失敗したものを「もう消えた」と判断せず、削除後の不在を別途確認する。`stop --all`、Docker全件prune、portのkillは使わない。

起動・検査の失敗や通常のキャンセルでもfinallyで所有資源の後始末を試みる。CLIが自ら後始末して観測時点に存在しない場合、journalの資源配列は空になり得る。未知資源や所有情報の不一致、観測失敗、journal保存失敗があれば自動回収を進めず、lockを残して失敗する。

`stopped`は後始末の完了であり、テスト成功ではない。過去の`failure`を保持する。SIGKILL・OS終了ではfinallyを保証できないため、残ったlockをPIDや古いmtimeだけで回収しない。Windowsで`pnpm.cmd`経由のCtrl+Cがプロセスツリーを終了させる場合も同じ。プログラムからの協調キャンセルには`probeEnvironment(root, signal)`を使う。復旧にはmanifest、owner、lock identityと実資源の再照合が必要。自動復旧コマンドはまだない。

## 証跡と秘密値

初回失敗run: `19dde0ee35aa`。manifestの後始末結果は`complete`、残留container/network/volumeは0、lockも解放済み。CLIによる自動後始末後の観測のため、この失敗runに実稼働imageの証明はない。

Windowsのコンソール中断run `ec388f20b189`では、プロセスツリーが終了してcontainer 2 / network 1 / volume 1が残った。該当CLIプロセスがいないこと、runのlease・資源identity・lockのinode/hashを再照合して手動回収した。回収後は残留0、5 lock解放済み。これは自動後始末の成功ではなく、強制終了時の制限と手動復旧の検証記録。

外部AbortSignalを15秒後に送る協調中断run `d2b43b8bc50d`は、DB起動中のcontainer 2 / network 1 / volume 1を記録・削除し、後始末`complete`・残留0を確認した。migration replayは失敗、catalogは未到達として報告しており、環境復元の成功回数には含めない。

レビューでchildの終了待ちとnative CLI実体の解決を修正後、run `248addee4e6b`でも協調中断を再検証した。cleanup complete、Docker資源0に加え、OSの該当CLIプロセス0・占有lock0を別途確認した。最終の基盤テストは36 files / 679件成功、lint・型検査成功。レビューは全6観点OK（未解消0）で、記録は`docs/reviews/diff-review-2026-11-04-7.md`。

run directoryには`manifest.json`、`owner.json`、`runtime.json`、`replay.json`を保存する。CLIの標準出力/標準エラーは資格情報を含み得るため、`start.private.log`へ保存し、チャットや公開artifactへそのまま出さない。`test-results/`全体はGit対象外。POSIXでは秘密logの作成modeを0600に指定し、WindowsではdirectoryのACLにも依存する。

## 接続復旧後のcloud metadata監査

Supabase projectのSQL Editorと連携ツールの両方で`select 1 as connection_ok`が成功した。参照はschema metadataのみで、アプリ行やAuthユーザー、鍵の読取・変更は行っていない。

確認数: public 17 tables / 162 columns / 13 enum types（44値）/ 62 constraints / 8 policies / 8 custom functions / 3 triggers。8関数の本文は、空白・コメントを正規化すると既存migrationの最終定義と一致した。

追補migration `20261104112155_restore_verified_catalog_definitions.sql` で次の設定を復元した。適用先は所有するfresh local環境だけであり、cloudへの変更は行っていない。

- `scenarios.sort_playtime_asc/desc`のstored生成列
- `feedbacks.comment_count NOT NULL DEFAULT 0`
- feedback comment/voteの件数更新trigger 2個
- `game_sessions.session_description DEFAULT ''`
- `scenarios.source_type`のDEFAULTなし

最後の既定値は旧`docs/plans/scenario-auto-import.md`と0003が指定する`manual`に対し、現行cloudではDEFAULTがないというdriftだった。今回は現行DBを再現してテストするため、追補でDROP DEFAULTを明示した。通常の作成処理は`input.sourceType ?? 'manual'`を明示挿入するため、その挙動は変わらない。localだけの既定値が、将来の明示代入漏れを隠すことも防ぐ。既存行の値は変更せず、運用DBにも適用していない。

7個のFK/PK名はcloudと履歴で異なるが、定義の意味は一致した。名前合わせだけのために制約を再作成しない。

初期catalog比較で出た9 CHECKと3 triggerの差は、cloud証拠のpretty=trueとruntime queryのpretty=falseという取得条件の違いだった。同じfalseでcloud metadataを再取得するとlocalと完全一致したため、確認済み12定義の期待値をfalse形式へそろえる。括弧やschema名を比較時に捨てる緩和は行わない。

**既存の認可課題も確認した。** 17テーブル中15テーブルのRLSが無効で、anon/authenticatedに更新を含む権限がある。`replace_availability_time_blocks`はSECURITY DEFINERで呼出者の認可がなく、anonからEXECUTE可能。`replace_confirmed_schedule_time_blocks`には認証・creator/keeper判定があるが、phase検証はない。これらはmetadataから確認した事実で、攻撃リクエストや利用者データへの操作は実施していない。

再現性修復の名目で推測したpolicyを追加して覆い隠さず、権限仕様の決定と修正・回帰テストを別途扱う。現行状態を権限テストの成功証拠にしない。

詳細証拠はignoredの`test-results/quality/schema-catalog-evidence.json`と`schema-catalog-findings.json`に保存した。静的ゲートM1の利用には、これらのcloud接続・ファイルは不要。

## 承認済みの再開方針

2026-11-04、ユーザーから「そもそも破綻している過去migrationは修正しても良い」と指示を受けた。0004の103行と153行にある同一条件の2箇所を次のように修復した。

```diff
-          AND sp.participant_status != 'WITHDRAWN'
+          AND sp.participant_status::text != 'WITHDRAWN'
```

enum型の定数をcommit前に作らず、ラベル文字列を比較する。現在のenumラベルに対する真偽・NULLの扱いを保ち、ファイル全体のtransactionとmigration versionも保つ。対象の中間policyは0017でテーブルとともに削除される。将来のenumラベル変更に一般化できる修正ではない。旧SQLのSHA-256は`0a8b35cc85f881ab5f72f6e9c79278596182893e12a8878f5572864a8b6ff716`。

根拠: [PostgreSQL 17のenum利用制約](https://www.postgresql.org/docs/17/sql-altertype.html#SQL-ALTERTYPE-NOTES)、[enumとtext比較](https://www.postgresql.org/docs/17/datatype-enum.html#DATATYPE-ENUM-TYPE-SAFETY)、[enum定数入力時の安全検査](https://github.com/postgres/postgres/blob/REL_17_STABLE/src/backend/utils/adt/enum.c#L101-L164)、[CLI 2.75のファイル単位batch](https://github.com/supabase/cli/blob/v2.75.0/pkg/migration/file.go#L67-L98)。一次資料と修復後の実DB再生で、先行55P04を解消したことを確認した。

ユーザー指示に基づき計画Step 7-1も更新した。修復後SQLのSHA-256は`b248515ffa576911fd18813082e4ba714bd581126f1d3463137f6378428a31c3`。fresh環境の復元・追補schema・seed・catalogを2回確認したためBatch 8へ進む。運用DB適用禁止は維持する。[CLIは適用済versionを比較する](https://github.com/supabase/cli/blob/v2.75.0/pkg/migration/apply.go#L19-L51)ため、0004適用済のDBにこの変更だけで再適用されることはない。ただしcloudのmigration履歴自体は今回調べていない。

過去SQLのbytes不変を必須とする場合は、fresh専用の互換bootstrap（0000–0003→独立transactionでenum追加→原本0004以降）を別の計画変更として設計する必要がある。通常のCLI全再生とは異なる証跡・検査が必要になる。後続migration追加だけの案、同versionの重複、4桁versionの途中へ見かけ上入るprefixを付ける案は採らない。
