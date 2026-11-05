# 専用環境のactor・行fixture

## 状態

2026-11-05にBatch 8を完了した。独立actorのfixture受入と旧25 specの4 project互換実行、build後のM1整合が成功した。旧suiteの実行義務330件は319成功と既存例外11件で照合済み。日程業務caseのverified結果とM2全体の受入は後続Batchで行う。

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

停止前に発見したbuild後のM1失敗は解消した。補助型の自動入口をGit母集団とtsconfig列挙の共通部分に限定し、ignoredのnext-env.d.tsからrun固有型が自動流入する経路を止める。実装からimport/referenceで到達する型の変更は引き続きsnapshotへ残す。Nextの生成型そのものを変更せず、通常の型検査では利用する。[Next 16.1.6の生成型仕様](https://github.com/vercel/next.js/blob/v16.1.6/docs/01-app/03-api-reference/05-config/02-typescript.mdx)

review 10の推奨C1も解消した。build/readiness/browser/evidenceの開始前に総合receiptとCLIを更新し、安全なphase/runIdだけを通知する。表示callbackの同期・非同期失敗がapp/serverの終了確認を中断しないことを回帰で確認した。

再開後のrun `71c1c1dafe3b` はWindows journal renameのEPERMで3/4成功となったため失敗として保存した。Windowsの一時EPERM/EBUSYのみ最大6回再試行し、毎回BigInt file identity・物理path・既存manifest内容を確認する。恒久失敗や置換は成功にしない。Nodeの終了回帰にあったstdout受信前の中断raceも修正した。

最終run `1104370cf0c1` は4/4成功、2 project・4 worker・4 journal・16 Auth/app user・4 sessionを照合。全cleanup完了と別途の残留0確認後、M1も再生成なしでpassed（登録8、legacy348、不足473、差分0）。tools全体53 files / 947 tests、Biome 955 files、typecheck成功。レビュー11の未解消指摘は0。基盤の受入であり、旧suite全体や業務caseのverifiedとは区別する。

Step 8-3の合成seed、legacy-local config/runner、旧認証・cleanup helper接続は実装した。4 projectの実受入は下記の途中状態で、Batch 9以降・CI切替には進んでいない。新fixture基盤だけの再実行は `pnpm exec tsx scripts/e2e/fixtureCheck.ts` を使う。通常の品質コマンド公開と全業務caseの結果照合はBatch 11で接続する。

### Step 8-3の途中検証と停止（2026-11-05）

入口は`pnpm exec tsx scripts/e2e/runLegacy.ts`。4 projectを順番に、それぞれ空DB・独立actor・固定旧state・Next本番buildで実行する。`--project chromium-auth`等は診断専用で、成功しても`partial-passed`。通常の受入は330件（local319、既存skip9、fixme2）を照合し、外部依存18件は実行しない。初期348登録の本文・状態を照合し、discovery前後と各実行前後に旧specの実bytesを検査する。

| run | 結果 | 後始末 |
|---|---|---|
| `96c303104ea0` 公開PC初回 | 55成功・2失敗。公開卓リンクの旧button指定をPOMで修正 | fixture/stack complete、stateなし、別途Docker資源0 |
| `c1edeaff9c4d` 公開PC修正後 | 57成功、結果照合passed | fixture/stack complete |
| `7a2cdcf3fdb4` 公開mobile | 48成功・既存skip9。最初の結果parserは注釈locationを拒否 | fixture/stack complete。parser修正後、保存済実report57件の照合成功 |
| `642b151a222a` 認証PC初回 | 64成功・29skip・15失敗。増skipを許可せず全体failed | UI行の日時検査失敗でfixture incomplete、stackはcomplete。別途Docker資源0・旧state/資格情報fileなし |

認証PCで検出した修正は、(1) ScenarioCardのClient境界、(2) PostgRESTで使うFK名、(3) timestamp without time zoneのUTC解釈、(4) 認証タブ・レスポンシブ重複のPOM指定。これらの修正後の実browser再検証は未実施。DB日時はマイクロ秒精度で比較し、削除条件へは取得した元の文字列を使う。

一時停止時点では旧spec本文の修正が必要な5定義が残った。再開後、FAB2件、GM action1件、作成後URL検査2件を、M1の規約に従ってcase ID付きの通常登録へ移行した。共通hookや他定義のfingerprintは変えず、初期348登録の行き先と330実行義務をreplacement契約で保持する。

全toolsは65 files / 1142 tests成功。その後、SQL文字列だけをなぞる2テストを除き、原migrationと確認済cloud metadataの等価性テスト1件を再実行して成功（登録総数1140）。Biome 983 files成功、型検査成功。レビュー指摘の秘密file部分書込み残留とspec差替えを修正し、実reportのannotation位置情報にも対応した。4 project受入・Batch 8全体・M2は未完了。

### 通常caseへの移行と再診断（2026-11-05）

`legacy-execution.json`は348行を保ち、local309 / replacement10 / skip9 / fixme2 / deferred18とする。replacementは変更前commit `933c689`の旧登録をGit objectから検証し、現在のcase/variant/binding、project/repeat、本文fingerprintへ対応させる。元のfingerprintを新本文へ貼り付けない。外部GIT変数、replace refs、graftsによる履歴変更も除外する。通常登録はStorybook8/app10、未移行legacy338。不足473とbaseline digestは不変。

認証PC run `647484800a75`は98成功・1失敗・9skip。前回のホーム画面、feedback参照、FAB、作成URLの失敗は解消した。GM操作の「申請管理」はヘッダーと参加者欄の両方に表示されるため、ヘッダー内SessionActionsへscopeする追加修正を行った。後続8件の依存skipを成功として扱わない。残る1skipは既存fixmeである。

このrunのUI cleanup receipt5本は全passed/remaining0、fixture/stackもcompleteだった。receiptに余分なui-cleanup失敗が出た原因は、evidence失敗の再throwを最後のphaseで重複記録するバグであり、error identityとAggregateError包装の照合で修正した。別のcontext障害は保持する。

3 run（上記認証PCとfresh DB再現2回）の終了後、Dockerのcontainer/network/volume、port43100のlistener、固定旧stateと当該run資格情報/context fileの残留0を独立した読取で確認した。

独立レビューでは、Playwright 1.57 JSONがタグ先頭の@を除去する仕様との不一致も修正した。全tools67 files/1191 testsが成功し、その後の変更はresults35件、origin13件、project runner18件で再検証した。型検査・Biome988 filesとM1も成功。4 projectの最終受入は引き続き必要で、実装済みcaseの恒久verified化は行わない。

### 続く互換診断と追加移行

保存点`01e24d8`の全件runは公開PC `548b5d247e75`の57成功、公開mobile `ee018195eafe`の48成功+既存skip9を照合した。認証PC `0e7fa7a98902`はGM修正が通り99成功となったが、基本情報のtext locatorが非表示の別DOMにも一致して失敗し、後続7件が未実行となった（既存fixme1と合わせ8skip）。

基本情報・日程遷移・取消dialog dismissを追加caseへ移し、POMを実UIの責務領域へ限定した後、認証mobile `da1511d489e2`は96成功/3失敗/9skip。home welcome、timeline、availability空状態が同じ非表示DOM重複で失敗した。home/availabilityはPOMだけを修正し、timelineはcase ID付きへ移行した。原specの未変更本文を維持し、取消のdismissは取消実行buttonではなく「継続する」を通常clickする。

現在は9case/18app登録を置換し、legacy330＋固定origin18で旧348を保持する。実行先はlocal301/replacement18/skip9/fixme2/deferred18、実行義務330のまま。M1は登録26（Storybook8/app18）、不足473、issues0。SessionActionsの表示契約へ通常click後の遷移URLを加えた理由とcase参照を、比較base `01e24d8`のpolicy migrationとして記録した。型検査・Biome988 files・関連132 tests成功、独立レビューに未解消指摘なし。これらの修正後の実browser受入は別途行う。

上記の全fixture/stack cleanupはcomplete。誤ってui-cleanup失敗を追加するバグの修正後、実失敗段階はevidenceだけに記録された。diagnosticのskipは合格へ数えない。

全件run初回の公開mobile `586f5f87e453`では、Google Fontsが返すextensionless URLの解析でNext16.1.6のTurbopack buildが失敗した。[既知のNext.js不具合](https://github.com/vercel/next.js/issues/99114)と一致する。同じHEAD/設定の別runで通過したが、失敗receiptは`batch8-legacy-all-first.json`へ保持している。フォント取得はbuild時の外部依存であり、この経路の完全offline再現は保証しない。

## 最終互換受入

保存HEAD `b229f12`のまま4 projectを順次fresh実行した。実行中のソース変更はない。

| project | run ID | 成功 | 既存例外 |
|---|---|---:|---:|
| chromium | `25fd1ce3a0cd` | 57 | 0 |
| mobile-chrome | `2f316dd6bcc8` | 48 | skip 9 |
| chromium-auth | `bfd0fabb12a2` | 107 | fixme 1 |
| mobile-chrome-auth | `8bdaf00e2b8d` | 107 | fixme 1 |

計330件の結果と実行目録が一致し、aggregateはpassed。外部依存18件は理由付きdeferredのまま実行外とし、旧348行の行き先を保持した。新しいskip・retry・失敗を追加していない。

直前の認証mobile診断 `fc149cc42d26`で、既存Axe検査が詳細内mainの重複・入れ子と横スクロール領域のキーボード到達性を検出した。外側mainを維持して内側をdivへ変更し、フェーズ一覧をフォーカス可能な名前付きsectionにした。テストとAxe除外は変更せず、全件受入で修正を確認した。

全fixture/stack cleanup complete。独立したOS/Docker読取でも所有コンテナ・ネットワーク・ボリューム・listener・run process・秘密file・lock・固定旧auth stateの残留0。各app statusはfinished/passed。最終build後のM1は登録26、legacy330、不足473、issues/policy delta0でpassed、baseline digest不変。レビューの未解消指摘は0。

証拠はignoredの `test-results/quality/batch8-legacy-final.json`、`batch8-static-final.json`、`batch8-final-residue-check.json`。認可は未検証のまま維持する。この受入を日程業務caseの個別verifiedやM2全体の完了へ転用しない。

## 本番buildの分離

新経路は固定app port **43100**。最初に検討した57300はOSの動的ポート範囲内で既存clientにBoundされており、起動前に拒否した。既存プロセスを停止せず、動的範囲外の固定値へ設計を変更した。実行ごとに空きportを自動選択する方式ではない。

build出力は`.next-e2e/run-<runId>`、Nextが更新するtsconfigはrun配下の`app/tsconfig.json`へ分離する。Windows上のTurbopackは絶対drive pathのextendsを解決できなかったため、extends/include/excludeはこの設定fileからの相対pathにする。元のtsconfigは無変更。ignoredのnext-env.d.ts生成更新はapp/status.jsonへ記録する。

Next 16.1.6を検査し、子envはallowlistとlocal URL/anon keyで構成する。既存.envの値を取り込まないことは同版の@next/envで回帰検証する。service roleはNextへ渡さない。readinessは起動前port検査に加え、run専用response headerの一致を要求する。失敗・中断でもtestと所有serverの終了を確認してからDBの後始末へ進む。

## 既存suiteの移行台帳

旧25 specの348登録は`legacy-execution.json`でexact key / fingerprintを保持する。初期分類はlocal 319、既存mobile条件skip 9、既存fixme 2、deferred-live 18。setup 1と既にcase登録済みStorybook 8はこの集合に混ぜない。

外部依存は環境変数を空にするだけでは止まらない。固定Booth URLを自動解析するTier 3と、バナーからimport画面へ遷移して解析が始まるcaseも個別に延期する。deferredや既存skipをpassに数えず、データ不足・認証不足・前段失敗による新しいskipは失敗として扱う。local互換runnerと合成seedを接続済みで、上記の実診断から最終受入を進める。
