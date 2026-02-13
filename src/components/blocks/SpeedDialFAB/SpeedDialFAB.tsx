'use client';

import { DotsThree, X } from '@phosphor-icons/react/ssr';

import { SpeedDialPanel } from './SpeedDialPanel';
import * as styles from './styles';
import { useSpeedDial } from './useSpeedDial';

type SpeedDialFABProps = {
  isAuthenticated: boolean;
};

export const SpeedDialFAB = ({ isAuthenticated }: SpeedDialFABProps) => {
  const { isOpen, close, toggle } = useSpeedDial();

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
            <SpeedDialPanel isAuthenticated={isAuthenticated} onClose={close} />
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
    </div>
  );
};
