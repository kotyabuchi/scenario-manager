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
| PR → main/develop | eventのbase。変更影響は一意なmerge-base | 選択required＋固定smoke＋全legacy-local |
| push → main/develop | event.before | 全required＋全legacy-local |
| schedule | default branchのイベントSHA自身 | 全required＋全legacy-local |
| workflow_dispatch | 選んだrefのイベントSHA自身 | 全required＋全legacy-local |

scheduleは日曜18:30 UTC（月曜03:30 JST）。欠落・不正なイベント、shallow history、HEAD不一致、複数merge-baseは失敗する。pushでbeforeがzeroまたはGit objectとして存在しないときは、静的診断の `historicalComparison` が `unavailable` になる。beforeが存在しても比較元にbaselineが未導入なら `baseline-not-introduced` と記録する。いずれもpush専用の外部承認 `E2E_LEDGER_BOOTSTRAP_APPROVAL` が必要で、event、repository、ref、before、head、現行baseline digestを実行ごとに照合する。破損・非commit・Git実行失敗を不存在扱いしない。

初回PRでbaseにbaselineとlegacy目録の両方が未導入なら、既存M1の外部承認 `{base, head, digest}` を必要とする。承認されたHEADに含まれる固定祖先 `933c68933c82578e54019f5ca924fbaafcd8c08b` の目録を使い、祖先関係とsmokeキーの固定digestを各jobで検査する。manifestに由来を残し、初回は全requiredへ広げる。一方だけの欠落、承認不一致、origin不在、同数のキー入替えは失敗する。このPR承認をpushの別tupleへ流用しない。承認値の登録は本実装では行わない。

実行は次のjobに分ける。

1. `planner`: 共通品質前段、M1、全登録収集、変更選択、閉包、分割manifestの作成。
2. `fixtures`: Windows/Linuxでイベント・抽出・変更選択・分割契約を検査。
3. `e2e-required`: manifestの非app必須登録を実行。
4. `e2e-legacy-local`: app必須登録とlegacy extrasを専用local DBで実行。
5. `e2e-aggregate`: 全job結果と各成果物を独立に再照合する必須check。

各workerも全登録を再収集し、head・workflow run/attempt・入力・全plan・全collectionがplannerと一致したときだけ起動する。集約は片方の欠落、skip、別attempt、別verification IDの混在、requiredの失敗、資源の未回収を拒否する。

失敗したworkflowを再実行するときはActionsの **Re-run all jobs** を選ぶ。失敗jobだけを再実行すると、新しいattemptに成功済みjobの成果物がないため照合できない。

PRの固定smokeはStorybookの `scenario-search-reset` と `e2e/smoke.spec.ts` のchromium/mobile各7登録。後者は静的比較元のexact key集合とも照合し、同数の別testへの入替えを通さない。閉包後にowner境界で分け、app必須18とlegacy extras312を混同しない。全件時は非app必須37＋app必須18＋extras312、計367の物理登録になる。

## 成果物と合否の限界

`test-results/quality/changed.json` は最新サマリー。根拠は `test-results/verification/<qualityId>/quality-receipt.json` と、そこから参照する独立verification IDの `plan.json` / `receipt.json` / `inputs-start.json` / `inputs-end.json` である。

CI公開artifactは `test-results/ci/plan`、`required`、`legacy-local`、`aggregate` の指定JSONだけを保存し、保持期間は7日。artifact名はGitHub run IDとattemptを含む。各shardは別IDを持ち、全件実行した一つのreceiptに偽装しない。

CIコマンドが失敗すると、Actionsログに段階と固定エラーコードを出す。分かる場合は品質チェック名、検証ID、指摘件数、後始末状態も含む。後始末の `complete` は全stageの資源解放を照合できたことを示す。`unknown` には未起動のstageや証拠不足が含まれ、資源の残留は確定していない。その実行で新規保存できた `failure.json` だけを成功判定の成果物と分け、別名のartifactで7日保存する。

private log、認証state、DB接続情報、raw trace、`test-results` 全体はアップロードしない。調査用traceは所有runのローカル成果物として扱う。JSONのchecksumは別実行の取り違えを防ぐもので、改ざん不能な署名ではない。assertionの意味、未移行テストの網羅、業務要件の完全性は別途レビューする。

## GitHub設定

公開後にrequired status checkとして指定する名前は **E2E verification gate**。旧 `Static Ledger Gate` は統合された。2026-11-05の読み取り時点ではmainにbranch protection/rulesetとrequired checkは設定されていない。本実装作業では設定・push・PR作成を行わない。

## M3の受入結果（2026-11-05）

code HEAD `fe7a8cd0bb8f6864052e7077fe32e8e78d4d3018` で次を確認した。ローカルの証跡索引は `test-results/quality/batch13-acceptance.json`。

- `quality:changed --base HEAD --no-shadow`: 品質前段、M1、変更選択、Storybook 1件、独立receipt再照合まで成功。検証用の一時コメントは元のbytesへ復元した。部分実行の結果であり、shadowの成功は主張しない。
- WindowsのCI相当実行: 合成PRイベントでplanner、required、legacy-local、aggregateが成功。必須55/55、追加legacy312登録は301成功・既存例外11件。合計367登録中356成功。品質前段はunit 1090成功・既存8skip、tools1813成功。
- 成功した実artifactのコピーに対する7つの否定検査: 必須test/jobのskip、成果物欠落、異なる選択の混入、必須checkpoint欠落、legacy目録の削除を拒否。原本は変更していない。
- 6 DB環境のcontainer、network、volume、lock、process、listener、認証ファイルの残留0。32 journals完了、所有NodeとStorybook listenerも0。

初回のローカル実行は、品質コマンド追加後の保存inventoryが古く、M1の `STALE_ARTIFACT` で停止した。`test-results/verification/<selectionId>/static.json` で指摘を確認できる。inventoryのpackage.json hashとsource fingerprintのみ同期して再受入し、nodes、edges、diagnostics、不足baselineは変更していない。

Linuxでは18 suites / 275 fixturesが成功した。実DB・ブラウザを使ったCI相当受入はWindowsで行った。GitHub hosted workflowの実行、push、PR作成、branch protection変更は行っていない。
