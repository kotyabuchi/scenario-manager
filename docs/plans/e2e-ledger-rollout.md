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
- PR作成・公開と実CI受入後の必須チェック設定は今回の実施指示に含まれる。運用DBの直接変更・デプロイは行わない。
- 既存のcloud接続を必要とする旧workflowをそのまま実行せず、公開前に実行境界を確認する。
- mainへのpushは現行Cloudflare workflowの本番デプロイを起動する。今回のPR作成・CI検証ではmergeを行わず、mergeとデプロイの扱いは具体的なPRと結果を揃えてから確定する。
- core437 / UI658の既存不足を成功扱いにしない。移行史の書き換え・無条件rebaseline・blanket skipは禁止。

## 進捗

- [x] Batch 1: フォント安定化
- [ ] Batch 2: PR分離と実CI受入
- [ ] Batch 3: 必須チェック設定
- [ ] Batch 4: 進捗・診断の改善
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

前提の実行で旧FABのmenuitemと旧GM操作のlink/buttonが現行UIと非互換だったため、PC/SP各3件の計6登録だけ本文の明示移行を行う。933原本と実行表のbytesは維持し、別の固定SHA付き対応表で登録キー・旧本文fingerprint・レビュー済み新本文fingerprintを照合する。登録・期待状態・注釈・他の本文変更は引き続き拒否し、receiptには旧/新の対応と実際に実行した新fingerprintを保存する。品質側は既存のreplacement18と元のspecを保持し、この前提専用の互換処理を品質ゲートへ持ち込まない。

レビュー時点のbase/headと依存関係を本文へ明記し、既存テストを共有DBへ接続しない。merge conflictは元worktreeに触れず専用checkoutで解消する。品質branchの既存bootstrap/UI移行祖先は履歴上に維持し、前提PRでのファイル配置が初回導入判定を壊さないことをfixtureで確認する。

### Step 2-2. hosted実行を完走させる

初回bootstrapの必要tupleを実SHAから計算し、外部設定と照合。各jobの固定SHA・attempt・collection・plan・checksum・cleanupを照合して実CIを受入する。部分job再実行で証拠を混ぜず、必要時はall jobsを再実行する。失敗は保持し、機密を含むraw log/trace/stateは公開しない。

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
