import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? '';

// Cloudflare Workers / Edge Runtime 向けの接続設定
// Supabase Transaction Pooler (port 6543) を使用すること
const client = postgres(connectionString, {
  prepare: false, // Transaction Pooler必須
  max: 1, // Serverless環境では1接続
  idle_timeout: 0, // 接続を即座に解放
  connect_timeout: 30, // 接続タイムアウト
});

export const db = drizzle({ client, schema });
