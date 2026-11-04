# Playwrightを活かした実装抽出・テスト台帳・品質ゲート導入計画

## Context

- 版: r2 / 作成日: 2026-11-04 / 状態: 計画完成（Terraレビュー2回、指摘解消）。
- ユーザーの依頼: 「この方針で、既存のPlaywrightを活かして、自動抽出・テスト台帳・品質ゲートを段階的に導入する実装計画を立てて。ワークツリーは分離させて。」
- 専用作業先: C:/Users/kabocchi/.codex/worktrees/e2e-ledger-plan/scenario-manager
- 実装の基準: b4c824e604e0e69da0e6e37f4a6bf60db83e71dc。managed worktreeをこのコミットから作成した。計画時点はdetached HEAD。
- 背景資料: docs/research/e2e-strategy-2026-11-04.md。この資料は元の作業ツリーの未コミット改修も調査した記録であり、基準コミットの実装量とは異なる。
- 本依頼で作成するのは計画とレビュー記録。アプリ・テスト基盤・DBの実装、コミット、公開はこの計画作成には含めない。

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
- [ ] Batch 2: 再現可能なsource一覧とNextルート抽出
- [ ] Step 2-1. ソース読み込みと安定した出力
- [ ] Step 2-2. Nextのルートを抽出
- [ ] Batch 3: Server Actions・HTTP入口と保守的な依存関係
- [ ] Step 3-1. file/inline ActionとAPIを抽出
- [ ] Step 3-2. file依存と既知の直接呼出
- [ ] Batch 4: 台帳schemaと対象・観点の照合
- [ ] Step 4-1. 台帳のschemaを固定
- [ ] Step 4-2. 意味を補う契約とvalidator
- [ ] Batch 5: Playwrightの実test登録と既存資産の段階移行
- [ ] Step 5-1. list reporterで実登録を取得
- [ ] Step 5-2. 既存testとIDの対応を導入
- [ ] Batch 6: 不足baselineと最初の静的CIゲート
- [ ] Step 6-1. baselineをbootstrapして固定
- [ ] Step 6-2. DB不要workflowへ接続
- [ ] Batch 7: 専用Supabase環境の再現性
- [ ] Step 7-1. schema/policy/grantを空DBから再現
- [ ] Step 7-2. 環境manifestと所有権
- [ ] Batch 8: 権限別fixtureと認証状態の分離
- [ ] Step 8-1. actorと業務fixture
- [ ] Step 8-2. 新configとcleanup
- [ ] Step 8-3. 既存suiteを実行するlocal互換経路
- [ ] Batch 9: 日程確定のbrowser E2Eを導入
- [ ] Step 9-1. UI操作と永続化
- [ ] Step 9-2. UI失敗状態と境界
- [ ] Batch 10: Action/RPC認可とDBテストの証拠
- [ ] Step 10-1. UIの外側にある拒否と原子性
- [ ] Step 10-2. integration結果adapterと偽成功の解消
- [ ] Batch 11: 実行結果の厳密な照合
- [ ] Step 11-1. reporterと外部checker
- [ ] Step 11-2. fingerprintと実行入口
- [ ] Batch 12: 機能単位の保守的な変更選択
- [ ] Step 12-1. Git差分を固定して選択
- [ ] Step 12-2. executionGroupと選択結果の検証
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

- Batch 1コミット: 9a75a99（前提修正）、6af39ab（分類、data JSONを除く手書き466行）、35472b1（実行境界）。各commit hookのlint/typecheck成功。

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

変更候補: supabase/config.toml、supabase/migrations（追加のみ）。新規: supabase/seed.sql、docs/testing/e2e-environment.md。

固定CLIで空のlocal DBへ既存migrationを適用し、成功/失敗を記録する。管理外のpolicy/grant/extension/関数設定が必要なら、正規のschema取得手順で設定だけを確認し、必要最小限をversion管理へ戻す。現行クラウドの安全性を推測しない。migration追加は既存Supabase migrationスキルとCLI規約に従い、過去migrationの書換えや運用DBへの適用はしない。

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

