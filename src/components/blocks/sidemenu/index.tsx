'use client';

import {
  BookOpen,
  Calendar,
  House,
  LogIn,
  LogOut,
  type LucideIcon,
  UserPlus,
  Users,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { MenuItem } from './menu-item';
import * as styles from './styles';

import { logout } from '@/app/(auth)/logout/actions';
import { useAuth } from '@/hooks/use-auth';
import { useToggleState } from '@/hooks/use-toggle-state';
import { VStack } from '@/styled-system/jsx';

import type { Route } from 'next';

type MenuItemType = {
  href: Route<string>;
  icon: LucideIcon;
  text: string;
};

const menuItems: MenuItemType[] = [
  {
    href: '/home',
    icon: House,
    text: 'Home',
  },
  {
    href: '/scenarios',
    icon: BookOpen,
    text: 'シナリオ',
  },
  {
    href: '/sessions',
    icon: Calendar,
    text: 'セッション',
  },
  {
    href: '/users',
    icon: Users,
    text: 'ユーザー',
  },
];

export const SideMenu = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [open, toggleOpen] = useToggleState(false);
  const { user, isLoading } = useAuth();

  const isLoggedIn = !isLoading && user !== null;

  const handleToggle = () => {
    toggleOpen();
  };

  const handleClickMenuItem = (href: Route<string>) => {
    router.push(href);
  };

  /** 現在のパスがメニューアイテムの配下かどうかを判定 */
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

  return (
    <aside
      className={styles.sideMenu({ open })}
      onClick={handleToggle}
      aria-label="メインナビゲーション"
    >
      <VStack className={styles.pageMenuButtons}>
        {menuItems.map((item) => (
          <MenuItem
            key={item.href}
            icon={item.icon}
            text={item.text}
            active={isActive(item.href)}
            onClick={() => handleClickMenuItem(item.href)}
          />
        ))}
      </VStack>
      <VStack className={styles.authButtons}>
        {isLoggedIn ? (
          <MenuItem
            icon={LogOut}
            text="Logout"
            variant="logout"
            onClick={handleClickLogout}
          />
        ) : (
          <>
            <MenuItem
              icon={LogIn}
              text="Login"
              variant="login"
              onClick={handleClickLogin}
            />
            <MenuItem
              icon={UserPlus}
              text="Signup"
              variant="signup"
              onClick={handleClickSignup}
            />
          </>
        )}
      </VStack>
    </aside>
  );
};
