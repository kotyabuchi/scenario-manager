# E2E Storage 無効化の追加実験 A2

固定 source は `cc5830aaf9e364ea3d6134e94dc25eac44544876`、共通観測は `723a0458b6cb085792466248886fb8e38969857e` を基とする。main 向け Draft PR は PR #10 と履歴が重なる。基準・A・B・C と独立した worktree/branch で測り、マージやデプロイは行わない。

A は `storage-api` を起動対象から除外するが、固定 Supabase CLI 2.75.0 は Storage が有効な場合、初期化時の migration job で Storage image を取得する。A2 はこれを分離して検証するため、生成する隔離 E2E 設定のみ Storage を無効化し、A と同じ4サービスの稼働 image を確認する。本番や通常開発用の Supabase 設定は変更しない。

既存の migration、seed、public/auth catalog、選択テスト、DB 隔離と cleanup の検査は維持する。Storage API や Storage schema 全体の互換性、アプリの全機能、認可の完全性はこの実験では証明しない。ソース・migration・seed の検索では Storage API/schema の直接利用は見つからなかったが、検索結果だけで互換性を保証しない。

native の `pnpm e2e:environment:check` は `b6d115744c33` / `c2da2a6f1252` が成功し、両方 cleanup complete・残留0。migration hash `7fd981083a38a5e2c97f05c92c814c963a5c5e0b2e8817594d3e230783c36c2c`、seed hash `557a8ef210e7f9adc58c5bc8efc34d5be0fb4ec1a468f3a429c51d9b8fad6148`、catalog fingerprint `5550aab5b2f5785daa898d6da83c3059d8abd59a6c19851e0eff6bd0004db415`、共通4 image ID は A の native 2回と一致した。実行時 HEAD は `0d042b8e4d4c796df6862c23e1a50c45cc8a1e20` で、Storage 設定と期待値の2行は未コミットだったため、これは最終固定 HEAD の証跡ではない。対象 E2E tools テストは53件成功した。Hosted の固定 HEAD に対する既存全ゲートと反復結果は別途記録する。
