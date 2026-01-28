'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useSystemMessage } from './useSystemMessage';

import { createClient } from '@/lib/supabase/client';

import type { Route } from 'next';

type AuthMessage =
  | {
      type: 'success';
      redirectTo: Route<string>;
      isNewUser: boolean;
      nickname?: string;
    }
  | { type: 'error'; message: string };

const AUTH_CHANNEL = 'auth';
const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 700;

export const useDiscordAuth = () => {
  const router = useRouter();
  const { showError, showSuccess } = useSystemMessage();
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const clearNewUser = useCallback(() => {
    setIsNewUser(false);
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<AuthMessage>) => {
      const data = event.data;
      if (data.type === 'success') {
        if (data.isNewUser) {
          setIsNewUser(true);
        } else {
          showSuccess(
            data.nickname
              ? `おかえりなさい、${data.nickname}さん`
              : 'ログインしました',
          );
        }
        router.refresh();
        router.push(data.redirectTo);
      } else if (data.type === 'error') {
        showError(data.message);
      }
    };

    return () => {
      channel.close();
    };
  }, [router, showError, showSuccess]);

  const login = useCallback(async () => {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      showError('認証の開始に失敗しました。もう一度お試しください。');
      return;
    }

    const left = Math.round(
      window.screenX + (window.outerWidth - POPUP_WIDTH) / 2,
    );
    const top = Math.round(
      window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2,
    );

    window.open(
      data.url,
      'discord-auth',
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`,
    );
  }, [showError]);

  return { login, isNewUser, clearNewUser };
};
