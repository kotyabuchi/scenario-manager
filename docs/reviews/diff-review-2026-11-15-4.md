# コード差分レビュー: PR #10へのA2取り込み

> レビュー日: 2026-11-15
> 対象: HEAD `cc5830aaf9e364ea3d6134e94dc25eac44544876` からの未コミット差分（未追跡を含む）
> 総合評価: A（未解消の必須・推奨指摘なし。マージ承認や最終HEADの実行受入を意味しない）
> コード対象: 7ファイル。文書3ファイルは結果・適用範囲の整合も確認
> モード: Terra/highの3担当による並列レビュー、親が指摘を判断・統合

## 変更サマリー

隔離E2EのStorage設定と常駐サービスを無効化し、再現検査の必須image集合を4サービスへ合わせる。実験条件と比較可能な共通image観測を維持し、cache・GHCR変更は取り込まない。

| 対象 | 変更 |
|---|---|
| `environmentInputs.ts` / `.test.ts` | 隔離生成設定のStorage無効化と回帰 |
| `environmentProbe.ts` | Storage起動除外と共通image観測 |
| `environmentReproduce.ts` / `.test.ts` | 4サービスのimage照合 |
| `imageObservation.ts` / `.test.ts` | 所有image・runner情報の制限付き診断 |

## 評価詳細

1. **規約**: 新規観測モジュールの3つのnull/undefined存在判定について `ramda.isNil` 必須規約違反を検出。親が修正を採用し、実装担当が型述語を維持して統一した。現在の型ではそれぞれ片側のみであり、動作不具合とは扱わない。
2. **設計・保守性**: Storage変更は隔離生成設定に閉じ、通常開発・本番設定は変更しない。診断と既存のcatalog・入力・cleanup検査の責務が分離されている。
3. **セキュリティ**: 所有project/containerのID・名前・label・image IDを再確認し、許可registryと形式を検査した値だけ出力する。資格情報・private path・Docker inspect生値を公開しない。
4. **性能**: 既存A2の観測追加コストは160–541ms/回。異常時は10秒後にabortを開始して子終了を待つため、厳密な10秒wall上限ではない。終了不能時にcleanupを先行させない。小標本・runner差・重複計時を明示し、全体改善率を断定しない。
5. **UX/a11y**: UI変更はなく評価対象外。
6. **バグ・ロジック**: 既存catalog、所有確認、migration/seed、入力・cleanup検査を維持する。Storage API/schema・動的間接利用・認可全体は未証明で、既存選択テストの成功と区別する。既存upload APIはCloudflare R2を利用するが、これだけで全利用の不在を証明しない。

## 指摘と対応

| 区分 | 指摘 | 対応 |
|---|---|---|
| 必須1 | `imageObservation.ts` の存在判定3箇所をisNilへ統一 | 修正・設計担当再確認済み。観測4テスト・型・Biome成功 |
| 推奨 | なし | — |
| 検討 | なし | — |

## 検証の境界

初期取り込み7ファイルはA2の固定HEAD `3c754c12d6c644ff01652f4a0cd5b5b78fa1d19c` とbyte一致を確認し、限定93件・Biome・型検査が成功した。サンドボックスでのjunction作成EPERMは権限付きで同じテストを再実行して通過した。isNil修正後の観測4テスト・型・Biomeが成功し、設計担当の再レビューで解消を確認した。

固定最終HEADの共通qualityとHosted CIはこの差分レビューとは別に受け入れ、PR #10本文に記録する。過去24試行の成功を取り込み後HEADの検証の代用にしない。未確認の間欠失敗、catalog fingerprintの直接比較、coverage不足は残件とする。Draft・未マージ・本番デプロイなしを維持する。
