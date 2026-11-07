# Hosted計時記録の訂正レビュー

> レビュー日: 2026-11-07
> 対象: 計画2件と既存レビュー記録の訂正。アプリ・テスト・CIコードの変更なし。
> 判定: Sol / mediumの独立監査で時刻計算とphaseの意味を確認。

初回成功run42340586935 attempt1、head `58f993019e0ef36abeb9f67e4cf78883eaddfbd5` のdesktop job128308817391には、公開ログの固定進捗時刻36件があった。当初の「公開ログに内部の時刻がない」という記録は誤りだった。artifactに所要時間の専用フィールドがないことと区別して訂正する。

| project | starting→inspecting | build→readiness | browser→evidence |
| --- | ---: | ---: | ---: |
| chromium | 139.973秒 | 44.734秒 | 76.277秒 |
| chromium-auth | 26.478秒 | 44.422秒 | 153.456秒 |

独立担当は保存した時刻から数値を再計算し、runnerコードで境界の意味も確認した。最初はSupabase環境の起動を含む区間、次はNext buildを中心とする区間、最後はPlaywright CLIとcheckpointを含む区間。migration単体・純粋なコンパイル・テスト本体の秒数には読み替えない。GitHubログのwall時刻であり、単調時計で計測した精密な内訳ではない。

cleanup開始の境界はあるが、環境cleanup終了の専用markerはない。receiptはcleanup完了・remaining空を示し、所要時間までは示さない。DB起動/migration/seed/catalogの各内訳、build内訳、環境cleanup総時間は引き続き追加計測候補とする。既存ログで復元できる粗区間へ同じ計測を重ねることは優先しない。

別の診断run42367955939 attempt1のmobileについても再計算したが、初回成功runへ混ぜていない。新しいrun自体の受入は同じhead/run/attemptの6組の成果物から独立検証済みで、全7job成功、必須67・extras312・全330行、6 DB cleanup・7 process終了を確認した。17分50秒／2,406 runner秒は別の成功観測である。過去の失敗2回とその3,848 runner秒は保持し、原因解消とは扱わない。

訂正コミットにはコード変更を含めない。直前の共通quality `4d49d90c882c` と診断headのHosted受入を記録し、訂正後の最終headのCIと成果物はPR本文で追跡する。最終headの結果を本文へ残すための文書コミットは重ねない。
