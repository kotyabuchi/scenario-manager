'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

import type { User } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  isLoading: boolean;
};

/**
 * 認証状態を監視するカスタムフック
 * @returns user: ログインユーザー情報（未ログイン時はnull）, isLoading: 認証状態確認中かどうか
 */
export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 初期状態を取得
    const getInitialUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    getInitialUser();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading };
};
