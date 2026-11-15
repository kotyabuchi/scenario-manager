# コード差分レビュー

固定base `448990008d4684364d3cf2e3abf9a1c6588ba993` に対する8コードファイルを、Sol / mediumの3担当が設計・規約、安全性・バグ、性能・診断の明確さで独立レビューした。UI変更はない。

## 指摘と対応

必須1件を修正済み。DBのStartedAtとstartイベントが同じ秒に入るという条件は、イベント発行の遅延で正常な観測を棄却していた。イベントがStartedAtより確実に前の場合だけ棄却し、次秒のstartイベントを受理する回帰と、確実に前なら拒否する回帰を追加した。設計担当の再レビューで解消を確認した。残る必須・推奨指摘は0件。

## 維持する境界

pullの状態は観測窓であり、正確な処理時間やimage別durationではない。親image対応の欠落・開始未観測・保持上限を明示し、重なる窓を合計しない。公開出力は固定schemaと有限数だけで、ID・資格情報・rawログを含まない。disabled時は追加parser・時計・Docker読取を行わない。

DBは既存の所有確認後にID・name・project labelを再照合する。有限eventsと必要項目のみのinspectを共通2秒deadlineで読み、abort後も既存runnerのcloseを待つ。deadlineは中断要求の期限であり終了待ちを含む厳密なwall上限ではない。診断失敗は元の検証・cleanupの成否を変えない。daemonの履歴欠落を不健康とは推測しない。

## 検証

限定回帰は4ファイル73テストが成功。8コードファイルのreadonly Biomeと型検査も成功。実環境の新規復元2回はmigration/catalog照合・cleanupに成功した。1回の診断の時刻棄却を契機に上記修正を行った。修正後の再復元、固定baseの共通quality、最終headのHosted検証・artifact受入は別の証跡で確認する。

レビュー詳細はignored `test-results/quality/db-pull-lifecycle-{design,security,performance}-review.md` に保持する。今回の変更は原因切り分けのための計測であり、97秒遅延の原因確定や速度改善の実証ではない。
