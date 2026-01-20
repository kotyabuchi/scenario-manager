import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? '';

// Cloudflare Workers / Edge Runtime 向けの接続設定
// - prepare: false - Transaction Pooler必須
// - max: 1 - 単一接続
// - fetch_types: false - 型フェッチを無効化（安定性向上）
const createClient = () =>
  postgres(connectionString, {
    prepare: false,
    max: 1,
    fetch_types: false,
  });

// グローバルなクライアントインスタンス
const client = createClient();

export const db = drizzle({ client, schema });
