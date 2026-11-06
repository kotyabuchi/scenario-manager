# 前提PRのローカル受入記録（2026-11-06）

`feat/ui-local-test-prerequisite` は、UI境界 `b4c824e604e0e69da0e6e37f4a6bf60db83e71dc` と `main@ed6bc674824d46c617d71429467c7d146a8ab792` を統合した前提ブランチ。UIと既存E2Eのローカル基盤を含む。core/UI契約台帳、ソース抽出、変更選択、品質ゲートは後続の `feat/e2e-ledger-quality-gates` で導入する。

## 実行基盤

共有Supabaseの資格情報を使わず、固定CLI 2.75.0で専用DBを復元する。認証・データfixture、本番Next、登録照合、所有資源の後始末を品質側から再利用した。catalog一致と認可の完全性を区別し、既知の認可不足を検証成功に読み替えない。

専用ポートはDB27320–27322、Next23100、Storybook6007。OSの既定動的割当範囲から分離し、空き検査と所有権付きlockを維持する。Codex再起動や無関係なプロセスの終了は不要。[ポート方針](./isolated-runtime-ports.md) と [フォント配信](./fonts.md) を参照。

## 原本と限定的なUI移行

933c689の348登録から外部サービス依存18登録を区別し、330登録を検証する。原本は品質側bootstrapと干渉しない `e2e/legacy/` に置き、SHA-256を固定する。

| 原本 | SHA-256 |
| --- | --- |
| legacy-tests.generated.json | `5749da8e957182fd3546ddd54b6da1b2d1ad02507c2919031094bb6c0532dbe1` |
| legacy-execution.json | `5765001d944f979805973537ccd93f8dceeec88041768dd55fcabc363e42ee5b` |

現行UIと非互換なFAB開閉、GM操作、日程提出先、キャンセルせずにダイアログを閉じる操作について、PC/SP各5件の計10登録だけ移行した。`ui-compatibility.json` の固定SHA-256は `8499862c2d9f41abae27743f48e0ffcdd1b00d1e57777e5b215e56f97aaa02b8`。

原本を書き換えず、登録キー・旧本文・レビュー済み新本文を厳密に照合する。対応外の本文、登録、期待状態、注釈の変更は拒否する。サマリーには新旧対応を残し、結果は実行した新本文のfingerprintを保持する。品質側は契約登録済みreplacement18のspecを維持する。

## 最終検証

`pnpm e2e:legacy` の同一入力による一括実行は `status=passed / phase=aggregate`。330登録を照合し、319成功・既存skip9・既存fixme2だった。外部サービス依存18件は成功数に含めない。

| project | run ID | 成功 | 既存の未実行 |
| --- | --- | ---: | --- |
| chromium | `ac3883674e60` | 57 | なし |
| mobile-chrome | `627ee3759beb` | 48 | skip 9 |
| chromium-auth | `89efb7f27975` | 107 | fixme 1 |
| mobile-chrome-auth | `16c825950d4a` | 107 | fixme 1 |

全4環境でmigration復元・catalog照合・UI資源・fixture・DB環境のcleanupが成功した。サマリーはローカルの `test-results/quality/rollout-prerequisite-legacy-final.json` に保存する。認証情報、raw log、trace、storage stateは公開しない。

- lint・型検査と実行基盤の全120テストが成功。
- unit全体は1094成功＋既存skip8。その後に追加した匿名ページ遷移3件も限定実行で成功。
- フォントは品質側の共通ゲートと実ブラウザでローカルWOFF2、日本語400/700、Google通信0を確認済み。前提側の本番Nextも4環境でbuild・起動を確認。
- Sol/mediumの独立レビューで、原本照合、UI互換対応、Nextのrun識別、POMの表示待機に必須指摘は残っていない。

## 途中の失敗と修正

`9a1637533d23` はNextのrun識別ヘッダー不足によりreadinessで失敗。品質側と同一の設定を移し、通常build・専用run・旧形式・不正IDの4回帰を追加した。

`c686f86e5add` は旧UI指定と作成後のURL読み取りで失敗。限定対応表と、詳細URLまたは入力エラーまで待つPOMで修正した。続く `c111e72c9550` の説明文重複はSSRの一時的な隠しコピーと確認し、基本情報の可視化と非表示を含む1件への収束を待つPOMへ修正した。失敗記録を保持し、最終成功と区別する。

## PRと統合

前提PRはmain向け、品質PRは前提ブランチ向けに公開し、hosted CIを別途受け入れる。前提CIの集約は `Local E2E verification`。品質側は固定祖先933c689と8bbfed403163222a566589e56f4c83854219e56fを保持したmergeで取り込む。

main更新は既存Cloudflareデプロイを起動する。PRとCI結果を確認してからマージを判断し、品質側の `E2E verification gate` を前提PRが発行できない段階でmainに必須化しない。
