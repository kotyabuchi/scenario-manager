import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/db/types';

/**
 * 認証付きSupabaseサーバークライアント
 * Cookie経由でユーザーセッションを管理する
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Componentから呼ばれた場合、setCookieが使えないため無視
          }
        },
      },
    },
  );
};

/**
 * データアクセス用Supabaseサーバークライアント
 * 認証付きクライアントと同じだが、命名で用途を明確にする
 */
export const createDbClient = async () => {
  return createClient();
};
