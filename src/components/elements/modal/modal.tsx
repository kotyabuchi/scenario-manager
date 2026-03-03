'use client';

import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { X } from '@phosphor-icons/react/ssr';

import * as styles from './styles';

import type { ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  headerVariant?: 'default' | 'danger';
  headerIcon?: ReactNode;
};

export const Modal = ({
  open,
  onOpenChange,
  title,
  children,
  footer,
  size = 'md',
  headerVariant = 'default',
  headerIcon,
}: ModalProps) => {
  // Ark UI Dialog doesn't properly respond to controlled `open` prop changes
  // Workaround: conditionally render the Dialog based on the `open` prop
  if (!open) return null;

  return (
    <Dialog.Root open={true} onOpenChange={onOpenChange} closeOnInteractOutside>
      <Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Positioner className={styles.positioner}>
          <Dialog.Content className={styles.content({ size })}>
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
                  <Dialog.CloseTrigger
                    className={styles.closeButton}
                    aria-label="閉じる"
                  >
                    <X size={20} />
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
