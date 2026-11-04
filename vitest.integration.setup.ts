import { vi } from 'vitest';

import { assertIntegrationEnvironment } from './scripts/e2e/integrationEnvironment';

const environment = assertIntegrationEnvironment(process.env);

// 旧テストの環境確認と直接client生成にも、検証済みの専用値だけを供給する。
process.env.NEXT_PUBLIC_SUPABASE_URL = environment.url;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = environment.anonKey;
process.env.SUPABASE_SERVICE_ROLE_KEY = environment.serviceRoleKey;

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: () => undefined,
  }),
}));

// legacy fixture用の互換経路。service-roleはRLSを迂回するため、認可検証には使わない。
vi.mock('@/lib/supabase/server', async () => {
  const { getTestClient } = await import('@/__tests__/helpers/testClient');
  return {
    createClient: async () => getTestClient(),
    createDbClient: async () => getTestClient(),
  };
});
