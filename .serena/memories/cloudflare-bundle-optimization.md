# Cloudflare Workers バンドルサイズ最適化

## 問題
Cloudflare Workers Freeプランのgzip 3MB制限でデプロイ失敗。

## 原因
1. Drizzle ORM + postgres パッケージが大きい（約200KB gzip）
2. Next.js内部の`@vercel/og` WASMファイル（resvg.wasm 1,346KiB + yoga.wasm 86KiB）が自動バンドルされる

## 解決策

### 1. Drizzle ORM → Supabase REST API移行
- `drizzle-orm`, `postgres`, `@neondatabase/serverless`, `drizzle-kit`, `ws` を削除
- Supabaseクライアント（既に認証で使用済み）でデータアクセス
- 詳細: `.claude/docs/migration-drizzle-to-supabase.md`

### 2. @vercel/og WASMファイルの除去
- プロジェクトでは`@vercel/og`を一切使用していないが、Next.js内部から自動バンドルされる
- `edgeExternals`や`serverExternalPackages`では除外不可（効果なし）
- **解決**: CIのビルド後ステップで空のWASMモジュール（8bytes）に置換
- ファイル: `.github/workflows/deploy-cloudflare.yml`

### 結果
- 移行前: gzip 3,210 KiB（デプロイ失敗）
- 移行後: gzip 2,664 KiB（約17%削減、400KiB余裕）

## 注意事項
- `next.config.ts`の`serverExternalPackages`にOG関連を入れても効果なし
- `open-next.config.ts`の`edgeExternals`にOG関連を入れても効果なし
- WASMはnode_modules内の`next/dist/compiled/@vercel/og/`から参照される
- 将来Next.jsをアップグレードする際、OG機能を使う場合はCIステップの削除が必要
