'use client';

import { useCallback, useState } from 'react';
import { DotsThree, X } from '@phosphor-icons/react/ssr';

import { FeedbackModal } from '../FeedbackModal';
import { ScenarioRegisterDialog } from '../ScenarioRegisterDialog';
import { SpeedDialPanel } from './SpeedDialPanel';
import * as styles from './styles';
import { useSpeedDial } from './useSpeedDial';

import { useSystemMessageActions } from '@/hooks/useSystemMessage';

type SpeedDialFABProps = {
  isAuthenticated: boolean;
};

export const SpeedDialFAB = ({ isAuthenticated }: SpeedDialFABProps) => {
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
      await navigator.clipboard.writeText(location.href);
      addMessage('success', 'リンクをコピーしました');
    } catch {
      addMessage('danger', 'コピーに失敗しました');
    }
  }, [close, addMessage]);

  return (
    <div className={styles.speedDialFAB_container}>
      {isOpen && (
        <>
          <button
            type="button"
            className={styles.speedDialFAB_overlay}
            onClick={close}
            data-testid="speed-dial-overlay"
            aria-label="メニューを閉じる"
          />
          <div className={styles.speedDialFAB_menu} role="menu">
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
        className={styles.speedDialFAB_fab}
        onClick={toggle}
        aria-label="メニューを開く"
        aria-expanded={isOpen}
      >
        <span className={styles.speedDialFAB_fabIcon({ open: isOpen })}>
          {isOpen ? <X size={24} /> : <DotsThree size={24} weight="bold" />}
        </span>
      </button>
      <FeedbackModal
        open={isFeedbackOpen}
        onOpenChange={handleFeedbackOpenChange}
      />
      <ScenarioRegisterDialog
        open={isScenarioRegisterOpen}
        onOpenChange={handleScenarioRegisterOpenChange}
      />
    </div>
  );
};
