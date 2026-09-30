'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DotsThree, X } from '@phosphor-icons/react/ssr';

import { FeedbackModal } from '../FeedbackModal';
import { ScenarioRegisterDialog } from '../ScenarioRegisterDialog';
import { SpeedDialPanel } from './SpeedDialPanel';
import { shareCurrentPage } from './share';
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

  return (
    <div className={styles.speedDialFAB_container}>
      <button
        type="button"
        className={styles.speedDialFAB_overlay({ visible: isOpen })}
        onClick={close}
        data-testid="speed-dial-overlay"
        aria-hidden="true"
        tabIndex={-1}
      />
      <section
        id="desktop-quick-actions"
        ref={menuRef}
        className={styles.speedDialFAB_menu({ visible: isOpen })}
        aria-label="クイック操作"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <SpeedDialPanel
          isAuthenticated={isAuthenticated}
          onClose={handleActionClose}
          onFeedbackOpen={handleFeedbackOpen}
          onScenarioRegister={handleScenarioRegister}
          onShare={handleShare}
        />
      </section>
      <button
        type="button"
        ref={toggleRef}
        className={styles.speedDialFAB_fab}
        onClick={toggle}
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={isOpen}
        aria-controls="desktop-quick-actions"
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
