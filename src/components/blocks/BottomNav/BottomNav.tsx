'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Calendar,
  DotsThree,
  House,
  User,
  X,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuthPrompt } from '../AuthPrompt';
import { FeedbackModal } from '../FeedbackModal';
import { ScenarioRegisterDialog } from '../ScenarioRegisterDialog';
import { SpeedDialPanel } from '../SpeedDialFAB/SpeedDialPanel';
import { shareCurrentPage } from '../SpeedDialFAB/share';
import { useSpeedDial } from '../SpeedDialFAB/useSpeedDial';
import * as styles from './styles';

import { useAuth } from '@/context';
import { useBottomNavSlotTarget } from '@/hooks/useBottomNavSlot';
import { useSystemMessageActions } from '@/hooks/useSystemMessage';

import type { Route } from 'next';
import type { MouseEvent } from 'react';

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
  const { isOpen, close, toggle } = useSpeedDial();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isScenarioRegisterOpen, setIsScenarioRegisterOpen] = useState(false);
  const { addMessage } = useSystemMessageActions();
  const { isAuthenticated: isAuthenticatedNow } = useAuth();
  const openAuthPrompt = useAuthPrompt();
  const slotTargetRef = useBottomNavSlotTarget();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const shouldRestoreFocusRef = useRef(true);

  useEffect(() => {
    const shouldFocusMenu = isOpen;
    const shouldFocusToggle =
      !isOpen && wasOpenRef.current && shouldRestoreFocusRef.current;
    const focusTimer = window.setTimeout(() => {
      if (shouldFocusMenu) menuRef.current?.querySelector('button')?.focus();
      else if (shouldFocusToggle) toggleRef.current?.focus();
    }, 50);
    wasOpenRef.current = isOpen;
    if (!isOpen) shouldRestoreFocusRef.current = true;
    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  const handleActionClose = () => {
    shouldRestoreFocusRef.current = false;
    close();
  };

  const handleFeedbackOpen = () => {
    handleActionClose();
    setIsFeedbackOpen(true);
  };

  const handleFeedbackOpenChange = (details: { open: boolean }) => {
    setIsFeedbackOpen(details.open);
  };

  const handleScenarioRegister = () => {
    handleActionClose();
    setIsScenarioRegisterOpen(true);
  };

  const handleScenarioRegisterOpenChange = (details: { open: boolean }) => {
    setIsScenarioRegisterOpen(details.open);
  };

  const handleShare = useCallback(async () => {
    shouldRestoreFocusRef.current = false;
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

    if (delta > SCROLL_THRESHOLD && !isOpen) {
      // 下へスクロール（コンテンツを読み進め）→ 隠す
      setVisible(false);
    } else if (delta < -SCROLL_THRESHOLD) {
      // 上へスクロール（戻る）→ 表示
      setVisible(true);
    }

    lastScrollY.current = currentY;
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const handleProtectedLink = (
    event: MouseEvent<HTMLAnchorElement>,
    href: Route<string>,
  ) => {
    if (isAuthenticatedNow) return;
    event.preventDefault();
    openAuthPrompt({
      message:
        href === '/home'
          ? 'ホームを見るにはログインが必要です。'
          : 'マイページを見るにはログインが必要です。',
      returnTo: href,
    });
  };

  return (
    <>
      <button
        type="button"
        className={styles.speedDial_overlay({ visible: isOpen })}
        onClick={close}
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className={styles.navWrapper({ visible: visible || isOpen })}>
        <div ref={slotTargetRef} />
        <nav className={styles.nav} aria-label="モバイルナビゲーション">
          {/* 左2つ */}
          {navItems.slice(0, 2).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navItem({ active })}
                aria-current={active ? 'page' : undefined}
                {...(item.href === '/home'
                  ? {
                      onClick: (event: MouseEvent<HTMLAnchorElement>) =>
                        handleProtectedLink(event, item.href),
                    }
                  : {})}
              >
                <span className={styles.navIcon({ active })}>
                  <item.icon
                    size={24}
                    weight={active ? 'fill' : 'regular'}
                    aria-hidden="true"
                  />
                </span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}

          {/* Center Speed Dial FAB */}
          <div className={styles.fabWrapper}>
            <section
              id="mobile-quick-actions"
              ref={menuRef}
              className={styles.speedDial_menu({ visible: isOpen })}
              aria-label="クイック操作"
              aria-hidden={!isOpen}
              inert={!isOpen}
            >
              <SpeedDialPanel
                isAuthenticated={isAuthenticatedNow}
                onClose={handleActionClose}
                onFeedbackOpen={handleFeedbackOpen}
                onScenarioRegister={handleScenarioRegister}
                onShare={handleShare}
              />
            </section>
            <button
              type="button"
              ref={toggleRef}
              className={styles.fab}
              onClick={toggle}
              aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
              aria-expanded={isOpen}
              aria-controls="mobile-quick-actions"
            >
              <span className={styles.fabCircle}>
                {isOpen ? (
                  <X size={24} weight="bold" aria-hidden="true" />
                ) : (
                  <DotsThree size={24} weight="bold" aria-hidden="true" />
                )}
              </span>
              <span className={styles.fabLabel} aria-hidden="true">
                {isOpen ? '閉じる' : 'メニュー'}
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
                {...(item.href === '/profile'
                  ? {
                      onClick: (event: MouseEvent<HTMLAnchorElement>) =>
                        handleProtectedLink(event, item.href),
                    }
                  : {})}
              >
                <span className={styles.navIcon({ active })}>
                  <item.icon
                    size={24}
                    weight={active ? 'fill' : 'regular'}
                    aria-hidden="true"
                  />
                </span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
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
