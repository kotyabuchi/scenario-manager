# CI失敗診断の追加レビュー

> レビュー日: 2026-11-07
> 差分の基準: bbe7443e61af24e254a4be746237d7527e5efd09
> 対象: CI公開診断、worker/CLI結合、関連テスト（7ファイル）
> 判定: 独立レビューの指摘解消・共通品質ゲート成功。Hostedの原因特定は継続。

## 背景と範囲

PR #10の記録コミットに対するrun42362035321はattempt1/2ともdesktopで失敗した。公開診断はreceipt段階の116指摘までで、後続auth未起動による指摘と実際の失敗ケースを分離できなかった。生のreportやエラー本文の公開を増やさず、固定語彙・件数・同一計画の登録済みキーのSHA256だけを追加する。

Sol / mediumの3担当がセキュリティとバグ、設計と規約、運用UXと性能を独立レビューした。元の成功判定とcleanup判定、manifest、artifactの受入条件は変更しない。

## 指摘と反映

- 検証結果未取得と検証済み0件を区別するため、`verificationState` を追加。
- reportのtimeoutと中断を通常のfailedにまとめず、検証schemaの固定statusをそのまま使用。
- ケース不足だけの場合も調査できるよう、`RESULT_MISSING` のハッシュを低優先で列挙。その他の失敗を先に置き、全体12件の上限と省略件数を維持。
- 親レビューで、DB ownerのないStorybookを未実行と誤表示しないよう修正。実行証拠があるowner欠落はunknown、StorybookのDB cleanup不要はnot-requiredとする。cleanupのcomplete表示はstatusに加えてissuesとremainingが空であることを確認。
- 新しい診断テストの空envは既存のProcessEnv拡張型を満たさなかったため、既存テストと同じprocess.envを使用。秘密値が出力されない検査は維持。

## 検証と限界

初期の限定4ファイル53テストに加え、指摘反映後の限定4ファイル56テスト、型検査、7ファイルのBiomeが成功。実CLIの異常終了、workerのreceipt拒否、failure.jsonへの保存、成功artifact未作成、未知語彙・自由記述・秘密markerの非公開を含む。3担当が最終差分を再確認し、未解消の必須・推奨指摘は0件。

固定base `0a5133d489d14e0a94c6fded66ebb656c6f8869b` のquality `4d49d90c882c` / selection `35b57d4c8377` / verification `e3623baa655a` が成功。unit91ファイル1,097成功/既存skip8、tools148ファイル2,192成功。保存物から必須67/67・extras312、legacy330行（成功319・既存例外11）を独立に再照合した。入力前後は `d2da5de5614ff218626aff760c445a58179fedf6d3b3724438d1e269ee3fe10b` で一致。6 DB cleanup complete・remaining空、全7stageのprocess終了・エラー0を確認した。

native確認でも専用port・所有container・テスト用Nodeは残留0。成果物照合を並行実行していた2つのNodeは、照合終了後の再確認で終了済みだった。既知の作業用MCP Node 11個は別に管理する。ローカル匿名Chromium57件はすべて成功し、Hostedの失敗は再現しなかった。共通gate後に変更したのは本レビューと計画の受入記録のみ。

この変更だけでは繰り返すHosted desktop失敗の原因を特定・解消したことにはならない。新しいheadのCIで安全な診断を取得し、原因修正と同一head/run/attemptの全成果物再照合までPRはDraftを維持する。

診断head `7064c41e9af547d10f31d0fc41e33ad18cf1c570` のrun42367955939 attempt1は全7jobと重複検査が成功。同一head/run/attemptの6組のartifactを独立再検証し、全330行、必須67・extras312、6 DB cleanup・7 process終了、固定履歴を確認した。以前の失敗はこの試行で再現せず、実際の失敗ケースと原因は依然未特定。診断の実装受入と原因解消を区別する。
