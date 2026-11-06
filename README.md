This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## テストと品質検査

固定lockfileで `pnpm install --frozen-lockfile` を実行し、`pnpm prepare` でPandaCSSを生成する。

| コマンド | 対象 |
|---|---|
| `pnpm check:ci` | 書き換えを行わないBiome検査 |
| `pnpm typecheck` | TypeScript型検査 |
| `pnpm test:unit` | DB不要のunit・DOM・componentテスト |
| `pnpm test:e2e-tools` | 自動抽出・台帳など検査ツール自身のテスト |
| `pnpm test:integration` | 専用ローカルDBを使う既存integrationテスト |

`pnpm vitest` は `test:unit` と同じDB不要の設定を使う。従来混在していた11ファイルは
`scripts/e2e/db-test-files.json` に列挙してintegrationへ移した。新しいDB依存テストもこの一覧へ登録する。
テストファイルは設定読込時に全件分類し、通常の検査から実DBクライアントを使用すると明示的に失敗する。
DBモジュールを完全にモックするpureテストは、同じ一覧の `mockedFiles` にパスと理由を記録する。
この登録でも実SDKのclient生成は禁止されるため、テスト側に必要なモックを用意する。

integrationは `.env` を自動読込せず、専用の `E2E_SUPABASE_URL`、`E2E_SUPABASE_ANON_KEY`、
`E2E_SUPABASE_SERVICE_ROLE_KEY` が必要。接続先はloopbackのみを許可する。
既存クラウドのキーや開発DBを流用せず、廃棄可能なテスト用環境を用意する。
環境構築とfixture移行は実装計画のBatch 7以降で行い、それまでは未設定時の事前失敗が期待結果となる。
既存integrationの早期return・環境依存skip等は一覧の `legacyRisks` に記録し、
単なるrunner成功を台帳の検証済み証拠には使用しない。

開発時は変更を整形してから `check:ci` → `typecheck` → `test:unit` → `test:e2e-tools` を実行する。
DBに関係する変更では、専用環境を確認したうえで `test:integration` も実行する。

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
