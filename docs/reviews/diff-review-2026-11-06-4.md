# Batch 5 同一入力の Inventory 再利用レビュー

対象は `aebd052889ede8692cd9e4b5780f85515c107fd3` を起点とする `scripts/e2e/snapshotInventory.ts` と対応fixture、および実Git fixture 1件の時間上限調整。最終品質ゲートと所有資源の独立受入は完了。

## 変更とレビュー

同じ `buildSnapshotInventories` 呼び出し内で、物理rootと全実効path・raw bytesを長さ付きSHA-256で照合し、完成済みInventoryだけを共有する。4 revision枠、preload、追跡bytes優先のPanda overlay、path衝突、依存変更拒否、外部package再照合を維持する。宣言済みpathを読めない枠は共有せず従来の解析へ渡す。公開snapshot・ledger・graph・選択形式の変更なし。

- 独立Group A（安全性・バグ）とGroup C（UX・性能）、親の統合確認に追加必須なし。実装者によるGroup Bは設計・規約の自己レビューで、独立レビューとは区別する。A/B共通の推奨は、共有される返却値を読み取り専用として扱う旨のJSDoc。反映済みで、Bの軽微なfixture存在判定も `isNil` に統一した。
- 独立構築とのserialize／graph一致、別呼び出しの非共有、異なるcommitの同一treeを検証した。BOM、大小文字、Storybook入口、alias、欠落と空、overlay優先と衝突、物理依存変更の否定fixtureを追加した。
- 計測後に本番builderへ加えた変更はJSDocのみ。 `batch5-comment-only.json` で計測版と最終版のソースdigestは異なり、出力JavaScriptのdigestが一致することを照合した。

## 測定

固定比較元 `0b14ff2`、Windows x64／Node 24.12.0／TypeScript 5.9.3。同じ固定依存とPanda証明で、各条件とも旧→新の順に別プロセスを各1回実行した。

| 条件 | builder所要秒 旧→新 | builder終了時のプロセス累積peak RSS KiB 旧→新 | Inventory参照数 旧→新 |
| --- | ---: | ---: | ---: |
| 全枠同一 | 318.401 → 84.387 | 3,331,280 → 2,401,520 | 4 → 1 |
| 一部同一 | 323.953 → 161.720 | 2,954,616 → 2,544,060 | 4 → 2 |
| 全枠相違 | 333.046 → 313.981 | 3,278,224 → 3,086,076 | 4 → 4 |

Inventory参照数は実測。各構築にproduct／Storybookの2 ProgramがあるためProgram回数は8→2、8→4、8→8と推定し、全量実測では計装していない。時間はbuilder全体で、Git snapshot初回採取、Panda事前証明、後段graph／selectionを含まない。RSSはプロセス累積最大でbuilder単独の値ではない。各1ペアで反復・順序交差がなく、OSキャッシュや負荷変動を分離できないため、再現性のある改善率や全枠相違時の単独ハッシュコストは求めていない。

3条件とも固定入力、4枠のserialized Inventory、graph、full plan、選択決定、selection／実効planのdigestが一致した。全枠同一はno-opでselection／実効planは両版null、残る2条件はfull-requiredで要求55件。旧移行receipt全体の比較はこの計測に含めていない。

## 初回失敗と再検査

初回品質 `2a3cdbab496f` は `test:e2e-tools` で `QUALITY_CHECK_FAILED`。lint・型・unitは成功し、静的台帳・選択・runtimeには進んでいない。 `trustedRevision.test.ts` のsymlink・directory・8 MiB超blobの実Git fixtureが5.454秒で既定5秒を超えた。該当する1 caseだけを30秒に調整し、35件の限定再検査では当該caseが2.628秒で通過した。独立の時間上限レビューでは、拒否assertion、productionの上限・path guard、他caseのtimeout、skip・retryに変更がないことを確認した。

## 最終ゲートの受入

固定base/headは `aebd052889ede8692cd9e4b5780f85515c107fd3`。品質 `524495c4959c`、選択 `b0e4f28d9a39`、実行 `b3c49c66e312` はすべて成功した。lint・型・unit・tools・静的台帳に続き、必須55成功、旧E2E312登録、全7 stagesを照合した。全件選択のためshadowの重複実行はない。core437/UI658の不足と外部サービス依存の保留18件は維持する。

入力digest `6de789e030f9e795a7437ddb28ec7987f75b6a6be4c9032c4cda931d1d028210` は実行前後で一致し、28 checkpointsの差分は0。独立受入 `test-results/quality/accept-batch5.524495c4959c.json` で全stageのexit・証跡・cleanupを再照合した。6環境のDocker資源、記録された11個のlock、専用5ポート、run IDで識別可能な子プロセスの残留は0。

計測の採用6件は `test-results/quality/batch5-benchmark/results/verified-comparison.json`、詳細は `test-results/quality/batch5-benchmark/results.md`。レビュー原本、計測版と最終版のJavaScript一致、初回失敗、最終runのreceiptはignoredの作業記録へ保存した。ローカル受入を、新しいheadのhosted CI成功として扱わない。
