# 静的テスト台帳（M1）

現在のゲートは実装の入口、必要な観点、Playwrightの実登録、既存不足の整合を確認します。DB・ブラウザ・test bodyは実行しないため、合格はE2Eの実行成功を意味しません。日程確定の7caseはまだplannedです。

## 日常の検査

```sh
pnpm e2e:ledger:check --base <レビュー対象の比較commitまたはref>
```

ローカルはbaseを明示します。PR CIはイベントのbase/head SHAを使い、`--base`を拒否します。保存したinventoryとlegacy目録の陳腐化、台帳と登録の不一致、既存不足の増加、理由のない契約縮小を検出します。台帳ファイルは変更せず、詳細は`test-results/quality/static-gate.json`へ出力します。列挙の一時ログは`test-results/discovery/`です。

実装を変更した後、保存物の差分を確認するには次を実行します。

```sh
pnpm e2e:ledger:update
pnpm e2e:ledger:check --base <比較ref>
```

updateは再抽出と保存を行い、新しい不足をbaselineへ追加する更新は拒否します。解消済み項目は取り除きます。既存testを変更した場合はcase/variant IDへの移行が必要です。再生成だけで比較元のlegacy制約を解除できません。inventoryだけを更新・検査する場合は`pnpm e2e:inventory` / `pnpm e2e:inventory --check`も使用できます。

## 初回bootstrapのレビュー

`pnpm e2e:ledger:bootstrap`はbaselineがない場合だけ使用する、初回導入用の生成コマンドです。既存baselineを上書きせず、通常checkからは呼びません。

初期状態は不足110項目と未解決診断363項目、計473項目です。診断はowner・構文hash・同一構文の出現番号で識別し、行移動では増えません。同じ位置から始まる入れ子のcallを区別した結果、旧位置キーで統合されていた16件も保持しています。例外で消してはいません。

初回PRでは全baseline、契約、legacy目録、抽出器の範囲をレビューします。比較baseにbaselineがないという理由だけではCIを通しません。レビュー後、リポジトリ管理者がActions変数`E2E_LEDGER_BOOTSTRAP_APPROVAL`へ次のJSONを設定します。秘密情報ではありません。

```json
{"base":"<PR eventのbase SHA>","head":"<レビュー済みhead SHA>","digest":"<bootstrapが出力したbaselineDigest>"}
```

3値の完全一致が必要です。head・base・不足内容が変わったら再レビューします。取り込み後は変数を削除できます。通常変更ではGit objectのbase baselineと比較するため、この変数で不足増加を許可できません。base commitが取得できない場合は常に失敗します。workflow/checker自体の変更はコードレビューとbranch protectionの管理対象です。

## 契約・例外の変更理由

contract、caseの観点・端末・actor削減、例外追加などは`policyDeltas`として報告します。意図した変更は`migrations.json`の`entries`へ次の構造で記録し、レビューに含めます。

```json
{
  "base": "<比較base SHA>",
  "policy": [{"deltaId":"<報告されたid>","reason":"変更理由","reference":"仕様またはレビュー記録"}],
  "legacy": []
}
```

理由は正確なdeltaへ対応付け、不要な理由・重複・別baseへの新しい記録を拒否します。過去の記録は保持します。legacyの移動は`legacy`に`from`・`to`・`reason`を指定します。移動記録で本文変更や端末削減を隠せません。理由の記録は変更の妥当性を自動承認するものではなく、新しい不足の追加も許可しません。

## 対応範囲

現段階では既存appとStorybookの設定をguard付き`--list`で列挙します。共有Supabase資格情報は子プロセスへ渡しません。guardは既知の誤ったimport時I/Oを止める仕組みであり、任意の悪意あるコードを実行するsandboxではありません。source map adapterは実際のrunnerのPlaywright 1.57.0に固定しています。

新しい独立workflowはDB用Secretsを参照しません。既存`test.yml`の移行、専用DB環境、実行証拠の厳密な検査は後続Batchで導入します。
