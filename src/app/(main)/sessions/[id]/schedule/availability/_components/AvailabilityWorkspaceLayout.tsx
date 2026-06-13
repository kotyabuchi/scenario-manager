'use client';

import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { X } from '@phosphor-icons/react/ssr';

import * as styles from './styles';

import type { ReactNode } from 'react';

type AvailabilityWorkspaceLayoutProps = {
  calendarSection: ReactNode;
  selectedTimeBlocksSection: ReactNode;
  desktopSidebarSection: ReactNode;
  mobileSidebarSection: ReactNode;
  mobileSidebarTitle: string;
  mobileSidebarOpen: boolean;
  onMobileSidebarOpenChange: (open: boolean) => void;
  stickyBar?: ReactNode;
};

export const AvailabilityWorkspaceLayout = ({
  calendarSection,
  selectedTimeBlocksSection,
  desktopSidebarSection,
  mobileSidebarSection,
  mobileSidebarTitle,
  mobileSidebarOpen,
  onMobileSidebarOpenChange,
  stickyBar,
}: AvailabilityWorkspaceLayoutProps) => {
  return (
    <>
      <div className={styles.workspace}>
        <div className={styles.leftColumn}>
          <section className={styles.card}>
            <div className={styles.cardBody}>{calendarSection}</div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardBody}>{selectedTimeBlocksSection}</div>
          </section>
        </div>

        <aside className={styles.desktopSidebar}>
          <section className={styles.card}>
            <div className={styles.cardBody}>{desktopSidebarSection}</div>
          </section>
        </aside>
      </div>

      <Dialog.Root
        open={mobileSidebarOpen}
        onOpenChange={(details) => onMobileSidebarOpenChange(details.open)}
        closeOnInteractOutside
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop className={styles.mobileDrawerBackdrop} />
          <Dialog.Positioner className={styles.mobileDrawerPositioner}>
            <Dialog.Content className={styles.mobileDrawerContent}>
              <div className={styles.mobileDrawerHandle} aria-hidden="true">
                <div className={styles.mobileDrawerHandleBar} />
              </div>
              <header className={styles.mobileDrawerHeader}>
                <Dialog.Title className={styles.mobileDrawerTitle}>
                  {mobileSidebarTitle}
                </Dialog.Title>
                <Dialog.CloseTrigger
                  className={styles.iconButton}
                  aria-label="閉じる"
                >
                  <X size={18} />
                </Dialog.CloseTrigger>
              </header>
              <div className={styles.mobileDrawerBody}>
                {mobileSidebarSection}
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {stickyBar}
    </>
  );
};
