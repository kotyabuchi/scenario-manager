# CIのCLI導入・確認の待ち時間を削減する

## Context

固定比較元は `3afd4384d68a660cf448cf74ce3f032e87ea9024`。既存の専用worktree `e2e-ui-prerequisite/scenario-manager`、branch `perf/e2e-legacy-shards` で実行する。PR #10はDraft・未マージを維持する。2026-11-14のユーザー指示により、CLIの待ち時間の原因調査と改善を行う。

直近の成功CI run42473579677 attempt1は23分1秒。前回run42460832272の16分7秒より長い。mobileのsetup-cliは4→157秒、native版確認は1→16秒。checking-cli→lockingも未認証0.522→106.364秒へ増加した。これらは区間観測であり、153秒すべてをnpmや更新確認へ帰属させない。

## 調査結果と採用方針

- 両runのsetup-cliは同一SHA `689adcfb80d947100a1eab127289b97d1fb07b13`。Bunは両方cache hit。155秒はnpm metadata/install/内部version確認をまとめたaction本体内にあり、詳細ログは残っていない。
- 固定CLI 2.75.0の `--version` は版表示の後で毎回GitHub releases/latestを同期照会し、通常の10時間cacheを無視する。専用の更新確認無効化flag/envはない。CLI v3へは更新しない。
- 所有する一時cwdに `supabase/.temp/cli-latest` を用意した `--help` は同じバイナリの版文字列を表示し、通常cacheにより更新通信を行わない。child cwdを明示し、`--workdir` の早期help処理には依存しない。
- 1.5秒遅延する所有loopback proxyで実験した。`--version` はcache有無とも1回接続し、版表示後にも待った。cacheあり `--help` は接続0・155ms・exit0で `Supabase CLI 2.75.0` を確認した。元のHosted106秒がすべてこの通信だったとの断定はしない。
- CI Ubuntuの導入は、固定版の公式release archiveを取得し、公開SHA256照合後に所有temp領域へ展開する小さいactionへ置換する。npm metadata/installとaction内部の `--version` を経由しない。downloadには時間上限を設け、取得・照合・展開・版確認を分けて記録する。今回binary cacheは増設しない。
- 版確認はnative実体の `--help` による厳密一致と正常終了を必須にする。終了前に成功にせず、kill後のstdoutだけで成功にしない。固定版の内部cacheに依存することを明記し、版変更時に再検証する。
- 通常start/statusの通知通信も、所有する新規テストworkdirだけに同じcacheを準備して除外する。共有checkoutのcache、認証、DB/migration、Docker Desktopには変更を加えない。

## Batch 1: 固定CLIの導入と確認を安定化する

### Step 1-1. 根拠と計測条件を固定

公式v2.75.0 source、実行されたsetup-cli SHA、Hostedのログ/metadata、制御proxy実験を記録する。archiveの公開checksumsとasset digestを照合する。既存actionが設定するregistry等の副作用を確認し、必要な設定を維持する。

### Step 1-2. 版確認と導入を修正

所有temp cwd/cacheの準備、native版確認、終了後のcleanupを共通helperへまとめる。誤版・不正出力・実行失敗・abort・cleanup失敗は拒否する。ローカル、単独診断、共通ゲートとも同じ確認を使う。

CIのrelease取得は固定Linux/amd64に限定し、任意入力をURL/pathへ連結しない。digest不一致、想定外展開結果、非native実体ではPATHへ追加せず失敗する。既存permissions、テスト集合、owner lock、close待ち、cleanup、receiptの合否を維持する。固定名と数値だけの計時にし、環境変数・資格情報・例外本文を公開しない。

### Step 1-3. 回帰・レビュー・受入

限定回帰とnative実験を行い、整形・型・独立レビューの後に `pnpm quality:changed --base 3afd4384d68a660cf448cf74ce3f032e87ea9024` を実行する。必須67/extras312、legacy330行（319成功・既存例外11）、固定入力、6 DB cleanup・7 process終了を照合する。通常commit/push後に新head/run/attemptのHostedを独立照合し、導入・確認区間と全体時間を分けてPR本文へ記録する。

### Review Checkpoint

- [x] 固定版sourceと制御proxyで更新通信の挙動を確認
- [x] 公開archive digestと既存action副作用を確認
- [x] 誤版・通信・失敗・abort・cleanup境界の回帰（Linuxのinstaller実行はHostedで受入）
- [x] 共通qualityと独立レビュー

通常commit/pushとHostedの最終結果はPR #10本文で管理する。

## 範囲と残件

このBatchではNode/CLIのmajor更新、binary永続cache、テスト数削減、品質閾値変更、本番反映を行わない。各runのVM/ネットワーク条件は統制されていないため、既存23分1秒との差をすべて本修正の寄与にしない。runnerのDB準備・cleanup計測、解析readの重複、製品テスト整理、旧間欠失敗の原因調査は別の残件。

## 調査成果物

ignoredの `test-results/quality/cli-perf-upstream-audit.md`、`cli-perf-setup-audit.md`、`cli-update-probe-Zm7lnD/observations.json`。一次根拠は [CLI root.go](https://github.com/supabase/cli/blob/v2.75.0/cmd/root.go)、[release.go](https://github.com/supabase/cli/blob/v2.75.0/internal/utils/release.go)、[実行されたsetup-cli](https://github.com/supabase/setup-cli/blob/689adcfb80d947100a1eab127289b97d1fb07b13/src/main.ts)。

## 実装と局所検証（2026-11-14）

公式公開checksumsファイル自体のSHA256 `552acadbb0972eae2aa58db168af7be0080c4a684447f83ece934a452f7d5dee`、当該archiveの公開行/asset digest/実downloadのSHA256 `e5597462f865d5ac72af0453358e37ecb0d85962ad6914a114a53de847303bde` を照合し、supabaseが単一通常fileであることを確認した。既存actionのregistry非空値保持・未設定時ghcr.ioを維持する。

共通helperを制御proxy下で3回実行し、169 / 168 / 163ms、外部向け接続0、正常終了・cleanupを確認した（`cli-update-probe-gHDALK/observations.json`）。同じharnessの `--version` はcache有無とも接続1、stdout後に設定した1.5秒を待った。人工的な遅延の除去を、Hostedの短縮率や旧遅延の全原因へ読み替えない。

ローカルnative CLI入口も339msで成功。限定7ファイルは95成功、Linux専用Bash fixture6件はWindowsのためskip。CIと同じ計時有効条件でも再実行し同件数で成功した。型とreadonly Biomeが成功。3エージェント（Sol/medium）の独立差分レビューは必須・推奨指摘0。詳細は [差分レビュー](../reviews/diff-review-2026-11-14.md)。

## ローカル全体受入（2026-11-14）

固定base/head `3afd4384d68a660cf448cf74ce3f032e87ea9024` の未コミット入力で、共通quality `cb0b5fd765f0`、selection `cebbb975b8a7`、verification `14f701f828e6` が成功。各receiptを独立に照合し、必須67・extras312、legacy330 unique行（319成功・既存例外11）、6 DB cleanup・7 process終了/エラー0、入力digest前後一致を確認した。実装12ファイルは開始時hashから変更なし。

全unit91ファイルは1,097成功・既存skip8。tools156ファイルは2,263成功、Linux専用installer fixture6件はWindowsのためskip。CIと同じ計時条件の限定回帰、型、readonly lint、独立レビューも成功。Linux fixture6件と実installerを含む新headのHosted結果・最終タイミング比較はPR #10本文で管理する。

共通quality内のCLI版確認6回は281 / 165 / 169 / 170 / 153 / 155ms（中央値167ms）。child起動から終了・temp cleanupを含む区間であり、CLI単体のCPU時間ではない。全体qualityのwallは1,743.828秒で、これを過去のHosted wallと比較しない。
