import { vi } from 'vitest';

// 純粋テストが意図せず実DBへ接続する場合は、その場で失敗させる。
const { rejectDatabaseAccess } = vi.hoisted(() => ({
  rejectDatabaseAccess: () => {
    throw new Error(
      'unit/componentでは実DBを使用できません。モックを定義するかtest:integrationへ分類してください。',
    );
  },
}));

// 未知のhelper・middleware経由でも実SDKのclient生成を許可しない。
vi.mock('@supabase/supabase-js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@supabase/supabase-js')>()),
  createClient: rejectDatabaseAccess,
  SupabaseClient: class {
    constructor() {
      rejectDatabaseAccess();
    }
  },
}));
vi.mock('@supabase/ssr', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@supabase/ssr')>()),
  createBrowserClient: rejectDatabaseAccess,
  createServerClient: rejectDatabaseAccess,
}));

vi.mock('next/headers', () => ({
  cookies: () => ({ getAll: () => [], set: () => undefined }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: rejectDatabaseAccess,
  createDbClient: rejectDatabaseAccess,
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: rejectDatabaseAccess,
}));
vi.mock('@/__tests__/helpers/testClient', () => ({
  getTestClient: rejectDatabaseAccess,
}));
