# Playwrightを活かした実装抽出・テスト台帳・品質ゲート導入計画

## Context

- 版: r2 / 作成日: 2026-11-04 / 状態: 計画完成（Terraレビュー2回、指摘解消）。
- ユーザーの依頼: 「この方針で、既存のPlaywrightを活かして、自動抽出・テスト台帳・品質ゲートを段階的に導入する実装計画を立てて。ワークツリーは分離させて。」
- 専用作業先: C:/Users/kabocchi/.codex/worktrees/e2e-ledger-plan/scenario-manager
- 実装の基準: b4c824e604e0e69da0e6e37f4a6bf60db83e71dc。managed worktreeをこのコミットから作成した。計画時点はdetached HEAD。
- 背景資料: docs/research/e2e-strategy-2026-11-04.md。この資料は元の作業ツリーの未コミット改修も調査した記録であり、基準コミットの実装量とは異なる。
- 計画作成時の範囲は計画とレビュー記録。後続のユーザー依頼により、専用branch `feat/e2e-ledger-quality-gates` で各Batchの実装・検証・レビュー・コミットを実行中。公開は含めない。

目的は、機能追加・変更に伴う検証漏れを、実装の自動抽出、要件とテストの対応、実行対象と結果の照合で検出すること。AIが作成するテストの意味はレビューし、静的解析だけで要件の正しさやassertionの十分性まで保証したと扱わない。

### 基準コミットで確認した現状

| 対象 | 状態 |
|---|---|
| Playwright | lockfileで1.57.0。既存25 spec、通常test定義173、skip呼出18、fixme定義1 |
| Storybook | 117 storyファイル。ブラウザテストはscenario-panels.spec.tsの1 spec / 5定義 |
| Vitest | 99 testファイル候補。unit分類に実DB接続テストが少なくとも11ファイル |
| 本番相当の実行 | playwright.config.tsでNext build/start、.next-e2e、port 3100。dev再利用は別モード |
| CI | test.ymlがcheckout前にlocal compositeを参照。unitへDB設定を渡していない |
| 認証とcleanup | 共通user.json、cleanup key不足の早期return、削除error未検査 |
| DB | supabase/config.tomlにseed.sql指定、ファイルなし。主要テーブルpolicy/grantの再現性は未検証 |
| 既存inline Action | schedule/confirm/page.tsx内confirmTimeBlocksServerActionからexport Actionへ接続 |
| 外部I/O | BOOTH/TALTOはserver fetch。画像はR2。dev uploadの成功はplaceholder |
| 既存serial依存 | e2e/auth/session-lifecycle.spec.tsは前のtestの状態に依存 |

数値は静的定義数であり、project・パラメータ・repeat展開後の実行数ではない。元の作業ツリーにあるrecruitments、新しいsessionsのparallel route、ページStories、追加Storybook spec、design:*コマンドはこの基準にない。初期導入の前提にせず、将来取り込まれた差分を抽出器が新規対象として検出する。

### 達成する要件

| ID | 要件 | 実装と検証 |
|---|---|---|
| Q1 | Nextの画面・API・file/inline Server Actionを漏れなく列挙 | Batch 2・3、構文fixtureと実ソースのspot check |
| Q2 | 対象・観点・case・実test登録を相互照合 | Batch 4・5、参照切れ/ID欠落/誤った層を故障注入 |
| Q3 | 既存不足を可視化し、通常変更で増やさない | Batch 6、信頼するbaseとの差分検査 |
| Q4 | 共有DB・ユーザーに依存せず更新テストを実行 | Batch 7・8、空DB再現・2 worker・中断後始末 |
| Q5 | UIからの保存・再表示、許可/拒否を代表フローで検証 | Batch 9・10、日程確定と認可integration |
| Q6 | missing/skip/xfail/flaky/古い結果を合格扱いしない | Batch 11、結果checkerの否定系 |
| Q7 | 変更影響を保守的に選択し、serial/setupを落とさない | Batch 12、base/head/dirty/rename/unknownのfixture |
| Q8 | 開発完了・PR CIで同じ検査を使う | Batch 6・13、WindowsとLinuxの同一入力比較 |
| Q9 | props経由の業務操作を追跡し、未解決を黙って除外しない | Batch 14、実在する日程確定の経路fixture |
| Q10 | 段階導入と復旧ができる | 各Checkpoint、profile/version/baseline移行規約 |

### 範囲と非目標

既存Playwright/POM/Storybook/Vitestを利用する。新runner導入、全面的なテスト書換え、全入力組合せのE2E化、テスト管理画面、業務DBへのテスト台帳テーブル追加は対象外。

この計画で完成させるのは、静的ゲート、専用環境で動く日程確定の代表フロー、正しい結果照合、機能単位の選択、CI/開発フロー接続、実例に対応したsurface追跡である。全既存テストのcase別fixture化、全不足の解消、live Discord/BOOTH/TALTO、R2 runtimeの全検証は継続移行として管理する。ただし、既存suiteの実行を失わないlocal互換経路は本計画に含め、CI切替の前提条件にする。未移行対象をverifiedへ昇格しない。

## 決定事項

| 項目 | 方針 | 理由 |
|---|---|---|
| runner | Playwright Test 1.57を継続。台帳導入だけのために更新しない | tag/list/reporter/trace等が既にある |
| 抽出実装 | TypeScript Compiler API。scripts/e2e配下、tsxで実行 | tsconfigのalias・宣言を解決できる |
| 対象の入口 | src/app全体、共通blocks、hooks/libを走査。tests/stories/生成物は除外 | /auth/callback、共通Action、inline Actionを含める |
| ID | scenario/caseの恒久IDと実行identityを分離 | ファイル移動やproject展開に耐える |
| 出力 | source inventory、要件契約、test登録、実行結果を分離 | 生成物の手修正と意味の混同を防ぐ |
| 既存テスト移行 | 未登録legacy一覧を固定し、新規/変更testからID登録 | 25 specの一括書換えを前提にしない |
| 不足 | base revisionに記録した項目単位のbaselineと比較 | 件数相殺やPR内rebaselineで逃げない |
| 静的MVP | routes/actions/APIsとfile依存。複雑なpropsはBatch 14 | 先に運用可能な小さいゲートを作る |
| 実行環境 | local Supabase Postgres/Auth/PostgREST、run/worker/case所有データ | 並列汚染と共有DBの変更を避ける |
| 権限 | service-roleは準備/後始末のみ。通常検査は利用者JWT | RLS bypassを権限検証へ混ぜない |
| 結果 | reporterが出力し、外部checkerが最終exit codeを決定 | runner集約成功だけではmissing等を検出できない |
| テスト選択 | 初版は機能マッピング＋global変更全件。後にgraphを追加 | 不明な依存で実行範囲を狭めない |
| 証拠の層 | browser/storybook/integrationを明示 | mock成功を保存やRLSの証拠へ転用しない |
| CI | 初期はDB不要の新規static workflow。既存test.yml移行はBatch 13で専用環境と同時 | checkoutだけ直して共有DBの書込テストを起動しない |
| Git hook | 軽い構造検査だけ。重い実行はPR前/CI | 毎commitの負担とstaged/workingの混同を避ける |
| 整形 | check:ciは非書込み。pnpm checkによる整形は検証前に実施 | 実行中のsource変更を避ける |

### 台帳と実行データの契約

1. inventory.generated.json: schemaVersion/extractorVersion、source snapshot、nodes/edges/diagnostics。生成時刻等の毎回変わる値を比較対象へ入れない。
2. contracts/*.json: target、read/write等の分類、必須aspect、許容layer、役割・状態の要求。実装から期待仕様を自動生成しない。
3. scenarios/*.json: scenarioId、caseId、checksのtarget/aspect対応、fixture、actor binding、variant、project、runtime、executionGroup。
4. test登録: runnerが列挙したfile/title/logical ID/parameter variant/project/repeatとsetup区分。
5. selection.json: base/head/source fingerprint、選択理由、必要executionの完全な集合、setup/group依存。
6. results.json: 登録testごとのattempt/final status/expectedStatus/retry、fixtureが実証したactor、runner全体status、cleanup結果。
7. receipt.json: source/lock/config/fixture/migration/ledger/selector/runtime profileのfingerprintと照合結果。secret値を含めない。

不足のidentityはtarget・aspect・layer・case・variant・actor binding・project・runtime。既存desktop不足へmobile不足を足しても別項目とする。repeatやパラメータ展開は実行登録で全件必要とする。

statusはplanned（テスト未実装）、implemented（登録testが存在）、実行時verified（指定snapshot/条件で成功）を区別する。verifiedを手書き台帳へ恒久保存しない。例外は専用ファイルへ理由・対象・追跡先・見直し条件を記録する。

### マイルストーンとレビュー単位

| 到達点 | Batch | その時点で保証すること |
|---|---|---|
| M1 静的台帳ゲート | 1–6 | 入口抽出、登録/契約/baseline整合。実行成功の保証はまだない |
| M2 専用環境の実行保証 | 7–11 | 日程確定の必要条件を隔離環境で実行し、実結果を照合 |
| M3 開発フローへ接続 | 12–13 | 選択理由と結果をローカル/CIで再検証 |
| M4 操作追跡の拡張 | 14 | 実在するprops経路を追跡し、未解決を検出 |

各Batchの見積りは原則3–8ファイル、手書き100–500行。生成JSONとデータfixtureは別に行数を報告するが、内容の確認は省略しない。実装時に500行または15ファイルを超える場合は、そのBatchを次の「抽出/照合」「実行/接続」等のStep境界で小さなコミットに分割し、完了条件を維持する。共有設定（package/config/workflow/schema）は親が順次統合する。

Checkpointは各Batchで「関連検査→未コミット差分のreview-diff→指摘修正→commitスキルによるコミット」を行う。計画作成時には実行しない。最終Batchでは全体レビューも行う。

## 前提条件

- 実装開始時に専用worktreeで実装用branchを作成し、基準コミットを記録する。元の作業ツリーの未コミットUI改修はコピーしない。
- node_modulesや.envの共有を前提にしない。固定lockfileで依存を導入し、pnpm prepare後に型検査する。既存ユーザーのcloud credentialsをテストへ自動流用しない。
- M1はDockerやDBなしで実装・検証可能。M2ではDocker等の対応runtimeと固定したSupabase CLIが必要。未導入ならM1を進め、M2実行前に対応版を選定・確認する。
- 現行クラウドDBのRLS/GRANTは未調査。Batch 7でschemaのみを確認し、migrationから復元する。運用DBの書換えやデータ複製はしない。
- 不明な権限仕様は、当該caseの要件確定が必要。既存実装だけを根拠に許可範囲を広げない。画像の匿名upload可否は代表フローの外へ保留する。
- test.ymlの全体グリーン、環境構築時間、既存E2E成功率は計画段階では未確認。測定してから最適化する。

## 実行状況

- 実行開始: 2026-11-04 / branch: feat/e2e-ledger-quality-gates
- 計画r2の手順に従い、完了した検証・レビュー・コミットを順次記録する。

- [x] Batch 1: DB不要の品質検査とDBテストの分類
- [x] Step 1-1. 非書込み検査とツール用テストproject
- [x] Step 1-2. 実DBテストを個別に分類
- [x] Batch 2: 再現可能なsource一覧とNextルート抽出
- [x] Step 2-1. ソース読み込みと安定した出力
- [x] Step 2-2. Nextのルートを抽出
- [x] Batch 3: Server Actions・HTTP入口と保守的な依存関係
- [x] Step 3-1. file/inline ActionとAPIを抽出
- [x] Step 3-2. file依存と既知の直接呼出
- [x] Batch 4: 台帳schemaと対象・観点の照合
- [x] Step 4-1. 台帳のschemaを固定
- [x] Step 4-2. 意味を補う契約とvalidator
- [x] Batch 5: Playwrightの実test登録と既存資産の段階移行
- [x] Step 5-1. list reporterで実登録を取得
- [x] Step 5-2. 既存testとIDの対応を導入
- [x] Batch 6: 不足baselineと最初の静的CIゲート
- [x] Step 6-1. baselineをbootstrapして固定
- [x] Step 6-2. DB不要workflowへ接続
- [x] Batch 7: 専用Supabase環境の再現性
- [x] Step 7-1. schema/policy/grantを空DBから再現
- [x] Step 7-2. 環境manifestと所有権
- [x] Batch 8: 権限別fixtureと認証状態の分離
- [x] Step 8-1. actorと業務fixture
- [x] Step 8-2. 新configとcleanup
- [x] Step 8-3. 既存suiteを実行するlocal互換経路
- [x] Batch 9: 日程確定のbrowser E2Eを導入
- [x] Step 9-1. UI操作と永続化
- [x] Step 9-2. UI失敗状態と境界
- [x] Batch 10: Action/RPC認可とDBテストの証拠
- [x] Step 10-1. UIの外側にある拒否と原子性
- [x] Step 10-2. integration結果adapterと偽成功の解消
- [x] Batch 11: 実行結果の厳密な照合
- [x] Step 11-1. reporterと外部checker
- [x] Step 11-2. fingerprintと実行入口
- [x] Batch 12: 機能単位の保守的な変更選択
- [x] Step 12-1. Git差分を固定して選択
- [x] Step 12-2. executionGroupと選択結果の検証
- [ ] Batch 13: ローカル品質ゲート・CI・開発規約へ接続
- [ ] Step 13-1. 共通qualityコマンド
- [ ] Step 13-2. 専用環境とCIを一体で切替
- [ ] Step 13-3. 規約と移行運用
- [ ] Batch 14: UI surfaceとprops依存の抽出を拡張
- [ ] Step 14-1. 実在する書き方を追跡
- [ ] Step 14-2. 観測から必須化へ移行

### 実行ログ

- 前提: 専用branch作成、pnpm install --frozen-lockfile、Panda生成完了。実DBへは接続していない。
- Batch 1: runnerのfilesOnlyでunit 32 / unit-dom 2 / component 54 / integration 11、全99件の重複・欠落なしを確認。DB未設定のintegrationはcollection前に失敗。
- Batch 1検証: check:ci成功、typecheck成功、unit 88ファイル（1078成功・既存8skip）。toolsは54成功。故障fixtureが終了1になることも確認し、fixtureは削除済み。
- 既存問題の是正: SessionActionsのpending styleを既存opacity.disabledへ対応付け、optional callbackを条件付きで渡す。FilterPanelテストは人数・時間の両方の非同期更新を待つ。期待値・skip数は変えていない。
- Batch 1レビュー: 3エージェント。SDK直接生成の拒否不足を修正してrequired解消。pure mockの理由付き登録を追加し推奨指摘も解消。最終A。記録: docs/reviews/diff-review-2026-11-04.md。

- Batch 2完了: source/TypeScript基盤とNextルート抽出を並列実装。親が共有schema・決定的なJSON出力・readonly checkを統合。tools 114成功、check:ci・typecheck成功。実ソース486、manifest566、route関連35、診断0、2回生成byte一致・readonly check成功。
- Batch 2レビュー: 通常route名の過剰除外、外部configの境界、stale時の診断隠蔽を修正。3エージェント再レビューで全指摘解消、最終A。記録: docs/reviews/diff-review-2026-11-04-2.md。小さな4コミットへ分割（source/schema、routes、inventory、探索の回帰fixture）。
- Batch 3完了: 共通symbol解決、Action/API入口、依存関係を3担当で並列実装。175 tools tests、check:ci（838ファイル）、typecheck成功。実sourceのAction39・API6を保持し、日程inline Action→Action実体→adapter→RPCの経路を確認。node1351、edge5792、error0、warning347（未解決call346・CSS import1）を保持。生成後のreadonly check成功。
- Batch 3レビュー: 初回required2・recommended4を修正。可変member/getter、外部callback型、SDK schema options、注釈、source母集団の共用を確認。Panda生成物はmanifestにある既知rootの15moduleを境界として保持。3担当の再確認で全指摘解消、最終A。記録: docs/reviews/diff-review-2026-11-04-3.md。
- Batch 3コミットは基盤・入口・由来・graph・索引fixture・入口fixture・依存fixtureの7単位へ分割（各手書き500行以下）。各hookでlint/typecheckを実行。
- 一時停止: ユーザーの「キリのいいところで一旦作業停止して」に従い、Batch 3チェックポイントを停止点とする。Batch 4以降の実装は未着手。次はStep 4-1の台帳schemaから再開する。
- 再開: 2026-11-04、ユーザーの「再開して」に従い、Batch 4から続行。停止時HEADは3655c9c、専用worktreeの未コミット変更なしを確認。
- Batch 4完了: strict Zod台帳・JSON loader・kind既定要件・個別checkとexecutionの照合・完全一致例外を実装。schemaとvalidatorは実行成功を判定せず、planned/implementedと登録の食い違いを検出する。不足identityには既定8次元に加えprofileも含め、同名project/runtimeの別configを混同しない。
- Batch 4契約: 独立仕様を根拠に日程5対象・7case・19executionを全件plannedで登録。creator/keeper各PC/mobile、Action拒否と入力不正、RPC認可/原子性、表示失敗を分離。RPCのSECURITY DEFINER内認可をRLS検証と数えない理由を明示。Batch 3の変更なしsource snapshotと照合しissues 0、不足110、例外0を確認した。
- Batch 4検証・レビュー: tools 242成功（台帳関連67件を含む）、check:ci（852ファイル）・typecheck成功。3担当レビューで全観点免除/actor欠落を故障検査し、isNil・identity共通化・不正JSONのファイル名/cause診断を修正。最終A、記録: docs/reviews/diff-review-2026-11-04-4.md。手書き変更はschema/loader、照合、構造test、照合testの各500行以下と、初期JSON/実行記録へ分割。
- Batch 5完了: 既存configを--listで列挙しapp349（setup1を含む）・Storybook8、計357登録をASTへ照合。legacy348・登録済8・setup1・serial group6を生成JSONへ保存。既存Storybookの5caseを明示ID/variantでimplementedへ移行し、日程7caseはplannedを維持。ブラウザ実行のverifiedではない。
- Batch 5境界: 子envのallowlist、dotenv抑止、SDK生成・通信・子process・run外書込みの拒否を先行load。catch後も失敗と呼出位置を保持する。一般的な悪意コードのsandboxとは扱わない。repeatの全件と各bindingを照合し、旧test本文・hook・loop・runtime skip変更をfingerprintへ保持する。
- Batch 5で判明したPlaywright 1.57差分: ESM source map配信前に変換後の座標を返すため、Node公開findSourceMapをrunner同梱sourceMapSupportのfallbackへ接続する小さい版固定adapterを追加。実際に起動するCLIの1.57.0を検査し、未検証版を拒否する。ESM/CJS位置の回帰を追加。test.failのlist時expectedStatusはpassedでもfail annotationが付くため、Batch 11ではannotationも照合する。body内skipはlistで確定できないためBatch 8のdeferred分類へ保持する。
- Batch 5検証: 全18ファイル326 tools tests成功、check:ci（868ファイル）・typecheck成功。生成legacyの反復/保存byte一致、binding/ledger/legacy issue0、不足110を確認。型検査と一時fixture削除の競合を防ぐためtest-resultsをtsconfigから除外し、inventoryを再生成（node1351・edge5792・warning347・source fingerprint 7b858374fe458989c42601ddce4a034fd554f1cba400cb9207534166f64c1598）。生成JSONはBiomeのformatterのみ対象外とし、構文lintは残す。
- Batch 5レビュー: runtime skipを定義と誤認してfingerprintから落とす必須指摘を修正。版チェックのrunner実体との一致、診断のcaller位置（括弧path含む）、isNilを修正し3担当の未解消0、最終A。記録: docs/reviews/diff-review-2026-11-04-5.md。source/照合/guard/runner/legacy/test/初期データを各手書き500行以下の9コミットへ分割済み（最終550b505）。
- Batch 6実装: 不足identityと診断anchorによる完全比較、base契約のpolicy delta、理由付き移行履歴、Git objectからの比較元読込、独立した静的workflowを接続。通常checkは保存済み台帳を変更せず、初回bootstrapと明示的updateを分離した。
- Batch 6初期抽出: node1351・edge5792・不足110・warning363・error0。warningは旧位置keyでは347となり、同位置から始まる異なるAST call16件を新たに分離した。473項目をbaselineに保持し、例外0。source fingerprint ac4da5cdfb72824d6abbf807e368d0c355b00facf4006b205446f2e41d2d699c、baseline digest 7d0a0243251f459c13a094413432994434e6da22e33a4618e946c29bc7764593。
- Batch 6検証完了: 最終23ファイル442 tools tests、check:ci（884ファイル）、typecheck成功。実inventory readonly check成功。初回の外部承認なしcheckは意図どおり終了1、承認済初回はCI eventを通した実CLI fixtureで成功。保存コミット55cabf6をbaseにした実プロジェクトのe2e:ledger:checkはpassed、registrations8・legacy348・不足473・issues0・policyDeltas0。CI/管理変数は公開・変更していない。
- Batch 6レビュー: 3担当で初回必須1・推奨3。初回承認へのmode混入、前回成功reportの残留、sourceとbase JSONの診断文脈を修正し、再確認で未解消0・最終A。記録: docs/reviews/diff-review-2026-11-04-6.md。実装と生成物は手書き500行以内の9コミット、実行記録を別コミットとする。
- M1達成: Batch 1–6の静的整合ゲートを実装・検証・レビュー済み。実E2Eの成功は未認定。次はBatch 7でCLI 2.75.0と専用Docker環境の復元・所有権管理を実装する。
- Batch 7基盤実装: strict manifest/状態遷移、物理pathと所有nonce、worktree/project/port排他、専用config/SQL入力生成、Docker資源の観測・完全ID照合・削除、診断probeを追加。合成seedはシステム1件だけで、実利用者データは使っていない。
- Batch 7実復元のブロッカー: CLI 2.75.0 / Docker 29.5.3のfresh run `19dde0ee35aa`は、既存0004の列挙値WITHDRAWNのcommit前利用でSQLSTATE 55P04。0000–0003は通過、seed/catalog未到達。後続migration追加では先行エラーを直せないため、計画どおりDB依存の後続Batchを保留し、M1は維持する。
- Batch 7中断検証: Windowsのpnpm.cmd経由Ctrl+Cはprocess tree終了となり、run `ec388f20b189`に残った2 container/1 network/1 volumeを所有nonce・ID・lock inode/hash照合後に手動回収、残留0・5 lock解放。協調AbortSignalのrun `d2b43b8bc50d`では同じ種類の所有資源を自動cleanupし残留0。いずれもDB復元成功とは数えない。
- Supabase接続: SQL Editorと連携ツールのSELECT 1が成功し、28P01は解消。schema metadataのみ監査し、生成列2・comment_count・trigger2・既定値1の履歴欠落を確認。既存15 tableのRLS無効とavailability RPC認可欠落も記録。運用DB変更・利用者データ読取は実施していない。
- 再開方針（承認済み）: 2026-11-04、ユーザーから「そもそも破綻している過去migrationは修正しても良い」と指示を受け、復元を阻む過去SQLの修復を許可する方針へ更新した。0004の2箇所だけ`participant_status::text != 'WITHDRAWN'`へ変更して再検証を進める。fresh復元・不足schema追補・seed・catalogを2回確認するまでBatch 7は未完了、運用DBへの適用は禁止を維持する。
- Batch 7基盤の最終検証: 36 files / 679 tools tests、check:ci（909 files）、typecheck成功。M1 readonly gateもbase 6051fb6に対してpassed（登録8・legacy348・不足473、差分0）。レビューでchildのclose待ち・Scoop native実体解決・安全なphase表示を修正し、3担当再確認で未解消0・最終A（docs/reviews/diff-review-2026-11-04-7.md）。修正版の実協調中断run `248addee4e6b`はDocker資源・CLIプロセス・lockの残留0。手書き500行以内の単位で基盤を保存し、復元完了とは分けて扱う。
- Batch 7完了: 固定HEAD `524a5d1b4e3af9ec0d0aed645216f27216266063` から `pnpm e2e:environment:check` を実行し、独立run `77b7c2fb0dc0` / `8104753284e9` がともに24 migration→seed→全catalog検査を通過。同一SQL/seed hash・catalog fingerprint・5サービスimage IDを照合し、双方cleanup complete。別途Docker資源・CLIプロセス・lock各0を確認した。実port競合は既存serverを止めずlockingで拒否し、二重起動・URL/所有権・初期化失敗も回帰検査済み。
- Batch 7追補の検証・レビュー: 全体38 files / 746 tests、check:ci 916 files、typecheck成功。最終C1修正後は対象Reproduce 29 tests（1追加）・Biome・typecheck成功、全体登録747。3担当レビューの必須1・推奨3を全解消し最終A（docs/reviews/diff-review-2026-11-04-8.md）。認可の安全性は未検証のまま維持し、実行条件・hash・過去SQL修復理由はdocs/testing/e2e-environment.mdに記録。次はBatch 8。
- Batch 7時点のM1再確認: package.jsonのコマンド追加によるinventory staleを検出し、package hash/source fingerprintの2値のみ再生成した。base 6051fb6に対するreadonly gateはpassed、登録8・legacy348・不足473・issues0・policy delta0。baselineは再設定せずdigest `7d0a0243251f459c13a094413432994434e6da22e33a4618e946c29bc7764593` を維持。
- Batch 8途中チェックポイント: Step 8-1/8-2の独立actor、Auth UUID/app ULID照合、SDK cookie、case journal、exact ID cleanup、Next本番build/start、専用Playwright configと証跡検査を実装。Step 8-2は下記M1整合の修正を残す。旧helperの修正はlocal互換runnerと一体のStep 8-3へまとめる。共通コマンド公開はBatch 11で行い、現時点の受入入口は `pnpm exec tsx scripts/e2e/fixtureCheck.ts`。既存ignoreで秘密・run出力は追跡されない。
- Batch 8実検証: API診断run `fff1cdc461f4` で2 case / 8 actorの独立性を確認。ブラウザrun `5562cc8e0ed0` ではPC/mobile 4 testが成功し、各projectで2 worker、計4 journal・16 Auth/app user・4 sessionを照合した。全fixture/stack cleanup complete、独立した読取確認でも所有Docker資源・lock・app listener・CLI/Node・当該秘密設定fileの残留0。業務caseのverifiedやM2達成はまだ認定しない。
- Batch 8検査・レビュー: 全tools 50 files / 929 tests、check:ci 951 files、typecheck成功。review 9は全指摘解消・最終A。review 10は必須0、推奨2のうちcontext終了待ちを修正し、追加の負例1件・Biome・担当再レビューで解消。残る推奨1件（長時間build/browser中の総合receiptとCLI進捗の細分化）は再開時へ保留。詳細はdocs/testing/e2e-fixtures.md、docs/reviews/diff-review-2026-11-04-9.md / -10.md。
- Batch 8移行目録: 旧25 specの348登録をlocal319・既存mobile skip9・fixme2・deferred-live18へ分類し、exact key/fingerprintと結果を照合するvalidatorを保存。互換seed、legacy-local config/runner、旧認証/cleanup helper接続、4 project実行は未実施。
- 停止直前の追加確認: base 6051fb6に対するM1は `STALE_ARTIFACT` で失敗した。Next buildで生成されたignoredのnext-env.d.tsと、そこから参照する `.next-e2e/run-5562cc8e0ed0/types/routes.d.ts` がsource manifestへ入り、fingerprintが変化する。再生成の差分はこの2入力とfingerprintのみだったため、run固有値を台帳へ固定せず生成差分を戻した。登録8・legacy348・不足473・policy delta0、baseline digestは不変。生成型の入力境界/復元契約を修正し、build前後のM1を通すことをStep 8-2の未完了条件とする。
- 一時停止（2026-11-04）: ユーザーの「キリのいいところで一旦作業停止して」に従い、このBatch 8途中チェックポイントで停止する。Batch 8全体・M2は未完了。再開時はStep 8-2のbuild後M1整合を最優先で直し、review 10の推奨C1、Step 8-3のlocal互換経路へ進める。Batch 9以降には着手しない。クラウドDB変更・push・PR・デプロイは行っていない。
- 保存点: fixture基盤・移行目録は `0ce6f61` まで、専用runtime・受入checkerは `4fa297b` まで保存済み。手書き500行以内の単位に分割し、各commitのlint/typecheck hookが成功した。停止記録はこの直後のdocs commitに保存する。ignoredのレビュー・実行証跡は当worktree内に保持する。
- 再開（2026-11-05）: ユーザーの「再開して」に従い、停止HEAD `07e885a` と未コミット変更なしを確認。Step 8-2のP1（build後M1整合）とC1（途中進捗）を修正し、実build前後を検証してからStep 8-3へ進む。
- P1修正: 補助declarationの自動root追加をGit母集団とtsconfig列挙の共通部分へ限定し、host/import/referenceから到達する型とmanifest収集は維持した。Next固有pathの事後除外やbaseline再設定はしていない。source 18回帰と6観点レビュー（指摘0）が成功。既存build生成物を残した実worktreeのM1もpassed、登録8・legacy348・不足473・issues0・policy delta0、baseline digest不変。新しい実build後の再確認は後続ログへ記録する。
- サブエージェント運用（2026-11-05、ユーザー承認）: 通常の実装・レビューは `gpt-6.1-sol` / `medium`、単純な読取調査は `gpt-6-luna` / `medium` を明示する。親のモデル・推論設定を継承させない。既存の継承設定で動いていた担当は中断し、この設定で担当を切り替えた。
- 再開後の実run `71c1c1dafe3b`: 空DB復元・schema照合・Next本番buildが成功し、build中の総合receipt/CLI進捗を確認した。build後M1も再生成なしでpassed。ただしPWはjournalのatomic renameでWindows EPERMとなり3/4成功で受入失敗、全体toolsもNode出力受信前の中断raceで941/943成功。成功へ丸めず、journalの限定retryとテストの受信同期を追加する。失敗runのDB資源・lock・app/CLIプロセス・秘密設定fileの残留0を独立確認した。
- Step 8-2完了（2026-11-05）: Windowsの一時rename EPERM/EBUSYを所有identity・保存内容の再確認付きで最大6回だけ再試行し、Node停止回帰は実stdout受信後に中断するよう修正。53 files / 947 tools tests、check:ci 955 files、typecheck成功。review 11は未解消0・最終A（docs/reviews/diff-review-2026-11-05.md）。
- 最終fresh受入run `1104370cf0c1`: 空DB復元→本番build→PC/mobile 4/4 test成功、2 project・4 worker・4 journal・16 Auth/app user・4 sessionを照合。fixture/stack cleanup complete、別途資源・lock・process・listener・当該秘密設定fileの残留0を確認。新build後のM1もpassed（登録8・legacy348・不足473、issues/policy delta0、baseline digest不変）。P1/C1と再開時の2失敗を解消し、Step 8-3へ進む。Batch 8全体・M2は引き続き未完了。
- サブエージェント設定: ユーザー承認により、通常の実装・レビューはSol / medium、単純調査はLuna / medium。新規起動時にmodel/effortを明示し、fork_turns=noneを使う。親設定を継承した旧agentを新しい作業へ再利用しない。
- Step 8-3の実装: 合成seed21 scenarios/参加session/feedback、固定旧stateの所有管理、現行FKに対応したUI行cleanup、専用config、348登録から330実行の選択、結果照合、project別runnerを小コミットで保存。レビューのP1（spec差替え）/P2（秘密file書込み途中の残留）を修正。
- Step 8-3実診断: 公開PCはPOM修正後`c1edeaff9c4d`で57成功。公開mobile`7a2cdcf3fdb4`は48成功・既存skip9、annotation locationのparser互換修正後に実report57件を受理。認証PC`642b151a222a`は64成功・29skip・15失敗で受入失敗。FK名・Client境界・naive日時・旧locatorの原因を特定して修正中。fixture cleanupは日時拒否でincomplete、stack cleanupはcomplete、別途Docker資源/固定state/当該資格情報file残留0。
- 再開時の優先順: (1) FK名追補migrationの空DB再生とcatalog検証、(2) 旧specの本文修正が必要な5定義/認証2projectの10登録をcase ID付きへ通常移行し、legacy-execution/selection/resultsに明示replacementを接続、(3) 修正後の4 projectをすべて実行・照合、(4) M1とレビューを閉じてBatch 8完了後にBatch 9へ進む。5定義はscenario-detail-actionsのFAB2件、session-flowのGM action1件、session-createの作成URL2件。共通hook/suiteの変更は避け、他testのfingerprintを巻き込まない。
- replacement設計の再開メモ: checkLegacyは同keyのregistered化に対応済みだが現legacy runnerは未対応。旧10行のkey/fingerprint/origin metadataを信頼する変更前Git版から固定し、移行先case/variant/bindingと一対一照合する。M1生成物はtests338/app登録10へ正常更新し、未移行338＋固定origin10から初期348を追跡する。実行義務は未移行320＋replacement10=330、既存skip9/fixme2/deferred18は増やさない。実結果には新fingerprintと旧originの対応を記録し、旧fingerprintの貼付けや全件rebaselineで通さない。
- 一時停止（2026-11-05）: ユーザーの「キリのいいところで一旦作業停止して」に従い、Step 8-3の途中checkpointで停止。全tools65 files/1142 tests成功、SQL鏡テスト2件を除去後の対象1件成功（総登録1140）、Biome983 files・型検査成功。FK追補とUI修正の実受入は再開後。詳細はdocs/testing/e2e-fixtures.md、docs/reviews/diff-review-2026-11-05-2.md。クラウドDB変更・push・PR・デプロイは行っていない。
- 再開（2026-11-05）: HEAD `933c689`からStep 8-3を継続。FK名追補を含む25 migrationとseed/catalogをfresh run `b293b8024507` / `e5fb24b57bc4`で再現し、両方cleanup complete・記録上の残留0を確認。認可は未検証のままBatch 10へ分離する。
- 通常登録への移行: 旧5定義にcase IDを追加し、現UIのFAB/GM actionと厳密な作成後ULID URLに修正。元の10登録はcommit `933c689`のGit objectと照合して保持し、同じkeyの新登録へ一対一で対応させる。目録は348（local309/replacement10/既存skip9/fixme2/deferred18）、実行義務330を維持。M1はregistered18（Storybook8/app10）・legacy338・不足473、issues/policy delta0、baseline digest不変。実browser受入は別途検証中。
- 互換受入の継続: 保存点`01e24d8`の全件runで公開PC57成功・公開mobile48成功+既存skip9を照合。認証PCは99成功まで進んだが、後続の基本情報で非表示DOM重複を検出した。基本情報・日程遷移・取消dialog dismissを追加移行後、認証mobile `da1511d489e2`は96成功/3失敗/9skip。home/availabilityのPOMとtimelineの本文を追加修正し、未実行を成功へ丸めない。全runのfixture/stack cleanupはcomplete。
- 移行後の現集計: 旧9定義をcase化し、現在の未移行330＋app通常登録18から初期348を追跡。実行先はlocal301/replacement18/skip9/fixme2/deferred18、実行義務330を維持。M1はbase `01e24d8`に対してpassed、登録26（Storybook8/app18）、不足473、issues0。SessionActionsの契約に通常click後の到達URLを追加した理由をmigrations.jsonへ記録した（policy delta1、既存保証の削減なし）。型検査・Biome988 files・関連132 tests成功。4 project最終受入は未完了。
- ビルドの既知制限: run `586f5f87e453`はGoogle Fontsの応答URLに依存するNext16.1.6の既知不具合でbrowser前に失敗した。同じHEAD/設定の別runでは通過。失敗receiptを保持し、test retryやskipには置き換えていない。フォントの完全なoffline再現は現経路の保証に含めない。
- Batch 1コミット: 9a75a99（前提修正）、6af39ab（分類、data JSONを除く手書き466行）、35472b1（実行境界）。各commit hookのlint/typecheck成功。

- Batch 8完了（2026-11-05）: 保存HEAD `b229f12`から全4projectをfresh実行し、公開PC `25fd1ce3a0cd`は57成功、公開mobile `2f316dd6bcc8`は48成功+既存skip9、認証PC `bfd0fabb12a2`と認証mobile `8bdaf00e2b8d`は各107成功+既存fixme1。合計319成功/既存例外11の330件を実行目録と照合し、旧348行の行き先を保持した。新しいskip・retry・失敗は0。
- 最終受入前のa11y診断 `fc149cc42d26`は106成功/1失敗/既存fixme1。内側mainの重複と横スクロール領域のキーボード到達性を最小修正し、既存Axe検査を変更せず全件受入で解消を確認した。独立レビュー未解消0。
- 最終build後のM1もpassed（登録26/legacy330/不足473、issues/policy delta0、baseline digest不変）。全fixture/stack cleanup complete、別途Docker資源・listener・run process・秘密file・lock・固定旧auth state残留0。receiptは `test-results/quality/batch8-legacy-final.json` / `batch8-static-final.json` / `batch8-final-residue-check.json`。次はBatch 9。M2全体・日程業務caseの実行証拠・認可検証は未完了。

- Batch 9完了（2026-11-05）: 保存HEAD `0f1d877`のfresh run `312e26447f78`で日程browser 8/8成功。creator-only/keeper-only各PC/mobileの確定・全置換・再読込・別参加者表示4条件と、入力拒否/実Actionの21件拒否・候補保持・旧DB全値保持の各PC/mobile4条件を検証した。ID/原TS位置/actor/lease/journalを全8件照合しissues0、skip/retry/flakyなし。
- Batch 9のUI失敗証拠: Storybookの既存8件と追加した保存失敗1件の9/9成功。UI mockは失敗通知・選択保持・再操作だけを証明し、DB保存や認可、RPC原子性の証拠とは分離した。実RPC拒否と原子性はBatch 10で検証する。
- Batch 9で発見した製品不具合: PCに確定CTAがない状態を既存styleで修正。想定内Actionエラーをplain messageへ変更し、本番RSCでの秘匿による汎用表示を解消した。予期せぬDB/RPC/catch Errorは維持。保存済みoffset付き日時の再保存拒否を両schemaで修正し、同値なcheck構成に整理して未解決診断2件も解消した。28入力の前後比較とunit12件で制約・エラー順を維持した。
- Batch 9の証跡修正: 実Playwright JSONのcompiled座標と列挙の原TS座標の差を、既存の1.57限定source map adapterを実workerにも適用して解消。座標一致の条件は維持した。無DB/無browserの2project×同位置loop回帰で、列挙・report・実workerのID/位置が一致することを確認した。
- Batch 9検証・レビュー: staticGate7、schedule tools28、既存fixture evidence/progress31、source map実回帰1、日時schema12件が成功。全体Biome1004 filesと型検査成功。Sol/mediumの3担当と親のレビューで未解消0。記録は `docs/reviews/diff-review-2026-11-05-4.md`。通常登録35（app18/isolated8/Storybook9）、legacy330、不足453、baseline digest `fd3507e0f6fa04d244874cdce650128d7be6071465bf1641be60cf63e3908b1d`。新規不足・例外追加なし。
- Batch 9後始末: 最終8 journal/stackのcleanup completeを確認し、Docker資源・lock・process・listener・秘密接続fileの残留0を独立確認した。ビルド前後のM1もpassed、issues/policy delta0。失敗run3件も保持し、後始末済みを確認。最終receiptは `test-results/quality/batch9-schedule-final.json`、残留確認は `batch9-final-residue-check.json`。Batch 10から続行し、M2全体は未完了。

- Batch 10初期16条件: Next cookies/cacheだけをmockし、本人JWTで正常Action・RPC、匿名/第三者/phase/入力/actor不一致拒否、全置換の原子性を実装。Vitest標準結果とfixture全actor roster・所有journal・check完了・cleanupを厳密照合する。DB無しのguarded collectionも静的ゲートへ接続し、実登録51・legacy330・不足437、issues/policy delta0を確認した。
- 初回実run `522fd686305d` は15/16成功。匿名RPCにSQL実行権限拒否を期待したが、復元catalogではanon EXECUTE可能、関数先頭のauth.uid()検査が `P0001 / Not authenticated` で拒否する既存契約だった。期待を実SQL契約へ合わせ、匿名identity・null data・旧親子全値保持の検査を維持した。単独failureの元errorも保持し、複数failureは集約する。
- 修正HEAD `d3850da` のfresh run `125b7a013e86` は16/16成功、全16journal/stack cleanup complete。独立確認でもDocker資源・lock・process・listener・秘密接続fileの残留0。初回失敗runも同じく残留0で記録を保持。receiptは `test-results/quality/batch10-integration-16-final.json` と `batch10-integration-16-residue-check.json`。Batch 10全体はcalendar4件の移行・受入を続け、M2は未完了。

- Batch 10完了: getCalendarSessionsの既存4件を独立した利用者JWT/cookie fixtureへ移管し、非存在・本人の確定日程・全表示項目・未確定日程を既知IDで無条件比較した。元fileの残17件とhooksは維持し、未移行11 DBファイルをlegacyへ残す。必要20条件、actor交換/service-role/未実行/早期終了/check欠落等を拒否する証跡検査を維持した。
- 最終HEAD `4cdfb90` のfresh run `01cc518d201c` は20/20成功、必要20・実結果20・成功20・journal20でissues0。全fixture/stack cleanup complete、独立確認でもDocker資源・lock・process・listener・秘密fileの残留0。receiptは `test-results/quality/batch10-integration-final.json` / `batch10-final-residue-check.json`。
- Batch 10最終検証: 全tools 76 files / 1326件中1325件成功後、Batch9由来の固定登録数26の古い期待だけを35へ整合し、app移行済18件の独立assertも保持して対象28件を再検証した。関連77件、isNil修正後evidence52件、全体型検査・Biome1032 files・各commit hook成功。3担当レビューの必須1件（isNil）を解消、追加小差分も再確認し最終A（review5/6）。保存後M1は55登録・legacy330・不足437、issues/policy delta0、baseline digest不変。次はBatch 11の結果照合共通化と全入力fingerprint。M2はまだ未完了。

- Batch 11完了: 全binding/project/repeat/setupを必要集合へ展開し、Playwright/Vitest標準結果と既存actor/journal/cleanup証拠をAND照合する共通checkerを導入。plan本文SHA、run/stage/input context、実exit、全attempt、全入力fingerprintの開始/境界/終了照合を追加し、`e2e:verify` / `e2e:verify:all`を公開した。Batch 12前の両commandは全必須＋legacy-localの保守的実行。
- Batch 11レビュー: 外側abort、Storybookの環境file読込、plan/digest取り違え、TaskMeta宣言元、実在しないCLI pathを修正。実受入でPandaの空cwdとTurbopackの仮想dirnameを検出し、唯一のPostCSS設定でStorybookにだけ実rootを渡す方式へ修正。テストassertや所有条件は緩和しない。3担当と追加Sol/medium調査・親レビューを集約し最終A（docs/reviews/diff-review-2026-11-05-7.md）。
- Batch 11否定系: 実runner fixtureでrepeat片側失敗、未実行、skip/xfail/retry、onError、report欠損/衝突、Vitest module/hook失敗を確認。純fixtureで全binding、古いplan/context、途中入力変更、cleanup失敗を拒否。全tools88 files/1487件と、別検証のStorybook追加3 files/10件、後続診断変更の関連86件が成功（重複を単純合算しない）。Biome1066 files・型検査・21コードcommitの通常hook成功。
- Batch 11失敗履歴: `82cfbad3f2e9`はStorybook4件失敗で後続停止、`8b19dd7065ad`はNext buildの仮想dirnameで停止。`bbc3ee73f020`はSupabase start成功後/catalog前に停止し、旧記録から原因は未確定。固定phaseと許可OS codeだけを残す診断を追加し、後続6環境起動では再発しなかった。いずれも失敗receiptを保持し、独立確認で資源残存0。原因未確定の1回を修正済みと説明しない。
- Batch 11最終実受入: 保存HEAD `6a480e14a36c2058087ab9f8d363930411c4812c`、verification `0a45a0cffc24`で全7stage成功。必須55/55、追加legacy312、issues0。物理結果367＝成功356＋既存skip9/fixme2。app必須18はlegacy330の内数で二重計数しない。deferred-live18・未移行integration-legacy11 files・fixture診断4は今回の実行集合外。
- Batch 11入力/後始末: 開始/終了digestは`bbbff02ffb690acb4bd0540aa930ad22acb2ae312d6689b62fb5e6bc4d0205c7`で一致、全28checkpointの差分0。integration `7289cb8cced6`、isolated `2de930d6e170`、legacy `a008b56d3646` / `45df9e452bb8` / `0130b08fb5fb` / `6cc3e1c5b9dd` の全32journal/stack cleanup complete。独立Docker/process/port/lock/秘密file検査も残存0、Storybook6007も解放。
- M2達成: 同じ保存HEADの最終M1もpassed（登録55/legacy330/不足437、issues/policy delta0、baseline digest不変）。receiptは`test-results/quality/batch11-verification-final.json` / `batch11-static-final.json` / `batch11-final-residue-check.json`。次はBatch 12のGit snapshot・保守的選択・shadow比較。事前設計は`test-results/quality/batch12-design.md`と`batch12-panda-provenance.md`に保持し、実装は未着手。
- Batch 12実装・コードレビュー（2026-11-05）: Git四時点/VFS、機能対応表と保守的選択、group/runner閉包、部分runner、独立NoOp、Panda由来証明、同一snapshotのshadowを実装。3担当レビューの必須4件を修正し、独立group照合・実行mode・存在チェックも改善。性能改善候補を保持したレビューはB、記録は`docs/reviews/diff-review-2026-11-05-8.md`。
- Batch 12 CLI追補: 実CLI起動で動的importと実行本体の逆参照が循環し、未解決top-level await・終了13を検出。`verificationRun.ts`へ本体を分離し、既存APIを再公開した。実Node/tsxで変更・全件CLIを検査する回帰2件を含む関連58件、型検査、Biome 1110 files成功。3担当レビュー9はA。`6a68fce` / `a4c80d2`へ通常hookで保存。
- Batch 12実受入完了: HEAD `a4c80d2`のclean状態でNoOp `ba2b0918aa37`がpassed。日程保存エラーStorybook spec末尾に一時コメントだけを加えたsnapshotでは選択 `58e69a72438e`が`TEST_FILE`理由で`schedule-save-error` 1件を選択し、部分 `7c372bdf43f0`が1/1成功。同じsnapshotの全件 `07dc26381159`は必須55/55・追加legacy312・7 stagesでpassed、独立比較は`matched`（未選択失敗・結果差異0）。全件内訳はintegration20、Storybook9、isolated8、Chromium57、mobile48+既存skip9、認証付き各107+既存fixme1。全367登録の356成功・既存例外11を区別し、旧DB legacy/deferred-liveは未実行のまま。
- Batch 12証跡・後始末: 部分6回・全件28回の入力checkpointがすべて一致し、共通checker issues0。6 DB環境のcontainer/network/volume/lock/process/listener/認証ファイル残留0、32 journals完了。2 Storybook runの所有Node/6007 listenerも0。一時コメントを削除して元のSHA-256と完全一致を確認し、clean HEADの最終M1もpassed（55/330/437、issues/policy delta0、baseline digest不変）。公開手順は`docs/testing/e2e-selection.md`、receiptは`test-results/quality/batch12-{noop,selection,verification}-final.json` / `batch12-static-restored.json`。実測receipt期間はNoOp248.6秒、部分120.4秒、全件1223.1秒、準備・比較込み1586.9秒。M3は次のBatch 13、M4はBatch 14で継続。

## Batch 1: DB不要の品質検査とDBテストの分類

### Step 1-1. 非書込み検査とツール用テストproject

対象: package.json、vitest.config.ts（変更）、scripts/e2e/vitest.config.ts（新規）。

check:ci（Biome非書込み）、typecheck、test:unit、test:e2e-toolsを定義する。scripts/e2e/**/*.test.tsを専用projectへ登録し、既存Vitestのinclude外にある検査コードが未実行にならないようにする。pure unit/componentと将来のDB integrationは明示したcommandで実行する。既存pnpm vitestの扱いもREADMEと実装フローへ記録し、暗黙にDBテストを廃止しない。

完了条件: DB envなしでツールfixtureと純粋テストを実行できる。検査fixtureを壊すとcommandが失敗する。

### Step 1-2. 実DBテストを個別に分類

対象: vitest.config.ts、vitest.setup.ts、vitest.integration.config.ts、vitest.integration.setup.ts、src/__tests__/helpers/testClient.ts、scripts/e2e/db-test-files.json（後三者のconfig/一覧は新規、helperは変更）。

最低11件を実コードから分類する: profile/feedback/scenarios-detail/scenarios-masterData/scenarios-searchScenarios/scenarios-new-adapter/scenarios-new-duplicateCheck/sessions-detail/sessions-list/sessions-participantAdapter/sessions-new。homeのadapter.test.tsはpure、SignupModalのadapter.test.tsはstubなので名前だけで除外しない。

pure setupの実DB client利用をfail-fastにし、integration setupだけが専用環境clientを供給する。DB不足時の早期return/expect(true)/skipを移行一覧へ記録し、integration commandの環境preflightで事前失敗させる。個別テストの修正はBatch 10で行う。

完了条件: 全既存testファイルがpure/component/integrationのいずれかに所属し、重複/取りこぼしがない。DB設定なしの純粋検査は成功し、integrationは理由付きで事前失敗する。

### Review Checkpoint: Batch 1

関連unit/component・tools fixture、非書込みlint、型検査、分類一覧のレビューを行う。共有DBへ接続する一括pnpm vitestを完了確認として実行しない。

## Batch 2: 再現可能なsource一覧とNextルート抽出

### Step 2-1. ソース読み込みと安定した出力

新規: scripts/e2e/source.ts、inventory.ts、inventorySchema.ts、source.test.ts、fixtures/source/。

tracked/未追跡の対象sourceを列挙し、ignoreと除外方針を固定する。tsconfigのextends/pathsを読み、Program/TypeCheckerを1回構築。実ファイルpathをGitの表記に正規化し、Windows drive/区切り/CRLF差を吸収する。Linuxで区別される大小文字を一律lowercaseにしない。symlinkで範囲外へ出るsourceは診断する。

sourceの解析にはアプリのimport実行を使わない。出力を安定sortし、更新commandとreadonly --checkを分離する。node/edgeに根拠sourceと位置を残す。JSONの部分書込みを避ける。

検証: 同じsnapshotの再実行がbyte一致、CRLF/LFで同等、除外test/生成物を母集団へ混ぜない。

### Step 2-2. Nextのルートを抽出

新規: scripts/e2e/extractors/routes.ts、routes.test.ts、fixtures/routes/。

src/app全体からpage/route/layoutと関連default/loading/errorを認識する。route groupとslotをURLから除くが表示経路を保持。dynamic/catch-all/optional catch-allとinterceptionをfixtureで検証。canonical URLとsource/slot/navigation variantを別フィールドにする。認識できない規約は診断し、推測したURLを確定値にしない。

完了条件: 基準のscenarios standalone/interceptedを別入口として保持し、/auth/callbackを落とさない。行番号変更だけでは対象IDが変わらない。

### Review Checkpoint: Batch 2

抽出fixture、実ソースspot check、決定論的出力の差分、Windows/Linux path fixtureを検証する。

## Batch 3: Server Actions・HTTP入口と保守的な依存関係

### Step 3-1. file/inline ActionとAPIを抽出

新規: scripts/e2e/extractors/actions.ts、apis.ts、および各test/fixture。

file directiveからexport関数を認識し、関数宣言/arrow、alias/re-export、共通blocksを扱う。全関数bodyからinline directiveを検出する。inline IDはsource＋親symbol＋local symbol、匿名で識別不能なら明示annotationを要求する。Next内部のビルド依存Action IDは保存しない。

Route HandlerはHTTP method単位に抽出し、import/export aliasも解決する。read/writeの期待分類は契約へ委ねる。Actionに名前が付いていることを「更新処理」の根拠にしない。

完了条件: confirm/page.tsxのinline→confirmScheduleTimeBlocksActionの両入口を抽出。非Actionの同名関数を誤登録しない。

### Step 3-2. file依存と既知の直接呼出

新規: scripts/e2e/extractors/dependencies.ts、dependencies.test.ts、fixtures/dependencies/。変更: inventorySchema.ts。

import/再exportの依存を保持し、直接の関数呼出とliteral table/RPC名を検出する。Supabaseのrpcという名前だけで判定せず、既知clientの由来を確認する。user-defined同名関数との誤判定をfixtureで防ぐ。動的な宛先/呼出はunresolved診断と保守的な依存にする。

props追跡の未対応はこの時点の宣言済み解析範囲として記録し、既存の未解決は初期baseline、新しい未解決は理由付き契約を要求する。未解決を理由に母集団から対象を削除しない。

### Review Checkpoint: Batch 3

alias/re-export/inline/動的呼出/名前衝突のfixtureと実コードの経路を確認。抽出できる存在・依存と、確認できない業務仕様を区別する。

## Batch 4: 台帳schemaと対象・観点の照合

### Step 4-1. 台帳のschemaを固定

新規: e2e/ledger/schema.ts、contracts/schedule.json、scenarios/schedule.json、exceptions.json、scripts/e2e/ledger.test.ts。

Zodから型を導出する。target→aspect→許容layer→caseの対応を1組ずつ持たせ、巨大なcovers/aspectsの直積を避ける。actorはoperator等の役割名と実fixture bindingを分け、creator-only/keeper-only/outsiderを独立variantにする。caseにexecutionGroupを宣言できるようにする。

検証: 未知field/ID重複/空理由/無効status/未知project/runtime/循環依存がエラー。Storybookの結果をpersist/RLSの証拠へ割当てると失敗する。

### Step 4-2. 意味を補う契約とvalidator

新規: scripts/e2e/ledger.ts、requirements.ts、requirements.test.ts。

全抽出入口に契約または初期不足項目を要求する。新しいAction/APIに分類や要件がない場合も検出する。消えたtarget、使われない例外、plannedと実testの食い違いを列挙する。必須観点はkindの既定ルールと対象固有契約から生成し、非適用を理由付きで表す。

この段階ではtest登録未接続のため、実test有無の判定はstub fixtureまで。plannedをimplementedへ自動昇格しない。

### Review Checkpoint: Batch 4

対応する対象が違う・layerが違う・理由だけで全観点免除する等の誤登録を故障注入して検証する。

## Batch 5: Playwrightの実test登録と既存資産の段階移行

### Step 5-1. list reporterで実登録を取得

新規: scripts/e2e/discover.ts、reporters/discovery.ts、discovery.test.ts、fixtures/discovery/。

アプリ用とStorybook用configをそれぞれ--listで列挙する。test body/setup/サーバーを起動しないことをfixtureで検証する。import時の副作用も禁止し、列挙をDB不要CIで実行する。各project、パラメータvariant、repeatの登録を保持する。setup testは別区分とし、業務caseの担当に数えない。

同一caseの端末展開をID重複と誤判定せず、同一execution tupleに複数登録された場合は明示したbindingかエラーとする。logical IDとPlaywright内部IDを混同しない。

### Step 5-2. 既存testとIDの対応を導入

変更: .storybook/tests/scenario-panels.spec.ts。新規: e2e/ledger/legacy-tests.generated.json、scenarios/scenarios.json、scripts/e2e/legacy.test.ts。変更: ledger.ts。

最初は既存Storybook specへcase/variantタグを付ける。未登録の既存アプリtestをlegacy一覧へ固定する。新規または内容変更のtestはID付与を要求する。ASTでtest本体/所属suiteの正規化fingerprintを使い、同名のまま内容を変更してlegacy除外を継続できないようにする。setup/単純整形は区別する。意図的なtest移動は移行対応を記録する。

serial lifecycleは実行groupとして登録し、後のselectorが途中だけ選ばない。複数testで1つのcaseを確認する場合は全testが必須であることを明示する。

### Review Checkpoint: Batch 5

DBなし列挙、loop/project展開、legacy追加禁止、本文変更時のID要求、test削除とimplemented台帳不一致を検証する。

## Batch 6: 不足baselineと最初の静的CIゲート

### Step 6-1. baselineをbootstrapして固定

新規: e2e/ledger/pending-baseline.json、inventory.generated.json、scripts/e2e/baseline.ts、baseline.test.ts。

初回は全target/観点/必要executionを再抽出し、未対応を正直にbaselineへ記録する。bootstrap専用commandは通常checkから呼ばない。初回baselineを導入するPRでは全項目をレビューし、比較元にschemaがないことを自動承認理由にしない。以後は信頼したbaseのbaselineと比較し、新規不足、解消済残骸、同数入替えを検出する。

base側契約も読み、必須project/aspect/actorを削って不足を消した変更をpolicy deltaとして報告する。例外追加・契約縮小・schema version更新には移行理由を要求する。自動検査だけで妥当性を認定せずレビュー対象として可視化する。

### Step 6-2. DB不要workflowへ接続

新規: .github/workflows/e2e-ledger.yml。変更: package.json。

e2e:inventory、e2e:ledger:checkを公開。CIはcheckout→setup→tools tests→readonly inventory/ledger/discovery/baseline検査。PR base/headをイベントから固定し、必要履歴を取得。source内のbase指定で別コミットへ差し替えられないようにする。base不在は失敗。初回bootstrapのレビュー条件を記録する。

このworkflowに共有Supabase secretsを渡さない。既存test.ymlの全面移行はBatch 13で行い、M1成功を既存E2E成功とは報告しない。

### Review Checkpoint: Batch 6

新Action・消したtest・古いinventory・baseline項目入替え・追加mobile不足・不正baseでCIが失敗することを検証。M1の達成を記録する。

## Batch 7: 専用Supabase環境の再現性

### Step 7-1. schema/policy/grantを空DBから再現

変更候補: supabase/config.toml、supabase/migrations（追補と復元不能な過去SQLの修復）。新規: supabase/seed.sql、docs/testing/e2e-environment.md。

固定CLIで空のlocal DBへ既存migrationを適用し、成功/失敗を記録する。管理外のpolicy/grant/extension/関数設定が必要なら、正規のschema取得手順で設定だけを確認し、必要最小限をversion管理へ戻す。現行クラウドの安全性を推測しない。migration追加は既存Supabase migrationスキルとCLI規約に従う。2026-11-04のユーザー指示により、破綻している過去migrationの修復は、原因・変更前後・再実行結果を記録して実施できる。新たな仕様変更は原則追補migrationに分離し、運用DBへの適用は行わない。

未知の仕様は当該契約を保留し、必要な設定が欠けたまま権限テストを合格させない。seedは公開master dataとテスト用最小データ。実ユーザーデータは使わない。

完了条件: fresh environmentでmigration→seedを2回再現し、必要table/RPC/policy/grantのcatalog検査が通る。未解消ならM2の依存部分を停止し、M1は利用できる。

### Step 7-2. 環境manifestと所有権

新規: scripts/e2e/environment.ts、environmentSchema.ts、environment.test.ts、fixtures/environment/。

runId、repo/commit、CLI/image version、ports、project ID、owned process/resource、local接続先をmanifestに記録。秘密値は別の一時設定として扱う。起動前に許可するlocal環境と所有markerを照合し、誤ったremote URLでreset/cleanupを開始しない。

初版は1 stackの占有ロック。並列worktreeは別project/portsで明示構成し、予約競合を検出する。既存portをkillしない。キャンセル・起動途中失敗でも所有resourceのみ片付け、残留を報告する。

### Review Checkpoint: Batch 7

空DB復元、port競合、二重起動、間違ったURL、起動失敗、中断後始末をlocal disposable環境で検証する。

## Batch 8: 権限別fixtureと認証状態の分離

### Step 8-1. actorと業務fixture

新規: e2e/fixtures/actors.ts、sessions.ts、fixtureManifest.ts、fixtureSchema.ts。変更: e2e/helpers/supabase-auth.ts。

Auth UUIDとapp user ULIDを正しく作成し結び付ける。creator-only/keeper-only/confirmed-player/outsider/anonymousを用意する。run×project×workerを基本にし、rateLimitの履歴が残る操作はcase別actor。データ行もcase所有にする。cookie hostをbaseURLから導出し、ログイン後のユーザー・権限をassertする。fixture生成はservice-role、通常操作は利用者JWT。

### Step 8-2. 新configとcleanup

新規: e2e/fixtures/test.ts、playwright.isolated.config.ts。変更: e2e/helpers/cleanup.ts、playwright.config.ts、package.json、.gitignore。

代表caseだけを新configから実行し、legacy suiteの共通user.jsonを混ぜない。build前に同じlocal Supabase設定を渡し、Next production buildを使う。auth state/build/reportをrun単位に分離し、同じcheckoutの並列buildはロックする。旧configと共通の端末定義は再利用し、実行対象は明示する。

cleanupはmanifestの作成IDのみ、各削除errorを検査。現行helperが参照するschedule_candidates・schedule_responses・game_schedulesはmigration 0017/0021で削除済みなので、適用後schemaに合わせて削除順を更新する。finallyで結果と独立に実行し、cleanup失敗はreceiptへ含める。pretest:e2eのkill-portを新経路で呼ばない。秘密・storageState・traceはgitignore/期限付きartifactにする。

### Step 8-3. 既存suiteを実行するlocal互換経路

新規: playwright.legacy-local.config.ts、scripts/e2e/runLegacy.ts、e2e/fixtures/legacySeed.ts、e2e/ledger/legacy-execution.json。変更: e2e/auth.setup.tsと必要な互換helper。Step 8-1/8-2とは別の小コミットに分ける。

旧configの--list結果を入口にし、公開/認証のPC/mobileをlocal stackで実行する。初版はworkers=1、同一checkoutを占有し、projectごとにlocalデータ・旧形式storageState・Nextプロセスを再初期化する。hardcoded e2e/.auth/user.jsonはそのrunだけのlocalユーザーで生成し、完了後に破棄する。新isolated caseとは別job/stackで実行する。

既存testが探すmaster data、paginationに必要なシナリオ数、feedback、参加状態などを合成seedで再現する。live importの必要envは設定せず、E2E_LIVE_IMPORT以外のE2E_TEST_BOOTH_URLだけでも外部取込が始まる既存Tier 3を含め、外部依存caseを個別に分類する。外部ケースは理由付きdeferred-liveにし、未設定を正常成功とは数えない。

legacy-executionには旧登録testごとにlocal互換実行、新caseによる代替、理由付き既存skip/fixme/deferred-liveを記録する。旧登録集合と切替後の和集合を比較し、行き先のないtest、新しい欠落、説明なしskipを失敗にする。残したlegacyはlegacy結果として報告し、台帳の個別要件verifiedとは区別する。

環境不足やstale selector等で初回local実行に失敗した場合は、原因と回帰caseを小さい追補commitで修正する。新たなexpected-failureで通さない。未説明の失敗・未実行がなく、各suiteの実行先または同等以上の代替が揃うまでBatch 13のCI切替を行わない。既存の明示例外は当該移行の記録を残す。

### Review Checkpoint: Batch 8

新経路の2 workerが異なるユーザー/行を使うこと、actorを取り違えると失敗すること、cleanup失敗/認証失敗/旧state混入を検証する。互換経路では旧25 specの実登録集合との対応を検査し、4 projectをそれぞれlocalで実行する。

## Batch 9: 日程確定のbrowser E2Eを導入

### Step 9-1. UI操作と永続化

新規: e2e/isolated/schedule-confirmation.spec.ts。変更: e2e/pages/schedule-confirm-page.ts、e2e/ledger/scenarios/schedule.json、contracts/schedule.json。

creator-onlyとkeeper-onlyの正例を別variantにする。PREPARATIONのfixtureから開始し、UIの通常clickで確定→再読込→参加者contextで同じtime blockを確認。PC/mobileを必要集合へ明記。dispatchEventで操作不能を回避しない。fixtureを使い、serial lifecycleの途中状態へ依存しない。

### Step 9-2. UI失敗状態と境界

新規: e2e/isolated/schedule-confirmation-errors.spec.ts。必要最小限のUI用mock/Storybook storyは既存部品へ追加する。

invalid入力・保存拒否・旧値保持・複数time blockを確認する。server処理の失敗をブラウザpage.routeだけで再現できると仮定せず、DB制約等の再現可能な失敗、または明示したテストadapterを用いる。UIのmockエラー確認はstorybook layer、実保存の失敗はbrowser/integration layerへ分ける。

アプリの不具合が見つかれば、仕様と照合して最小修正と回帰caseを同Batchの後続変更へ含める。期待値変更やskipによる回避はしない。外観改修へ広げない。

### Review Checkpoint: Batch 9

local専用環境で必要4条件以上（creator/keeper×PC/mobile）を実行し、再表示を確認。失敗時traceと対象caseを台帳へ対応させる。

## Batch 10: Action/RPC認可とDBテストの証拠

### Step 10-1. UIの外側にある拒否と原子性

新規: 日程確定ディレクトリの__tests__/actions.integration.test.ts、およびRPC integration test。変更: vitest.integration.setup.ts、DB fixture。

匿名・outsider・不許可phaseのAction拒否と、利用者JWTによるRPC直接拒否を確認する。Nextの不安定な内部Action IDをHTTPに直書きしない。Action integrationはNext境界だけをmockし、認証済Supabase client/実DBで検証する。actorごとのclient差替えが並列testで混ざらないよう、初版は当該suiteを直列化する。

RPCの一括replaceでinvalid blockを混ぜても旧データが残ること、creator-only/keeper-onlyを独立に確認する。service-roleの結果を拒否確認へ使わない。

### Step 10-2. integration結果adapterと偽成功の解消

新規: scripts/e2e/evidence/vitest.ts、vitest.test.ts、fixtures/results/。変更: fixtureを導入する既存DB test。

最初は日程関連を個別case IDで登録し、Vitest結果を共通evidenceへ変換する。test全体の成功だけで個別checkを満たさない。DB失敗時の早期return/expect(true)/環境不足skipを、移行対象から順にassertionまたは明示したpreflight failureへ変える。

11件すべてを同Batchで改修しない。未移行はintegration-legacy一覧に保持し、個別evidence未対応のまま成功率へ算入しない。pgTAPを後から導入する場合は別adapterを実装し、TAPの全assertionとplan件数を照合する。

### Review Checkpoint: Batch 10

権限を逆にすると拒否testが失敗すること、RLS bypassの混入が検出されること、未実行/早期returnを証拠へ算入しないことを検証する。

## Batch 11: 実行結果の厳密な照合

### Step 11-1. reporterと外部checker

新規: scripts/e2e/reporters/results.ts、verifyResults.ts、verifyResults.test.ts。変更: schemaと専用config。

必要case/variant/actor/project/runtimeを登録testへ展開し、repeatを含めた全件を照合する。expectedStatusと最終statusがpassed、runner全体成功、全必須結果存在、fixture actor一致を要求する。skip/fixme/xfail/interrupted/missingを成功へ算入しない。retry成功はflakyとして分離し、この代表フローの必須gateでは失敗にする。

複数testで1 caseを担う場合も全testが必要。setup・cleanup・reporter障害・結果JSON欠損を検出する。対象なしはdocs-only等の判定理由がある場合に限り成功とし、--pass-with-no-testsで吸収しない。

### Step 11-2. fingerprintと実行入口

新規: scripts/e2e/fingerprint.ts、run.ts、run.test.ts。変更: package.json。

e2e:verifyとe2e:verify:allを公開。開始前と終了後のsource/lock/config/ledger/test/fixture/stub/migrationのfingerprintを照合し、途中編集や古いreportを拒否。環境起動→build→test→結果照合→後始末を所有manifestに従って実行する。子プロセス異常とcleanupのexit codeを失わない。

receiptは再現用の証拠であり、改ざん不能な認証とは扱わない。CIで独立再検査する。

### Review Checkpoint: Batch 11

repeatの一部失敗、1 caseの一部test不足、xfail、retry、古いreport、途中編集、report欠損、cleanup失敗をfixtureと実runで検証。M2達成を記録する。

## Batch 12: 機能単位の保守的な変更選択

### Step 12-1. Git差分を固定して選択

新規: scripts/e2e/select.ts、gitSnapshot.ts、selection.test.ts、e2e/ledger/impact-rules.json。

CIはイベントbase/headを使い、ローカルは指定baseからHEAD＋staged/unstaged/untrackedを含める。delete/renameとNUL区切りを扱う。base/headのfile graphの和集合を使い、削除した依存も追う。baseが読めない/分類できない変更はfull-requiredへ拡大するかエラー。

UI専用import関係だけではE2Eへの依存を表せないので、機能directory→contract/caseの明示マッピングも使う。test-only/fixture/config/台帳変更を対象に含める。認証・root layout・共通操作部品・lockfile・テスト基盤は広域、migrationはDB全件＋関連E2E。

### Step 12-2. executionGroupと選択結果の検証

executionGroupはgroup全体、認証setup等はrunner依存も含める。legacy serial testを実行する場合は元のsuite全体を実行し、途中だけ抽出しない。未移行legacyやbaselineが関係する変更は「実行証拠不足」を表示し、新規変更がbaselineを拡大していないか別途検査する。

選択理由と必要集合を保存し、--listの登録と突合してから実行する。partial選択と同じsnapshotのfull-requiredを比較するshadow運用を開始する。full-requiredは「登録済必須ケース全件」。これとは別にlegacy-localを実行し、CI全体では双方の結果と移行目録を照合する。未移行legacyを台帳上verifiedとは扱わず、legacy-localを省略したrunを全既存suiteの回帰検査と呼ばない。

### Review Checkpoint: Batch 12

add/delete/rename/dirty/untracked、shared Button、alias、未知依存、serial途中選択、0件を検証。意図した回帰変更を与え、必要caseが選ばれることを確認する。

## Batch 13: ローカル品質ゲート・CI・開発規約へ接続

### Step 13-1. 共通qualityコマンド

新規: scripts/quality/changed.ts。変更: package.json、lefthook.yml。

quality:changedはreadonly lint→型→pure/unit/tools→静的ledger→関連Storybook/integration/E2E→receipt照合。DB不要変更でも抽出・台帳の全体整合は検査する。unknown変更をdocs-onlyに分類しない。

hookはstaged snapshotを対象にできる軽量schema/ID検査だけにする。working treeにだけある未stageのtestを使ってcommit内容を合格にしない。staged snapshot検査を未実装の間はhookを権威ある保証とせず、PR前とCIの全体checkを必須とする。

### Step 13-2. 専用環境とCIを一体で切替

変更: .github/workflows/test.yml、.github/actions/setup/action.yml、e2e-ledger.yml。

各jobをcheckout→setupに修正し、composite内の重複checkoutを除く。unitはtest:unitへ。旧E2E jobはlocal専用のe2e-legacy-localとe2e-requiredに分け、共有cloud key/email/passwordの注入を取り除く。Batch 8-3の移行目録と実行結果が受入条件を満たしてから切り替える。checkout修正だけ先行させて共有DBへ更新系testを実行しない。

イベントと実行集合を次のように設定する。各イベントのhead、比較元、modeをJSON fixtureで検証する。

| workflow event | checkout/比較元 | 実行 |
|---|---|---|
| pull_request → main/develop | PR head SHAをcheckout、PR baseとのmerge-baseで比較 | 静的＋選択required＋固定smoke＋legacy-local全件 |
| push → main/develop | event.afterをcheckout、baseline増加は存在するevent.beforeと比較 | full-required＋legacy-local全件 |
| schedule | default branchのイベントSHAをcheckout。差分選択は行わず、現在snapshotの整合を検査 | full-required＋legacy-local全件 |
| workflow_dispatch | 指定refを固定。全件modeで実行 | full-required＋legacy-local全件 |

初回push等でbeforeが存在しない場合はbootstrap規約を適用し、自動で不足増加を承認しない。定期実行の初期案はcron「30 18 * * 0」（日曜18:30 UTC、月曜03:30 JST）。scheduleはdefault branch上で動くため、developの全件確認はpushで行う。定期実行は実装時にworkflowへ設定するもので、この計画作成では登録しない。[GitHub公式の起動イベント](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

WindowsとLinuxで抽出/選択fixtureを確認し、実DB/browserの主実行はLinux、ローカルWindowsでも同じmanifest契約を確認する。fork PRにも本番secretを渡さない。reportとtraceを期限付きartifactへ保存する。

### Step 13-3. 規約と移行運用

変更: .claude/rules/testing-patterns.md、.claude/skills/exec-plan/SKILL.md、scripts/export-codex-skills.ps1の既存出力先、必要なら.claude/rules/codex-harness.md。生成: AGENTS.mdと対象Codex skill。

testing-patternsを正本にしてquality:changed、実行不足/例外の扱い、assertionレビューを記載。gen:agentsで再生成し--check。Claude専用harnessも同じcommandを呼び、別の合否を作らない。skill exportは当該対象だけを更新し、他skillの変更を混ぜない。

### Review Checkpoint: Batch 13

一度成功後に必須testをskipし、ローカル/CI両方が失敗することを確認。共有cloud credentialsなしでPR相当が完走し、選択集合と結果が一致する。旧suiteの任意1件を実行目録から外すと失敗すること、PR/push/schedule/dispatchが指定した集合を選ぶことを確認。M3達成を記録する。

## Batch 14: UI surfaceとprops依存の抽出を拡張

### Step 14-1. 実在する書き方を追跡

新規: scripts/e2e/extractors/surfaces.ts、callbacks.ts、各testとfixtures。

onClick/onSubmit/form action/RHF handleSubmit/Ark callback/Link/routerを抽出する。親JSX属性→子props→callback呼出、直接alias、.bind、単純wrapperに対応。call siteとentry contextを保持し、Storybookのmockと実ページのActionを混同しない。

基準のSelectedTimeBlocksStickyBar→ConfirmAvailabilityWorkspace.handleConfirm→inline Action→export Action→adapter→RPCをgolden fixtureと実ソースspot checkで確認する。任意のJSの完全解析は非目標。動的registry/spread/外部callbackで解決不能なら診断し、契約または保守的fallbackを要求する。

### Step 14-2. 観測から必須化へ移行

source inventoryの新kind/versionを追加し、schema migrationとして旧baselineと新しい義務を区別する。全既存surfaceの新規不足を通常機能PRへ紛れ込ませず、初期移行変更でレビューする。操作件数/fingerprint変化はレビューのきっかけでありassertion追加の証明とはしない。

最初は診断を収集し、基準実装の未解決を明示契約へ整理してから、新規surface/依存の未解決をfailにする。依存graphをテスト選択へ使う際も、機能マッピングとの和集合を維持し、full-requiredとの比較で取りこぼしがないと確認してから限定範囲で絞る。

### Review Checkpoint: Batch 14

props/bind/匿名handler/同名別関数/動的callbackで誤った確定をしないことを検証。対象未抽出、ゲート回避、選択漏れを含む全体review-diffを実施。M4達成を記録する。

## ファイル一覧

上のStepに列挙したファイルを正本とし、以下は責務ごとの一覧。新規ファイルの名前は実装時に近い責務へ統合してよいが、責務・検証・境界を省略しない。

| 区分 | 新規/変更 | 用途 |
|---|---|---|
| scripts/e2e/source・inventory・extractors | 新規 | TS/Next抽出と診断、単体fixture |
| e2e/ledger/schema・contracts・scenarios | 新規 | 要件、対象、caseと証拠の対応 |
| inventory/legacy/pending/exception JSON | 新規 | 生成物と段階移行の記録 |
| scripts/e2e/discover・reporters・evidence | 新規 | Playwright/Vitest登録・結果の正規化 |
| scripts/e2e/environment・fingerprint・run | 新規 | 専用環境と実行証跡 |
| scripts/e2e/select・gitSnapshot | 新規 | 差分と実行集合 |
| scripts/quality/changed.ts | 新規 | ローカル/CI共通の品質入口 |
| e2e/fixtures・isolated・legacy-execution目録 | 新規 | 権限/データ分離、旧suite互換、代表フロー |
| playwright.isolated.config.ts・playwright.legacy-local.config.ts | 新規 | 移行済caseと旧suiteの専用local config |
| supabase/seed.sql・必要な補完migration | 新規 | 空DBからの再現 |
| 日程のintegration test | 新規 | Action/RPCの拒否・原子性 |
| package.json・Vitest/Playwright config | 変更 | commandと分類、reporter |
| auth/cleanup/helper・既存Storybook spec | 変更 | 認証・所有データ・stable ID |
| workflow・hook・testing規約・exec-plan | 変更 | 検査の接続 |
| AGENTS.md・対象Codex skill | 生成 | 正本から同期 |
| docs/testing/e2e-environment.md | 新規 | 固定version・起動・復旧手順 |

## 検証方法

### 計画段階で実施した確認

基準コミットのファイル、設定、inline Actionと日程確定処理、既存serial suite、unit/DB分類を静的に確認した。先行調査でPlaywright 1.57.0のlist/tag/reporter/CLIとNext/Supabaseの公式資料を確認済み。DB・アプリ・CIの実行はしていない。

### 実装時の自動検査

各Stepの検証に加え、次の故障が必ず失敗になることをtest:e2e-toolsで確認する。

| 故障 | 期待 |
|---|---|
| 新しいinline Actionの見落とし | inventory fixture不一致 |
| 新規対象に契約なし | 静的ゲート失敗 |
| implementedのtest削除 | 登録不一致 |
| 全く別のtargetへ同数baselineを入替え | baseline増加 |
| desktopの不足へmobile条件を追加 | 新しいexecution不足 |
| source/testが変わった後の古いreceipt | fingerprint不一致 |
| repeat/複数testの一部だけ成功 | 必須結果不足/失敗 |
| skip/fixme/xfail/途中中断 | verifiedにしない |
| serialの途中testだけ選択 | group展開で補完、欠ければ失敗 |
| selectorが未知変更を0件にする | full-requiredまたは失敗 |
| 異なるactor/clientで検査 | fixture identity不一致 |
| cleanup失敗・report出力失敗 | 全体gate失敗 |

M1はDB無し、M2はlocal disposable、M3はCI相当のclean checkoutで検証する。大量の既存テストを「全部成功」と報告する前に、legacy/移行済/例外/未実行の内訳を必ず出す。

### 初期受入値と計測

正確性の受入値は「未説明の抽出漏れ0、登録不一致0、必要execution欠落0、新規不足0」。既存不足数・flaky率・環境準備/build/test/cleanup時間は測定して記録し、事前に速度改善率を約束しない。選択の最適化は全件比較で取りこぼしを確認してから行う。

## 移行・復旧・継続課題

- 各Batchは以前のrunnerを利用可能にしたまま追加し、専用configから対象を昇格する。旧共有DB経路を新しい品質ゲートのfallbackにしない。
- ゲート障害で復旧する場合は、原因のextractor/schema変更を戻すか、明示した前versionへ固定する。blanket skip、勝手なbaseline再生成、未知を無視する変更で復旧しない。
- 新規UI改修を取り込むときは、そのコミットで再抽出する。前回調査のdirty treeをbaselineとしてコピーしない。
- 全旧E2Eのfixture化は、認証/profile、scenario/import、session lifecycle、feedback等の領域ごとに3–8ファイルの後続Batchを起票する。各領域のlegacy項目削除と実行証拠を同じ変更で提出する。
- R2はlocal bindingだけでなく返却URLからbytesを取得する経路が必要。画像保存の権限仕様を確定後、OpenNext/workerdの専用runtime profileを追加する。それまでR2契約をverifiedとしない。
- BOOTH/TALTOはserver transport stub、実Discordは専用接続profileとして後続導入する。モック実行とlive接続の証拠を分ける。
- 現行mainのbranch protectionや運用DBschemaは未取得。CIのrequired check登録は実装時に設定を確認し、実際に追加する対象名を確定する。台帳による自動検査とレビューの両方を残す。

