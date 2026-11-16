# コード差分レビュー: pull とホスト負荷の補助観測

> レビュー日: 2026-11-15
> 対象: `215fce880b7329ac43b8361b5799ff55bac37756` からの Batch 2 差分。3 専門レビューを統合。
> 未解消の必須・推奨指摘なし。レビューは実環境受入やマージ承認ではない。

## 対象と評価

GHCR の固定 role に対する retry 表示を既存の安全な列挙値へ縮約する。Linux で CLI timing が有効な場合、Supabase start の前後に短命の所有 reader でホスト全体の CPU counter と I/O pressure を取得し、差分と親時計上の読取窓を記録する。

| 観点 | 評価 |
|---|---|
| 設計・規約 | proc の固定 path、bounded read、strict schema、固定出力形式を使用。close callback での post reader 起動による command 計時混入は、時刻記録のみとして計時確定後に起動するよう修正した。 |
| セキュリティ・バグ | raw proc、CPU ID、path、PID、例外、環境値を公開しない。未知 role・不正値、counter 減少、CPU 構成変更、欠測は拒否または null とする。reader 実 entry の直接テスト不足は追加14件で対応済み。 |
| 性能 | 追加 pull・DB 操作はなく、Linux の有効時に所有 reader を最大2回起動。2秒は中断要求であり、実 close を待つため絶対終了時間ではない。前後 read は command 計時の外、外側の environment-start には含まれる。 |
| UX/a11y | UI 変更なし。観測不能をゼロや成功と解釈しない。 |

## 検証と限界

最終差分に対し pull/start timing・reader・observer・environment probe・command runner の6ファイル **107テスト**、対象7ファイル Biome が成功。型検査は追加 reader 直接テスト後の実装担当の成功報告を受領した。これらの件数に先行71件・24件を重複加算しない。

固定 HEAD `215fce8` の Batch 1 全体 quality・Hosted 受入は成功済みだが、この Batch 2 固定 commit の Linux 実 proc・Hosted CI はレビュー時点で未実施。Windows の通常 runtime は診断を起動しないため、fixture と限定テストを Linux 実受入の代用にしない。ホスト全体の差分は image 単位の転送・展開・I/O や原因を特定せず、親の読取窓と既存 marker の原点は厳密には同期しない。旧24試行の GHCR retry は旧 parser の制限により未確認で、欠測を0に置換しない。
