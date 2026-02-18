import { vi } from 'vitest';

// Next.js の cookies() をモックして Vitest 環境で Supabase クライアントを動作させる
vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: () => undefined,
  }),
}));
