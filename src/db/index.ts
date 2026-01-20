import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? '';

/**
 * Cloudflare Workers / Edge Runtime 向けのDB接続
 *
 * Cloudflare Workersではモジュールレベルで初期化したI/Oオブジェクトを
 * 複数リクエスト間で再利用できないため、リクエストごとに新しいクライアントを作成する
 * @see https://zenn.dev/ud/articles/2cfd6050ef8f1e
 *
 * Supabase Transaction Pooler (port 6543) を使用すること
 */
export const getDb = () => {
  const client = postgres(connectionString, {
    prepare: false, // Transaction Pooler必須
    max: 1, // Serverless環境では1接続
    idle_timeout: 0, // 接続を即座に解放
    connect_timeout: 30, // 接続タイムアウト
  });
  return drizzle({ client, schema });
};

// 後方互換性のため残すが、Cloudflare Workers環境では getDb() を使用すること
// ローカル開発やビルド時にはこちらが使われる
export const db = getDb();
