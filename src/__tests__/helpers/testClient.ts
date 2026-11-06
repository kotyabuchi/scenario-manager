import { createClient } from '@supabase/supabase-js';

import { assertIntegrationEnvironment } from '../../../scripts/e2e/integrationEnvironment';

import type { Database } from '@/db/types';

/**
 * 専用ローカルDBのlegacy fixture用Supabaseクライアント。
 *
 * service-roleによるRLSバイパスを維持する互換経路であり、認可の検証には使用しない。
 * 既存アプリの認証情報やanon keyへはフォールバックしない。
 */
export const getTestClient = () => {
  const { url, serviceRoleKey } = assertIntegrationEnvironment(process.env);
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
