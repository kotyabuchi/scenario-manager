# E2E バナー表示の状態同期

`scenario-new-banner.spec.ts` のクリア時の固定 500ms を、Playwright の自動再試行する非表示 assertion に置き換える。最初に BOOTH URL の note 表示を確認した後、clear 操作による非表示を待つため、初期状態の非表示では成功しない。実装の debounce と UI は変更しない。

非対応 URL のケースは元の初期入力→非表示検査と固定 500ms を維持する。初期状態からの検出を BOOTH→非対応 URL への遷移だけで置き換えると、異なる回帰を見逃し得る。初期状態から debounce の完了を安全に識別できる observable を確認してから別途検討する。

変更する clear ケースを `legacy-banner-clear` / `clear` variant / `main` binding に移行する。chromium-auth・mobile-chrome-auth の各旧 registration と fingerprint を base `8fef59b92b98823b142922dbb57c05f927dac51d` の Git object に結び付け、同じ project の新登録へ1:1 replacement する。実行義務330と既存例外を維持する。新登録数・未移行数・planDigest は生成後に実測し、選択されるテストの意味的同等性と区別する。

効果や flaky 率の短縮は未計測。固定 head の chromium-auth 入口と Hosted 実ブラウザー・全体検証、結果・cleanup の独立受入を別途実施する。実行前に限定検査を動作成功と混同しない。

## 保留する次の調査

feedback 投票は楽観表示が server mutation 成功を意味しないため、固定待機を表示 assertion に置き換えるだけでは永続化・失敗時 rollback を保証できない。所有可能な個別 fixture と mutation 完了・再読込・失敗時の観測可能な境界を先に調べる。

E2E 責務移管・重複削減は旧 identity/assertion と新しい層・実行証拠の対応を先に契約化する。空送信→resolver→error 表示や検索→URL/詳細等の代表経路は保持し、未実行の移管先を理由に browser assertion を削除しない。

## 検証状況

台帳登録前の list では既存6ケースと依存 auth-setup 1件を列挙、対象 Biome に成功。初回 ledger check は base 無指定で失敗、base 指定後は変更ケースの case ID 不足で失敗した。旧2ケースを case 化した中間案は非対応 URL の初期入力検査を失うため撤回し、clear のみ1:1移行する。共有 snapshot 更新中に正規 ledger update を開始した試行は snapshot 変更で拒否され、生成物は未更新。その後、全担当 freeze 後に正規生成と fixture・ledger 検証を行った。

初回 typecheck は並行変更中の isolatedApp の未使用 import で失敗し、統合 freeze 後の型検査は成功。実ブラウザー・Hosted は未実施。

## 統合時の台帳検証

正規 `e2e:ledger:update` は成功（pending 435・baseline digest 不変）。`--base 8fef59b...` の ledger check は issues 0 / policyDeltas 0。元348登録の分類は local 301→299、replacement 18→20、既存 skip 9・fixme 2・deferred 18 は不変で、非 deferred の実行義務は330を維持する。再生成された legacy discovery は未登録330→328、case 登録全体37→39（app 18→20）。required plan の固定 fixture は67→69（app 18→20、他 profile 不変）。extras の実測値や計画 digest は固定 head の計画生成・Hosted 受入で確認する。

生成前の関連 fixture 実行は目録不一致で失敗し、生成後の初回は旧固定集計期待値4件のみ失敗した。実集合の期待値を更新し、旧 origin と新 case の接続を保つ selection/result を含む153件、requirements/plan/CI legacy results の51件に成功。Playwright list は対象6件＋auth setup 1件で、browser は起動していない。

別の runLegacy fixture では sandbox 上で async realpath と fixture のパス文字列の大小文字が異なり3件失敗。fixture root 自体を置換する初案はテスト所有 temp の既存 cleanup guard と衝突して30件失敗したため撤回し、runner と同じ async realpath を spy の期待値3箇所だけに使用。引数の全体一致と既存 cleanup guard を保持して35件成功。失敗試行時に guard が拒否した test-owned temp directory の残留有無は統合側で確認する。

## 2026-11-16 統合レビュー時点

旧登録2件から同一projectのclear caseへ一対一で移行し、非deferred実行義務330・既存例外を維持。関連239件、型検査、Biome、ledger checkに成功した。過去のfixture cleanup guard失敗の一時領域は所有証明可能な現在の残留候補が見つからず、削除はしていない。固定HEADの全体quality・実ブラウザ・Hostedはこれから検証する。単発成功や静的検査を間欠失敗の根治や速度改善と扱わない。
