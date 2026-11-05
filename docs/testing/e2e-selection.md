# 差分選択と実行証拠

変更に関係する登録済みケースを選び、既存の Playwright / Vitest と所有環境で検証する。全体の台帳整合を調べてから部分実行する。抽出の成功や baseline の許容だけでは、要件を検証済みと扱わない。

## コマンド

```powershell
# 従来どおり登録済み必須全件と legacy-local を実行
pnpm e2e:verify:all

# 明示した比較元から変更を選び、同じ入力の全件実行とも比較
pnpm e2e:verify:changed --base HEAD

# ローカル反復用。全件 shadow を実行せず、選択した集合だけを検証
pnpm e2e:verify:changed --base HEAD --no-shadow

# 変更選択の静的検査・理由記録を通しつつ全件へ拡大
pnpm e2e:verify:changed --base HEAD --all
```

`--base HEAD` でも staged / unstaged / untracked の変更を含む。比較元に branch 名を渡した場合も、最初に解決した commit ID へ固定する。ローカルの working tree を検査するため、staged の内容だけの合格証明ではない。

既定の shadow は部分検証の後に全件を実行する。実行時間を短縮する運用へ移る前に、選択漏れを調べるための段階導入である。最初から全件に拡大された場合は、同じ全件を二度実行しない。`--no-shadow` の成功は、未選択の回帰テストも成功したという意味ではない。

## 選択の手順

1. M1 の全体抽出、全登録、台帳、baseline、移行履歴を読み取り専用で検査する。
2. base / HEAD / index / working の Git 情報と実行入力を固定する。rename の両端、削除済みファイル、未追跡入力も扱う。
3. 各時点の TypeScript ソース・tsconfig・alias で依存グラフを作り、旧依存を含めて和集合にする。旧設定の JavaScript を実行したり checkout を切り替えたりしない。
4. 逆向きの依存追跡と `e2e/ledger/impact-rules.json` の機能対応表を加算する。認証、共通操作部品、設定、依存、台帳、テスト基盤は広域として扱う。
5. ケースの全 execution / binding / repeat、executionGroup と推移的依存、setup を含める。Vitest はファイル内全件へ拡大する。app を選ぶ場合は既存 legacy-local owner 全体を維持する。
6. 同じフィルターで guarded collection をやり直し、登録ID、原ソース位置、project、repeat、依存の完全一致を確認してから実行する。
7. 標準 runner 結果、native の fixture・actor・journal 検査、資源解放、開始・終了・途中の入力を照合する。

判定できない変更は全件へ拡大するか失敗する。変更パスが未知だから、またはグラフ構築に失敗したからという理由で0件にはしない。Playwright の有効なタイトルが test-list の形式で表現できない場合は専用理由を保存して無絞り込みの全件へ戻す。登録IDの不一致は失敗のままにする。

## 実行範囲の読み方

`full-required` は**登録済み必須ケース全件**を意味する。Batch 11 の実行集合は必須55登録、追加 legacy312登録であり、app の必須18登録は legacy-local330登録の内数である。55と330をそのまま足さない。

未移行の deferred-live18登録、旧 integration テスト11ファイル、fixture 診断用の実行は別の範囲にある。特に DB 変更では登録済み integration を全件選ぶが、旧 DB テストまで検証したとは扱わず `LEGACY_DATABASE_UNVERIFIED` を残す。

結果の `status` は実行ゲートの合否、`coverageStatus` と `coverageGapCodes` は変更に対する実行証拠の不足を示す。成功でも `insufficient` があり得る。新しい不足を baseline に追加して通すことは M1 が別途拒否する。CLI はこの区別、0件の有無、shadow の有無、未移行 DB テストが実行対象外であることを出力する。

### 0件

通常の結果 checker は業務登録0件を拒否する。別の NoOp 検査だけが、差分なし、または明示した文書 allowlist の変更を受理する。初期 allowlist は `README.md` のみ。全変更パスごとの根拠、グラフ・規則・全件 plan の digest、比較できない入力がないこと、終了時 snapshot の一致が必要になる。

`noOp: true` は「変更から選んだ実行が0件」という意味であり、既定の全件 shadow は引き続き実行する。NoOp に runner 成功の偽のレポートを作らない。

## Git 管理外の Panda 生成物

`styled-system/` は ignored でも実行入力である。由来を確かめず変更対象から除外しない。

レビュー済みの設定・プリセットの内容と、package / lock / patch が四時点で同一の場合に限り、固定済み依存を使って所有する別ディレクトリへ再生成する。入力ファイルの改変、予定外の出力、リンク、出力の追加・不足・内容差を拒否する。相対パスと raw SHA-256 の全件が既存の実行入力に一致した場合だけ、該当する ignored 入力を各グラフで共有する。元の実行入力 fingerprint は除外しない。

インストール済み pnpm lock と作業ツリーの lock の一致、Panda の固定版、CLI の開始・終了時ハッシュも記録する。依存実体は既存 runner と同じ信頼済み install を前提とし、全依存パッケージの真正性を独立に証明する仕組みではない。設定を変更した場合、再レビューされるまでは全件へ戻る。

Windows の初回方式確認では、異なる所有cwd二箇所と既存生成物の137ファイルが完全一致した。各実行では再生成を一回行って照合する。

## Shadow の判定

部分と全件で、Git snapshot、実入力、全登録、規則、全件 plan の digest を一致させる。verification ID と所有環境は別にする。独立 checker は全ケース、ファイル、executionGroup、setup、app owner の閉包も検査する。

- 全件側だけで未選択の必須キーが失敗した場合は `missed-required-failure`。
- 同じ選択キーの結果が食い違う場合は `nondeterministic`。
- hook、fixture、レポート、入力、後始末等に不備がある場合は `inconclusive`。成功に丸めない。
- 現段階で実レポートから assertion 由来の失敗キーを確定できるのは Storybook。isolated / integration / legacy の失敗は必要な失敗試行の証拠が揃わないため `inconclusive` とし、ゲートは失敗する。この分類範囲は CLI にも出す。

後続の stage や全件 shadow を開始するには、先行する子プロセスの実終了と所有資源の解放を確認する。失敗した DB owner は保守的に停止する。終了・解放を確認できた Storybook assertion の失敗だけは、比較のため後続へ進める。

全件が成功しただけで選択ロジックの完全性を証明したとはしない。削除、旧 alias、共有 Button、未知依存、serial 中間選択、意図した回帰を持つ fixture でも選択集合を検証する。

## 保存物

- `test-results/quality/selection.json`: 最新の差分検証の状態と子runへの参照。
- `test-results/verification/<selectionId>/`: 静的検査、Git開始・終了、生成物の由来、選択理由、有効 plan、shadow 比較。
- `test-results/verification/<verificationId>/`: 各実行の入力、plan、stageごとの標準結果と最終 receipt。
- `test-results/quality/verification.json`: 最新の子run。shadow がある場合は通常その全件実行。

公開 receipt にソース本文、認証情報、生の例外やログを持ち込まない。private log は公開用の証跡とは別に扱う。

## 現段階の制約

製品コードには未解決の依存参照が残るため、関係を確定できない変更は広く全件へ戻る。テスト専用変更など、登録との対応を確定できる範囲から部分実行する。細かな UI callback 経路の抽出は後続 Batch 14 の対象である。

安全性のため、部分実行でも全体 M1、四時点のグラフ、生成物確認、入力チェックを行う。現在は同じ設定の collector や入力走査が一部重複しており、0件でも準備時間はかかる。将来の再利用は入力の同一性を維持する範囲で行う。

Git・入力の照合は各 checkpoint の観測であり連続監視ではない。raw bytes を比較するため、改行コードだけの違いでも選択範囲が広がる。未ステージの rename は削除と追加の両方として扱う。
