'use client';

import { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CalendarBlank,
  CaretDoubleLeft,
  CaretDoubleRight,
  House,
  Plus,
  SignIn,
  User,
  Users,
} from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import * as styles from './styles';

import { useAuthPrompt } from '@/components/blocks/AuthPrompt';
import { ScenarioRegisterDialog } from '@/components/blocks/ScenarioRegisterDialog';
import { Divider } from '@/components/elements/Divider';
import { useAuth } from '@/context';
import { useDiscordAuth } from '@/hooks/useDiscordAuth';

import type { Icon } from '@phosphor-icons/react';
import type { Route } from 'next';
import type { MouseEvent } from 'react';

type NavItem = {
  href: Route<string>;
  label: string;
  icon: Icon;
};

const navItems: NavItem[] = [
  { href: '/home', label: 'ホーム', icon: House },
  { href: '/scenarios', label: 'シナリオ', icon: BookOpen },
  { href: '/sessions', label: 'セッション', icon: Calendar },
  { href: '/schedules', label: 'スケジュール', icon: CalendarBlank },
  { href: '/users', label: 'ユーザー', icon: Users },
];

/**
 * SideMenu - PC（lg以上）のグローバルナビゲーション
 *
 * ロゴ・主要ナビ・下部のアクション（シナリオ登録）とユーザー表示で構成し、折りたためる。
 * モバイルでは表示せず、BottomNav / SpeedDialFAB が役割を担う。
 */
export const SideMenu = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, discordMeta, isLoading, isAuthenticated } = useAuth();
  const { login } = useDiscordAuth();
  const openAuthPrompt = useAuthPrompt();

  const isLoggedIn = !isLoading && isAuthenticated;
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const handleHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isAuthenticated) return;
    event.preventDefault();
    openAuthPrompt({
      message: 'ホームを見るにはログインが必要です。',
      returnTo: '/home',
    });
  };

  const avatarUrl = user?.avatar ?? discordMeta?.avatarUrl;
  const displayName = user?.nickname ?? discordMeta?.displayName ?? 'ゲスト';

  return (
    <aside
      className={styles.sideMenu({ collapsed: isCollapsed })}
      aria-label="メインナビゲーション"
    >
      <div className={styles.sideMenuContent}>
        <div className={styles.header}>
          <Link
            href="/home"
            className={`${styles.logo} ${isCollapsed ? styles.logoCollapsed : ''}`}
            aria-label={isCollapsed ? 'シナプレ管理くん' : undefined}
            onClick={handleHomeClick}
          >
            <span className={styles.logoIconFrame}>
              <BookOpen size={20} weight="fill" className={styles.logoIcon} />
            </span>
            {!isCollapsed && (
              <span className={styles.logoTexts}>
                <span className={styles.logoTitle}>シナプレ管理くん</span>
                <span className={styles.logoSubtitle}>
                  TRPGを、もっと楽しく。
                </span>
              </span>
            )}
          </Link>
        </div>

        <nav className={styles.nav} aria-label="メインメニュー">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                aria-label={isCollapsed ? item.label : undefined}
                title={isCollapsed ? item.label : undefined}
                className={styles.navItem({ active })}
                {...(item.href === '/home' ? { onClick: handleHomeClick } : {})}
              >
                <item.icon
                  size={20}
                  weight={active ? 'fill' : 'regular'}
                  className={styles.navIcon({ active })}
                  aria-hidden="true"
                />
                {!isCollapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* 下部: シナリオ登録 + ユーザー */}
        <div className={styles.bottom}>
          {isCollapsed ? (
            isLoggedIn ? (
              <>
                <ScenarioRegisterDialog>
                  <button
                    type="button"
                    className={styles.compactPrimaryAction}
                    aria-label="シナリオを登録"
                    title="シナリオを登録"
                  >
                    <Plus size={20} weight="bold" />
                  </button>
                </ScenarioRegisterDialog>
                <Link
                  href="/profile"
                  className={styles.compactAction}
                  aria-label={`プロフィール: ${displayName}`}
                  title="プロフィール"
                >
                  <span className={styles.avatar}>
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt=""
                        width={36}
                        height={36}
                        className={styles.avatarImage}
                      />
                    ) : (
                      <User size={20} />
                    )}
                  </span>
                </Link>
              </>
            ) : (
              <button
                type="button"
                className={styles.compactPrimaryAction}
                aria-label="ログイン"
                title="ログイン"
                onClick={() => login()}
              >
                <SignIn size={20} weight="bold" />
              </button>
            )
          ) : (
            <>
              {isLoggedIn ? (
                <>
                  <ScenarioRegisterDialog>
                    <button type="button" className={styles.registerButton}>
                      <Plus size={18} weight="bold" />
                      シナリオを登録
                    </button>
                  </ScenarioRegisterDialog>

                  <Divider />

                  <Link
                    href="/profile"
                    aria-label={`プロフィール: ${displayName}`}
                    className={styles.userButton}
                  >
                    <span className={styles.avatar}>
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt=""
                          width={36}
                          height={36}
                          className={styles.avatarImage}
                        />
                      ) : (
                        <User size={20} />
                      )}
                    </span>
                    <span className={styles.userName}>{displayName}</span>
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.loginButton}
                  onClick={() => login()}
                >
                  <SignIn size={18} weight="bold" />
                  ログイン
                </button>
              )}
              <Link href="/about" className={styles.aboutLink}>
                サービスについて
              </Link>
            </>
          )}
          {isCollapsed && (
            <span className={styles.aboutPlaceholder} aria-hidden="true">
              &nbsp;
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        className={styles.toggleHandle}
        aria-label={
          isCollapsed ? 'サイドメニューを開く' : 'サイドメニューを閉じる'
        }
        aria-expanded={!isCollapsed}
        onClick={() => setIsCollapsed((current) => !current)}
      >
        {isCollapsed ? (
          <CaretDoubleRight size={18} className={styles.toggleHandleIcon} />
        ) : (
          <CaretDoubleLeft size={18} className={styles.toggleHandleIcon} />
        )}
      </button>
    </aside>
  );
};
