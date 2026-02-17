'use client';

import {
  BookOpenText,
  CalendarPlus,
  ChatText,
  ListBullets,
  MagnifyingGlass,
  ShareNetwork,
  SignIn,
} from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';

import * as styles from './styles';

import { useDiscordAuth } from '@/hooks/useDiscordAuth';

import type { Route } from 'next';

type SpeedDialPanelProps = {
  isAuthenticated: boolean;
  onClose: () => void;
  onFeedbackOpen: () => void;
  onScenarioRegister: () => void;
  onShare: () => void;
};

export const SpeedDialPanel = ({
  isAuthenticated,
  onClose,
  onFeedbackOpen,
  onScenarioRegister,
  onShare,
}: SpeedDialPanelProps) => {
  const router = useRouter();
  const { login } = useDiscordAuth();

  const handleNavigate = (path: Route<string>) => {
    onClose();
    router.push(path);
  };

  const handleLogin = () => {
    onClose();
    login();
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
            onClick={onScenarioRegister}
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
            onClick={onShare}
          >
            <ShareNetwork size={20} className={iconClass} />
            シェア
          </button>
          <button
            type="button"
            className={styles.speedDialFAB_menuItem}
            role="menuitem"
            onClick={onFeedbackOpen}
          >
            <ChatText size={20} className={iconClass} />
            フィードバック
          </button>
          <button
            type="button"
            className={styles.speedDialFAB_menuItem}
            role="menuitem"
            onClick={() => handleNavigate('/feedback' as Route)}
          >
            <ListBullets size={20} className={iconClass} />
            みんなのフィードバックを見る
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
            onClick={onShare}
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
    </>
  );
};
