# Batch 6 参加申請・取消の差分レビュー

対象は `35920f0cbb9bd2bcfd96deb0088cb9ffd6dafafd` をHEADとする時点のBatch 6の未コミット差分。専用fixture、Actionのintegration、ブラウザの往復操作、登録と証跡の照合をレビューし、ローカルの全件品質ゲートと所有資源の回収を受け入れた。

## 実装と証拠の範囲

- 専用の公開募集中セッション1件を使う。主催者、申請者、承認済み参加者、非参加者を別々のAuth UUIDとアプリ利用者ULIDへ結び付け、匿名も検証する。空席を1つ残し、取消ケースにだけPENDINGを作成する。管理clientはseedとcleanup、Actionと独立再取得は利用者のCookie・JWTを通る。
- integrationは6 case、10条件。本人と非参加者の自己申請、匿名と承認済みの申請拒否、200文字の保存と201文字の拒否、本人PENDINGの取消、匿名・本人行なし・承認済みの取消拒否、非object入力を確認する。余分な他人IDを渡した場合も申請はJWT本人にだけ作られ、取消は本人行がなければ拒否される。独立した再取得と再検証要求の照合後にcheckを記録する。
- ブラウザはChromiumとmobile-chrome各1件。申請者と主催者の独立contextで通常UIを操作し、再読込後の申請状態、管理画面の対象カードとメッセージ、取消後の消失、比較用カードの保持を確認する。複合キーを事前に予約し、観測後のrecord／removedと既存cleanupへ結び付ける。
- integrationの日程・RPC・カレンダー20条件と日程確定ブラウザの必須4条件は維持した。新規登録は固定case・variant・binding・actor・project・checkを照合し、条件削減、未知variant、別fixture／actorの流用、不正journalと未回収を拒否する。

## 指摘と対応

| 観点 | 確認・対応 |
| --- | --- |
| 所有fixtureの回収 | PENDINGの作成応答が失敗しても複合キー予約を保持する。申請fixtureと共通cleanupの既存回帰で、予約状態の実在参加行が回収対象になることを確認した。 |
| integrationの証明範囲 | 取消による他人行の保持は同一の所有卓で確認した。別卓の同一利用者行を保護する対照は今回の契約に含めない。 |
| integrationの否定証跡 | 不正親をjournal schemaで拒否するテストと、schemaを通る未回収journalをcleanup検査で拒否するテストを分けた。validator単独のcaseとfixtureの照合、1 variantの削減、未知variantの追加も回帰化した。 |
| ブラウザの所有証跡 | 申請専用journalについて、主催者所有scenario・session各1件、正確な参加行3件、許可された資源種別、全件回収を要求した。scenario欠落と日程fixtureの資源混入を拒否する。 |
| ブラウザのactor型 | own propertyと存在の両方を検査してからactorを利用する。型検査を再実行して通過した。 |

必須指摘は対応済み。限定ツール検査は6ファイル137件が通過した。

## 先行検査と台帳差分

先行型検査はブラウザfixtureでactorの未定義を指摘する `TS18048` 2件で失敗し、存在確認の修正後に通過した。初回の台帳writerはVitest収集段階で失敗し、再実行は終了0だった。先行の全ツール検査は144ファイル2074成功・2失敗。既存assertionがcase付き登録35件、検証済みDBファイル3件を期待していたため、新規登録に合わせて37件、5件へ更新した。関連4ファイル69件が通過した。

正規writerでcore不足から2 Actionの `aspect=contract` だけを退役し、新規不足は0。生成した登録はisolatedのChromium／mobile-chrome各1件だけを追加した。既存行、関連する4件の未解決呼出、UIと管理画面の独立不足、固定UI移行履歴、旧legacyとreplacement、外部サービス依存の保留18件を維持した。

## 最終ローカル受入

| 項目 | 実績 |
| --- | --- |
| 固定base / head | `35920f0cbb9bd2bcfd96deb0088cb9ffd6dafafd` / 同一。そのHEAD時点の未コミット差分を検査 |
| 品質 / 選択 / 実行 | `1f43a7c0543e` / `56904e39b167` / `26c8e7ed4c81`。いずれも成功 |
| 品質前段 | lint・型・静的台帳成功、unit 1097成功＋既存skip 8、tools 145ファイル2087成功 |
| 実行 | 67必須成功（app 18、integration 30、isolated 10、Storybook 9）、旧E2E追加登録312、全7ステージ。追加integration 10件とブラウザ2件はすべて成功。全件選択のためshadowの重複実行なし |
| 入力 | 前後の入力証跡はバイト一致。入力digest `5c44d021b0a727bc871c72059121cd583a221f9a212b7d70fe5a8d764b28e1f4`、28 checkpointsの差分0。Git snapshot digestも前後一致 |
| 独立受入 | `test-results/quality/accept-batch6.1f43a7c0543e.json` のreceipt照合と実資源監査が成功。全ステージで終了とcleanupを確認。6環境のDocker資源、記録された11個のlock、実行IDで識別可能なホストプロセスの残留0。専用5ポートのlistenerとactive-or-boundは0（TIME_WAITを除外） |
| 残る不足 | core 435、UI 658、deferred-live 18。coverageは `insufficient` |

固定catalogの `session_participants` はRLS無効で、anon／authenticatedに直接書込権限がある。今回の合格はActionのCookie本人拘束と単一所有卓での永続化・入力検査・再取得に限る。直接DB書込の拒否、RLS、別卓にある同一利用者行の保持、承認と取消の競合時の原子性は未検証。主催者contextの一覧は独立した観測であり、管理者認可の別証明には数えない。

各コミット前に検証済み差分のバイトを記録と照合し、検証範囲文書までを `a996566` から `b168000` の11コミットに分割した。Batch 5・6追加後のPR #8最終headに対するHosted CIは未実行。実行方法と検証範囲は [参加申請・取消の検証](../testing/session-application-verification.md) を参照。
