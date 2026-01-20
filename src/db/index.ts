import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

import * as schema from './schema';

// Node.js環境ではwsを使用、ブラウザ環境ではWebSocketを使用
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const connectionString = process.env.DATABASE_URL ?? '';

// Cloudflare Workers / Edge Runtime 向けの接続設定
// neon-serverless はWebSocket経由で接続（安定性向上）
const pool = new Pool({ connectionString });

export const db = drizzle({ client: pool, schema });
