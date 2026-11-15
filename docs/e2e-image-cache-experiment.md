# E2E Docker image cache 実験 B

実験対象は固定 source `cc5830aaf9e364ea3d6134e94dc25eac44544876` の Hosted Ubuntu 24.04、CLI 2.75.0、PostgreSQL 17、3 shard の既存 E2E 構成。CLI のサービス・テスト・health・cleanup を変更しない。ECR の公式イメージだけを `docker save` で保存し、Docker daemon のデータ、DB volume、認証情報、auth state は保存しない。

CLI が使用するタグは [CLI 2.75.0 の Dockerfile](https://raw.githubusercontent.com/supabase/cli/v2.75.0/pkg/config/templates/Dockerfile) を参照。2026-11-15 に公開 ECR の各タグの manifest index から linux/amd64 の manifest を選択し、その config digest を `docker manifest inspect` で取得した。cache validator に固定した値は次の通り。

| ECR イメージ | index digest | linux/amd64 config digest |
| --- | --- | --- |
| postgres:17.6.1.075 | 82a04ba6c05f60950a74ae46be3726abb18d06ee44da936276fd782e72e36855 | 0fab7a426fa7aba838f6e4c746f975032237934f4ca5ace1a7222ba88deaacf7 |
| kong:2.8.1 | 1b53405d8680a09d6f44494b7990bf7da2ea43f84a258c59717d4539abf09f6d | 3cefb958bcd694597b65adc00053a762b1f9a6df3c6031af528d052d75a64e1a |
| postgrest:v14.3 | 7c5840727ad683b0fdbfb9810930665b34f8b44884a4dc740aa8844748a2b85e | 8fef2fc016f1e9d785424f0d1362a7dc6b53c3519e89cb965d81419137f3fb41 |
| gotrue:v2.186.0 | f2112b9289422f205df4ea15b8b550d425ae42528ea54521faa32cc7b62490de | 1a00f324d1ea23e5938de070ef2571cc8be5a7dbcd4c0be77e282e0aa1d1cae2 |
| storage-api:v1.35.3 | 5a3ecdc67dbe9e88a56810b5b2f432f2d93708dcb4dc9de34e78e342b390eb4d | d2308c7679ad90ca9445ef52612d7dfaca908776294943db175d8ead0205f3e0 |

接頭辞は `public.ecr.aws/supabase/`、表中 digest の接頭辞は `sha256:`。ローカル Docker Desktop の containerd store は index digest を ID とし、classic store は config digest を使うため、復元後の ID は両方を許容する。保存・復元前には config 自体の SHA-256 と、config の rootfs diff IDs を各展開済み layer tar の SHA-256 と照合する。未知タグ、重複、path traversal、リンク、変更された config/layer は拒否し、load 前に失敗させる。未対応圧縮も照合失敗として扱う。正常・破損の fixture は CI planner で実行する。

key は専用 namespace、run ID、generation、shard、OS、architecture、CLI、validator と Supabase config の hash を含む。restore-keys は指定しない。generation は `floor((run_attempt - 1) / 2)`。同一 PR・同一 HEAD の同一 run を Re-run all jobs で合計 6 回実行し、1/3/5 は miss/save、2/4/6 は hit を期待する。PR cache は merge ref に属し、その PR の再実行で復元できる（[GitHub cache scope](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)）。exact hit のみ load し、restore failure/miss は CLI の通常取得へ戻す。破損や不一致は失敗として計上し、成功した shard だけ保存する。

`E2E_IMAGE_CACHE` JSON marker は restore/save action の outcome、save・validate・load・inspect の所要時間、archive bytes を記録する。転送・展開と圧縮・アップロードは action の step 時間とログを別途採取する。保存失敗、復元失敗、期待 hit/miss と異なる試行は欠測・失敗として扱う。高速化を前提にせず、共通計測の cold start と E2E wall も併記する。ネットワーク取得では同時 manifest 問い合わせ時の ECR rate exceeded が観測された。
