# コード差分レビュー

> レビュー日時: 2026-11-08
> 対象起点: ebafe3fd3923699492924bf89233ab0c64642660
> 対象範囲: 指定された未コミットコード3ファイルのみ
> 総合評価: A
> レビューモード: シリアル、6観点

## 変更サマリー

単独scheduleCheckのinventory生成に、正規prepareVerificationDetailsと同じStorybook source contextとsurface projectionを適用する修復。新規の小さい一時Git fixtureは実source解析・surface生成・台帳読込・登録照合・validatorを通し、projection省略とstory context省略を別々に検出する。

対象ファイル:

- scripts/e2e/scheduleCheck.ts
- scripts/e2e/scheduleCheck.test.ts
- scripts/e2e/scheduleCheckSurface.test.ts（最終177行）

参照コンテキスト: docs/plans/e2e-legacy-ci-sharding.md Batch 4、test-results/quality/pr10-standalone-repair-report.md。親編集中のdocs2ファイルはレビュー対象外。

## 評価詳細

### 1. コーディング規約準拠 OK

追加コードにany、non-null assertion、機密値、console出力、不要な独自型はない。fixture型は既存関数のReturnTypeから導出され、追加コメントは日本語。CLI内部コードの既存形式と整合している。fixture内のReact断片は解析入力であり、製品UIの新規実装ではない。

### 2. 設計・保守性 OK

本体のinventory式は正規prepareVerificationDetailsと一致する。新たなvalidator分岐や失敗救済を増やさず、欠落していた入力文脈と投影を補っている。既存mockテストは実空inventoryを返して新しいprojection境界を満たし、実ソース回帰は別ファイルで抽出器とvalidatorのstubを避けている。最終call-through spyは戻り値を偽装せず、実入口へ渡ったstory解析結果を観測する。

### 3. セキュリティ OK

外部入力からshell commandを生成する変更や認証境界への変更はない。既存の静的エラー・台帳読取エラーの詳細をreceiptへ漏らさないassertが維持されている。一時fixtureは既存helperの所有temp rootに限定され、cleanup前の実path親検査も維持される。追加資源はテスト用ファイルと一時Gitのみ。

### 4. パフォーマンス OK

新回帰は数個のsource/台帳ファイルを持つ最小fixtureで完結する。全repo解析、Next build、DB/browserは追加していない。実解析は独立した期待証拠の作成と本番入口の検証に各1回必要であり、削ると入口配線の誤りを見落とす。既存4テストの空inventory生成も小さい。報告された最終回帰約1.1秒は本修復の意味ある証明として妥当で、不要な長時間回帰は残っていない。

### 5. UX・アクセシビリティ OK

製品画面の変更なし。単独診断入口が正規surface台帳を誤って拒否する問題を除去し、失敗時のreceiptとメッセージは保持している。UI/a11y上の新しい問題はない。

### 6. バグ・ロジックエラー OK

isolated profileのcase/contract/exception scope、bindingsの厳格失敗、validation.issuesの厳格失敗、期待集合生成は維持されている。Promise.allSettledは台帳読取失敗時にも列挙子終了を待ち、runIsolatedCheckへの所有lifecycle接続・evidence検査・cleanup失敗の伝搬も維持する。timeout/retry/skip変更はない。

新回帰は投影済みinventoryのissues=0と、投影前inventoryのMISSING_TARGET2/UNEXPECTED_CHECK8をassertし、最終6登録のtestId一致を確認する。明示renderのStoryを追加した最終版では、実validatorへ渡ったinventoryのstoryReferences、同entryのbinding2件、未解決render診断0も確認する。context引数だけの欠落ではstoryReferencesが空になるため、この別の配線欠落も検出できる。

## 指摘一覧

- 必須: 0件
- 推奨: 0件
- 検討: 0件

暫定レビューでは、初版Storyがargsのみで明示renderを持たず、context追加の回帰証明が不足している点を伝達した。最終版の明示renderと実validator call-through観測を再確認し、解消済みと判断した。追加の恒久的な指摘はない。

## 検証と限界

独立レビュアーはSerenaによる対象symbolと関連実装の読み取りでレビューした。コード編集、Git操作、tests/typecheck/DB/browser/runtimeの実行は行っていない。

実装担当報告では最終限定2files/5tests、Biome、tscが成功し、context省略だけの変異でred、復元後greenを確認済み。これは担当報告として参照したもので、独立再実行した結果ではない。親が所有する実10件・環境cleanup・共通quality・Hosted再検証の合否は本レビューの対象外であり、ここで成功認定しない。

本修復はstandalone入口のdiscovery阻害を除くものであり、参加者INSERTの過去の間欠失敗を解消した証拠ではない。

## 親の実行受入と整形差分への対応

レビュー対象は3ファイル、+194/-2（196変更行、新規177行を含む）。単独所有run533bc32d5ae3の10件・journal10件が成功し、DB cleanup complete・専用port/所有container残留0を確認した。

初回quality33872a8baf99はscheduleCheck.tsのCRLF整形差分だけで停止。変異復元後の限定Biomeを新testだけに絞った検査漏れであり、LF正規化前後は改行以外の内容が完全一致することを確認した。全3ファイルのreadonly Biomeを再確認し、失敗記録は保持した。

新quality3c88f7f194d5 / selectiona17cdbeffeae / verification78ef7c20dc1fは成功。unit1,097成功/既存skip8、tools2,200成功、必須67・extras312、legacy330行のidentity/状態/例外を独立validatorで再照合した。入力前後digest一致、6 DB cleanup・7 process終了/エラー0、nativeの専用port/所有container残留0、コード3ファイルの検証前後SHA256一致を確認した。通常E2Eと別の上限21fixture診断は非再現という観測であり、品質ゲートreceiptへ混ぜていない。

公開後の最終headのHosted受入は別途必要で、本レビューとローカル結果はその代替ではない。
