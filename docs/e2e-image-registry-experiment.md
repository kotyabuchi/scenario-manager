# E2E Docker image registry 実験 C

固定 source `cc5830aaf9e364ea3d6134e94dc25eac44544876`、Hosted Ubuntu 24.04、CLI 2.75.0、PostgreSQL 17、既存 3 shard を使う。共通計測を除く実行条件の差分は共有 job env の `SUPABASE_INTERNAL_IMAGE_REGISTRY` を `public.ecr.aws` から `ghcr.io` に変更する一行のみ。サービス、テスト、health、cleanup、キャッシュおよび prefetch は変更しない。

[CLI 2.75.0 の Dockerfile](https://raw.githubusercontent.com/supabase/cli/v2.75.0/pkg/config/templates/Dockerfile) でタグを確認した。2026-11-15 に各 GHCR タグの公開 manifest index と linux/amd64 manifest を順次取得し、config digest を ECR の同じタグと照合した。5 件すべて取得可能で config digest が一致した。以下は両 registry 共通の値（接頭辞 `sha256:` を省略）。

| イメージ | linux/amd64 config digest |
| --- | --- |
| postgres:17.6.1.075 | 0fab7a426fa7aba838f6e4c746f975032237934f4ca5ace1a7222ba88deaacf7 |
| kong:2.8.1 | 3cefb958bcd694597b65adc00053a762b1f9a6df3c6031af528d052d75a64e1a |
| postgrest:v14.3 | 8fef2fc016f1e9d785424f0d1362a7dc6b53c3519e89cb965d81419137f3fb41 |
| gotrue:v2.186.0 | 1a00f324d1ea23e5938de070ef2571cc8be5a7dbcd4c0be77e282e0aa1d1cae2 |
| storage-api:v1.35.3 | d2308c7679ad90ca9445ef52612d7dfaca908776294943db175d8ead0205f3e0 |

比較方法は `docker manifest inspect ghcr.io/supabase/<image>:<tag>` から linux/amd64 の manifest digest を選び、`docker manifest inspect ghcr.io/supabase/<image>@sha256:<digest>` の `config.digest` を読む。ECR 側は同じ手順の固定タグに対する別実験 B の記録と照合した。manifest index や Docker image ID はストア実装で異なり得るため、config digest と混同しない。タグは可変であり、実行時の共通観測も確認する。速度・成功率は実際の workflow 観測後に判断し、失敗や欠測も記録する。
