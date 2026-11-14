# 選択・収集処理の計測と解析共有の差分レビュー

対象: `f8070302` からの未コミット17コードファイル（新規4含む）。docsを除く全差分を3エージェント（Sol/medium）が独立レビューし、親が結果を照合した。

## 結果

必須指摘0、修正待ち0。レビューと局所測定は共通quality・最終headのHosted受入を代替しない。

| 観点 | 確認 |
| --- | --- |
| 規約・設計 | optional observerの既存API互換、Zod由来の計時型、static state identityに限定したprivate WeakMap、一回消費 |
| セキュリティ | root/入力digestだけで済ませずGit入口・package型/config・存在/realpath/列挙を実readで照合。非公開cloneで返却state改変を隔離 |
| バグ | 証拠欠落・不一致・再read例外でfresh解析。collector全終了待ち、用途別登録/台帳検査、legacy/plan、入力checkpointを維持 |
| 性能 | raw inventoryだけを共有。AST/Program/本文をcacheに保持しない。再読費用とstatic側の追加費用を総wallに含める |
| CLI UX | 固定schemaの診断、単調時計、同期/非同期span、observer例外が本来の結果や例外を上書きしない |
| UI/a11y | 製品UI、browserテスト、テスト層、既存例外の変更なし |

## 検証と限界

型・readonly Biome、対象9ファイル107テストが成功。実Git入口変更、依存型・継承/root config、負の存在照会、Story専用型、junction、偽state、独立clone、一回消費を確認した。

実repo各3回の準備wall中央値は268.310→248.802秒、19.508秒・約7.3%短縮。full plan/discovery/legacy/static/graph/effective選択は一致し、必須67/extras312を保持。collectionの再読証明は約30秒残る。ピークメモリ未計測、cache/別chat負荷は未統制で、Hosted改善率へ外挿しない。

測定harnessと比較スクリプトも独立監査した。追加ファイルでcoverageGaps/変更理由が増えるため、code・関連node/rule/caseと明示6ファイルのpath差を検証する。effective選択とPanda証明は厳密比較する。比較用スクリプトの初期誤判定を修正し、検証対象自体の基準を緩めていない。

独立所見と計測正本はignoredの `test-results/quality/planner-perf-final-*-review.md`、`planner-perf-measurement-review.md`、`planner-perf-comparison.json`。計画・残件は [実装計画](../plans/e2e-planner-performance.md)。旧間欠失敗、既存pending、coverageStatus=insufficientは維持する。

## 追加差分: streaming中の非表示ソート要素

共通qualityの初回はmobileのソート操作1件がstrict mode violationで失敗した。保存traceのhidden SSR断片と可視client要素の一時共存を独立調査し、`e2e/pages/sessions-page.ts` のDOM/CSS locatorを `getByRole('combobox', { name: '並び替え', exact: true })` へ変更した。可視の同じ利用者操作を特定し、元のURL assertion、件数、skip、待機条件は保持する。性能実装17ファイルに変更はない。

追加1ファイルの親レビューと独立レビューは必須指摘0。mobile単独診断 `efc1a58672b1` は57行（48成功/既存skip9）とcleanup completeを確認。全体ゲートは別IDで再実行する。初回の失敗記録は保持し、過去の原因不明な間欠失敗全体が解決したとは扱わない。

## 最終共通ゲートの照合

quality `d949a26337f3` / selection `610797372d45` / verification `7e293b181035` が成功。固定ID、base/head、selectionとverificationの参照、入力前後一致、全必須67/extras312、legacy330行（319成功/既存例外11）、6 DB cleanup・7 process終了/エラー0を独立照合した。unit91ファイル1,097成功/既存skip8、tools152ファイル2,232成功。full-requiredとcoverageStatus=insufficientを維持する。

終了後の専用ポート・当該worktreeのNode・実行中コンテナは0。性能17コードファイルは測定時からhash不変。最終headのHostedは通常commit/push後に別途検証し、PR本文で管理する。
