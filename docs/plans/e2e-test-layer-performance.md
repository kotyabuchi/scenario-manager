# テスト層の初期化と実行効率を改善する計画

## Context

開始SHAは `7226ebc`（既存worktree `e2e-ui-prerequisite/scenario-manager`、branch `perf/e2e-legacy-shards`）。PR #10はDraftを維持し、今回の改善を既存perfスコープへ追加する。本番マージは今回の実装・検証に含めない。

2026-11-08に[CI短縮の事例記事](https://zenn.dev/edash_tech_blog/articles/5b90aa33bd8d49)と[元のE2E戦略記事](https://zenn.dev/polyco/articles/26624b38c951b5)の本文を取得した。前者の準備コストの実測、後者の実装と確認対象の対応管理を組み合わせる。記事のVitest4.1・2CPU環境の設定を、そのままVitest3.2.4の現プロジェクトへ移さない。守る対象は件数だけでなく、各テストの責務、実SDK接続の拒否、DOM/Reactの後始末、Storybookのannotation/decorator、実runnerの証拠と合否である。

現在のpure unitは91ファイル（node35・unit-dom2・component54）で、実DB16ファイル（legacy11・verified5）は既に分離済み。jsdom56件は全てDOM/RTLを利用する。componentのうち19件は直接renderであり、Storybookを使う35件と同じannotations/a11y/preview/CSSの初期化を受けている。Batch1はこの適用範囲を整理し、DOMや検査を削らず、不要なStorybook初期化を減らす。

## 決定事項

| 項目 | 方針 | 理由 |
| --- | --- | --- |
| version/構成 | Vitest3.2.4、既存unit/unit-dom/componentの3projectを維持 | 設定移行と性能比較を混同しない |
| 対象 | 直接render19ファイルをunit-domへ一貫分類 | 同じDOM契約を軽量setupで維持する |
| setup | 共通light DOM setupを抽出し、unit-domとStorybook setupから参照 | jest-dom/必要polyfill/明示cleanupを共有する |
| portable stories | 35ファイルだけ既存annotations/a11y/preview/project.beforeAllを維持 | Storybook固有の意味を失わない |
| DBguard | vitest.setup.tsを全91ファイルへ適用し続ける | 分類移動を実SDK許可にしない |
| 実装順 | Divider/SessionTabsの2件で限定回帰後、19件全体の同等性・時間を比較 | 差分の原因を限定し、同じ集合で測る |
| worker/isolation | 現条件を維持 | pool/isolateやCPU事例の丸写しを避ける |
| 受入 | exactテスト集合・各責務・guard・cleanupを維持し、同条件のwallで評価 | 集計phase秒の短縮を全体改善と誤認しない |
| Git/公開 | Batchレビュー後に通常commit、最終headをPR10で検証 | 古いreceiptを新headの成功へ読み替えない |

## 前提条件

- 静的監査: `test-results/quality/next-perf-unit-audit.md`。直接render19件の正確な配列: `test-results/quality/next-perf-direct-files.json`。
- 現行HEAD/lockfile/version/runner/worker/cache条件を固定し、同条件のbaselineを親が取得する。shared Codex backendの他chat Nodeは停止しない。
- getTestProjectsの分類union107・pure91・DB11+5を固定する。19ファイルの内容・ケース・既存skipを変えない。
- Story非使用判定は直接import走査に基づく。移行時はtransitive依存とNext/Ark/nuqs等の実行条件も確認する。
- 本計画作成時点で実装変更・新規実行・性能受入は行っていない。

## Batch 1: テストの初期化・依存読込・CI生成処理を軽量化する

### Step 1-1. 同条件baselineと対象集合を固定する

対象19件を同じNode/Vitest/lockfile・4workers・result cache無効で、変更前後それぞれ3回計測する。総wallとVitestの各phaseを記録し、最初の実行と反復を区別する。OS/dependency cacheは消去せず、冷cacheの保証やworker集計からの推定をしない。共有PCの他チャットを停止しないため、負荷やキャッシュによる差の限界も記録する。全91件は品質ゲートで実行し、最終的なCIへの効果はHostedの同head/run/attemptで確認する。全case別CPU/RSSのための新基盤は追加しない。

file/fullTitle/repeatIndex/statusのexact集合を保存する。意図したproject移動は別表にし、project名以外のtest入替・追加skip・省略を禁止する。node35・DOM56・DB16という責務境界は変えない。

### Step 1-2. light DOM setupと明示分類を実装する

- 新規候補: `.storybook/vitest.dom.setup.ts`。jest-dom、ResizeObserver、Element.scrollTo、matchMedia、明示afterEach(cleanup)を現setupから移す。React act環境、global/polyfill等の挙動を変更しない。新しい不要なpolyfillは増やさない。
- `.storybook/vitest.setup.ts` はlight DOM setupを参照し、setProjectAnnotations（a11y+project preview）とproject.beforeAllを維持する。
- `vitest.config.ts` のunit-domはDBguard + light DOM setup、componentはDBguard + 既存Storybook setup。unitはDBguardのみを維持する。
- `testClassification.ts` は明示した直接render19件をunit-domへ分類する。DB manifest優先、未登録DB依存拒否、既存SpeedDial2件、glob escaping、一意性を維持する。`.test.tsx`全体をunit-domにする暗黙規則にはしない。
- まずDivider/SessionTabsの限定回帰でDOM契約を確認し、19件全体の同一集合とwallで採用を判断する。効果がなく移行コストを正当化できなければ再評価する。

**分類方式を固定する。** classifier内の `DIRECT_DOM_TEST_FILES` などの明示readonly集合へ、監査済み19のexact pathを登録する。拡張子やimport非存在だけから自動で軽量化対象を増やさない。集合への追加には「Story annotation/decorator/beforeAllを利用しない」という監査理由と依存確認が必要。実装時は静的な小さい配列/表を使い、新しい汎用manifest loaderや再帰import analyzerを作らない。

分類のたびに明示集合の重複・不存在・DB所属との競合を検査する。既存TypeScript依存で対象testの直接runtime import構文を確認し、`.stories` module、`@storybook/*` / `storybook/*` のruntime importを持つ対象はcomponentへ黙って残すのではなく分類エラーにする。import/export-from、literal import()/require()を対象にし、対象test内のnonliteral import()/require()も軽量化の可否を確定できないため分類エラーとする。type-only宣言は実初期化を伴わないので区別する。補助moduleまで辿る汎用graphは追加しない。

これにより、将来opt-in対象へ直接Story参照が追加された時はannotations欠落のまま実行せず、明示集合から外してcomponentへ戻すか、依存設計を見直す必要がある。transitive helperが後からStory機能を読み込む変更までこのdirect guardが自動証明するわけではない。その変更は依存レビューと実collection/traceで監査する。将来その保守負担が大きくなった場合だけ別案を検討し、今回過剰な分析器へ拡張しない。

light setup適用によってunit-domの既存useSpeedDialのcleanupも明示化される。現状はRTL auto cleanupがglobal hooks検出に依存するため、Storybook削除と同時にcleanupを失う設計を避ける。共有setupが二重登録されないことを確認する。

### Step 1-3. 安全条件を維持し残17件へ展開する

2件の限定回帰が確認できたら、次表の依存条件を確認して19件全体で検証する。最終分類はunit35/unit-dom21/component35、pure91とDB11+5は同じ。

| 残17対象 | 必ず維持する依存/観測 |
| --- | --- |
| Combobox | Ark popup/listbox、userEvent、waitFor、portal/focusとDOM cleanup |
| Select | Ark listbox/option/key navigation/scrollTo。既存Enter skipは新規救済や削除をせず理由/状態を保持 |
| DatePicker | parseDateとlocale、popover/calendar、日付選択、focus、observer/scroll系 |
| FileUpload | File/FileListと入力イベント、drop/selection、DOM固有API |
| RadioGroup | 選択/disabled/keyboard/focus、変更callback |
| NumberInput | 数値入力、spinbutton/keyboard、変更callback |
| Slider | range表示、値/keyboard、focus/observer、DOM query |
| SideMenu | 既存next/navigation・context・useDiscordAuth・ScenarioRegisterDialog mock、認証分岐と開閉 |
| GlobalHeader | 同じNext/context/auth/dialog mock、navigationと認証分岐 |
| AuthPromptDialog | dialog/portal/close、認証導線、callback |
| FilterPanel | NuqsTestingAdapter、即時draft→URL、debounce取消、400ms後の再反映防止。timer変更は別案へ |
| ScenarioFilters | NuqsTestingAdapter/useFilterDraft、URL/履歴/タグ・範囲条件の双方向反映 |
| ScenarioDetailPanel | AuthPromptContext、localStorage.clear、レビュー/動画/section/async表示、状態間隔離 |
| ScenarioDetailHead | 既存fixture/DOM見出し・メタ情報・リンク属性 |
| ParticipantsSection | SessionPhases分岐、参加者role/表示条件、実fixture |
| ScenarioSearchModal | 既存actions mock、fake timers、検索debounce/async、タイマー復元、modal cleanup |
| MemberSearchInput | 既存searchUsersAction mock、fake timers、検索debounce/async、タイマー復元 |

NextmockやDBguardが不要になったとみなして外さない。fixture/Supabase error/状態遷移を成功固定するmockを追加して移行を通さない。Storybook35側はannotation・decorator・beforeAllを残す。

### Step 1-4. exact集合・契約・性能を受け入れる

初回比較では19件のwall中央値91.361→89.306秒と差が小さく、setup集計よりcollection集計が大きかった。したがって採用判断の前に、実importが多い `@phosphor-icons/react/ssr` だけを[Vitest v3のweb optimizer](https://v3.vitest.dev/config/#deps-optimizer)へ明示登録する小実験を追加する。node/DB用ssr optimizer、アプリのimport、モック、worker/isolationは変更しない。初回bundle生成を含む実行と反復を分け、同じ19ケース集合で差を確認する。効果がなければこの設定は戻す。採用する場合は全91件でReact/Storyとの互換性も確認し、設定変更を追加レビューする。

CI準備も固定ログを確認した。run42448751791 attempt1、planner job128633218929では `pnpm install --frozen-lockfile` 内でroot prepare/Panda生成が成功した後、明示 `pnpm prepare` が再度実行されていた。後者のstepは2.514秒。共有setupからこの重複stepだけを除去し、installのlifecycle・失敗判定・frozen lockfileを維持する。削除後のHostedでPanda生成が残ることを確認し、2.514秒を削除後の実測短縮量とみなさない。

分類テストは19件のexact所属、旧SpeedDial2件、DB11/5とmock境界、未知/重複/欠落/外部path/動的route escapingを検証する。opt-in対象の不存在は基準repo回帰で検出し、一般classifierは対象を持たない最小repoでも使用可能に保つ。全unitの固定件数は今回の受入記録へ保存し、通常のテスト追加を恒久的に拒否する条件にはしない。opt-in対象へStory import/re-export/literal dynamic import/requireを加えた反例、nonliteral import/requireを加えた反例、type-only参照との区別も確認し、setup欠落を黙認しない。既存の実setup反例でSDK client/constructor/SSR/wrapper経由が通信前に拒否されることを維持する。テスト集合はfile/title/repeatIndex/statusで比較し、意図した19件のproject差だけを許容する。

ledgerのprofileはapp/isolated/storybook/integrationであり、unit/unit-dom/componentはvitest.config.tsのquality前段projectである。qualityChecksは同configの全91を走らせるため、今回の分類だけで必須67/extras312のキー変更は不要。integration configとintegrationVerifiedFilesはgetTestProjectsを共用するので、DB集合が一切変わらないことを確認する。新setupも固定入力snapshotと変更選択が捕捉することを確認し、unknown-input救済で省略しない。

改善は全unit wallとCI planner wallに基づき判定する。setup/collect/environmentのworker集計はwallへ足さず、phase改善だけで性能を確定しない。効果が曖昧なら成功試行数と条件を記録し、改善率の確定を保留する。

### Review Checkpoint: Batch 1

- [x] formatting後、担当全ファイルのreadonly Biome/型が成功
- [x] pure91と意図した分類移動、DB11+5分離が一致。移動19件のexact case集合を9試行で比較
- [x] 既存skip、DOM/keyboard/async/タイマー/Nextmock/DBguardの責務を維持
- [x] light DOM cleanupとportable-story annotationsをnativeで確認
- [x] 比較可能なbaseline/candidateのwall・phase・試行数と測定限界を記録
- [x] 固定比較元の共通qualityが成功し、owner process/port/containerを回収
- [x] 未コミット差分をreview-diffでレビューし、必須指摘0を確認
- 通常commit/push後の最終head/run/attemptのHosted gate・artifactの独立照合結果は、[PR #10](https://github.com/kotyabuchi/scenario-manager/pull/10)の本文に記録する。受入結果の文書追記だけでCIを再起動し続けない。

## ファイル一覧

### 新規ファイル

| ファイル | 用途 |
| --- | --- |
| `.storybook/vitest.dom.setup.ts` | 軽量DOM matcher/polyfill/明示cleanup |
| `scripts/e2e/domSetup.test.ts` | 実setupのeffect購読・DOM・portal・root containerのcleanup回帰 |

### 変更ファイル

| ファイル | 変更内容 |
| --- | --- |
| `vitest.config.ts` | unit-domにlight setup、既存3project維持 |
| `.github/actions/setup/action.yml` | installのprepareを保持し、重複する明示Panda生成を除去 |
| `.storybook/vitest.setup.ts` | light部分を共有しportable annotationsを保持 |
| `scripts/e2e/testClassification.ts` | 直接render19件の明示分類 |
| `scripts/e2e/testClassification.test.ts` | exact対象と従来DB/escaping境界 |
| `e2e/ledger/impact-rules.json` と既存selection回帰 | 新setup単独変更も共通テスト基盤として明示選択 |
| `docs/testing/e2e-quality.md` | project責務/測定と同一集合の説明 |
| 本計画 | 受入・測定結果と残件を記録 |

Vitest version/lockfile、unit91の製品テスト本体、DB schema/fixture、runner receipt schema、CI shard境界は変更しない。変更が必要になればBatch範囲を再評価する。

## 検証方法

同一checkoutで静的分類unionとJSON登録集合を保存し、pilot/19件/3project全体の順で実行する。Vitest3.2.4の実対応CLIを確認してからproject指定とreporterを選ぶ。

```powershell
pnpm test:e2e-tools scripts/e2e/testClassification.test.ts scripts/e2e/domSetup.test.ts scripts/e2e/selection.test.ts
pnpm test:unit --project unit-dom
pnpm test:unit --project component
pnpm test:unit --project unit
pnpm quality:changed --base <固定した比較元SHA>
```

測定中の入力変更、旧receiptの流用、worker aggregate秒のwall換算を禁止する。runner/DB/browserを起動した検証は所有ID/PID作成時刻に限定して後始末し、共有backend/別chatのNodeを一括終了しない。旧shadow inconclusiveやcoverageStatus=insufficientはsetup変更で消さない。

## 残件

調査結果に基づく次の順序。間欠失敗の原因は未確定のままであり、高速化によって解消済みにはしない。単独診断入口は前Batchで修復・受入済み。

| 優先順 | 作業 | 具体的な完了条件 |
| --- | --- | --- |
| 1・ローカル受入済み | 本Batchの初期化分離・SSRアイコン読込・CI重複生成除去 | 複数回実測と共通quality成功。新headのHosted結果はPR本文で管理 |
| 2・plannerローカル受入済み | planner/runnerの不足区間だけ計測 | [選択・収集の内訳と解析共有](e2e-planner-performance.md)は各3回で中央値268.310→248.802秒。共通quality・独立照合が成功し、新headのHostedはPR本文で管理。runnerのDB準備/cleanupは残件 |
| 2a・CLIローカル受入済み | CIのCLI導入・確認の通信待ちを除去 | [固定CLIの導入・版確認](e2e-cli-performance.md)は制御proxy・共通quality・独立照合が成功。新headのHosted結果と工程時間はPR本文で管理 |
| 3 | SessionFormの下位保証と単体の重複を整理 | 実空送信→resolverの2エラー＋submit未呼出を追加し、同一最小送信2件をpayload検証1件へ統合。errors配線切断で失敗を確認 |
| 4 | E2E統合・層移管の台帳契約 | 現1:1移行とは別に旧identity/assert→保持先・層・実行証拠を保存。未実行先や無断skipを拒否。契約完成前にbrowser削除しない |
| 5 | 実際のE2E統合 | 検索のtitle/card/countを実検索journeyへ集約、直URL復元2→1、セッション成功2→1を小Batch化。実API/DB/Next/authの接続を保持 |
| 6 | 固定500ms待機の置換 | bannerはvisible→hiddenの遷移を待つ。投票は楽観表示とmutation完了を区別し、成功後の状態保持・失敗rollbackを先に検証 |

元の330件は分割時の同等性条件。将来件数を減らす場合も過去receiptは変更せず、新しいbase/headと旧→新対応を受け入れる。検索Storyのin-memory fixtureは実API paginationの代替ではない。投票一覧にはprops更新とstate保持の不整合が疑われるが、未再現のため確定バグとは扱わない。

Batch1の独立計画レビューは必須指摘0。新setupの共通影響ルール登録と、preview CSSを外す際のvisibility検査の意味確認を追加した。後者は現在のVitest CSS設定と代表検査を確認し、既存DOM保証を失わないことを根拠付きで記録する。

| 候補 | 状態/着手条件 | 維持条件 |
| --- | --- | --- |
| toolsの重い初期fixture/実process区間 | 親が別auditを統合、Batch未確定 | fresh正本/改変反例/所有cleanupを保持 |
| Test SDK guard importOriginal削減 | import traceで支配的と確認してから | constructor/SSR/wrapperの拒否と必要exports保持 |
| portable previewのCSS/viewport等整理 | Storybook側の意味と実costを確認してから | annotation/decorator/a11y/visual挙動を保持 |
| FilterPanel等のreal timer削減 | 独立した責務変更として評価 | debounceキャンセル/遷移後assertを保持 |
| 重複assert/代表ケース整理 | 個別の失敗検出同等性が確認できたものだけ | 件数削減を同一集合高速化と混同しない |
| worker/pool/isolation/shard | 初期化軽量化後に必要性を再測定 | Vitest3.2.4対応、isolation/guard維持、別条件比較 |
| 記事のDB prepare/clone等 | 親が既存証跡と追加auditを統合 | DB所有境界/権限/receipt/cleanupを弱めない |

## Batch 1の局所計測（2026-11-08）

Windows、Node24.12.0/Vitest3.2.4、同じ19ファイル、4workers、result cache無効。lockfile SHA256は `3562982316d5a030417acbd05d698ef6a7298dc2039ccdaa6e3f4f6cd98921ce`。OS/dependency cacheを消さず、条件ごとに3回ずつ実行した。別チャットの負荷は制御していない。

| 条件 | 1回目wall | 2回目wall | 3回目wall | 中央値 |
| --- | ---: | ---: | ---: | ---: |
| 変更前 | 130.463秒 | 90.343秒 | 91.361秒 | 91.361秒 |
| DOM初期化分離のみ | 94.964秒 | 88.251秒 | 89.306秒 | 89.306秒 |
| 分離＋SSRアイコンのbundle | 47.951秒 | 46.479秒 | 45.498秒 | 46.479秒 |

9試行すべてで161成功・既存skip1、file/ancestor/title/fullName/statusの重複を含む集合が完全一致した。製品テスト本体は変更していない。最後の条件は新しいoptimizer cacheの生成を初回に含み、その後は再利用。中央値差44.882秒・約49.1%はこの19ファイルの局所観測であり、CI全体や全91ファイルの改善率ではない。初期化分離だけの差2.055秒は小さいため、大幅改善の根拠としない。

Vitestのcollect集計は変更前3回目189.62秒、bundle2回目26.21秒だった。worker間で重なるためwallへ加算しない。実cache metadataでもbundle対象がSSRアイコン入口だけであることを確認した。全91件・共通quality・新headのHosted受入は別途記録する。

独立レビューは3エージェント（Sol/medium）と追加2ファイルの追補で必須指摘0。分類39件、選択25件、実DOM/portal/effect cleanup2件、代表DOM7件は成功。合否とタイミングの原本は `test-results/quality/next-perf-*-acceptance.json`、詳細ログは同directoryのprivate logに保存した。

## Batch 1のローカル受入

固定base/head `7226ebca24c922772409779c66edb300f76c2bde` から、quality `8f47e4741403` / selection `e1decc1deddb` / verification `3a319ff5e0fb` が成功。unit91ファイル・1,097成功/既存skip8（Vitest duration49.21秒）、tools150ファイル・2,216成功（201.00秒）。lint・型・全体台帳も成功した。

保存した成果物を独立に再照合し、必須67・extras312、legacy330行（319成功・既存例外11）、6 DB cleanup complete、7 stageのprocess終了/エラー0を確認。input digestは前後とも `a4c4585bdda9e219d84d5914baf623cdb6a9e849c960299c78cb37cd5c5eaf24`。共通ゲート全体のlocal wallは1,844.94秒であり、局所ベンチの49.1%をこの時間へ外挿しない。

終了後の所有quality process、専用5ポートのlistener、running containerは0。Docker Desktopや別チャットのNodeは停止していない。`coverageStatus=insufficient`、旧integration未実行、既存pendingは維持。今回非再現だった旧間欠失敗の原因が特定された意味にはならない。
