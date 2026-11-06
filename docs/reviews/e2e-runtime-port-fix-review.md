# 専用runtimeのポート衝突修正レビュー（2026-11-06）

対象は今回のポート差分（品質側14 tracked files、追加policy test 1 file、前提側への共通変更同期）。以前レビュー済みのフォント・前提PR移送差分と区別する。Sol/mediumのGroup A（security/bug）、B（design/standards）、C（UX/performance）で独立確認した。

| 観点 | 結果 |
| --- | --- |
| 規約 | OK。固定値・日本語説明・既存型を使用 |
| 設計 | OK。DB/App/Storybookの起動設定を共通定義から参照 |
| セキュリティ | OK。所有lock、nonce、接続先制約、cleanupの実装を変更しない |
| 性能 | OK。ポート探索や追加の常駐処理なし |
| UX/運用 | OK。再起動前提を撤回し、全TCP状態とPIDを調べる手順へ |
| バグ | OK。起動/接続/予約値と負例の検査対象を維持 |

必須指摘0。推奨された前提Storybookの定数参照漏れ、8083/3333等の開発ポート除外、保証範囲の説明とテスト名を修正した。fixtureの直書きを定数化する任意提案は今回保留。既存の独立した期待値を新番号に同期し、起動引数・lock内容・接続先の不一致を関連テストで検出する。

品質側452件、前提側104件が成功。最終のpolicy7件を両側で再確認し、両側lint/type、品質AGENTS同期も成功。初回sandbox内実行は一時Git書込・atomic rename権限エラーがあり、成功扱いせず同じ関連テストを通常権限で再実行した。

前提 `3b766562c503` / 品質 `777e5d611b7c` の専用DB起動、migration復元、catalog一致、cleanupを受入。品質runはNext23100も予約。Codex旧接続を残した状態で成功し、所有資源の残留0を独立監査した。新ポートでのNext/Storybook実ブラウザ、前提全E2E、共通品質ゲートは別の未完了受入項目。

各Groupの原記録と実行ログは `test-results/quality/port-fix-*`、運用手順は `docs/testing/isolated-runtime-ports.md`。

後続受入: 品質run `6c5123d3f35f` でNext/Storybook実ブラウザと全共通品質ゲートも成功した。前提330登録は引き続き別runで受入する。
