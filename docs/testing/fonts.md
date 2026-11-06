# フォントのローカル配信

アプリとStorybookは共通の `src/app/globals.css` から `@fontsource-variable/noto-sans-jp/wght.css` を読み込む。package.jsonは5.3.1へ固定し、pnpm-lock.yamlのintegrityで配布物を固定する。ビルド時・ブラウザ表示時ともGoogle Fonts APIを使わない。

既存の `--font-noto-sans-jp` とPandaのbody/heading tokenを維持し、フォント名を `Noto Sans JP Variable` に設定する。weight100–900の可変フォントなので既存UIの400/500/600/700を含む。font-displayはswap、フォント全体のpreloadは行わない。

## 配布元とライセンス

- [Fontsourceの公式パッケージ資料](https://github.com/fontsource/font-files/blob/main/fonts/variable/noto-sans-jp/README.md)
- [Google Fontsの原本](https://github.com/google/fonts/tree/main/ofl/notosansjp)
- package metadata: Google Fonts v57、更新日2026-10-01、OFL-1.1、Japanese/Latin/Latin-ext/Cyrillic/Vietnameseを含む。
- ライセンスは依存パッケージに加え、公開先 `/fonts/noto-sans-jp-OFL.txt` に全文を保存する。

124個のunicode-rangeに分かれたWOFF2は合計5,473,652 bytes。これは全体の配布サイズであり、初回通信量ではない。ブラウザは使用文字を含む範囲だけを取得する。画面に現れる文言だけで日本語を削らず、ユーザーの自由入力を表示できる範囲を維持する。

5.3.1のwght.cssのSHA-256は `a363ae8ac50f96545aa0985eecf3f54b098a5442a71d77cc2d8b0c78ab602440`。124 facesすべてがunicode-range・weight100–900・swapを持ち、CSS内の外部URLは0、参照する124 assetsの存在を確認済み。

## 変更理由と検証

Next.js 16.1.6のnext/font/googleでは、Googleが時折返す拡張子なしURLをTurbopackが処理できず、本番buildが失敗した。[公式Issue #99114](https://github.com/vercel/next.js/issues/99114)の症状と一致する。Nextのinterception patchは別件なので維持し、フォントの取得経路だけを変更した。

依存更新時はfrozen install、本番build、Storybook build、両環境の日本語表示と400/700、同originのwoff2取得、Googleへの通信がないことを確認する。検証中に外部取得を無視・再試行して成功へ丸めない。最新の受入結果は [導入計画](../plans/e2e-ledger-rollout.md) と検証receiptに記録する。
