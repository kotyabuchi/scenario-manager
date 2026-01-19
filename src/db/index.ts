import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? '';

// Edge/Serverless環境用の接続設定
// - prepare: false - prepared statementsを無効化（Supabase Transaction Pooler必須）
// - idle_timeout: 20 - アイドル接続のタイムアウト（秒）
// - connect_timeout: 10 - 接続タイムアウト（秒）
// - max: 1 - Serverless環境では1接続のみ使用
const client = postgres(connectionString, {
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
  max: 1,
});

export const db = drizzle({ client, schema });
