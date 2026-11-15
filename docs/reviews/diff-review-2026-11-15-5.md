# コード差分レビュー: Hosted catalog fingerprint 証拠

> レビュー日: 2026-11-15
> 対象: `e3bbe743fe325c71ee36492cdf26447d089ffbbd` からの未コミット差分。専門担当3名の結果を統合。
> 未解消の必須・推奨指摘: なし。レビューは固定後の実行受入やマージ承認を意味しない。

## 対象と評価

既存 probe の catalog fingerprint を DB stage の安全な証拠として保持し、同じ shard receipt と CI v3 envelope に結び付ける。aggregate は plan の各 DB stage の証拠を照合して保存する。新しい DB read や生 catalog の公開は追加しない。

| 観点 | 結果 |
|---|---|
| 規約・設計 | 期待値は既存 canonical 化から導出し、旧ローカル receipt の欠測と新 CI の必須化を区別。JSDoc の対応先ずれは修正・再確認済み。 |
| セキュリティ・バグ | 証拠は固定形式の stage/owner/fingerprint/成功状態に限定。存在する不正値、所有者取違え、旧 envelope、欠落を拒否し、既存の入力・cleanup gate を維持。信頼された runner と artifact 経路が前提で、悪意ある runner に対する署名ではない。 |
| 性能 | 既存 probe 返値と receipt を利用し、追加 SQL や実観測 catalog の再取得を行わない。固定期待値の正規化と stage 走査が加わるが、実行時間・artifact サイズの Hosted 実測は未確認。 |
| UX/a11y | UI 変更なし。CI 失敗時は既存の固定要約と failure artifact を使う。 |

## 検証と残件

関連5ファイル159テスト、CI partition・CLI・runtime・aggregate 4ファイル106テスト、型検査、対象 Biome は成功。旧 v2 envelope を成功期待していた既存テストは v3 成功・v1/v2 拒否へ更新し、CI 関連テストを再実行した。SQL・URL・JWT・path・例外 sentinel を不正 catalog 証拠として与え、failure artifact・結果・stderr に漏れず成功 receipt を作らないテストを追加した。

固定 commit 後の `quality:changed`、Hosted CI、実 artifact の6 DB stage の独立受入と、コピーを用いた integration/isolated の欠落・owner/hash 改変拒否は未実施。過去 artifact には実行時 fingerprint が保存されておらず、後から補完しない。fingerprint は対象 metadata に限り、seed 行・全 DB 行・Storage 全体・認可の完全性を保証しない。Draft・未マージを維持する。
