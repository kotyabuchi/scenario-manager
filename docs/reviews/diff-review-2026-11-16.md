# 差分レビュー: E2E 診断とバナー待機

対象: `8fef59b92b98823b142922dbb57c05f927dac51d` からの未コミット差分。2026-11-16 に Security / Bug、Design / Standards、Performance の3観点を独立に確認した。未解消の必須・推奨指摘はない。

- 安全性: 診断は固定分類・有限件数・時刻に限定し、生ログ、URL、PID、資格情報を公開しない。取得失敗・欠測は unknown とし、元の成功判定と cleanup を維持する。journal 子の停止と実 close を待つ。
- 設計: 既存の非対応 URL 初期入力ケースを保持し、clear の2 project の旧登録と新 case を同一 project で一対一に対応付ける。旧 origin と fingerprint を維持し、別 project の結果で代替しない。
- 性能: clear は表示を確認してから入力を消し、固定500msを状態 assertion に置換。短縮量と flaky 率は未測定。診断の上限・取得範囲を限定し、journal 取得は Linux Hosted のみ。OS が子の close を返さない場合、終了確認は期限を超えて待つ可能性がある。
- 解釈: wall clock は変動し得る。server close の未観測は接続瞬間の server 健康や listener 所有の証明ではない。journal は daemon 全体の同窓情報で、該当起動との因果は未確定。report 内の文字列観測と trace の欠測を分ける。

統合時に関連239テスト、型検査、Biome、ledger 検査を実施済み。レビュー担当者による実行ではない。固定 HEAD の全体 quality、実ブラウザ、Hosted Linux の journal 実取得と独立受入はこのレビュー時点では未実施。
