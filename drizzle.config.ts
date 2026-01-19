import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

export default defineConfig({
  // スキーマファイルのパス
  schema: './src/db/schema.ts',
  // Supabase へのマイグレーションファイルを出力するディレクトリ
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
