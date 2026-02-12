'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Calendar,
  House,
  Plus,
  User,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import * as styles from './styles';

import type { Route } from 'next';

type NavItem = {
  href: Route<string>;
  label: string;
  icon: typeof House;
};

const navItems: NavItem[] = [
  { href: '/home', label: 'ホーム', icon: House },
  { href: '/sessions', label: 'セッション', icon: Calendar },
  // center FAB is rendered separately
  { href: '/scenarios', label: 'シナリオ', icon: BookOpen },
  { href: '/profile', label: 'マイページ', icon: User },
];

const SCROLL_THRESHOLD = 10;

export const BottomNav = () => {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY.current;

    if (delta > SCROLL_THRESHOLD) {
      // 下へスクロール（コンテンツを読み進め）→ 隠す
      setVisible(false);
    } else if (delta < -SCROLL_THRESHOLD) {
      // 上へスクロール（戻る）→ 表示
      setVisible(true);
    }

    lastScrollY.current = currentY;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      className={styles.nav}
      aria-label="モバイルナビゲーション"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(calc(100% + 16px))',
      }}
    >
      {/* 左2つ */}
      {navItems.slice(0, 2).map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={styles.navItem({ active })}
            aria-current={active ? 'page' : undefined}
          >
            <item.icon size={24} weight={active ? 'fill' : 'regular'} />
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        );
      })}

      {/* Center FAB */}
      <div className={styles.fabWrapper}>
        <Link href={'/scenarios/new' as Route} className={styles.fab}>
          <Plus size={28} weight="bold" />
        </Link>
      </div>

      {/* 右2つ */}
      {navItems.slice(2).map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={styles.navItem({ active })}
            aria-current={active ? 'page' : undefined}
          >
            <item.icon size={24} weight={active ? 'fill' : 'regular'} />
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
