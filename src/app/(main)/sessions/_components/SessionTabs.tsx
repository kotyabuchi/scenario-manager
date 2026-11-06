'use client';

import Link from 'next/link';

import * as styles from './styles';

import { useAuthPrompt } from '@/components/blocks/AuthPrompt';

import type { TabType } from '../interface';

type SessionTabsProps = {
  activeTab: TabType;
  isLoggedIn: boolean;
};

export const SessionTabs = ({ activeTab, isLoggedIn }: SessionTabsProps) => {
  const openAuthPrompt = useAuthPrompt();

  const handleProtectedTab = (tab: 'upcoming' | 'history') => {
    openAuthPrompt({
      message:
        tab === 'upcoming'
          ? '参加予定を確認するにはログインが必要です。'
          : '参加履歴を確認するにはログインが必要です。',
      returnTo: `/sessions?tab=${tab}`,
    });
  };

  return (
    <div className={styles.tabBar}>
      <nav
        className={styles.tabContainer}
        aria-label="セッションの表示切り替え"
      >
        {isLoggedIn ? (
          <Link
            href="/sessions?tab=upcoming"
            className={styles.tabButton({ active: activeTab === 'upcoming' })}
            aria-current={activeTab === 'upcoming' ? 'page' : undefined}
          >
            参加予定
          </Link>
        ) : (
          <button
            type="button"
            className={styles.tabButton({ active: activeTab === 'upcoming' })}
            onClick={() => handleProtectedTab('upcoming')}
          >
            参加予定
          </button>
        )}
        {isLoggedIn ? (
          <Link
            href="/sessions?tab=history"
            className={styles.tabButton({ active: activeTab === 'history' })}
            aria-current={activeTab === 'history' ? 'page' : undefined}
          >
            参加履歴
          </Link>
        ) : (
          <button
            type="button"
            className={styles.tabButton({ active: activeTab === 'history' })}
            onClick={() => handleProtectedTab('history')}
          >
            参加履歴
          </button>
        )}
        <Link
          href="/sessions?tab=public"
          className={styles.tabButton({ active: activeTab === 'public' })}
          aria-current={activeTab === 'public' ? 'page' : undefined}
        >
          公開卓を探す
        </Link>
      </nav>
    </div>
  );
};
