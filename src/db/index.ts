import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL ?? '';

// グローバルシングルトンパターン（開発環境でのHMRによる接続リークを防止）
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};

// コネクションプール設定
const client =
  globalForDb.client ??
  postgres(connectionString, {
    max: 10, // 最大接続数（開発環境では少なめに）
    idle_timeout: 20, // アイドル接続を20秒後にクローズ
    connect_timeout: 10, // 接続タイムアウト10秒
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client;
}

export const db = drizzle({ client, schema });
