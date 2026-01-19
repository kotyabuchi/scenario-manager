import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? '';

// Edge/Serverless環境用の接続設定
// - max: 1 - 各リクエストで1接続のみ使用
// - prepare: false - prepared statementsを無効化（Supabase Transaction Pooler必須）
// - idle_timeout: 0 - 接続を即座にクローズ
// - max_lifetime: 0 - 接続の再利用を無効化
const client = postgres(connectionString, {
  max: 1,
  prepare: false,
  idle_timeout: 0,
  max_lifetime: null,
  connect_timeout: 30,
});

export const db = drizzle({ client, schema });
