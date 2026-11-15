# PR10 main diagnostics combined差分レビュー

- 日時: 2026-11-08
- 起点: HEAD eae61a7273dd60e7c29fca908973f27321c19a20
- 対象: docs除外の未コミットコード/workflow全9ファイル、+115/-26（141変更行）。staged/unstaged/untrackedを確認。
- モード: Sol / medium、1担当・serial・6観点。既読scenario-manager-review-diffスキルを継続適用。Supabase fixture診断の範囲についてsupabase skillも確認した（API/DB/schemaの変更なし）。
- 総合評価: A。必須0、推奨0、検討0。最終共通qualityやHosted受入の代替ではない。

## 対象と変更内容

既存5ファイル（両workflow、githubEventSchema/test、AvailabilityWorkspaces.test.tsx）に、sessions.ts、sessionFixtures.test.ts、selectionConsoleSummary.ts、runChangedVerification.test.tsの4ファイルが追加されている。

sessions.tsは参加者INSERTのerrorありとerrorなしの返却row不一致を別々にthrowする。前者の診断にはHTTP status、SQLSTATE/PGRST形式のcode、ローカルで構築した参加者typeのみを含め、message/details/hint/接続先/ID/実rowは含めない。後者はstatus/typeだけを含める。

selectionConsoleSummaryは固定の帰属可能範囲を表すkeyをshadowFailureClassificationからshadowFailureAttributionPolicyへ改名する。実runのstatus/partial/full/shadow/failureには変更がない。

## 6観点

1. コーディング規約準拠: OK。Zod/DB生成型・既存型推論・isNil・日本語コメント/例外を維持。any/non-null assertion/console/型重複なし。追加テストは既存fixture API/intercept/反例パターンを使う。git diff HEAD --check成功（CRLF正規化警告のみ）。
2. 設計・保守性: OK。INSERT障害とデータ不整合を診断文だけで区別し、作成/検証/cleanupの構造を変えない。summary keyの新名とコメントが静的policyであることを正確に示す。qualityChangedのselection型はReturnTypeで追従し、run.tsは結果JSONをそのまま出すため手書き型修正は不要。repository内の旧key参照は撤去確認用testだけとなる。
3. セキュリティ: OK。codeは5文字ASCII英数字またはPGRST+3桁に限定され、未知値はunknown。statusはSupabase responseのnumber、participant_typeはDB返却値でなく直前にローカル定義したSPECTATOR/KEEPER/PLAYER。任意DB本文/接続情報/ユーザーID/rowを追加露出しない。新testがmessage/details/hint/private-db-codeの非露出と未知code fallbackを確認する。
4. パフォーマンス: OK。DB query/INSERT回数や成功経路を変更せず、失敗時の短いregex/文言分岐だけ。既存UI unit変更はwaitFor内の全画面role探索をbutton-selector textContent照合へ限定し、最終role照合を維持する。
5. UX・アクセシビリティ: OK。製品UI変更なし。summaryの名前変更により静的帰属policyを実失敗判定と誤読しにくくなる。UI unitはクリック前にbutton role/name、exact2件、対象enabledを確認し、通常位置/固定バーと1/2回目errorを維持する。
6. バグ・ロジックエラー: OK。旧条件 `error!=nil OR row!=expected` の双方を別々のthrowとして保持し、errorありでrowが正しくても失敗、errorなしでrow不正でも失敗する。成功時だけjournal.recordへ到達する順序も不変。reserve前/後の所有境界とINSERT失敗時予約保持テスト、既存role不整合testを保持する。summaryのkey名変更は実verification/shadow合否分岐に影響しない。full-required passed/failedかつshadow未実行の回帰ケースが新policy keyとshadow=nullを確認する。

## diff以外の文脈/consumer確認

- sessions.tsのparticipant配列、reserve→INSERT→厳密row照合→record、後続参加者集合照合とavailability作成までをdiff contextで確認した。失敗時throw/所有journalを維持している。
- sessionFixtures.test.tsのINSERT失敗table反例、API intercept、private messageテスト、新code table、既存participant_status=PENDINGの役割不整合拒否を確認した。row mismatchを成功へ変える変更なし。
- selectionConsoleSummary全体を確認し、status/phase/receiptPath/mode/coverage/partial/full/shadow/failureに変更がないことを確認した。
- repository検索で旧key/newkey/summary関数のconsumerを確認した。qualityChanged.tsはReturnTypeでstate.selectionへ格納し、run.tsはJSON出力。旧keyを合否判定やstrict schema consumerが要求する参照は見つからなかった。
- 既存retarget差分を再読し、perf exact base/類似名/push否定、main/develop/旧feat受理、workflow/schemaの許可集合一致を再確認した。
- 既存AvailabilityWorkspaces差分も再読し、timeout/retry/skipや最終assertの弱化がないことを確認した。

## 実施/未実施

git diff HEAD全9ファイル、関連context、consumer検索、status、untracked一覧、diff --checkを確認した。追加untrackedレビュー対象なし。docsは指定どおり今回レビュー対象外であり既存docs/reviews/diff-review-2026-11-08.mdを変更していない。

ソース/Git/remote mutation、テスト実行、Node/Serena helper起動、DockerDesktop/containers/portsの起動停止は行っていない。本レポートだけignored配下へ保存した。親が準備中の所有単独runとその後の共通gate/Hosted再受入で、実際の障害診断・最終合否・cleanupを確認する必要がある。今回の診断追加は元の障害原因を確定するものではない。

## 親による受入確認

全9コード差分の独立レビュー後、コードを固定してquality `f0187e70242a`を実行し、selection `240bd4bb92ae` / verification `306d2bf199f5` が成功。lint・型・unit1,097成功/既存skip8・tools2,199成功を確認した。独立artifact validatorで必須67・extras312・legacy330行の状態/identity、入力前後一致、6 DB cleanup・7 process終了/エラー0を再照合した。日程調整10件とlegacy4構成はすべて期待状態に一致し、診断追加のきっかけとなった失敗は非再現だった。ホスト上のNodeと稼働containerも0を確認した。

gate後の変更は計画・レビューへの受入事実と後続TODOの追記のみ。単独scheduleCheckにはsurface inventory不整合が残るため、その診断失敗を正規fullgateの成功に置き換えず別記録とした。元の間欠失敗の根本原因は未確定である。ローカル受入はmain追従前の証跡であり、最終headのHosted再受入やPR #10の本番マージ承認を代替しない。
