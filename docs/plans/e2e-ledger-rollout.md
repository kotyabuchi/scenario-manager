# 品質ゲートの実運用導入と継続改善

## Context

2026-11-06、全14 Batches / M4完了後、ユーザーから「フォント安定化→PR・実CI受入→必須チェック→運用改善・重要フローの検証拡張」の順で実施する指示を受けた。専用worktreeとbranchは継続利用し、開始HEADを `d31688a2ea70a8c93ca2df092999558b3228b487` に固定する。

mainに未公開の前提UI等232コミットが含まれるため、ユーザーに公開範囲を確認し「前提のUI等を別PRに分けて段階導入」を選択済み。前提の境界は `b4c824e604e0e69da0e6e37f4a6bf60db83e71dc`。元worktreeの未コミット変更は取り込まない。追加調査で旧CIが共有Supabaseに接続すると分かったため、ユーザーは前提PRにローカルDB・認証・後始末の実行基盤を含める分割を承認した。前提PRを単独で検証可能にし、後続PRへ自動抽出・core/UI台帳・変更選択・品質ゲートを残す。

## 決定事項

| 項目 | 方針 | 理由 |
| --- | --- | --- |
| フォント | `@fontsource-variable/noto-sans-jp@5.3.1` を固定して共通CSSから配信 | Google応答形式によるbuild失敗を除き、unicode-range分割と日本語の自由入力を維持 |
| Next | 16.1.6と既存interception patchを維持 | フォントだけのためにルーティング・build基盤まで変更しない |
| PR | UI＋ローカルテスト実行基盤と、自動抽出・台帳・品質ゲートを分離 | 前提PRも共有DBを使わず単独で検証可能にする |
| CI | GitHub hostedでplan・両shard・aggregate・fixturesを受入 | WindowsのCI相当結果とは区別する |
| bootstrap | 実際のPR base/head/baseline digestに固定 | 初回導入だけを許可し、head更新時は再照合する |
| 必須check | 実CI成功後に `E2E verification gate` を設定 | 成功未確認のcheckで先にマージを塞がない |
| 性能 | 内容一致を証明した解析結果だけを再利用 | checkpoint・未知変更のfallback・結果照合を維持する |
| 最初の検証拡張 | セッション参加申請と申請取消の一組 | 認可・永続化・UIの経路を小さい単位で検証する |

## 前提条件

- 同じ専用worktree、Sol/medium（単純調査はLuna/medium）のsubagent設定を使用する。
- PR作成・公開と実CI受入後の必須チェック設定は今回の実施指示に含まれる。2026-11-06、両PRのCI受入後にユーザーが段階マージと本番デプロイを明示承認した。運用DBの直接変更は行わない。
- 既存のcloud接続を必要とする旧workflowをそのまま実行せず、公開前に実行境界を確認する。
- mainへのpushは現行Cloudflare workflowの本番デプロイを起動する。承認された順序は、PR #6をmergeしてデプロイを確認し、PR #7をmain向けに再検証・必須check設定してからmergeする。履歴を保つmerge commitを使用する。
- core437 / UI658の既存不足を成功扱いにしない。移行史の書き換え・無条件rebaseline・blanket skipは禁止。

## 進捗

- [x] Batch 1: フォント安定化
- [x] Batch 2: PR分離と実CI受入
- [x] Batch 3: 必須チェック設定
- [x] Batch 4: 進捗・診断の改善
- [ ] Batch 5: 同一入力の解析再利用
- [ ] Batch 6: 参加申請・取消の検証拡張

## Batch 1: フォント安定化

### Step 1-1. ローカル配信へ統一

依存を正確なversionで固定する。アプリとStorybookが共有するglobals.cssへfont CSSと既存CSS変数を設定し、next/font/googleの呼出・class・Vitest mockを除く。weight400/500/600/700、swap、preloadなし、任意の日本語の表示を維持。ライセンス・package provenance・配信サイズを記録する。

### Step 1-2. 本番buildと表示を受入

font packageのunicode-range・参照asset・hashを確認し、アプリとStorybookでGoogle通信なし、同originのwoff2取得、400/700と日本語表示を検証する。通常writerで台帳を更新し、固定比較元に対するquality:changedを通す。初期不足の増加を検出した場合は理由を解消し、baselineを増やして通さない。独立レビュー後にコミットする。

## Batch 2: PR分離と実CI受入

### Step 2-1. 前提変更と品質基盤を別PRにする

最新mainとの履歴・差分、前提境界、remote既存PRを確認し、前提UI等のPRと品質基盤のPRを作る。前提PRには既存の検証済みローカルDB構築・認証fixture・所有資源の後始末・legacy runnerを再利用し、実行に必要なDB復元修正とUI/locator修正を取り込む。旧E2Eの共有資格情報参照をなくす。core/UI契約、ソース自動抽出、変更選択、品質ゲートは後続PRに残す。

前提PRでは4 projectの330登録を実行し、319成功と既存skip9/fixme2を正確な登録キー・期待状態で照合する。品質PRでreplacement扱いの18登録もこの時点では実行する。別枠のdeferred-live18件は330登録の外であり、成功数に含めない。登録の入替え・新規skip・cleanup不足を成功扱いにしない。legacyだけの登録基準はこの実行基盤に含める。

前提の実行で旧FABのmenuitemと旧GM操作のlink/buttonが現行UIと非互換だった。後続の未実行ケースにも旧日程URLとダイアログを閉じるボタン名が残っていたため、PC/SP各5件の計10登録だけ本文の明示移行を行う。933原本と実行表のbytesは維持し、別の固定SHA付き対応表で登録キー・旧本文fingerprint・レビュー済み新本文fingerprintを照合する。登録・期待状態・注釈・他の本文変更は引き続き拒否し、receiptには旧/新の対応と実際に実行した新fingerprintを保存する。品質側は既存の契約登録済みreplacement18のspecを保持し、この前提専用の互換処理を品質ゲートへ持ち込まない。

レビュー時点のbase/headと依存関係を本文へ明記し、既存テストを共有DBへ接続しない。merge conflictは元worktreeに触れず専用checkoutで解消する。品質branchの既存bootstrap/UI移行祖先は履歴上に維持し、前提PRでのファイル配置が初回導入判定を壊さないことをfixtureで確認する。

### Step 2-2. hosted実行を完走させる

初回bootstrapの必要tupleを実SHAから計算し、外部設定と照合。各jobの固定SHA・attempt・collection・plan・checksum・cleanupを照合して実CIを受入する。部分job再実行で証拠を混ぜず、必要時はall jobsを再実行する。失敗は保持し、機密を含むraw log/trace/stateは公開しない。

初回公開の比較元にはUI台帳がなく、固定v1祖先から現在までにはフォント依存・Panda入力の変更がある。この経路だけ、外部bootstrap承認後に固定導入コミット `36ee35030c757d6492b9ca4283dabf166609f811` の独立した依存環境で、v1祖先 `8bbfed403163222a566589e56f4c83854219e56f` からの旧CLI検証を再生する。実行はLinux plannerの所有プロセス群に限定し、終了・scratch回収後の証跡を既存 `plan/static.json` に保存する。現在の移行記録は導入時の記録と同一であること、UI不足は導入時の保存集合から増えないことを検査する。静的証跡から導くdigestをmanifestに結び、後段の両shard・集約でも固定Gitと外部承認を照合する。通常の依存変更・Panda由来の検査条件と移行原本は変更しない。

## Batch 3: 必須チェック設定

### Step 3-1. 設定と検証

対象ブランチの既存ruleset/branch protectionを取得して保全し、成功したcheckの正確な名前と提供appを照合して必須化する。既存制約を消さず、設定後のread-backとPRのcheck状態を確認する。

## Batch 4: 進捗・診断の改善

### Step 4-1. 準備段階の状態を可視化

static-ledger、collection、selectionの進捗をpublic receiptとCLIへ反映する。表示callbackの失敗で所有processの後始末を中断しない。

### Step 4-2. UI不足エラーを具体化

新規不足のentry/site/codeを上限付きで表示し、詳細artifactへの導線を出す。秘密や巨大なソース断片を出さず、既存拒否条件を維持する。関連fixtureと共通品質ゲート、独立レビューを通す。

## Batch 5: 同一入力の解析再利用

### Step 5-1. 再利用条件を固定する

base/head/indexの内容・configが同一の場合に限りinventory/TypeScript Programの重複構築を抑える。異なる入力を共有しない否定fixtureを追加し、graph/台帳digestと選択結果の同一性を確認する。所要時間・メモリを測定し、改善率を事前に約束しない。

## Batch 6: 参加申請・取消の検証拡張

### Step 6-1. 契約と専用fixtureを追加

applyToSessionActionとcancelApplicationActionを対象に、主体別の成功・匿名/第三者拒否・永続化・再取得・取消後の状態を契約化する。deferred-liveの外部サービス18件とは別の新規検証である。

### Step 6-2. UIとintegrationの証拠を接続

既存Playwrightで参加申請・取消の代表フローを登録し、Action/RPCの認可証拠と別に照合する。該当不足だけを退役し、static・runtime・shadow・cleanupを通す。契約に対応しない既存不足やlive外部サービスを検証済みに昇格しない。

## ファイル一覧

| 区分 | 主な対象 |
| --- | --- |
| フォント | package.json、pnpm-lock.yaml、src/app/layout.tsx、src/app/globals.css、.storybook/preview.ts、.storybook/vitest.setup.ts、src/styles/tokens/fonts.ts |
| CIと設定 | .github/workflows/test.yml、.github/actions/setup/action.yml、scripts/e2e/ci*.ts、必要なGitHub設定 |
| 進捗・性能 | scripts/e2e/runChangedVerification.ts、prepareChangedVerification.ts、snapshotInventory.ts、surfaceMigration.tsと関連fixture |
| 新規契約 | e2e/ledger/contracts・scenarios、e2e/isolated、integrationの限定対象、生成台帳 |
| 記録 | docs/testing・docs/reviewsと当計画 |

## 検証方法

各Batchで変更に必要な限定検査→共通quality:changed→独立レビュー→小コミットの順に進める。変更500行/15ファイルの上限を超える場合は分割し、生成台帳は手書き差分と区別する。runtime中は入力を固定する。CI公開物は既存の安全なJSON許可リストだけとし、秘密設定やログ全体を添付しない。

## 再起動前の引継ぎ（2026-11-06）

以下は停止時点の履歴。追加調査で旧ポートとCodexの外向き通信の衝突を特定し、ユーザー指示により再起動を前提としないポート修正へ変更した。新しい方針は [専用ポート](../testing/isolated-runtime-ports.md) を参照。

- 品質worktree: `C:/Users/kabocchi/.codex/worktrees/e2e-ledger-plan/scenario-manager`、branch `feat/e2e-ledger-quality-gates`、HEADは開始時の `d31688a`。フォント・Pandaレビュー済みdigest・生成inventory・文書は未コミットで保存済み。
- 前提PR worktree: `C:/Users/kabocchi/.codex/worktrees/e2e-ui-prerequisite/scenario-manager`、branch `feat/ui-local-test-prerequisite`。HEAD `b097926e43f06c6cae79bdbe3392aeac66694d2d` はUI境界と最新mainのmerge。既存UIの型エラー修正も含め、lint/typeのpre-commitを通過した。ローカル基盤・CI・UI/DB復元修正はその後の未コミット差分として保存中。
- フォントの最終共通検査 `0ad74512480e` はlint/type/unit（1090成功・既存skip8）/tools（1919成功）/静的台帳を通過。selection `bf498c47aad7`、runtime `34094ee37ef8` は最初のintegration環境のlock取得時に失敗し、実行ケース0件。入力digestは前後一致、core baseline437も変更なし。成功receiptとして扱わない。
- 原因はIPv6の57320〜57322をCodexアプリのプロセスが保持していること。診断時PID47636、`codex.exe`。`57320` の予約は `EADDRINUSE`。専用DBコンテナとlockファイルは0であり、アプリのプロセスは強制終了していない。
- 前提側のguard付き登録列挙は933原本と一致（348登録・登録済みcase 0・setup 0）。deferred-live18を除く330件の実行は再起動後。静的suiteはlint/type/unit/tools93件まで通過し、その後のreview修正は限定検査する。
- 前提の必須review指摘は、specと旧台帳の同時書換えによる実行義務の減少。`legacyBaseline.ts` が933の2 Git blobのSHA-256を固定して入口でbyte照合する修正を追加し、否定を含む4件が成功した。DB/ブラウザのruntimeは未実行。
- 前提側のreview修正後はlint/typeと基盤テスト97件がすべて成功。確定日程ActionのError実体返却をplainなmessageへ統一し、内部例外を固定文言へ変換する4件の限定unitも成功した。修正前のunit全体は1090成功・既存skip8。フェーズ一覧のfocus ring指摘は既定outlineの抑制が確認できず、任意の表示統一へ分類しコードは変更していない。
- 2026-11-06のfetch後、GitHub developとUI境界の差は226コミット・1215ファイル、ローカルdevelopとUI境界は84コミット・862ファイル。ベースをdevelopへ変えてもUI差分は残る。ユーザーは比較を質問しただけで、PR対象ブランチの変更は指示していない。
- まだpush・PR作成・required check設定・merge・デプロイは行っていない。

再開時は専用ポートの解放を確認し、品質worktreeのフォント共通検査とapp/Storybookの実ブラウザ表示を先に完了する。次に前提worktreeのreview修正を再確認して、330件のlocal-only E2Eとcleanupを検証する。両worktreeで同じ専用ポートを使うためruntimeを並列実行しない。登録基準は前提で `e2e/legacy/`、品質branchで `e2e/ledger/` に置く。品質branchの933とUI移行祖先を保持するため、後の統合はmergeを用いる。

補助記録は各worktreeの `test-results/quality/` にある。品質側の `rollout-font-*`、前提側の `prerequisite-runtime-reuse.md`、`prerequisite-pure-unit.md`、`prerequisite-review-{a,b,c}.md` を参照する。秘密を含み得るraw runtime logは公開しない。

## ポート衝突修正の受入（2026-11-06）

Codex再起動を待つ手順は撤回し、固定値を `e2e/isolatedRuntime.ts` でDB27320–27322 / Next23100 / Storybook6007へ集約した。Windows/Linuxの既定動的帯へ戻る変更、サービス間・開発ポートとの重複を回帰テストで検出する。実行前の空き検査、所有権確認、cleanupは従来どおり。

- 前提側: run `3b766562c503` で新ポートのmigration復元・catalog一致・cleanup complete。基盤104件成功。
- 品質側: run `777e5d611b7c` で同じ復元・照合・cleanup成功、Next23100の追加予約も成功。関連29 files / 452件成功。
- 両側: lint・型検査・最終ポート方針7件成功。品質側AGENTS再生成・同期確認済み。
- Codex PID47636の旧57320–57322/HTTPS接続は前後で存続。再起動・強制終了・OS設定変更なし。
- 独立監査で両runのcontainer/network/volumeとlock、新ポートの残留は0。別プロジェクトの既存network/volumeは所有外なので変更していない。
- Sol/mediumの3観点レビューで必須0。前提Storybookの定数参照、開発用ポートリスト、説明範囲の推奨は反映済み。

今回の受入はポート設定と環境ライフサイクル。新ポートでのNext/Storybook実ブラウザ検証・前提330件・共通品質ゲート全体はまだ未実行で、従来の失敗receiptを成功へ読み替えない。次はフォント共通検査と実ブラウザ、前提全E2Eの順。補助フォント観測スクリプトの接続先も23100へ同期済み。

## Batch 1 完了（2026-11-06）

品質 `6c5123d3f35f`、selection `68edd8578cad`、verification `6e083d43a729` が成功。比較元/開始HEADは `d31688a`、必須55件成功・旧E2E312登録・7 stagesを照合した。lint/type、unit1090成功＋既存skip8、tools130 files/1926件、静的台帳、所有資源のcleanupも成功。core不足437とUI不足658は引き続き未解消として扱い、coverageStatus=insufficientを維持する。

本番build後のStorybookとアプリで日本語400/700の実描画を確認し、ローカルWOFF2を各28/22件取得、Googleフォント通信0。フォント観測の旧/login参照は現行の公開トップ/へ修正して再確認した。証跡は品質run別 `font-acceptance.json` と画像に保存済み。Codexを再起動せずに全段階を通過した。

前提PR側では、公開前の確認で見つかった保護ページ3件の古い/login redirectをトップ/へ揃えた。限定回帰3件とtypecheck成功。既存の前提unit全体1094成功＋skip8とは実行時点を区別する。前提330登録のE2Eを次に受入する。

## Batch 2 実CI受入の途中経過（2026-11-06）

- [前提PR #6](https://github.com/kotyabuchi/scenario-manager/pull/6): base main、head `f835e025bfc00a2dae88056f46b49dff8d3d64a6`。hosted run `42169840430` / attempt 1で静的検査・4 project・集約が成功。330登録を319成功・既存skip9/fixme2として照合し、所有資源の回収も完了。Ubuntu 26.04のブラウザ非対応はブラウザjobの24.04固定、Modal/Selectのfocus前キー操作はfocus待機で修正した。
- [品質PR #7](https://github.com/kotyabuchi/scenario-manager/pull/7): baseは前提feature branch。祖先を保持して統合した `d3b9ab82257c1142155d99bd798fcf679cf1ea5a` のローカル全件品質ゲート `70ce295a66cf` が成功。unit1097成功＋既存skip8、tools1960成功、必須55成功・extras312登録を照合。終了後のcontainer/network/volume/lockと専用portの残留は0。
- 品質PRの初回hosted run `42173880293` / attempt 1は失敗。Windows fixturesと初回UI移行の静的検査で停止し、両runtime jobは未実行。成功扱いにしない。
- Windowsの短縮TEMPでは通常のrealpathが8.3 aliasを残すことを再現し、fixtureの作成・所有cleanup比較をnative realpathへ統一した。本番の物理root検査は維持し、通常TEMPの64件と実際の短縮TEMPで関連145件・型検査が成功した。
- 初回移行は上記の固定履歴再生で対応中。PR #7の新しいheadに対する全hosted jobの成功後にBatch 2を完了する。mainへのmerge、デプロイ、必須check設定はまだ行っていない。

履歴再生はLinux実機で成功し、独立した旧CLI実行とsnapshot・baseline・移行記録・pendingの各digestが一致した（snapshot `405f781b18d08229dd9247264295c86dc717351e13b66ab810ba69c09c8f2228`）。親側の依存を探索させないため旧checkoutはプロジェクト外の所有一時領域へ置き、Gitの警告は判定用stdoutから分離した。実機の中断検査でも所有する親・子・process groupの消滅を確認し、一時領域を回収した。これは固定旧移行の検証結果であり、現在のPR全体のhosted成功とは区別する。

実PR条件で、公開baseには台帳がないため既存の契約変更記録2件が新規の無関係な移行と判定されることも確認した。検証済みの導入コミットを契約・旧test・移行履歴の継続比較元にし、導入時に新設したUI契約の実行条件も保護する。公開base側に既存台帳がある曖昧な状態は置き換えず拒否し、通常baseの比較条件や履歴原本は維持する。

## Batch 2 完了と本番反映の承認（2026-11-06）

品質PR #7のhead `84f1201c9cd1d6a777e539cf4d2d48dbc7fb01ea`、base `f835e025bfc00a2dae88056f46b49dff8d3d64a6` に対する [hosted run 42182265275](https://github.com/kotyabuchi/scenario-manager/actions/runs/42182265275) / attempt 1は全6 jobsが成功した。Ubuntu/Windowsの各364 fixtures、planner、required、legacy-local、集約を受入。必須55成功・旧E2E312登録と7 stagesの終了・cleanupを照合した。既存skip9/fixme2は成功数に含めず、core437/UI658の不足を維持する。

取得したplan・両shard・集約成果物を実際のrun/attempt・固定Git・外部承認で独立に再検証し、集約receiptと完全一致した。manifest digestは `02cda10d33ea2a4e501be0e63908d56a94d4f605a83aa761803057ca280431ad`、required verificationは `2835845cb3ff`、legacy-localは `8208d967f061`。前提PR #6も前述のhosted runで受入済みで、両PRをready for reviewにした。

ユーザーは両PRの段階マージと本番デプロイを承認した。PR #6は `a270fbdbd7bc23844ead4ad551732d6f6046aa14` でmainへmerge済み。Cloudflare deploy run `42186359422` を確認中。品質PR #7はこのmainを祖先として取り込み、承認tupleとbaseを更新して全hosted jobsを再検証する。旧base向けの成功を新base向けの成功として読み替えない。必須checkの設定とPR #7のmergeは新base向け受入後に行う。

## Batch 3と段階デプロイの完了（2026-11-06）

PR #7はmain `a270fbdbd7bc23844ead4ad551732d6f6046aa14` を取り込んだhead `eb13ff3a133e47b1623c77fdee7530fa5a9da187` で再検証した。[run 42186792136](https://github.com/kotyabuchi/scenario-manager/actions/runs/42186792136) / attempt 1の全6 jobsが成功し、固定Git・実run/attempt・外部承認と取得artifactの独立再集約も一致した。必須55成功・extras312登録、manifest digest `5b51dc7e7b4d5244a16e7402c93c4eb7f0d8064e3bff1b3f8f79f379fea81fd0`。core437/UI658の不足は維持する。

既存保護を取得した上で、[ruleset 26680579](https://github.com/kotyabuchi/scenario-manager/rules/26680579) をmainに限定して有効化した。必須checkは `E2E verification gate`、提供appはGitHub Actions（15368）、最新baseとの一致を必須とし、bypass actorは設けない。設定のread-backとPR #7のrequired check成功を確認し、通常mergeでmain `0b14ff2b5924d6b34f942561d9e573a85f6cd6e2` へ取り込んだ。mergeの両親とtreeは受入済みheadに一致する。

- PR #6の[deploy 42186359422](https://github.com/kotyabuchi/scenario-manager/actions/runs/42186359422)成功。Worker version `0831654b-e004-46a3-8299-814a035b47d2`。
- PR #7の[deploy 42189940136](https://github.com/kotyabuchi/scenario-manager/actions/runs/42189940136)成功。Worker version `2110c96a-61bd-4dd3-8a34-15318959fce8`。
- 両デプロイ後に匿名の実ブラウザでトップ・シナリオ一覧・既存詳細のHTTP200と日本語フォントを確認。同origin WOFF2を21件取得し、Googleフォント通信0。画像付きカードを観測できなかったため、R2サムネイルの本番受入までは主張しない。

初回main pushの[run 42189940054](https://github.com/kotyabuchi/scenario-manager/actions/runs/42189940054)は未受入。attempt 1は旧PR用承認値を取り込んで起動した。正しいpush tupleを設定して全jobsを再実行したattempt 2・3も `CI_STATIC_LEDGER_FAILED` で停止し、runtimeは未実行。PRの成功と本番デプロイ成功を、このpush CIの成功へ読み替えない。

固定main、Node24.12.0/pnpm10.33.0、独立Linux環境で実push条件の準備全体は成功し、旧移行の固定digestも一致した。一方、別の試行はPanda段階で失敗した。正常終了後約57msで消える子プロセスを旧終了監視が誤拒否する問題は実processで再現し、250ms以内の自然終了を待つ候補を検証した。GitHubで同じ原因が発生したかは未確定であり、候補と安全なCI診断は別の限定修正として進める。

## Batch 4 完了（2026-11-06）

準備開始、static-ledger、collection、selectionのレシートを段階ごとに保存してから任意表示を行う。親の品質レシートと最終JSONにrun別パスを追加した。UI不足は識別子・既知診断コードを10件まで表示し、詳細全件は成果物へ保存する。任意例外の公開、既存不足の増加、承認・cleanup条件の緩和は行わない。

レビューで見つかった必須4件と推奨6件を修正した。必須保存の通知失敗、stderrの非同期EPIPE、browserとevidenceの取り違え、起動とcleanupの両失敗、fixture cleanupの非throw incompleteを回帰で検証した。Sol/mediumの3観点再レビューで残件0。

品質 `bfdcba603dcb`、selection `00240fce47fb`、verification `91020b7ccbec` が成功。検証時の固定比較元・HEADは `0b14ff2`、その時点の未コミット25ファイルが対象。lint/type、unit1097成功＋既存skip8、tools140 files/2013成功、必須55成功・旧E2E312登録・7 stagesとcleanupを照合した。入力digestは前後 `6f2b5f4aa79354e2b9f175183c4d0ce2df6c966cf0838d87bdd737f2b34bcfa7` で一致する。全件選択のためshadowの重複実行はない。core437/UI658は依然insufficient。

検証済みコードは `04ccf3c`、`0899c5c`、`28d4fa0`、`66c2b8e`、`6f4cc49` の5つの小コミットへ依存順に分割し、通常hookを通した。次は終了監視とCI診断の限定修正を確認し、Batch 5の同一入力再利用、Batch 6の申請・取消へ進む。

独立受入でも入力ファイルのbyte一致、28 checkpointsの差分0、全stageのexit0・process終了を確認した。6環境のcontainer/network/volume、記録された11個のlock、専用5ポートの残留は0。調査用Linuxコンテナと専用snapshot imageも、ID・ラベル確認後に回収した。他プロジェクトの資源とCodexのプロセスは変更していない。

## 履歴再生とCI診断の限定修正（2026-11-06）

正常close後だけ250ms・50ms間隔で同じprocess groupの自然消滅を確認する。実Linuxで自然終了は約52ms・停止信号なしで成功、期限超過は停止後も失敗、猶予中の中断も停止確認後に失敗した。終了未確認時のscratch保持は維持し、修正候補で固定旧移行の全proofが従来と一致した。

固定12工程と6失敗区分だけを既知の例外型から読み、plan/static-ledgerのsafe failure JSONへ任意追加する。任意のmessage/cause/stackや模倣オブジェクトは診断として公開しない。Linuxの既存policy fixtureには固定履歴の実再生を追加し、固定保存物とproof・前後HEADを照合する。今回のJSON保存後に出すmarkerがある場合だけ安全な結果1ファイルをuploadする。古い結果が残る保存失敗も成功へ昇格させない。

関連8 files/79 tests、型検査、Biome、actionlintが成功。3観点レビューの必須1件（保存失敗時の古いartifact公開）も修正・再確認済み。コードは `9f65acb`、`7f5072f`、`0cea6dd`、`345f0a8` の4コミット。GitHubの実履歴checkと全hosted gateはこれから確認し、旧attempt 2・3の実原因が同一だったとは断定しない。
