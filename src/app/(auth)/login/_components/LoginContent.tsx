'use client';

import { useSearchParams } from 'next/navigation';

import * as styles from '../styles';
import { DiscordIcon } from './DiscordIcon';

import { createClient } from '@/lib/supabase/client';

export const LoginContent = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleDiscordLogin = async () => {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>シナプレ管理くん</h1>
        <p className={styles.subtitle}>TRPGシナリオ・セッション管理</p>

        {error && (
          <div className={styles.error}>
            ログインに失敗しました。もう一度お試しください。
          </div>
        )}

        <button
          type="button"
          onClick={handleDiscordLogin}
          className={styles.discordButton}
        >
          <DiscordIcon />
          Discordでログイン
        </button>

        <p className={styles.note}>
          ログインすることで、セッションへの参加やレビューの投稿が可能になります。
        </p>
      </div>
    </div>
  );
};
