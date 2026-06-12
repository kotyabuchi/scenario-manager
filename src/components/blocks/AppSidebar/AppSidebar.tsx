'use client';

import {
  BookOpen,
  Calendar,
  CalendarCheck,
  House,
  Plus,
  SidebarSimple,
  SignIn,
  Users,
} from '@phosphor-icons/react/ssr';
import { useAtom } from 'jotai';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ScenarioRegisterDialog } from '../ScenarioRegisterDialog';
import { sidebarCollapsedAtom } from './atoms';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarUserMenu } from './SidebarUserMenu';
import * as styles from './styles';

import { useAuth } from '@/context';
import { useDiscordAuth } from '@/hooks/useDiscordAuth';

import type { Icon } from '@phosphor-icons/react/dist/lib/types';
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
  { href: '/schedules', label: 'スケジュール', icon: CalendarCheck },
  { href: '/users', label: 'ユーザー', icon: Users },
];

const LG_BREAKPOINT_QUERY = '(min-width: 1024px)';

export const AppSidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
  const { user, isLoading } = useAuth();
  const { login } = useDiscordAuth();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const handleToggle = () => {
    const isLgUp =
      typeof window.matchMedia === 'function'
        ? window.matchMedia(LG_BREAKPOINT_QUERY).matches
        : true;
    // null（自動）の場合はブレークポイントから現在の見た目の状態を導出する
    const effectiveCollapsed = collapsed ?? !isLgUp;
    setCollapsed(!effectiveCollapsed);
  };

  const handleClickLogin = () => {
    login();
  };

  const dataCollapsed = collapsed === null ? 'auto' : `${collapsed}`;

  return (
    <aside
      className={styles.appSidebar_container}
      data-collapsed={dataCollapsed}
      aria-label="グローバルナビゲーション"
    >
      <div className={styles.appSidebar_header}>
        <Link href="/home" className={styles.appSidebar_logo}>
          <div className={styles.appSidebar_logoIconFrame}>
            <BookOpen size={18} className={styles.appSidebar_logoIcon} />
          </div>
          <span className={styles.appSidebar_logoText}>シナプレ管理くん</span>
        </Link>
        <button
          type="button"
          className={styles.appSidebar_toggleButton}
          onClick={handleToggle}
          aria-label="サイドバーを開閉"
        >
          <SidebarSimple size={20} />
        </button>
      </div>

      <nav className={styles.appSidebar_nav} aria-label="メインナビゲーション">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
          />
        ))}
      </nav>

      <div className={styles.appSidebar_footer}>
        {!isLoading && user ? (
          <>
            <ScenarioRegisterDialog>
              <button
                type="button"
                className={styles.appSidebar_ctaButton}
                aria-label="シナリオを登録"
                title="シナリオを登録"
              >
                <Plus size={16} weight="bold" />
                <span className={styles.appSidebar_ctaLabel}>
                  シナリオを登録
                </span>
              </button>
            </ScenarioRegisterDialog>
            <SidebarUserMenu nickname={user.nickname} avatarUrl={user.avatar} />
          </>
        ) : (
          <button
            type="button"
            className={styles.appSidebar_ctaButton}
            onClick={handleClickLogin}
            aria-label="ログイン"
            title="ログイン"
          >
            <SignIn size={16} />
            <span className={styles.appSidebar_ctaLabel}>ログイン</span>
          </button>
        )}
      </div>
    </aside>
  );
};
