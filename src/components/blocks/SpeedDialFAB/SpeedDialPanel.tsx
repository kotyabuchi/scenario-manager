'use client';

import { useState } from 'react';
import {
  BookOpenText,
  CalendarPlus,
  ChatText,
  MagnifyingGlass,
  ShareNetwork,
  SignIn,
} from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';

import { FeedbackModal } from '../FeedbackModal';
import { shareCurrentPage } from './share';
import * as styles from './styles';

import { useDiscordAuth } from '@/hooks/useDiscordAuth';

import type { Route } from 'next';

type SpeedDialPanelProps = {
  isAuthenticated: boolean;
  onClose: () => void;
};

export const SpeedDialPanel = ({
  isAuthenticated,
  onClose,
}: SpeedDialPanelProps) => {
  const router = useRouter();
  const { login } = useDiscordAuth();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const handleNavigate = (path: Route<string>) => {
    onClose();
    router.push(path);
  };

  const handleShare = async () => {
    await shareCurrentPage();
    onClose();
  };

  const handleFeedback = () => {
    onClose();
    setIsFeedbackOpen(true);
  };

  const handleLogin = () => {
    onClose();
    login();
  };

  const handleFeedbackOpenChange = (details: { open: boolean }) => {
    setIsFeedbackOpen(details.open);
  };

  const iconClass = styles.speedDialFAB_menuIcon;

  return (
    <>
      {isAuthenticated ? (
        <>
          <button
            type="button"
            className={styles.speedDialFAB_menuItem}
            role="menuitem"
            onClick={() => handleNavigate('/scenarios/new' as Route)}
          >
            <BookOpenText size={20} className={iconClass} />
            シナリオ登録
          </button>
          <button
            type="button"
            className={styles.speedDialFAB_menuItem}
            role="menuitem"
            onClick={() => handleNavigate('/sessions/new' as Route)}
          >
            <CalendarPlus size={20} className={iconClass} />
            セッション募集
          </button>
          <button
            type="button"
            className={styles.speedDialFAB_menuItem}
            role="menuitem"
            onClick={() => handleNavigate('/scenarios' as Route)}
          >
            <MagnifyingGlass size={20} className={iconClass} />
            シナリオ検索
          </button>
          <hr className={styles.speedDialFAB_divider} />
          <button
            type="button"
            className={styles.speedDialFAB_menuItem}
            role="menuitem"
            onClick={handleShare}
          >
            <ShareNetwork size={20} className={iconClass} />
            シェア
          </button>
          <button
            type="button"
            className={styles.speedDialFAB_menuItem}
            role="menuitem"
            onClick={handleFeedback}
          >
            <ChatText size={20} className={iconClass} />
            フィードバック
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={styles.speedDialFAB_menuItem}
            role="menuitem"
            onClick={() => handleNavigate('/scenarios' as Route)}
          >
            <MagnifyingGlass size={20} className={iconClass} />
            シナリオ検索
          </button>
          <button
            type="button"
            className={styles.speedDialFAB_menuItem}
            role="menuitem"
            onClick={handleShare}
          >
            <ShareNetwork size={20} className={iconClass} />
            シェア
          </button>
          <button
            type="button"
            className={styles.speedDialFAB_menuItem}
            role="menuitem"
            onClick={handleLogin}
          >
            <SignIn size={20} className={iconClass} />
            ログイン
          </button>
        </>
      )}
      <FeedbackModal
        open={isFeedbackOpen}
        onOpenChange={handleFeedbackOpenChange}
      />
    </>
  );
};
