'use client';

import { BookOpen, LogIn, LogOut, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import * as styles from './styles';

import { logout } from '@/app/(auth)/logout/actions';
import { useAuth } from '@/hooks/use-auth';

import type { Route } from 'next';

type NavItem = {
  href: Route<string>;
  label: string;
};

const navItems: NavItem[] = [
  { href: '/home', label: 'ホーム' },
  { href: '/scenarios', label: 'シナリオ' },
  { href: '/sessions', label: 'セッション' },
];

export const GlobalHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isLoggedIn = !isLoading && user !== null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const handleClickLogin = () => {
    router.push('/login');
  };

  const handleClickSignup = () => {
    router.push('/signup');
  };

  const handleClickLogout = async () => {
    await logout();
  };

  const handleClickProfile = () => {
    router.push('/profile');
  };

  const userAvatarUrl = user?.user_metadata?.['avatar_url'];

  return (
    <header className={styles.header}>
      {/* Logo */}
      <Link href="/home" className={styles.logo}>
        <div className={styles.logoIconFrame}>
          <BookOpen size={18} className={styles.logoIcon} />
        </div>
        <span className={styles.logoText}>シナプレ管理くん</span>
      </Link>

      {/* Navigation Links */}
      <nav className={styles.navLinks}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink({ active })}
            >
              <span className={styles.navLinkText({ active })}>
                {item.label}
              </span>
              <span className={styles.navLinkLine({ active })} />
            </Link>
          );
        })}
      </nav>

      {/* User Area */}
      <div className={styles.userArea}>
        {isLoggedIn ? (
          <>
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
            <button
              type="button"
              className={styles.authButton({ variant: 'logout' })}
              onClick={handleClickLogout}
            >
              <LogOut size={16} />
              ログアウト
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.authButton({ variant: 'login' })}
              onClick={handleClickLogin}
            >
              <LogIn size={16} />
              ログイン
            </button>
            <button
              type="button"
              className={styles.authButton({ variant: 'signup' })}
              onClick={handleClickSignup}
            >
              <UserPlus size={16} />
              新規登録
            </button>
          </>
        )}
      </div>
    </header>
  );
};
