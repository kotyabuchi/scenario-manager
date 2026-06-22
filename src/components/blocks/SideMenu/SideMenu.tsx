'use client';

import {
  BookOpen,
  Calendar,
  CalendarBlank,
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

import { ScenarioRegisterDialog } from '@/components/blocks/ScenarioRegisterDialog';
import { Divider } from '@/components/elements/Divider';
import { useAuth } from '@/context';
import { useDiscordAuth } from '@/hooks/useDiscordAuth';

import type { Icon } from '@phosphor-icons/react';
import type { Route } from 'next';

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
 * ロゴ・主要ナビ・下部のアクション（シナリオ登録）とユーザー表示で構成する。
 * モバイルでは表示せず、BottomNav / SpeedDialFAB が役割を担う。
 */
export const SideMenu = () => {
  const pathname = usePathname();
  const { user, discordMeta, isLoading, isAuthenticated } = useAuth();
  const { login } = useDiscordAuth();

  const isLoggedIn = !isLoading && isAuthenticated;
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const avatarUrl = user?.avatar ?? discordMeta?.avatarUrl;
  const displayName = user?.nickname ?? discordMeta?.displayName ?? 'ゲスト';

  return (
    <aside className={styles.sideMenu} aria-label="メインナビゲーション">
      {/* ロゴ */}
      <Link href="/home" className={styles.logo}>
        <span className={styles.logoIconFrame}>
          <BookOpen size={20} weight="fill" className={styles.logoIcon} />
        </span>
        <span className={styles.logoTexts}>
          <span className={styles.logoTitle}>シナプレ管理くん</span>
          <span className={styles.logoSubtitle}>TRPGを、もっと楽しく。</span>
        </span>
      </Link>

      {/* ナビゲーション */}
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={styles.navItem({ active })}
            >
              <item.icon
                size={20}
                weight={active ? 'fill' : 'regular'}
                className={styles.navIcon({ active })}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 下部: シナリオ登録 + ユーザー */}
      <div className={styles.bottom}>
        {isLoggedIn ? (
          <>
            <ScenarioRegisterDialog>
              <button type="button" className={styles.registerButton}>
                <Plus size={18} weight="bold" />
                シナリオを登録
              </button>
            </ScenarioRegisterDialog>

            <Divider />

            <Link href="/profile" className={styles.userButton}>
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
      </div>
    </aside>
  );
};
