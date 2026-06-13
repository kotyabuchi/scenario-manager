# Netlify Functions 作成ガイド

## ディレクトリ構造

```
project/
├── netlify/
│   ├── functions/           # Serverless Functions
│   │   ├── hello.mts
│   │   ├── api/
│   │   │   └── index.mts
│   │   └── scheduled-task.mts
│   └── edge-functions/      # Edge Functions
│       ├── auth.ts
│       └── geolocation.ts
├── netlify.toml
└── package.json
```

## Serverless Functions

### 基本テンプレート

```typescript
// netlify/functions/hello.mts
import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  return new Response("Hello, World!");
};

export const config: Config = {
  path: "/api/hello"
};
```

### JSONレスポンス

```typescript
// netlify/functions/user.mts
import type { Context, Config } from "@netlify/functions";

interface User {
  id: string;
  name: string;
  email: string;
}

export default async (req: Request, context: Context) => {
  // リクエストメソッドの確認
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  // URLパラメータの取得
  const url = new URL(req.url);
  const userId = url.searchParams.get("id");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing user ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const user: User = {
    id: userId,
    name: "John Doe",
    email: "john@example.com"
  };

  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json" }
  });
};

export const config: Config = {
  path: "/api/user"
};
```

### POSTリクエストの処理

```typescript
// netlify/functions/contact.mts
import type { Context, Config } from "@netlify/functions";

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body: ContactForm = await req.json();

    // バリデーション
    if (!body.name || !body.email || !body.message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 処理（例: メール送信、DB保存など）
    console.log("Contact form submitted:", body);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/contact"
};
```

### 環境変数の使用

```typescript
// netlify/functions/api-call.mts
import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  // 環境変数はNetlify.env経由でアクセス
  const apiKey = Netlify.env.get("API_KEY");

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const response = await fetch("https://api.example.com/data", {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
};

export const config: Config = {
  path: "/api/external"
};
```

### Background Function（長時間処理）

```typescript
// netlify/functions/heavy-task-background.mts
// ファイル名に -background サフィックスが必須
import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  // この関数は即座に202を返し、バックグラウンドで実行
  // 最大15分間実行可能

  const body = await req.json().catch(() => ({}));

  console.log("Starting heavy task...", body);

  // 長時間処理
  await someHeavyOperation(body);

  console.log("Heavy task completed");
  // 戻り値は無視される
};

async function someHeavyOperation(data: unknown) {
  // 重い処理をここに実装
  await new Promise(resolve => setTimeout(resolve, 60000));
}
```

### Scheduled Function（定期実行）

```typescript
// netlify/functions/daily-cleanup.mts
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  const { next_run } = await req.json();

  console.log("Running daily cleanup...");
  console.log("Next scheduled run:", next_run);

  // クリーンアップ処理
  await performCleanup();

  console.log("Cleanup completed");
};

async function performCleanup() {
  // 定期実行する処理
}

export const config: Config = {
  // CRON式（UTC）
  schedule: "0 0 * * *"  // 毎日0:00 UTC
  // プリセットも使用可能
  // schedule: "@daily"
  // schedule: "@hourly"
  // schedule: "@weekly"
};
```

## Edge Functions

### 基本テンプレート

```typescript
// netlify/edge-functions/hello.ts
import type { Context, Config } from "@netlify/edge-functions";

export default async (req: Request, context: Context) => {
  return new Response("Hello from the Edge!");
};

export const config: Config = {
  path: "/edge/hello"
};
```

### 認証ミドルウェア

```typescript
// netlify/edge-functions/auth.ts
import type { Context, Config } from "@netlify/edge-functions";

export default async (req: Request, context: Context) => {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const token = authHeader.slice(7);

  // トークン検証
  if (!isValidToken(token)) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 認証成功、次のハンドラーへ
  return context.next();
};

function isValidToken(token: string): boolean {
  // トークン検証ロジック
  return token.length > 0;
}

export const config: Config = {
  path: "/api/*",
  excludedPath: ["/api/public/*", "/api/health"]
};
```

### 地域ベースのコンテンツ

```typescript
// netlify/edge-functions/geolocation.ts
import type { Context, Config } from "@netlify/edge-functions";

export default async (req: Request, context: Context) => {
  const country = context.geo?.country?.code || "US";
  const city = context.geo?.city || "Unknown";

  // 日本からのアクセス
  if (country === "JP") {
    return new Response(
      JSON.stringify({
        message: "こんにちは！",
        country,
        city
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // その他の国
  return new Response(
    JSON.stringify({
      message: "Hello!",
      country,
      city
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};

export const config: Config = {
  path: "/api/greeting"
};
```

### レスポンスの変換

```typescript
// netlify/edge-functions/transform.ts
import type { Context, Config } from "@netlify/edge-functions";

export default async (req: Request, context: Context) => {
  // 元のレスポンスを取得
  const response = await context.next();

  // HTMLの場合のみ変換
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  // HTMLを取得して変換
  let html = await response.text();

  // バナーを挿入
  html = html.replace(
    "</body>",
    `<div id="promo-banner">Special Offer!</div></body>`
  );

  return new Response(html, {
    status: response.status,
    headers: response.headers
  });
};

export const config: Config = {
  path: "/*",
  excludedPath: ["/api/*", "/_next/*", "/assets/*"]
};
```

### A/Bテスト

```typescript
// netlify/edge-functions/ab-test.ts
import type { Context, Config } from "@netlify/edge-functions";

export default async (req: Request, context: Context) => {
  // 既存のCookieをチェック
  const cookies = req.headers.get("Cookie") || "";
  let variant = cookies.match(/ab-variant=([AB])/)?.[1];

  // 新規ユーザーにはランダムに割り当て
  if (!variant) {
    variant = Math.random() < 0.5 ? "A" : "B";
  }

  // リクエストヘッダーにバリアントを追加
  const modifiedRequest = new Request(req.url, {
    method: req.method,
    headers: new Headers(req.headers)
  });
  modifiedRequest.headers.set("X-AB-Variant", variant);

  const response = await context.next(modifiedRequest);

  // Cookieを設定
  const newResponse = new Response(response.body, response);
  newResponse.headers.append(
    "Set-Cookie",
    `ab-variant=${variant}; Path=/; Max-Age=604800`
  );

  return newResponse;
};

export const config: Config = {
  path: "/*"
};
```

## Netlify Blobs との連携

```typescript
// netlify/functions/cache.mts
import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  const store = getStore("cache");
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response(JSON.stringify({ error: "Missing key" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "GET") {
    const data = await store.get(key, { type: "json" });
    if (!data) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "POST") {
    const body = await req.json();
    await store.setJSON(key, body);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "DELETE") {
    await store.delete(key);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
};

export const config: Config = {
  path: "/api/cache"
};
```

## 開発・テスト

### ローカル開発

```bash
# Netlify CLIでローカルサーバー起動
netlify dev

# 特定のFunctionをテスト
netlify functions:invoke hello --payload '{"name": "World"}'

# Scheduled Functionのテスト
netlify functions:invoke daily-cleanup
```

### 型定義のインストール

```bash
# Serverless Functions
npm install @netlify/functions

# Edge Functions
npm install @netlify/edge-functions
```

## 注意事項

1. **グローバルスコープ**: 関数定義外にグローバルロジックを書かない
2. **TypeScript推奨**: `.mts` 拡張子を使用
3. **環境変数**: `Netlify.env.get()` を使用
4. **CORSヘッダー**: 明示的に要求されない限り追加しない
5. **タイムアウト**:
   - Serverless: 10秒（デフォルト）
   - Background: 15分
   - Scheduled: 30秒
   - Edge: 50ms CPU時間
