# テスト初期化・依存読込・CI準備の差分レビュー

対象: `7226ebc` からの未コミット9コードファイル。docsはコードレビュー対象から除外。3エージェントをSol/mediumで分担し、後から追加したoptimizer設定とCI生成step除去を別途再レビューした。

## 結果

必須指摘0、修正待ち0。以下は静的レビューと限定検証の結果であり、共通品質ゲート・新headのHosted検証を代替しない。

| 観点 | 確認 |
| --- | --- |
| 規約・設計 | 監査済み19件だけ明示opt-in。新TSXは従来component分類。再帰依存解析や設定移行を増やしていない |
| セキュリティ・バグ | 全pure testのDBguard、DB優先分類、Story実参照の拒否を維持。小さな一時repoを19件の存在要件で壊さない |
| cleanup | 実setupを通す回帰でReact effect購読、DOM、portal、root containerの次testへの残留を検査 |
| UX/a11y | Story35側のannotation/a11y/preview/beforeAllを維持。製品UI変更なし。CSS処理は従来から既定で無効のため、実CSSの保証はbrowser側 |
| 性能 | 軽量化だけの小差を大幅改善と扱わず、同一19件でSSRアイコンbundleを追加比較。worker集計とwallを区別 |
| CI | 新setup変更を共通基盤として選択。installで実行済みのPanda生成の重複stepだけを除去し、lifecycle/失敗ゲートを維持 |

## 検証と限界

- 19件の変更前・DOM分離・分離＋bundle、各3試行でcase multiset一致（161成功・既存skip1）。最終条件のwall中央値46.479秒、変更前91.361秒。全体CIへの外挿はしない。
- 分類39、変更選択25、DOM cleanup2、代表DOM7テストは成功。製品test本体・DBguard本体・version・pool・isolation・timeout・retryは未変更。
- optimizerはjsdomのunit-dom/componentへ適用される。全91件と共通qualityで互換性を確認し、HostedのPanda生成がinstall内に残ることを確認する必要がある。
- opt-inのStory guardは直接import/export/import()/require()が対象。間接helperの依存はレビュー対象であり、汎用依存証明ではない。

詳細な独立所見はignoredの `test-results/quality/next-perf-review-{security,design,performance,addendum}.md`、計画と残件は `docs/plans/e2e-test-layer-performance.md`。

## 共通ゲートの結果

quality `8f47e4741403` / verification `3a319ff5e0fb` 成功。全91ファイル1,097成功/既存skip8、tools150ファイル2,216成功、必須67・extras312・legacy330行を独立照合。入力前後一致、6 DB cleanup complete、7 stageのprocess終了/エラー0、専用ポート・running container残留0を確認した。静的レビュー後の追加差分はこの受入記録のみ。最終headのHosted結果はPR本文で管理する。
