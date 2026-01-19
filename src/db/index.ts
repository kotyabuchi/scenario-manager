import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? '';

// Edge/Serverless環境用の接続設定
// - prepare: false - prepared statementsを無効化（Supabase Transaction Pooler必須）
const client = postgres(connectionString, {
  prepare: false,
});

export const db = drizzle({ client, schema });
