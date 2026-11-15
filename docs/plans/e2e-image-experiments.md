# E2E イメージ取得の比較契約

固定 source は `cc5830aaf9e364ea3d6134e94dc25eac44544876`、各 Draft PR の base は main `e9427ba` とする。PR 10 の checkout と変更は使用せず、デプロイやマージは行わない。基準、A（サービス除外）、B（イメージキャッシュ）、C（レジストリ）は独立した branch/worktree で比較する。C は ECR を基準、GHCR を候補とし、B と混合しない。

基準・A・C は各 3 回以上の全 workflow を観測する。同じ head の rerun-all による 3 attempt も含む。各 attempt は独立した runner の観測だが、統計的な独立性を保証するものではない。1 workflow の 3 worker を独立した 3 回と数えない。B は同一 run の 6 attempt で miss/save → hit を 3 組実施し、generation は `floor((attempt - 1) / 2)` とする。キャッシュ保存・復元の転送と load に要する費用をすべて含める。失敗や欠測を除外せず、run、attempt、queue、失敗理由とともに記録する。n=3 は小標本として中央値と最小・最大を示す。

各観測は同一 head/run/attempt の既存 6 artifact を照合し、67 required、312 extras、330 legacy、既存 11 例外、6 DB cleanup、7 process cleanup を維持する。A は稼働サービスの subset を許可するが、public/catalog/テストの保証を削らない。基準・候補とも失敗を消さない。共通ログでは CLI binary 導入の既存 download/checksum/extract/verify 秒数と、Docker image 取得・起動の各観測を分ける。runner image/version、CPU、Docker driver、稼働中の所有サービスの image tag/ID/digest と追加観測の所要時間を記録する。非 TTY pull 進捗の区間は正確な pull duration とみなさない。

有望な候補が 2 つ以上あれば、組み合わせを別 branch/worktree/Draft PR で 3 回観測する。なければ組み合わせを実施しない理由を記録する。常設 runner は導入せず、必要性と運用条件を残件とする。比較・採否は全条件の観測後に判断する。

image ID は Docker の image store により OCI index digest または config digest を指し得る。同じ OS/architecture と storage driver の観測同士で比較し、RepoDigest も別途記録する。image ID を canonical config digest と決めつけない。

