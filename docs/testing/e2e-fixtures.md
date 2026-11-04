# 専用環境のactor・行fixture

## 状態

Batch 8のStep 8-1とStep 8-2の途中実装を保存し、ユーザーの依頼で一時停止した。実local DBのAPI診断と、Next本番buildを使うPC/mobileのPlaywright受入は成功した。build後のM1整合と旧25 specの4 project互換実行は未完了。業務caseのverified結果は作っていない。

## 所有単位と認証

`run × project × workerIndex × caseId × retry` をjournalのownerにし、caseごとにcreator-only / keeper-only / confirmed-player / outsiderを作る。anonymousは未ログインclientであり、Supabase Authの匿名ユーザーではない。

Auth UUIDを事前生成して予約し、作成後のIDを確認する。アプリ側は別のULIDを持ち、`users.auth_user_id`で紐付ける。利用者clientはanon keyでログインし、`auth.getUser()`・`current_app_user_id()`・fixture owner tagを照合する。service roleは準備と後始末に限る。creatorとkeeperは別ユーザーで、outsiderは参加者集合へ含めない。

Cookieはインストール済み`@supabase/ssr`の生成結果を使い、`storageState(baseURL)`で渡されたlocal hostへ設定する。JWTやpasswordをjournalやactor証跡に含めない。旧`e2e/.auth/user.json`を新fixtureで読まない。

## 接続と秘密値

所有環境のcatalog一致後、stackとworktree lockの生存期間内でのみfixture・build・testを実行する。固定CLIの`status -o json`からURLと必要な鍵だけを取り出し、既存`.env`や共有DB設定へfallbackしない。`connection.private.json`はrun directory内に新規作成し、POSIX modeは0600、Windowsではdirectory ACLにも依存する。

workerは秘密設定と最新manifest/ownerを再照合し、running状態・loopback接続先・port・run/nonceを確認する。鍵のrole確認は取り違え防止であり、JWT署名検証の代替ではない。通常の本人確認はAuth APIと利用者JWTのRPCで実施する。

## 後始末

作成前にIDをjournalへreserveし、成功後にrecordする。記録保存が失敗しても予約済みIDからrollbackできる。削除は現在の行identityとAuth owner tagを照合してexact IDだけに行う。各削除errorと削除後の不在を確認する。

RPCが作ったtime blockは所有session内で収集し、同じcaseの関連userを確認してjournalへ保存する。親削除前にはincoming FKの参照が残っていないことも確認し、未知participant等をCASCADEやSET NULLで巻き込まない。削除済みIDの再出現は残留として報告する。削除失敗・所有不一致・観測/保存失敗はincompleteとし、親への削除を止める。

## 現時点の実行証跡

run `fff1cdc461f4` のAPI診断で2 caseを並行作成した。各caseは別の4 actorとsessionを持ち、計8 app user IDの重複なし、Auth UUID/ULID本人照合、Cookie hostの一致を確認した。両fixtureはcleanup complete、remaining 0 / issues 0。stackもcleanup completeで資源残留0。これは2つのAPI処理の診断であり、Playwright worker受入とは区別する。

基盤レビューでは、未記録のCASCADE子行の巻込みとremoved ID再出現の見逃しを検出し、親FK参照検査と保守的な残留判定を追加した。参照残留のtable/columnも秘密・行内容を含めずjournalへ記録する。3担当の再レビューで全指摘を解消した（review 9）。

run `5562cc8e0ed0` のブラウザ受入では、Next production build/startからPC/mobileの4テストが成功した。4 worker / 4 journal / Auth UUID 16 / app ULID 16 / session 4を照合し、retry・skip・missing・cleanup問題なし。各projectで2 workerの独立した本人情報を実プロフィール画面から確認した。同時実行上限は2。終了後の独立した読取確認でもDocker資源・lock・app listener・所有CLI/Nodeプロセス・当該秘密設定fileの残留は0だった。

runtime/config/受入checkerはreview 10で3担当が確認した。context終了が一部失敗しても全件の終了を待つよう修正し、即失敗と遅延失敗の負例1件・担当再レビューで確認した。実browser受入はこの限定修正前の実装に対する証跡であり、最終HEADを固定した再実行とは呼ばない。全tools 929件、追加負例1件、Biome・typecheckが成功した。

## 再開点

最優先は停止前に発見したbuild後のM1失敗。ignoredのnext-env.d.tsとrun固有routes.d.tsが抽出source manifestへ混入し、STALE_ARTIFACTになる。新しいrunを台帳へ固定すると次回buildでまた変わるため、試行した再生成は保存済みinventoryへ戻した。baselineを増やさず、生成型の入力境界またはbuild後復元の契約を修正し、build前後でM1を確認する。現状の停止チェックポイントを全gate成功とは扱わない。

review 10の推奨C1も残る。長時間のbuild/readiness/browser中、総合receiptとCLIの表示が細かな段階へ追従しない。個別app/status.jsonは更新され、結果の合否や後始末には影響しない。安全な進捗callbackと途中保存を再開時に検討する。

次はStep 8-3の合成seed、legacy-local config/runner、旧認証・cleanup helper接続、4 projectの実行。認証/helperの旧経路への変更をここでまとめる。Batch 9以降・CI切替には進んでいない。受入のみの再実行は `pnpm exec tsx scripts/e2e/fixtureCheck.ts` を使う。通常の品質コマンド公開と全業務caseの結果照合はBatch 11で接続する。

## 本番buildの分離

新経路は固定app port **43100**。最初に検討した57300はOSの動的ポート範囲内で既存clientにBoundされており、起動前に拒否した。既存プロセスを停止せず、動的範囲外の固定値へ設計を変更した。実行ごとに空きportを自動選択する方式ではない。

build出力は`.next-e2e/run-<runId>`、Nextが更新するtsconfigはrun配下の`app/tsconfig.json`へ分離する。Windows上のTurbopackは絶対drive pathのextendsを解決できなかったため、extends/include/excludeはこの設定fileからの相対pathにする。元のtsconfigは無変更。ignoredのnext-env.d.ts生成更新はapp/status.jsonへ記録する。

Next 16.1.6を検査し、子envはallowlistとlocal URL/anon keyで構成する。既存.envの値を取り込まないことは同版の@next/envで回帰検証する。service roleはNextへ渡さない。readinessは起動前port検査に加え、run専用response headerの一致を要求する。失敗・中断でもtestと所有serverの終了を確認してからDBの後始末へ進む。

## 既存suiteの移行台帳

旧25 specの348登録は`legacy-execution.json`でexact key / fingerprintを保持する。初期分類はlocal 319、既存mobile条件skip 9、既存fixme 2、deferred-live 18。setup 1と既にcase登録済みStorybook 8はこの集合に混ぜない。

外部依存は環境変数を空にするだけでは止まらない。固定Booth URLを自動解析するTier 3と、バナーからimport画面へ遷移して解析が始まるcaseも個別に延期する。deferredや既存skipをpassに数えず、データ不足・認証不足・前段失敗による新しいskipは失敗として扱う。local互換runnerと合成seedは後続で接続する。
