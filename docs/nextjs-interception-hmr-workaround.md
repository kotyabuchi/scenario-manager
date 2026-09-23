# Next.js 16.1.6 の Intercepting Routes 開発時不具合

シナリオ一覧から詳細を開く2ペイン表示には、Next.js の Parallel Routes と Intercepting Routes を使う。Next.js 16.1.6 の開発サーバーでは、ファイル保存による HMR の後に Intercepting Route のリライトが重複し、この遷移が失敗する。本プロジェクトは pnpm のパッチで重複を防いでいる。

## 正常な表示と不具合の見分け方

- ビューポート幅1044px以上で `/scenarios` のカードをクリックした場合は、同じページ内に一覧と詳細を左右1:1で表示する。
- 1043px以下でのカード遷移、および詳細URLの直接表示・リロードでは、幅にかかわらず詳細を単独ページで表示する。これは設計どおりの動作。
- 1044px以上で一覧からカードをクリックしたのに詳細単独ページへ移る場合は、ブラウザーの Network で `/scenarios/[id]` の RSC リクエスト（`_rsc` パラメータ付き）を確認する。HTTP 500 とサーバーログの `Invalid interception route: /scenarios/(.)(.)(.)...` が揃えば、この不具合に該当する。遷移失敗後に通常のページ読み込みへ切り替わるため、結果として詳細単独ページが見える。

## 原因と適用中の修正

開発サーバーの HMR 更新時、Next.js が新しい Intercepting Route のリライトを `beforeFiles` に追加する前に古いものを消していない。保存を重ねると `(.)` が積み重なった無効なルートになり、RSC リクエストが500を返す。[Next.js の不具合報告 #91265](https://github.com/vercel/next.js/issues/91265) と [修正案 #91364](https://github.com/vercel/next.js/pull/91364) に同じ原因と対策が記載されている。

本プロジェクトの [`patches/next@16.1.6.patch`](../patches/next@16.1.6.patch) は、`next/dist/server/lib/router-utils/setup-dev-bundler.js` で古い Intercepting Route のリライトを除外してから新しいものを追加する。対象は開発サーバーの処理で、アプリ側のルーティング仕様は変更しない。パッチは `package.json` の `pnpm.patchedDependencies` に登録され、`pnpm-lock.yaml` にハッシュが記録されている。依存関係のインストール時に pnpm が自動適用するため、`node_modules` を手作業で編集する必要はない。

## 再現・確認手順

1. `pnpm install --frozen-lockfile` の後、`pnpm dev` を起動する。パッチ追加前から起動していたサーバーは再起動する。
2. 幅1280px程度で `http://localhost:3000/scenarios` を開き、カードをクリックして2ペイン表示を確認する。
3. ソースファイルを保存して HMR を発生させる。一覧へ戻ってカードを再度クリックする。この操作をもう一度繰り返しても2ペインが維持され、RSC リクエストが500にならないことを確認する。確認用に加えた変更は元に戻す。
4. 自動検証には `pnpm exec cross-env E2E_PORT=3000 E2E_REUSE=1 playwright test e2e/scenarios/routing.spec.ts --project=chromium --workers=1` を使う。このテストは2ペイン、狭幅・直URL・リロード時の単独表示、戻る／進むなどを検証する。ただし HMR 後のリライト重複そのものはテスト内で発生させないため、手順3も実施する。

パッチ適用時には、ファイル保存2回後のカード遷移と、開発サーバーを再利用した上記E2E 7件の成功を確認した。本番ビルドでのルーティング検証結果は [シナリオUIリデザインの実装状況](plans/ui-redesign-scenarios-status.md) を参照。

## Next.js 更新時

バージョンを上げる際は、対象バージョンに同じ修正が含まれるか確認する。修正済みなら `package.json` の `next@16.1.6` に対する `patchedDependencies` 設定とこのパッチファイルを削除し、`pnpm install` でロックファイルを更新する。その後、上記の HMR 後の手動確認とルーティングE2Eを通す。未修正なら、新バージョンに対してパッチが適用できるかを確認して更新する。古いバージョン向けのパッチ指定を残したままにはしない。
