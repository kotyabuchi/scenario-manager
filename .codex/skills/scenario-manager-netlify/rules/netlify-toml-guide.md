# netlify.toml 設定ガイド

## 基本構造

```toml
# ビルド設定
[build]
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"

# Functions設定
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

# 開発サーバー設定
[dev]
  command = "pnpm dev"
  port = 3000
  targetPort = 3000
  autoLaunch = false
```

## フレームワーク別設定

### Next.js

```toml
[build]
  command = "pnpm build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

# Next.jsはNetlify Adapterが自動設定
# @netlify/plugin-nextjs が必要
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Vite / React SPA

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

# SPAのルーティング対応
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Astro

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

# SSR使用時
[[plugins]]
  package = "@astrojs/netlify"
```

## Edge Functions設定

```toml
# Edge Functionsディレクトリ（デフォルト: netlify/edge-functions）
[build]
  edge_functions = "netlify/edge-functions"

# 個別のEdge Function設定
[[edge_functions]]
  path = "/api/*"
  function = "api-handler"

[[edge_functions]]
  path = "/admin/*"
  function = "auth"

[[edge_functions]]
  pattern = "/products/(.*)"
  excludedPattern = "/products/public/(.*)"
  function = "product-handler"
```

### Edge Function実行順序

```toml
# 上から順に実行される
[[edge_functions]]
  path = "/admin"
  function = "auth"      # 1番目: 認証チェック

[[edge_functions]]
  path = "/admin"
  function = "logger"    # 2番目: ログ記録

[[edge_functions]]
  path = "/admin"
  function = "handler"   # 3番目: メイン処理
  cache = "manual"       # キャッシュ有効（最後に実行）
```

## リダイレクト設定

```toml
# 基本的なリダイレクト
[[redirects]]
  from = "/old-path"
  to = "/new-path"
  status = 301  # 恒久的リダイレクト

# パラメータ付きリダイレクト
[[redirects]]
  from = "/blog/:slug"
  to = "/articles/:slug"
  status = 301

# 条件付きリダイレクト（国別）
[[redirects]]
  from = "/*"
  to = "/ja/:splat"
  status = 302
  conditions = { Country = ["JP"] }

# プロキシ（外部APIへ）
[[redirects]]
  from = "/api/external/*"
  to = "https://api.example.com/:splat"
  status = 200
  force = true

# SPA fallback
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## ヘッダー設定

```toml
# グローバルヘッダー
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# 静的アセットのキャッシュ
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# APIのキャッシュ無効化
[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
```

## 環境変数

```toml
# ビルド時の環境変数
[build.environment]
  NODE_VERSION = "20"
  CUSTOM_VAR = "value"

# コンテキスト別設定
[context.production]
  command = "pnpm build"
  [context.production.environment]
    NODE_ENV = "production"

[context.deploy-preview]
  command = "pnpm build"
  [context.deploy-preview.environment]
    NODE_ENV = "preview"

[context.branch-deploy]
  command = "pnpm build"
  [context.branch-deploy.environment]
    NODE_ENV = "staging"
```

## プラグイン設定

```toml
# ビルドプラグイン
[[plugins]]
  package = "@netlify/plugin-nextjs"

[[plugins]]
  package = "netlify-plugin-cache"
  [plugins.inputs]
    paths = [".cache", "node_modules/.cache"]

# ローカルプラグイン
[[plugins]]
  package = "./plugins/my-plugin"
```

## ブランチ別デプロイ

```toml
# 本番環境（mainブランチ）
[context.production]
  command = "pnpm build"
  publish = "dist"

# ステージング（developブランチ）
[context.develop]
  command = "pnpm build:staging"
  publish = "dist"
  [context.develop.environment]
    API_URL = "https://staging-api.example.com"

# 特定ブランチ
[context.feature-x]
  command = "pnpm build:feature"
```

## Functions詳細設定

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

  # 外部モジュールをバンドルから除外
  external_node_modules = ["sharp", "canvas"]

  # 特定の関数にのみ適用
  [functions."heavy-function"]
    external_node_modules = ["puppeteer"]

  # スケジュール設定
  [functions."scheduled-task"]
    schedule = "@hourly"
```

## Deno Import Map（Edge Functions用）

```toml
[functions]
  deno_import_map = "./import_map.json"
```

**import_map.json**:
```json
{
  "imports": {
    "lodash": "https://esm.sh/lodash@4.17.21",
    "@/lib/": "./lib/"
  }
}
```

## セキュリティ設定

```toml
# Basic認証（_headersファイルでも可）
[[headers]]
  for = "/admin/*"
  [headers.values]
    Basic-Auth = "admin:password"

# CSP（Content Security Policy）
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'"
```

## 完全な設定例

```toml
# Next.js プロジェクトの例
[build]
  command = "pnpm build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[functions]
  directory = "netlify/functions"

[[plugins]]
  package = "@netlify/plugin-nextjs"

# Edge Functions
[[edge_functions]]
  path = "/api/auth/*"
  function = "auth-middleware"

# リダイレクト
[[redirects]]
  from = "/old-blog/*"
  to = "/blog/:splat"
  status = 301

# ヘッダー
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# 本番環境
[context.production.environment]
  NEXT_PUBLIC_API_URL = "https://api.example.com"

# プレビュー環境
[context.deploy-preview.environment]
  NEXT_PUBLIC_API_URL = "https://staging-api.example.com"
```
