'use client';

import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { X } from 'lucide-react';

import * as styles from './styles';

import type { ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export const Modal = ({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: ModalProps) => {
  // Ark UI Dialog doesn't properly respond to controlled `open` prop changes
  // Workaround: conditionally render the Dialog based on the `open` prop
  if (!open) return null;

  return (
    <Dialog.Root open={true} onOpenChange={onOpenChange} closeOnInteractOutside>
      <Portal>
        <Dialog.Backdrop
          className={styles.backdrop}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        />
        <Dialog.Positioner className={styles.positioner}>
          <Dialog.Content className={styles.content}>
            <header className={styles.header}>
              <Dialog.Title className={styles.title}>{title}</Dialog.Title>
              <Dialog.CloseTrigger className={styles.closeButton}>
                <X size={20} />
              </Dialog.CloseTrigger>
            </header>
            <div className={styles.body}>{children}</div>
            {footer && <footer className={styles.footer}>{footer}</footer>}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
