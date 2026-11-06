# UI操作の抽出と台帳の保守

## 抽出で分かること

inventory v2は、従来のroute・Action・関数・RPCのgraphを保持し、`surfaceAnalysis` にUI操作を追加する。画面からの描画、親から子へ渡すprops、callbackの呼出先を追い、操作と既存Actionを結びつける。

| 情報 | 意味 |
| --- | --- |
| `site` | JSX上のmountまたは操作の位置。行番号ではなく、所有関数・タグ・構造・静的属性からIDを作る |
| `entry` | 実ページ等のproduct入口、または明示したStorybookのrender入口 |
| `binding` | siteをどの入口・mount経路で使うか。同じ部品でも呼出箇所が違えば区別する |
| `flow` | 描画、props供給、handler・propsの呼出、遷移先への順序付きの経路 |
| `resolution` | 既存targetへ解決、ローカル処理、省略、外部遷移、未解決のいずれか |
| `diagnostic` | 静的に確定できなかった処理。入口・mount経路と構文の証拠を残す |

productとStorybookは別のTypeScript Programで解析する。Storyのmockを製品のActionに置き換えたり、Storybookだけの操作をproductの契約として数えたりしない。行番号は表示用であり、空行の追加だけで別の操作にはしない。同じ構造で区別できないsiteは診断に残す。

直接のalias、props、単純wrapper、標準のbind、確認済みのReact/RHF等の書き方を扱う。receiverの書換え、動的callback、未知のcomponentやspreadなど、確定できない経路は未解決として残す。任意のJavaScriptの実行結果を静的解析だけで再現する仕組みではない。

## 抽出とテストの証拠は別

Actionへつながった事実は、保存・認可・エラー表示が正しいことの証拠ではない。台帳の契約に期待する結果と実行条件を書き、登録されたcaseのassertionで確かめる。操作件数やfingerprintだけを見て検証済みにはしない。

基準の実装は日程確定。通常位置とモバイル固定バーは別surfaceで、どちらも `ConfirmAvailabilityWorkspace.handleConfirm` → inline Action → export Action → adapter → RPCを使う。`schedule-confirm-persist` は各権限・各ブラウザ登録の中でdesktop viewportから初回保存し、mobile viewportから全置換する。対象ボタンが1つで表示・有効、もう一方が非表示であることを確認して操作し、再読込と別参加者の再取得で結果を比較する。

UIの既定観点は `render`。保存や認可の既存Action/RPC契約は引き続き独立して扱う。新しいsurfaceの契約は `e2e/ledger/contracts/`、検証caseとの対応は `e2e/ledger/scenarios/` に記録する。

## v1からの初期移行

通常更新から初期化はできない。専用ローカルコマンドを使う。

```powershell
pnpm exec tsx scripts/e2e/ledgerRefresh.ts migrate-surface --base 8bbfed403163222a566589e56f4c83854219e56f
```

このSHAはM3受入後のv1祖先。移行は同じextractorで旧版と現在を再観測し、旧版のcore投影が保存済みv1と完全一致することを確認する。package・lock・Pandaの由来とGit/input snapshotも固定し、途中変更や再現できない入力を許さない。旧テストを現在の登録で代用しない。

- 旧版に存在したUI不足を `O`、現在の契約と実登録から得た不足を `H` とする。
- `H ⊆ O` を要求する。初回移行に新たな未解決や契約不足を紛れ込ませられない。
- 保存するUI不足は `H` と完全一致させ、解消済みキーは `O − H` として記録する。
- coreの `pending-baseline.json` とUI不足は分ける。UI不足を既存exceptionへ移しても、UI側の増加検査からは除外しない。

保存先は `inventory.generated.json` と、新設の `surface-pending.json` / `surface-migration.json`。あわせて登録済みtestの本文fingerprintを `legacy-tests.generated.json` へ同期する。HEAD・作業ツリー・再列挙の未登録test、setup、groupは完全一致し、登録済みtestもfingerprint以外のidentityを保持する必要がある。後者の移行史は導入後に再生成しない。`bootstrap` は旧v1用で廃止され、無条件のv2初期化経路はない。

初回公開のevent baseに台帳がない場合は、既存M1の外部bootstrap承認に加え、固定v1祖先がHEADの祖先であることを確認する。承認値を移行ファイルに書いて代用できない。この初回取り込みでは固定祖先を保持する必要がある。通常v2の比較やschedule/dispatchから初期化経路へ戻ることはできない。

## 導入後の変更

1. ソースと必要な契約・caseを変更する。解決不能な新しい依存は、対応する書き方への限定や抽出対応で解消する。契約を追加するだけでは未解決診断は免除されない。
2. 通常の `pnpm e2e:ledger:update` で生成物を更新する。実際のスクリプト引数は `package.json` を参照する。
3. `pnpm quality:changed --base <比較元>` を実行し、静的台帳とrunnerのreceiptを確認する。

通常更新ではtrusted HEADのUI不足より増えたキー、解消済みキーの再追加、移行史の変更を拒否する。静的検査では比較元の履歴・現行の再観測・保存内容を独立に照合する。全requiredへ実行範囲を広げても、この静的エラーを免除しない。

## 変更影響の選択

UI graphは既存graphへ投影して利用する。Actionや共有部品の変更を操作入口へ逆伝播させ、既存の機能ディレクトリ規則で選ぶcaseとの和集合を取る。UI graphだけに選択を置き換えない。

UI不足も選択時にはcore不足と合わせて評価する。未解決の呼出元が変更先を隠す可能性があるため、未解決依存があるソース変更は全requiredへ戻す。部分実行は既定のfull shadowと比較し、欠落・別snapshot・既存例外を成功に混ぜない。

staged hookはindex上のschema・ID・参照だけを検査する。全体の再抽出と実行証拠は品質ゲート・CIで確認する。CIのreceiptにはUI不足・移行史・観測元・snapshotのdigestを含め、別HEADや古いreceiptの流用を拒否する。

この文書はBatch 14の実装説明。実受入の完了状況は [作業記録](e2e-ledger-resume.md) と [品質ゲートの運用](e2e-quality.md) を参照する。
