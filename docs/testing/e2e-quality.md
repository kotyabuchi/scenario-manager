# 品質ゲートの実行とCI

開発規約の正本は `.claude/rules/testing-patterns.md`。この文書は実行、成果物、導入時の設定を補足する。

## ローカルでの実行

編集とPanda生成を終えてから実行する。比較元は開始時にcommit SHAへ固定される。

```sh
pnpm quality:changed --base HEAD
pnpm quality:changed --base <base-ref> --all
pnpm quality:changed --base <base-ref> --no-shadow
```

処理順は `check:ci` → `typecheck` → `test:unit` → `test:e2e-tools` → M1全体静的検査 → 変更選択とrunner実行 → unique成果物の独立照合。`check:ci` は書き換えず、整形は事前に `pnpm check` で行う。品質前段の各段階と実行終了時に入力・Git snapshotの不変性を確認する。

既定では部分実行に加えて全件shadowを行う。`--no-shadow` は関連実行の限定的な結果である。`--all` や全件fallbackでも、未移行領域まで検証した意味にはならない。実行範囲、未検証領域、NoOpの条件は [変更選択の仕様](e2e-selection.md) を参照。

前提はNode 24.12.0、pnpm 10.33.0、Supabase CLI 2.75.0、local Docker、Playwright Chromium。共有cloud資格情報は不要。専用環境の詳細は [環境と復旧手順](e2e-environment.md) にまとめている。

## staged hook

`pnpm e2e:ledger:staged` はGit index stage 0の台帳JSONだけを読み、schema・ID・参照を検査する。working treeの未stage修正で不正なindexを救済しない。競合・symlink・検査中のindex変更を拒否する。

通常の `git add <paths>` → `git commit` を使う。別の `GIT_INDEX_FILE` を使うpath限定commitは `ALTERNATE_INDEX_UNSUPPORTED` で失敗する。このhookはtestの実登録・型・sourceとの対応を保証しない。PR前とCIの全体ゲートが必要である。

## CIの判定

`.github/workflows/test.yml` が全イベントを扱う。各jobが固定SHAをcheckoutしてから共通setupを呼ぶ。token権限はcontents readのみで、共有Supabaseのsecretsを渡さない。

| イベント | 静的比較 | runtime |
| --- | --- | --- |
| PR → main/develop（段階導入中は明示した前提ブランチも可） | eventのbase。変更影響は一意なmerge-base | 選択required＋固定smoke＋desktop/mobile全件 |
| push → main/develop | event.before | 全required＋desktop/mobile全件 |
| schedule | default branchのイベントSHA自身 | 全required＋desktop/mobile全件 |
| workflow_dispatch | 選んだrefのイベントSHA自身 | 全required＋desktop/mobile全件 |

scheduleは日曜18:30 UTC（月曜03:30 JST）。欠落・不正なイベント、shallow history、HEAD不一致、複数merge-baseは失敗する。pushでbeforeがzeroまたはGit objectとして存在しないときは、静的診断の `historicalComparison` が `unavailable` になる。beforeが存在しても比較元にbaselineが未導入なら `baseline-not-introduced` と記録する。いずれもpush専用の外部承認 `E2E_LEDGER_BOOTSTRAP_APPROVAL` が必要で、event、repository、ref、before、head、現行baseline digestを実行ごとに照合する。破損・非commit・Git実行失敗を不存在扱いしない。

初回PRでbaseにbaselineとlegacy目録の両方が未導入なら、既存M1の外部承認 `{base, head, digest}` を必要とする。承認されたHEADに含まれる固定祖先 `933c68933c82578e54019f5ca924fbaafcd8c08b` の目録を使い、祖先関係とsmokeキーの固定digestを各jobで検査する。manifestに由来を残し、初回は全requiredへ広げる。一方だけの欠落、承認不一致、origin不在、同数のキー入替えは失敗する。このPR承認をpushの別tupleへ流用しない。承認値の登録は本実装では行わない。

実行は次のjobに分ける。

1. `planner`: 共通品質前段、M1、全登録収集、変更選択、閉包、分割manifestの作成。
2. `fixtures`: Windows/Linuxでイベント・抽出・変更選択・分割契約を検査。
3. `e2e-required`: manifestの非app必須登録を実行。
4. `e2e-legacy-desktop`: `chromium`／`chromium-auth`を専用local DBで順に実行。
5. `e2e-legacy-mobile`: `mobile-chrome`／`mobile-chrome-auth`を別のHosted runnerで順に実行。
6. `e2e-aggregate`: 全job結果と各成果物を独立に再照合する必須check。

各workerも全登録を再収集し、head・workflow run/attempt・入力・全plan・全collectionがplannerと一致したときだけ起動する。legacyは各165件（必須9・extras156）、合計330件を実行し、deferred18件は実行結果として拒否する。projectごとのDB・seed・Next build・process・cleanupは共有しない。

CI manifest／envelope／aggregateはversion 2の固定3shard（required・legacy-desktop・legacy-mobile）を使い、旧legacy-local tupleや互換aliasを受け入れない。集約は欠落・余分・重複、failure/cancel/skip、別head/run/attempt、verification IDや環境owner IDの再利用、required失敗、未回収を拒否する。legacy stageの検査済み結果は必須とし、同HEADの実行正本、共通report、現/置換元fingerprint、既存skip理由、全結果の和集合を再照合する。ローカルの全4project実行と単体診断の入口は変更しない。

失敗したworkflowを再実行するときはActionsの **Re-run all jobs** を選ぶ。失敗jobだけを再実行すると、新しいattemptに成功済みjobの成果物がないため照合できない。

PRの固定smokeはStorybookの `scenario-search-reset` と `e2e/smoke.spec.ts` のchromium/mobile各7登録。後者は静的比較元のexact key集合とも照合し、同数の別testへの入替えを通さない。閉包後にowner境界で分け、app必須18とlegacy extras312を混同しない。2026-11-07の全件時は非app必須49＋app必須18＋extras312、計379の物理登録になる。既存skip/fixme11件はextras内の承認済み例外であり、必須67件の成功とは分ける。

## 成果物と合否の限界

`test-results/quality/changed.json` は最新サマリー。根拠は `test-results/verification/<qualityId>/quality-receipt.json` と、そこから参照する独立verification IDの `plan.json` / `receipt.json` / `inputs-start.json` / `inputs-end.json` である。

CI公開artifactは `test-results/ci/plan`、`required`、`legacy-desktop`、`legacy-mobile`、`aggregate` の指定JSONと既存の固定履歴検査結果だけを保存し、保持期間は7日。artifact名はGitHub run IDとattemptを含む。各shardは別IDを持ち、全件実行した一つのreceiptに偽装しない。

取得時は `e2e-plan-<runId>-<attempt>`、`e2e-required-<runId>-<attempt>`、`e2e-legacy-desktop-<runId>-<attempt>`、`e2e-legacy-mobile-<runId>-<attempt>`、`e2e-aggregate-<runId>-<attempt>`、`e2e-surface-history-<runId>-<attempt>` のexact名で別directoryへ保存する。両legacyはそれぞれenvelope／plan／receipt／inputs-start／inputs-endの5 JSONを使う。別attemptやlatestの成功で欠落を補わない。

CIコマンドが失敗すると、Actionsログに段階と固定エラーコードを出す。分かる場合は品質チェック名、検証ID、指摘件数、後始末状態も含む。後始末の `complete` は全stageの資源解放を照合できたことを示す。`unknown` には未起動のstageや証拠不足が含まれ、資源の残留は確定していない。その実行で新規保存できた `failure.json` だけを成功判定の成果物と分け、別名のartifactで7日保存する。

private log、認証state、DB接続情報、raw trace、`test-results` 全体はアップロードしない。調査用traceは所有runのローカル成果物として扱う。JSONのchecksumは別実行の取り違えを防ぐもので、改ざん不能な署名ではない。assertionの意味、未移行テストの網羅、業務要件の完全性は別途レビューする。

## GitHub設定

必須status名は **E2E verification gate** を維持する。旧 `Static Ledger Gate` は統合済み。2026-11-07の読み取りではmain ruleset `26680579` がactiveで、GitHub Actions（integration ID 15368）の同checkを要求し、最新mainへの追従も必須、bypassは空だった。今回の分割では設定を変更しない。

PR #9未マージの段階導入ではbase `perf/e2e-tools` をworkflowとPRイベントschemaの両方へ固定追加する。未知branchと同branchへのpushは許可しない。PR #9マージ後、後続PRをmainへ切り替えて再検証する際に、この一時許可を削除する。

## M3の受入結果（2026-11-05）

code HEAD `fe7a8cd0bb8f6864052e7077fe32e8e78d4d3018` で次を確認した。ローカルの証跡索引は `test-results/quality/batch13-acceptance.json`。

- `quality:changed --base HEAD --no-shadow`: 品質前段、M1、変更選択、Storybook 1件、独立receipt再照合まで成功。検証用の一時コメントは元のbytesへ復元した。部分実行の結果であり、shadowの成功は主張しない。
- WindowsのCI相当実行: 合成PRイベントでplanner、required、legacy-local、aggregateが成功。必須55/55、追加legacy312登録は301成功・既存例外11件。合計367登録中356成功。品質前段はunit 1090成功・既存8skip、tools1813成功。
- 成功した実artifactのコピーに対する7つの否定検査: 必須test/jobのskip、成果物欠落、異なる選択の混入、必須checkpoint欠落、legacy目録の削除を拒否。原本は変更していない。
- 6 DB環境のcontainer、network、volume、lock、process、listener、認証ファイルの残留0。32 journals完了、所有NodeとStorybook listenerも0。

初回のローカル実行は、品質コマンド追加後の保存inventoryが古く、M1の `STALE_ARTIFACT` で停止した。`test-results/verification/<selectionId>/static.json` で指摘を確認できる。inventoryのpackage.json hashとsource fingerprintのみ同期して再受入し、nodes、edges、diagnostics、不足baselineは変更していない。

Linuxでは18 suites / 275 fixturesが成功した。実DB・ブラウザを使ったCI相当受入はWindowsで行った。GitHub hosted workflowの実行、push、PR作成、branch protection変更は行っていない。

## Batch 14途中の全件受入（2026-11-06、停止時点）

code HEAD `3a40bfebe797f91e64d6ca9c728aedbf962133a8` のquality `22c6926a1f65` が成功。lint・型・unit1090成功（既存8skip）・tools1919成功、M1指摘0、verification `2c006b74031e` は必須55/55成功。legacy extras312登録は301成功・既存例外11件で、合計367登録中356成功だった。日程確定4登録では各実行で通常位置と固定バーの両操作から保存・全置換・再表示を確認した。

28 checkpointの入力が一致し、6 DB環境の資源・認証ファイル残留0、32 journals完了、所有Node/Storybook listener残留0。一時コメントも完全復元した。証跡索引は `test-results/quality/batch14-stop-acceptance.json`。

この選択はfull-requiredへのfallbackで、部分・全件shadowの比較ではない。Git statusでcleanでも、4ファイルのCRLFとHEADのLFとの差をraw入力の変更として検出したためである。終了後に改行以外の一致を確認してHEAD bytesへ戻した。部分選択はchangedPathsが検証用spec1件だけであることを事前に確認してから再受入する。ユーザーの一時停止指示により、ここを区切りにM4未完了で停止した。

## M4の最終受入（2026-11-06）

再開後、runtime HEAD `efb5a374568dc6b926dc845a310e4a63d4c21386` と受入済みcode HEAD `3a40bfe` の差分が文書4件だけであることを確認した。実装変更がないため共通品質前段は上記の成功記録を使い、`pnpm e2e:verify:changed --base HEAD` で独立した部分/全件shadowを受入した。

- selection `5c9f6ed9984d`: 検証用spec1件だけのraw変更からpartialを選択。既知coverage gaps0、shadow matched、選択漏れ・結果不一致0。
- partial `7f598182e3f2`: 日程確定4/4成功、7 checkpoints一致。
- full `b3400e416abd`: 必須55/55成功、legacy extras301成功・既存例外11件。計367登録中356成功、28 checkpoints一致。
- partial/fullは異なるIDで同一input/snapshot。各planの日程確定4行に通常位置と固定バーの2surface検査を含み、実ブラウザ結果とも一致した。
- 今回の7 DB環境・36 journalsは回収済み。既存quality分を含む13環境・68 journalsを独立照合し、資源・認証ファイル・所有Node・Storybook listener残留0。一時コメント完全復元、audit時のGit cleanも確認した。

最初の試行 `f83629524284` は部分4件成功後、全件側の最後の本番buildでGoogle Fonts由来のエラーになり、shadowはinconclusiveだった。拡張子なしURLのqueryをNext.js 16.1.6が処理できない[既知不具合](https://github.com/vercel/next.js/issues/99114)と一致する。失敗証跡を保存し7環境・36 journalsの回収後、同一コード・snapshot・plan・入力digestで再実行して上記の成功を確認した。この外部依存の再発可能性は残るため、恒久対策としてNext更新またはフォントのローカル固定を別途検証する。

最終証跡は `test-results/quality/batch14-runtime-acceptance.json` と `batch14-verified-artifacts.json`、初回失敗の回収記録は `batch14-shadow-first-residue.json`。正式実装レビューの必須指摘を解消し、全14 Batches・30 Steps / M4完了とした。既存不足や実受入外の範囲は [完了・検証記録](e2e-ledger-resume.md)に記載している。
