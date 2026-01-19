import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? '';

// Cloudflare Workers / Edge Runtime 向けの接続設定
// - prepare: false - Transaction Pooler必須
// - idle_timeout: 0 - リクエスト完了後に接続を即座に解放
// - max: 1 - 単一接続のみ使用
// - connection: { application_name: 'scenario-manager' } - 接続識別用
const client = postgres(connectionString, {
  prepare: false,
  idle_timeout: 0,
  connect_timeout: 15,
  max: 1,
  connection: {
    application_name: 'scenario-manager',
  },
});

export const db = drizzle({ client, schema });
