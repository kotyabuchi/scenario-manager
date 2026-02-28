import { vi } from 'vitest';

// Next.js の cookies() をモックして Vitest 環境で Supabase クライアントを動作させる
vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: () => undefined,
  }),
}));

// アダプター関数が使う Supabase クライアントを SERVICE_ROLE_KEY 付きに差し替え
// RLS をバイパスし、テストフィクスチャで作成したデータにアクセス可能にする
vi.mock('@/lib/supabase/server', async () => {
  const { getTestClient } = await import('@/__tests__/helpers/testClient');
  return {
    createClient: async () => getTestClient(),
    createDbClient: async () => getTestClient(),
  };
});
