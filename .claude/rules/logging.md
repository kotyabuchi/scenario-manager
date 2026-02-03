# Logging（ログ出力）

## 使用ライブラリ

**LogTape** (`@logtape/logtape`)

本番コードでは `console.log` / `console.error` / `console.warn` を使用しない。
必ず `src/lib/logger.ts` の `getAppLogger()` でロガーを取得して使用する。

## 初期化

`src/instrumentation.ts` の `register()` 関数でアプリ起動時に1回だけ初期化される（Next.js Instrumentation機能）。

## カテゴリ設計

`["app", "機能名"]` の形式で指定する。

| カテゴリ | 用途 |
|----------|------|
| `["app", "auth"]` | 認証関連 |
| `["app", "upload"]` | ファイルアップロード |
| `["app", "feedback"]` | フィードバック |
| `["app", "sessions"]` | セッション管理 |
| `["app", "scenarios"]` | シナリオ管理 |

新しい機能を追加する場合は `["app", "新機能名"]` のカテゴリを使用する。

## ログレベルの使い分け

| レベル | 用途 | 本番出力 |
|--------|------|----------|
| `error` | 操作失敗・例外キャッチ | ○ |
| `warn` | 注意が必要だが動作は継続 | ○ |
| `info` | 重要な処理の記録 | ✕ |
| `debug` | 開発時のみ必要な情報 | ✕ |

## 使用例

```typescript
import { getAppLogger } from '@/lib/logger'

const logger = getAppLogger(['app', 'auth'])

// テンプレートリテラル構文を使用（構造化ログ対応）
logger.error`認証コールバックでエラー発生: ${error}`
logger.warn`ファイルサイズ超過: ${fileSize}`
logger.info`ユーザーログイン完了: ${userId}`
logger.debug`リクエストパラメータ: ${params}`
```

## 例外

- テストコード内の `console.warn` / `console.error` は許容（テスト用途）
- HTMLテンプレートリテラル内のブラウザ側スクリプト（`<script>` 内等）は、サーバー側ライブラリのLogTapeが使用できないため `console` を使用してよい
