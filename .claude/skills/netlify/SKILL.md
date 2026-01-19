---
name: netlify
description: Netlifyへのデプロイ、プロジェクト管理、Functions/Edge Functions作成、環境変数管理を行う。「netlifyにデプロイして」「netlify functionを作って」「環境変数を設定して」などで起動。
argument-hint: <command> [options]
metadata:
  author: scenario-manager
  version: "1.0.0"
---

# Netlify Management Skill

Netlify MCPを活用してNetlifyプロジェクトのデプロイ・管理を行うスキル。

## 利用可能なコマンド

| コマンド | 説明 | 例 |
|---------|------|-----|
| `deploy` | サイトをデプロイ | `/netlify deploy` |
| `status` | プロジェクト情報を確認 | `/netlify status` |
| `env` | 環境変数を管理 | `/netlify env list` |
| `function` | Serverless Functionを作成 | `/netlify function create hello` |
| `edge` | Edge Functionを作成 | `/netlify edge create auth` |
| `logs` | ログを確認 | `/netlify logs` |

## 実行フロー

### 1. 初期確認

まず現在のNetlifyプロジェクト状態を確認:

```
1. netlify-project-services-reader で siteId を取得
2. プロジェクト情報（デプロイ状況、環境変数等）を確認
3. netlify.toml の有無を確認
```

### 2. コマンド別処理

#### `deploy` - デプロイ実行

```typescript
// 1. プロジェクト一覧からsiteIdを特定
mcp__netlify__netlify-project-services-reader({
  selectSchema: {
    operation: "get-projects",
    params: { projectNameSearchValue: "プロジェクト名" }
  }
})

// 2. デプロイ実行
mcp__netlify__netlify-deploy-services-updater({
  selectSchema: {
    operation: "deploy-site",
    params: {
      siteId: "取得したsiteId",
      deployDirectory: "ビルド出力ディレクトリの絶対パス"
    }
  }
})
```

**デプロイ前チェック**:
- `netlify.toml` が存在するか確認
- ビルドコマンドの実行（`pnpm build` など）
- `.netlify` フォルダが `.gitignore` に含まれているか確認

#### `status` - プロジェクト情報確認

```typescript
// プロジェクト情報を取得
mcp__netlify__netlify-project-services-reader({
  selectSchema: {
    operation: "get-project",
    params: { siteId: "siteId" }
  }
})

// 最新のデプロイ情報を取得
mcp__netlify__netlify-deploy-services-reader({
  selectSchema: {
    operation: "get-deploy-for-site",
    params: { siteId: "siteId", deployId: "deployId" }
  }
})
```

#### `env` - 環境変数管理

```typescript
// 環境変数一覧を取得
mcp__netlify__netlify-project-services-updater({
  selectSchema: {
    operation: "manage-env-vars",
    params: {
      siteId: "siteId",
      getAllEnvVars: true
    }
  }
})

// 環境変数を設定
mcp__netlify__netlify-project-services-updater({
  selectSchema: {
    operation: "manage-env-vars",
    params: {
      siteId: "siteId",
      upsertEnvVar: true,
      envVarKey: "MY_API_KEY",
      envVarValue: "secret-value",
      envVarIsSecret: true,
      newVarContext: "all",  // all, dev, branch-deploy, deploy-preview, production, branch
      newVarScopes: ["all"]  // all, builds, functions, runtime, post_processing
    }
  }
})

// 環境変数を削除
mcp__netlify__netlify-project-services-updater({
  selectSchema: {
    operation: "manage-env-vars",
    params: {
      siteId: "siteId",
      deleteEnvVar: true,
      envVarKey: "MY_API_KEY"
    }
  }
})
```

#### `function` - Serverless Function作成

**コーディングルール取得が必須**:
```typescript
mcp__netlify__netlify-coding-rules({ creationType: "serverless" })
```

**テンプレート** (`netlify/functions/hello.mts`):
```typescript
import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const { name = "World" } = await req.json().catch(() => ({}));

  return new Response(JSON.stringify({ message: `Hello, ${name}!` }), {
    headers: { "Content-Type": "application/json" }
  });
};

export const config: Config = {
  path: "/api/hello"
};
```

#### `edge` - Edge Function作成

**コーディングルール取得が必須**:
```typescript
mcp__netlify__netlify-coding-rules({ creationType: "edge-functions" })
```

**テンプレート** (`netlify/edge-functions/auth.ts`):
```typescript
import type { Context, Config } from "@netlify/edge-functions";

export default async (req: Request, context: Context) => {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 認証成功時は次のハンドラーへ
  return context.next();
};

export const config: Config = {
  path: "/api/*"
};
```

#### `logs` - ログ確認

```typescript
mcp__netlify__netlify-project-services-reader({
  selectSchema: {
    operation: "get-project",
    params: { siteId: "siteId" }
  }
})
// → プロジェクトURLからNetlify Dashboardへのリンクを案内
```

### 3. netlify.toml の自動生成

プロジェクトに `netlify.toml` がない場合、以下のテンプレートを提案:

```toml
[build]
  command = "pnpm build"
  publish = ".next"  # または "dist", "out" など

[build.environment]
  NODE_VERSION = "20"

# Serverless Functions
[functions]
  directory = "netlify/functions"

# Edge Functions（必要な場合）
[[edge_functions]]
  path = "/api/*"
  function = "auth"

# リダイレクト（SPAの場合）
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## MCP Tools Reference

### Reader Tools（読み取り）

| Tool | 用途 |
|------|------|
| `netlify-user-services-reader` | ユーザー情報取得 |
| `netlify-team-services-reader` | チーム情報取得 |
| `netlify-project-services-reader` | プロジェクト情報取得 |
| `netlify-deploy-services-reader` | デプロイ情報取得 |
| `netlify-extension-services-reader` | 拡張機能情報取得 |

### Updater Tools（更新）

| Tool | 用途 |
|------|------|
| `netlify-deploy-services-updater` | デプロイ実行 |
| `netlify-project-services-updater` | プロジェクト設定更新、環境変数管理 |
| `netlify-extension-services-updater` | 拡張機能管理 |

### Coding Rules

| creationType | 用途 |
|--------------|------|
| `serverless` | Serverless Functions |
| `edge-functions` | Edge Functions |
| `blobs` | Netlify Blobs |
| `forms` | Netlify Forms |
| `image-cdn` | Image CDN |
| `db` | Netlify DB |

## 注意事項

1. **`.netlify` フォルダ**: ユーザーコード用ではない。`.gitignore` に追加すること
2. **CORS**: 明示的に要求されない限りCORSヘッダーを追加しない
3. **環境変数**: シークレット、APIキーは必ず環境変数で管理
4. **TypeScript推奨**: Functions/Edge FunctionsはTypeScriptを優先
5. **ローカル開発**: `netlify dev` でローカルサーバーを起動

## トラブルシューティング

### Blobsがローカルで動作しない
```bash
npm install @netlify/vite-plugin
```
Vite設定に追加して `npm run dev` で起動。

### デプロイが見つからない
```typescript
// プロジェクト一覧を検索
mcp__netlify__netlify-project-services-reader({
  selectSchema: {
    operation: "get-projects",
    params: {}  // 全プロジェクト取得
  }
})
```

### siteIdの取得方法
1. Netlify Dashboard URL: `https://app.netlify.com/sites/{site-name}/...`
2. `netlify status` コマンド（CLI）
3. MCP `get-projects` で検索
