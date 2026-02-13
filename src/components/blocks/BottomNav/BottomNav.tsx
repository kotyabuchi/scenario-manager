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

import { FeedbackModal } from '../FeedbackModal';
import { ScenarioRegisterDialog } from '../ScenarioRegisterDialog';
import { SpeedDialPanel } from '../SpeedDialFAB/SpeedDialPanel';
import { shareCurrentPage } from '../SpeedDialFAB/share';
import { useSpeedDial } from '../SpeedDialFAB/useSpeedDial';
import * as styles from './styles';

import { useSystemMessageActions } from '@/hooks/useSystemMessage';

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

type BottomNavProps = {
  isAuthenticated: boolean;
};

export const BottomNav = ({ isAuthenticated }: BottomNavProps) => {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { isOpen, close, toggle } = useSpeedDial();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isScenarioRegisterOpen, setIsScenarioRegisterOpen] = useState(false);
  const { addMessage } = useSystemMessageActions();

  const handleFeedbackOpen = () => {
    close();
    setIsFeedbackOpen(true);
  };

  const handleFeedbackOpenChange = (details: { open: boolean }) => {
    setIsFeedbackOpen(details.open);
  };

  const handleScenarioRegister = () => {
    close();
    setIsScenarioRegisterOpen(true);
  };

  const handleScenarioRegisterOpenChange = (details: { open: boolean }) => {
    setIsScenarioRegisterOpen(details.open);
  };

  const handleShare = useCallback(async () => {
    close();
    try {
      const result = await shareCurrentPage();
      if (result === 'clipboard') {
        addMessage('success', 'リンクをコピーしました');
      }
    } catch {
      addMessage('danger', 'シェアに失敗しました');
    }
  }, [close, addMessage]);

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
    <>
      <nav
        className={styles.nav}
        aria-label="モバイルナビゲーション"
        style={{
          transform: visible
            ? 'translateY(0)'
            : 'translateY(calc(100% + 16px))',
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

        {/* Center Speed Dial FAB */}
        <div className={styles.fabWrapper}>
          {isOpen && (
            <>
              <button
                type="button"
                className={styles.speedDial_overlay}
                onClick={close}
                aria-label="メニューを閉じる"
              />
              <div className={styles.speedDial_menu} role="menu">
                <SpeedDialPanel
                  isAuthenticated={isAuthenticated}
                  onClose={close}
                  onFeedbackOpen={handleFeedbackOpen}
                  onScenarioRegister={handleScenarioRegister}
                  onShare={handleShare}
                />
              </div>
            </>
          )}
          <button
            type="button"
            className={styles.fab}
            onClick={toggle}
            aria-label="メニューを開く"
            aria-expanded={isOpen}
          >
            <span className={styles.fabIcon({ open: isOpen })}>
              <Plus size={28} weight="bold" />
            </span>
          </button>
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
      <FeedbackModal
        open={isFeedbackOpen}
        onOpenChange={handleFeedbackOpenChange}
      />
      <ScenarioRegisterDialog
        open={isScenarioRegisterOpen}
        onOpenChange={handleScenarioRegisterOpenChange}
      />
    </>
  );
};
