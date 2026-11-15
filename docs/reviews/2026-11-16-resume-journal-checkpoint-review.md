# 差分レビュー: journal分類とcheckpoint失敗

対象は `2a804f38665122082cee21a7de3a01da05c40bdb` からの7ファイル差分。2026-11-16に security / bug、design / 規約、performance / UX を独立に確認し、最終時点の必須・推奨指摘はない。

- journalは外側msgから固定enumと相対時刻のみを抽出し、URL・生error・識別子を保存しない。既存4分類の外側msg内での部分一致を維持し、新2分類を優先する。version 1のenum拡張は旧strict consumerと互換ではなく、collector更新が必要。旧runへ新分類を遡及しない。
- checkpoint失敗は input-check として記録し、同時のbrowserおよび所有appのserver-exit・server-stop・reportも個別に保持する。例外伝播、成功条件、実close待ちとcleanupを維持する。
- journalの解析は既存の出力・行数・行長・時間窓の上限内で完結し、追加processやI/Oを行わない。daemon全体の未帰属観測や空eventsは、当該pullの原因や失敗不在の証明ではない。UI/a11y実装の変更はない。

レビュー担当は実DB、browser、Hosted journalを実行していない。統合時の限定6 suite 117 tests、Biome、全体typecheck、ledger check（登録69、issues 0、policy delta 0）は成功。固定コミット後のfull quality・Hostedおよび独立受入はこの時点で未実施。
