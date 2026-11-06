# 参加申請・取消の検証範囲

`applyToSessionAction` と `cancelApplicationAction` の契約を、専用DBのintegrationと既存Playwrightに接続する。契約は `e2e/ledger/contracts/session-application.json`、実行条件は `e2e/ledger/scenarios/session-application.json` に置く。アプリのActionやDBスキーマ自体を変更するものではない。

## 必須の実行条件

| 操作 | 条件 | 観測する結果 |
| --- | --- | --- |
| 申請 | 申請者、非参加者の自己申請 | Cookie/JWT本人のPENDINGだけを作成し、200文字のメッセージを保存。別利用者IDの申告で本人を切り替えない |
| 申請拒否 | 匿名、承認済み参加者 | エラーと参加行・親状態の保持 |
| 入力検査 | メッセージ201文字 | 保存せず拒否 |
| 取消 | 申請者本人 | 所有fixture内の本人PENDINGを削除し、他人の参加行を保持。主催者の別リクエストでも消失を再確認 |
| 取消拒否 | 匿名、本人申請のない非参加者、承認済み参加者 | 他人のPENDINGを含む状態を保持。入力の他人IDで取消主体を切り替えない |
| 入力検査 | 非objectの取消入力 | 本人のPENDINGを保持して拒否 |
| UI往復 | Chromium、mobile-chrome | 通常UIで申請・取消。申請者と主催者の独立contextを再読込し、導線・対象カード・メッセージ・取消後の消失を確認 |

integrationは6 case・10条件、UIは1 case・2 project。既存55登録に追加して、全体の必須登録は67になる。旧E2Eの追加実行対象312登録と、外部サービス依存で保留している18登録は別に扱う。

## 所有データと実行主体

`session-application` fixtureは、主催者・申請者・承認済み参加者・非参加者・匿名を同じcaseのjournalとleaseに結び付ける。認証利用者のAuth UUIDとアプリ利用者ULIDは別々に生成し、利用者JWTとアプリ側の本人対応を確認する。seedとcleanupだけが管理clientを使い、Actionと状態再取得は利用者のリクエストを通す。

作成するのはPUBLICかつRECRUITINGの所有セッション1件。空席を残し、比較用の承認済み参加行を持つ。取消ケースだけ申請者のPENDINGも作る。申請前に複合キーをjournalへ予約するため、書き込みの成否が不明でも既存cleanupが回収できる。観測に成功してからrecordまたはremovedへ進め、失敗時もfinallyで回収を待つ。

## 結果を品質ゲートへ結び付ける

登録収集はテスト本文を実行せず、固定されたcase・variant・binding・actor・projectを照合する。申請の10 integration条件と2 browser条件は、台帳とテストを同時に削除しても必須条件から外れない。未知variantの追加、別fixtureへの置換、別actorの証跡流用も拒否する。

integrationは状態の再取得と期待結果のassertion後にcheckを記録する。ゲートは標準結果、check、認証主体、所有journal、cleanup完了を照合する。browserは実行条件と標準結果に加え、独立contextで使ったactor、所有scenario・session各1件、正確な参加行の複合キー、許可された資源種別と全件回収を確認する。

更新は通常の `pnpm e2e:ledger:update` で生成し、`pnpm quality:changed --base <固定SHA> --all` で検証する。writerの成功や台帳の `implemented` は実行成功の証拠ではない。run別の結果と所有資源の回収まで受け入れて初めて検証完了とする。

## この契約で証明しないこと

- 固定catalogの `session_participants` はRLS無効で、anon・authenticatedに直接書込権限がある。この検証が確認するのはActionの本人拘束であり、直接DB書き込みの拒否やRLSによる保護ではない。
- fixtureは1セッションだけを使う。同じ利用者が別セッションにも申請している場合の保持や、承認と取消が競合した場合の原子性は対象外。
- 主催者画面は別利用者による再取得の観測に使う。管理者認可を独立に検証した証拠には数えない。
- 解消するcore不足は2 Actionの `aspect=contract` だけ。関連する未解決呼出、UI不足、外部サービス依存の保留を検証済みへ昇格させない。
