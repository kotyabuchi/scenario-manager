'use client';

import { BookOpen, SignIn } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import * as styles from './styles';

import { useAuth } from '@/context';
import { useDiscordAuth } from '@/hooks/useDiscordAuth';

/**
 * モバイル専用トップバー（md以上ではAppSidebarに置き換わるため非表示）
 */
export const GlobalHeader = () => {
  const router = useRouter();
  const { user, discordMeta, isLoading, isAuthenticated } = useAuth();
  const { login } = useDiscordAuth();

  const isLoggedIn = !isLoading && isAuthenticated;

  const handleClickLogin = () => {
    login();
  };

  const handleClickProfile = () => {
    router.push('/profile');
  };

  const userAvatarUrl = user?.avatar ?? discordMeta?.avatarUrl;

  return (
    <header className={styles.header}>
      {/* Logo */}
      <Link href="/home" className={styles.logo}>
        <div className={styles.logoIconFrame}>
          <BookOpen size={18} className={styles.logoIcon} />
        </div>
        <span className={styles.logoText}>シナプレ管理くん</span>
      </Link>

      {/* User Area */}
      <div className={styles.userArea}>
        {isLoggedIn ? (
          <button
            type="button"
            className={styles.avatar}
            onClick={handleClickProfile}
            aria-label="プロフィール"
          >
            {userAvatarUrl ? (
              <Image
                src={userAvatarUrl}
                alt="ユーザーアバター"
                width={36}
                height={36}
                className={styles.avatarImage}
              />
            ) : null}
          </button>
        ) : (
          <button
            type="button"
            className={styles.loginButton}
            onClick={handleClickLogin}
          >
            <SignIn size={16} />
            ログイン
          </button>
        )}
      </div>
    </header>
  );
};
