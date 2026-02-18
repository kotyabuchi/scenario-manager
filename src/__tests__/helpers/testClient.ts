import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/db/types';

/**
 * テスト用Supabaseクライアント
 *
 * SUPABASE_SERVICE_ROLE_KEY があればRLSバイパス、なければ anon key を使用。
 * next/headers に依存しないため、Vitest環境で直接使用可能。
 */
export const getTestClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const key = serviceRoleKey ?? anonKey;

  if (!url || !key) {
    throw new Error(
      'テスト用Supabase接続情報が不足しています。.envを確認してください。',
    );
  }

  return createClient<Database>(url, key);
};
