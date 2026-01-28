'use client';

import { BookOpen, LogIn, Plus, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import * as styles from './styles';

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
  { href: '/schedules', label: 'スケジュール' },
  { href: '/users', label: 'ユーザー' },
];

export const GlobalHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isLoggedIn = !isLoading && user !== null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // scenarios配下（/scenarios/new以外）で登録ボタンを表示
  const showScenarioRegisterButton =
    pathname.startsWith('/scenarios') && pathname !== '/scenarios/new';

  const handleClickLogin = () => {
    router.push('/login');
  };

  const handleClickSignup = () => {
    router.push('/signup');
  };

  const handleClickProfile = () => {
    router.push('/profile');
  };

  const userAvatarUrl = user?.user_metadata?.avatar_url;

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
        {showScenarioRegisterButton && (
          <Link href="/scenarios/new" className={styles.registerButton}>
            <Plus size={16} />
            シナリオを登録
          </Link>
        )}
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
