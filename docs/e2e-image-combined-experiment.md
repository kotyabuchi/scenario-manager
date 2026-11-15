# E2E イメージ取得の組合せ実験

固定 source `cc5830aaf9e364ea3d6134e94dc25eac44544876` と共通観測 `723a0458b6cb085792466248886fb8e38969857e` に、A2 の隔離 E2E Storage 無効化と C の GHCR 変更を組み合わせる。main 向け Draft PR の差分には未マージ PR #10 と共通の履歴が含まれる。対象は CLI 2.75.0、PostgreSQL 17、Ubuntu 24.04 の既存3 shard。Storage は専用設定と exclude の両方で無効化し、db/rest/kong/auth を GHCR から取得する。通常開発や本番設定、テスト選択、health、cleanup、隔離、cache は変更しない。

単独 A2 と C の詳細は `docs/plans/e2e-image-storage-disabled.md` と `docs/e2e-image-registry-experiment.md` を参照。組合せでは 4 image のタグ・registry・実測 ID と canonical config digest の対応、Storage absent と cold pull、3 shard plan、seed/migration・catalog、6 DB cleanup と7 process exit を各 attempt で照合する。catalog の照合は既存の固定期待値検査の成功を確認するもので、Hosted artifact には実行時 catalog fingerprint がなく直接 hash 一致は未確認。Storage API/schema 全体や認可の完全性は保証しない。

固定 head の全 workflow を3回以上観測し、基準・A2・C と同 runner 層を優先して比較する。workflow wall と初回 start を別々に示し、失敗・欠測・queue・runner image/kernel・cache 状態も記録する。単独効果の加算で組合せ効果を予測せず、実測後に判断する。マージやデプロイは行わない。
