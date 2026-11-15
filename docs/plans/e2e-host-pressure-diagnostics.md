# Supabase start 中のホスト負荷診断

## 目的と範囲

Hosted の DB 作成前に繰り返し観測された長い時間窓について、同時期のホスト全体の CPU counter と I/O pressure の変化を補助証拠として記録する。Linux で既存 CLI timing が有効な場合のみ、所有する `supabase start` の直前と実 close 後、command 計時が確定した後に固定用途 reader を各 1 回起動する。close から読取までの遅れは公開窓に含め、即時観測とは扱わない。Windows や無効時は起動しない。既存の image pull timing、テスト、cleanup と成功条件は変えない。

reader は固定された `/proc/stat` と `/proc/pressure/io` のみを各 65536 bytes まで読む。許可する aggregate CPU 8 counter と CPU ID 群、PSI `some` / `full` の total だけを小さい JSON で親に渡す。CPU ID は前後比較のみに使い、公開しない。guest は重複加算せず、iowait を idle と合算しない。親は 2 点の差分のみ公開し、欠測、値の不正、counter 減少や CPU 構成変更は該当値を unknown（null）にする。

公開する `cpuTicks` の順序は user、nice、system、idle、iowait、irq、softirq、steal。`ioSomeUs` と `ioFullUs` は PSI total の差分（マイクロ秒）。割合は計算しない。start を原点とする親の単調時計で reader 呼び出しごとの開始・終了と子 close の時刻を記録する。各 read 窓には起動・終了処理が含まれ、正確な kernel 取得時刻ではない。既存 `environment-start-command` の測定には前後 reader の待ち時間を含めない。前後 read 窓はそれぞれ観測に要した時間を示し、その合計は観測オーバーヘッドの目安である。外側の environment-start 時間は診断待機を含むため、従来値と単純比較しない。

## 所有と失敗

`process.execPath` と固定 script を shell なしで既存 command runner に渡す。各 reader の 2 秒は abort 開始時刻であり、runner の終了確認を待つ。必要なら既存の猶予後 SIGKILL を所有 child にだけ要求する。OS の割り込み不能状態を含む絶対終了時間は保証しない。runner は既存の 16 MiB 出力上限を維持し、reader 自身も出力を小さく制限する。timer と abort listener は終了時に解除する。close callback は時刻を同期記録するだけとし、command 計時確定後に post reader を起動して終了を待つ。診断の欠落や失敗は start の結果、元エラー、cleanup に影響させない。

公開値は固定の数値、null、状態 enum のみとし、proc の生文、path、PID、例外や環境変数は公開しない。状態は取得の成否を示し、各 read の timeout / cancelled / invalid / unavailable は原因の断定ではない。新規 pull、daemon 設定変更、権限昇格は行わない。

## 解釈と検証

これらはホスト全体の累積 counter の差であり、特定 image の展開、daemon の I/O、CPU 飽和の証明にはならない。並列 workload、取得窓のずれ、runner 差の影響を受ける。転送と展開の内訳も識別できない。過去 artifact に値を補完しない。

固定 fixture による正常差分、欠測、reset、CPU 構成変化、異常入力、非 Linux・無効、中断、deadline 後の実 close 待ちを限定テストする。実 Hosted の受入では、2 read 窓と安全な値のみが公開されること、既存 gate と cleanup が変わらないことを別途確認する。Docker Desktop の新規起動や共有環境の変更は行わない。

この親時計の原点と既存 supabase start timing の原点は別々に取得するため、両系列をミリ秒単位で厳密に重ねる較正はない。相関を読む際は各窓と未較正の差を考慮する。

2026-11-15 限定検証: host pressure・environment probe・command runner の 3 ファイル 71 テスト、`pnpm typecheck`、変更対象 4 ファイルの Biome readonly 検査に成功。Linux の実 proc と Hosted 実行による受入は未実施。

最終差分では reader 直接テストと GHCR retry parser を含む関連6ファイルをまとめて再検証し、107テストと対象 Biome が成功した。先の71件・24件と重複するため合算しない。固定 commit 後の Hosted Linux 実 proc・CI 受入は別途確認する。

追加検証: reader entry の `node:fs` だけを fixture 化し、固定 path・実 parser・出力を直接検査した。通常 kernel 形式、guest、CPU 欠落/重複/巨大値、PSI の欠落/重複/不正、65,536 bytes 超、例外・sentinel 非公開を確認。observer 側の安全整数超過と PSI reset を含む 24 件、typecheck、対象 Biome が成功。本物の Linux proc と Hosted 受入は引き続き未実施。
