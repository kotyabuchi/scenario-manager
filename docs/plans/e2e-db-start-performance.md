# CIのDB初回起動の内訳と高速化

## Context

2026-11-15のユーザー指示を受け、専用worktree `e2e-ui-prerequisite/scenario-manager`、branch `perf/e2e-legacy-shards` を継続する。固定比較元は `b860ea2b4400de3f9f53e2d4150b77c927aa824f`。PR #10はDraft・未マージを維持する。

直前の成功run43586046676 attempt1では `environment-start` がrequired/desktop/mobileの初回120.000/129.336/111.308秒、各jobの2回目26.075/24.876/24.886秒だった。6環境すべて新規所有volumeを作成し、cleanup済み。初回差をすべてpullと断定せず、内部の境界を追加計測する。

## 一次調査

固定CLI v2.75.0は必要imageをDocker Composeで並列pullし、取得後にDBを起動する。現configとexcludeではpostgres/kong/gotrue/postgrest/storage-apiの5種が対象。不要サービスの除外と並列pullは既に実施済み。health timeout短縮やhealth無視は高速化策にしない。

CIのsetup actionはGHCRを指定していたが、`localCommandEnvironment` の許可リストが `SUPABASE_INTERNAL_IMAGE_REGISTRY` を落としていた。したがって変更前の実startはCLI既定ECRを使う経路だった。計測baselineはこの現状を維持し、候補では指定を通過させて先読みと実startの取得先を一致させる。registry変更と処理の重ね合わせの寄与は混同しない。

根拠: [CLI start](https://github.com/supabase/cli/blob/v2.75.0/internal/start/start.go)、[DB start](https://github.com/supabase/cli/blob/v2.75.0/internal/db/start/start.go)、[サービス選択](https://github.com/supabase/cli/blob/v2.75.0/internal/utils/config.go)、[Compose pull](https://github.com/docker/compose/blob/v2.40.3/pkg/compose/pull.go)。CLI v3の変更は本件へ取り込まず、2.75.0を維持する。

## Batch 1: 内部計測と初回待ちの削減

### Step 1-1. 安全な境界計測

所有marker/configの確認、更新cache準備、CLI commandを分離する。CLI stderrの既知の固定マーカーだけを単調時計の経過として記録し、任意ログ本文・path・資格情報を公開しない。chunk分割・CRLF・ANSI・過大入力・重複・時計/出力障害を扱い、観測障害で本処理やclose待ち・cleanupの意味を変えない。markerのない区間を推測で補わない。

### Step 1-2. 原因を確認して改善

Hostedで初回と2回目の各段階を比較する。image取得が支配的なら、必要5種だけの事前取得を独立した準備処理と重ねる案を優先評価する。前の直列stepへ時間を移すだけの変更は改善としない。Docker image cacheはrestore/load費用も含む実測が必要な別候補とし、DB volume/dump再利用は行わない。

### Step 1-3. 回帰・レビュー・受入

限定回帰、型、readonly lint、独立レビューを実施する。計測用の中間commitは限定検証後のHosted調査に用い、Batch完了とは扱わない。最終実装は `pnpm quality:changed --base b860ea2b4400de3f9f53e2d4150b77c927aa824f` を通し、必須67・extras312・legacy330行、入力一致、6 DB cleanup・7 process終了を独立照合する。Hostedは同head/run/attemptで成果物を再検証し、前後の全体wall・準備区間・job時間和を分けてPR本文に記録する。

## 制約

テスト集合・既存例外・品質閾値・migration・CLI版を変えない。Docker Desktopを起動停止せず、今回所有するテスト資源とLSPだけを後始末する。原因未確定の接続間欠失敗は保持する。別VM・cache・負荷の差を今回の変更の因果効果として断定しない。

## 計測追加のローカル確認

`e2e:environment:check` の2回新規復元が成功した。run `639deb8b3f97` / `5ca3c95c9581` はmigration・catalog照合・cleanupが成功し、両環境とも資源残留なし。readyを含む8到達点を各1回確認した。証跡はignored `db-start-instrument-reproduction.json` / `db-start-instrument-local-timing.json`。

imageが既にあるローカルでのcommand時間は29.519 / 27.855秒。開始→databaseは0.260 / 0.273秒、database→schemaは10.992 / 10.605秒、schema→globalsは6.065 / 4.394秒、プロジェクトmigrationは0.281 / 0.277秒、health→readyは10.119 / 10.129秒だった。初回image取得がないWindows観測であり、Hostedのcold時間の説明にはまだ使わない。

## 改善候補

`localCommandEnvironment` はimage registryの1変数だけを保持し、共有DBの接続先・資格情報・任意Nodeオプション等の除外を維持する。GHCR経由の新規復元 `5435beeef680` / `7cb90b3041cb` もmigration/catalog/cleanupが成功した。固定5imageについて取得済みECRとGHCRのローカルimage IDはすべて一致した（同一内容の観測で、将来の可変tagまで保証するものではない）。ローカルの既存layerを共有するため、これをcold取得の速度比較には使わない。

候補wrapperはChromium導入と、固定CLI/PG17に対応する5imageの先読みを同一プロセス内で並行する。別registry・対象外OS/archは先読みをskipする。ローカルDocker socketを検査し、存在するimageはpullしない。先読みは120秒上限、通常の取得失敗は既存CLIへfallbackする。Chromium失敗・取消は全childを中断し、全closeを待つ。別stepへ背景プロセスを持ち越さない。

直前runのChromium導入は各19秒だったため、重ね合わせの短縮上限の目安は約19秒。registry変更と合わせた効果は新規runner上のwrapper＋start、全体wall、job時間和で比較する。保存imageはローカル展開でpostgres約5.41GBなど大きく、tar cacheの保存/復元費用を未計測のまま追加しない。

## Hostedの計測基準

計測のみのhead `0c7f6d917ba7d1d7de7f6f9df91c45c664bea541`、run43666801186 attempt1で全7jobが成功した。各jobの順序はrequired / desktop / mobile、単位は秒。

| 区間 | 初回3job | 同jobの2回目3job |
| --- | --- | --- |
| command全体 | 67.386 / 67.284 / 66.888 | 24.325 / 24.315 / 24.320 |
| command開始→database（取得・config等） | 39.734 / 39.075 / 38.378 | 0.042 / 0.038 / 0.037 |
| database→schema（DB起動・health等） | 14.500 / 15.117 / 15.387 | 11.164 / 11.149 / 11.148 |
| schema→globals（内部schema等） | 1.568 / 1.550 / 1.558 | 1.579 / 1.551 / 1.552 |
| migrations→seed（project migration） | 0.103 / 0.101 / 0.101 | 0.101 / 0.103 / 0.100 |
| containers→health | 0.420 / 0.385 / 0.409 | 0.381 / 0.415 / 0.427 |
| health→ready | 11.052 / 11.048 / 11.047 | 11.050 / 11.050 / 11.047 |

初回は元観測111〜129秒を再現せず約67秒だった。旧runの内部計時がないため、その全時間を後からpullに帰属させない。今回のcold/warm差では取得前段が主に増えており、migrationの高速化は優先しない。marker間の未掲載区間もあるため表の合計をcommand全体と扱わない。正本はignored `db-start-hosted-baseline-timing.json`。

基準runのChromium導入stepはrequired29秒、desktop/mobile28秒。初回commandとの非重複区間の合計は96.386 / 95.284 / 94.888秒だった。全体wall801秒、job時間和2,002秒。6組のartifactをdigest・ファイル集合まで確認し、未変更の計測用コミットで必須67・extras312・legacy330行・6 DB cleanup・7 process終了を独立に再検証した。

## 候補のローカル全体受入

quality `6357a31f1a2b` / selection `b9dccdb760e3` / verification `3e7e64304bec` が成功。baseは本計画の固定比較元、実行headは計測用 `0c7f6d9` の未コミット候補。unit91ファイル1,097成功/既存skip8、tools158ファイル2,309成功/WindowsのLinux専用skip6。候補の3観点レビューは必須・推奨0（[レビュー](../reviews/diff-review-2026-11-15-2.md)）。

前回成功 `7b454032703a` とplan全項目が一致し、必須67・extras312・legacy330 unique行（319成功・既存例外11）、入力前後digest一致、6 DB cleanup・7 process終了/error0を独立照合した。実装10ファイルのhashは開始時から不変。今回の全体再実行は接続間欠失敗なく完了したが、過去の間欠失敗の根本原因解消とは扱わない。

所要1,871.496秒はローカル全体検証の観測で、CIの短縮値には使わない。正本はignored `db-start-quality-acceptance.json` / `db-start-quality-pins.json`。候補headのHosted受入結果と性能比較はPR #10本文に保存する。

## GHCR候補の実測と取得先の調整

head `b8e77f223bedc086e0a558051ae614b9985c3655`、run43670799178 attempt1は全7job・重複検査が成功し、6artifactのdigestと必須67・extras312・legacy330行・6 DB cleanup・7 process終了の独立照合も成功した。しかし準備＋初回commandはrequired70.268秒、desktop122.839秒、mobile126.981秒で、基準96.386 / 95.284 / 94.888秒に対し後2jobが退行した。

全5imageの先読みは成功しfallbackなし。PostgreSQLのpullは42.736 / 96.740 / 100.754秒、Chromiumは約39.2 / 29.7 / 31.7秒。DB startは25.268 / 24.839 / 24.981秒へ短縮したが、待ちを含めると一律の改善ではない。全体wall820秒・job時間和1,948秒であり、planner等の変動も含むためこれだけで採用しない。旧111〜129秒もimage取得の変動で説明できる可能性はあるが、旧runの内部計時がないため断定しない。

次の候補は、従来の実startが使っていたECRを3workerの共通job envで明示し、先読みの固定5imageもECRに揃える。setupは指定済みregistryを保持するため、他jobの既定値は変更しない。registry環境変数の継承、並行化、timeout/fallback、取消・終了待ちは維持する。GHCRが常に遅いと断定する変更ではなく、取得先を基準と揃えて並行化を評価するための調整である。

registryとworkflow指定だけの追補は限定回帰・readonly lint・型検査・YAML解析・独立レビュー後に、最終headのHosted全体検証とartifact独立照合を実施する。直前候補のローカル全体受入と最終headの検証を混同せずPR本文に併記する。
