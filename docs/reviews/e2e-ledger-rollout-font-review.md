# フォント安定化の差分レビュー

2026-11-06。比較元 `d31688a2ea70a8c93ca2df092999558b3228b487`、docsを除く10ファイル。Sol / mediumの3エージェントが独立して各2観点をレビューした。生成台帳の更新は通常writerによるソースハッシュと行番号の更新で、既存不足のbaselineは変更していない。

| 観点 | 結果 | 確認内容 |
| --- | --- | --- |
| 規約 | OK | 共通CSSへフォントを集約し、既存Panda tokenとCSS変数を維持 |
| 設計・保守 | OK | アプリとStorybookで同じ固定packageを利用し、next/font専用mockを除去 |
| セキュリティ | OK | versionとlock integrityを固定、CSS外部URLなし、OFL原文一致 |
| 性能 | OK | 124 unicode-range、可変weight100–900、swap、preloadなし |
| UX・a11y | OK（静的範囲） | 日本語範囲・既存400/500/600/700・sans-serif fallbackを維持 |
| バグ・ロジック | OK | font-familyと変数参照、app/StorybookのCSS読込、生成台帳の整合 |

必須0・推奨0・検討0。静的レビューの評価はA。実ブラウザと本番buildの受入は別に実施する。

## Panda設定の固定ハッシュ

`src/styles/tokens/fonts.ts` の変更は、Googleからの注入という古い説明を共通CSSによる定義へ直すコメント2行のみ。値は変更していない。23設定ファイルをpath昇順に並べた `{path,sha256}` のJSONから算出したレビュー済みdigestを、`03f73032e430c11ce22433b55fe27b1c8da08ccac1f0d9ce55b39d3ccc4e042e` から `aac1c4bee4f1ec16e7c5d3fdf0112d3d410203ae0b618caf4ac6b52766bd433f` へ更新した。旧font設定のbyteを使うと旧digestを再現できる。未レビュー設定の拒否条件は変更していない。

## 検証状況

- 初回共通検査 `c4ae79173224` はtypecheck開始時に失敗。単独typecheckは成功し、同じ入力の再実行でもtypecheckは成功した。初回receiptは失敗のまま保持する。
- 再実行 `be07d291aa4d` はlint・typecheck・unit（1,090成功、既存skip8）を通過し、toolsは1,910成功・9失敗。9件は上述の固定digest不一致による `UNREVIEWED_CONFIG` であり、設定変更を拒否する動作だった。
- 固定digest更新後、`pandaProvenance.test.ts` の限定14件が成功。テストfixtureを旧設定へ固定する変更は採用せず、元のfixtureを維持した。
- 最終共通検査 `0ad74512480e` はlint/type/unit（1090成功、既存skip8）/tools（1919成功）と静的台帳を通過。実行検証は最初のDB環境を作る前、Codexアプリが保持するIPv6ポート57320〜57322との衝突で停止した（`EADDRINUSE`）。DBコンテナ・lock残留は0。当時の停止記録。後述のポート修正後は再起動せず再検証した。
- 上記の失敗時点では実ブラウザ・buildは未受入だった。失敗receiptは保持し、次の成功runと区別する。

REVIEW_RESULT verdict=A blocking=0 recommended=0 consider=0 report=docs/reviews/e2e-ledger-rollout-font-review.md

## 実機受入

品質run `6c5123d3f35f` は共通検査・静的台帳・必須55ケース・旧E2E312登録・7 stages・cleanupをすべて通過した。unit1090成功/既存skip8、tools1926成功。既存baselineの不足は引き続き未解消。

本番buildを通過したStorybookとアプリの公開トップで、日本語400/700のcomputed styleとCDPによるcustom fontのglyph描画を照合した。同origin WOFF2応答はStorybook28件、アプリ22件、Google通信は両方0。親が双方の画像も確認した。最初の補助観測は削除済み/loginを待っていたため、所有する観測プロセスだけを終了し、現行/に直した補助処理を同じquality run中に実行した。quality本体のコード・入力は途中で変更していない。

証跡: `test-results/verification/6c5123d3f35f/font-acceptance.json`、`test-results/quality/rollout-font-{storybook,app}.png`。
