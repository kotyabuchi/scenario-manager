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
