'use client';

import { BookOpen, LogIn, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import * as styles from './styles';

import { ScenarioRegisterDialog } from '@/components/blocks/ScenarioRegisterDialog';
import { useAuth } from '@/context';
import { useDiscordAuth } from '@/hooks/useDiscordAuth';

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
  const { user, discordMeta, isLoading, isAuthenticated } = useAuth();
  const { login } = useDiscordAuth();

  const isLoggedIn = !isLoading && isAuthenticated;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const showScenarioRegisterButton =
    pathname.startsWith('/scenarios') &&
    pathname !== '/scenarios/new' &&
    pathname !== '/scenarios/import';

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
            {showScenarioRegisterButton && (
              <ScenarioRegisterDialog>
                <button type="button" className={styles.registerButton}>
                  <Plus size={16} />
                  シナリオを登録
                </button>
              </ScenarioRegisterDialog>
            )}
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
          </>
        ) : (
          <button
            type="button"
            className={styles.authButton({ variant: 'login' })}
            onClick={handleClickLogin}
          >
            <LogIn size={16} />
            ログイン
          </button>
        )}
      </div>
    </header>
  );
};
