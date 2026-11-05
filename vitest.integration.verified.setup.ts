import { beforeEach, vi } from 'vitest';

import { readIntegrationConnection } from './src/__tests__/helpers/integrationFixture';

const connection = readIntegrationConnection();
process.env.NEXT_PUBLIC_SUPABASE_URL = connection.manifest.apiUrl;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = connection.anonKey;
Reflect.deleteProperty(process.env, 'SUPABASE_SERVICE_ROLE_KEY');

// production server/auth/adapter/RPCは実物を使用し、Nextのrequest境界だけを置換する。
vi.mock('next/headers', async () => {
  const { integrationCookies } = await import(
    './src/__tests__/helpers/integrationRequest'
  );
  return { cookies: async () => integrationCookies() };
});
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

beforeEach(() => vi.clearAllMocks());
