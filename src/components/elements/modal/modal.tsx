'use client';

import { useRef } from 'react';
import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';

import { ModalCloseButton } from './ModalCloseButton';
import * as styles from './styles';

import type { ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onExitComplete?: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  mobileSheet?: boolean;
  headerVariant?: 'default' | 'danger';
  headerIcon?: ReactNode;
};

export const Modal = ({
  open,
  onOpenChange,
  onExitComplete,
  title,
  children,
  footer,
  size = 'md',
  mobileSheet = false,
  headerVariant = 'default',
  headerIcon,
}: ModalProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      onExitComplete={onExitComplete}
      closeOnInteractOutside
      lazyMount
      unmountOnExit
      initialFocusEl={() => contentRef.current}
    >
      <Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Positioner className={styles.positioner({ mobileSheet })}>
          <Dialog.Content
            ref={contentRef}
            className={styles.content({ size, mobileSheet })}
          >
            {mobileSheet && <div className={styles.sheetHandle} aria-hidden />}
            {headerVariant === 'danger' ? (
              <header className={styles.headerDanger}>
                {headerIcon && (
                  <span className={styles.headerIcon_style}>{headerIcon}</span>
                )}
                <Dialog.Title className={styles.titleDanger}>
                  {title}
                </Dialog.Title>
              </header>
            ) : (
              <>
                <header className={styles.header}>
                  <Dialog.Title className={styles.title}>{title}</Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <ModalCloseButton />
                  </Dialog.CloseTrigger>
                </header>
                <hr className={styles.divider} />
              </>
            )}
            <div className={styles.body}>{children}</div>
            {footer && (
              <>
                <hr className={styles.divider} />
                <footer className={styles.footer}>{footer}</footer>
              </>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
