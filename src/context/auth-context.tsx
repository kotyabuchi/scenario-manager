'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { isNil } from 'ramda';

import { createClient } from '@/lib/supabase/client';

import type { Database } from '@/db/types';

type UserRole = Database['public']['Enums']['role'];

interface AuthUser {
  userId: string;
  discordId: string;
  nickname: string;
  avatar: string | null;
  role: UserRole;
}

interface DiscordMeta {
  discordId: string;
  avatarUrl: string | null;
  userName: string | null;
  displayName: string | null;
}

type AuthContextType = {
  user: AuthUser | null;
  discordMeta: DiscordMeta | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
  initialUser?: AuthUser | null;
  initialDiscordMeta?: DiscordMeta | null;
};

export const AuthProvider = ({
  children,
  initialUser = null,
  initialDiscordMeta = null,
}: AuthProviderProps) => {
  const [user, setUserState] = useState<AuthUser | null>(initialUser);
  const [discordMeta, setDiscordMeta] = useState<DiscordMeta | null>(
    initialDiscordMeta,
  );
  const [isLoading, setIsLoading] = useState(
    isNil(initialUser) && isNil(initialDiscordMeta),
  );

  // 認証状態からユーザー情報を取得する関数
  const fetchUserFromAuth = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setUserState(null);
      setDiscordMeta(null);
      setIsLoading(false);
      return;
    }

    // usersテーブルからユーザー情報を取得
    const { data: dbUser } = await supabase
      .from('users')
      .select('user_id, discord_id, nickname, image, role')
      .eq('discord_id', authUser.id)
      .single();

    if (dbUser) {
      // 既存ユーザー
      setUserState({
        userId: dbUser.user_id,
        discordId: dbUser.discord_id,
        nickname: dbUser.nickname,
        avatar: dbUser.image,
        role: dbUser.role,
      });
      setDiscordMeta(null);
    } else {
      // 新規ユーザー（Discord認証済みだがusersテーブルに未登録）
      setUserState(null);
      setDiscordMeta({
        discordId: authUser.id,
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
        userName: authUser.user_metadata?.custom_claims?.global_name ?? null,
        displayName: authUser.user_metadata?.full_name ?? null,
      });
    }
    setIsLoading(false);
  }, []);

  // 初期値がある場合は設定、ない場合は認証状態を監視
  useEffect(() => {
    if (!isNil(initialUser) || !isNil(initialDiscordMeta)) {
      setUserState(initialUser);
      setDiscordMeta(initialDiscordMeta);
      setIsLoading(false);
      return;
    }

    // 認証状態の変更を監視
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserFromAuth();
      } else if (event === 'SIGNED_OUT') {
        setUserState(null);
        setDiscordMeta(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialUser, initialDiscordMeta, fetchUserFromAuth]);

  const setUser = (newUser: AuthUser) => {
    setUserState(newUser);
    setDiscordMeta(null);
  };

  const clearUser = () => {
    setUserState(null);
    setDiscordMeta(null);
  };

  const value: AuthContextType = {
    user,
    discordMeta,
    isLoading,
    isAuthenticated: !isNil(user),
    isNewUser: isNil(user) && !isNil(discordMeta),
    setUser,
    clearUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (isNil(context)) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { AuthUser, AuthContextType, DiscordMeta, UserRole };
