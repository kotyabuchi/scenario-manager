'use client';

import { useRef, useState } from 'react';
import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { ListBullets } from '@phosphor-icons/react/ssr';

import * as styles from '../styles';

import { SectionToc, type TocSection } from '@/components/blocks/SectionToc';
import { ModalCloseButton } from '@/components/elements/modal';

type ScenarioDetailTocProps = {
  sections: TocSection[];
  variant: 'desktop' | 'mobile';
};

/** 単独ページだけに表示する目次。狭い画面では下から開く。 */
export const ScenarioDetailToc = ({
  sections,
  variant,
}: ScenarioDetailTocProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  if (variant === 'desktop') {
    return (
      <aside className={styles.desktopToc}>
        <div className={styles.tocSticky}>
          <h2 className={styles.tocTitle}>目次</h2>
          <SectionToc sections={sections} />
        </div>
      </aside>
    );
  }

  return (
    <div className={styles.mobileToc}>
      <Dialog.Root
        open={isOpen}
        onOpenChange={(details) => setIsOpen(details.open)}
        closeOnInteractOutside
        lazyMount
        unmountOnExit
        initialFocusEl={() => drawerRef.current}
      >
        <Dialog.Trigger className={styles.mobileTocTrigger}>
          <ListBullets size={18} />
          目次
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop className={styles.drawerBackdrop} />
          <Dialog.Positioner className={styles.drawerPositioner}>
            <Dialog.Content ref={drawerRef} className={styles.drawerContent}>
              <div className={styles.drawerHeader}>
                <Dialog.Title className={styles.tocTitle}>目次</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <ModalCloseButton aria-label="目次を閉じる" />
                </Dialog.CloseTrigger>
              </div>
              <div
                onClickCapture={(event) => {
                  if (
                    event.target instanceof Element &&
                    event.target.closest('a[href^="#"]')
                  ) {
                    setIsOpen(false);
                  }
                }}
              >
                <SectionToc sections={sections} />
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </div>
  );
};
