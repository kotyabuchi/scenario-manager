'use client';

import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { Link2, PenLine, X } from 'lucide-react';
import Link from 'next/link';

import * as styles from './styles';

import * as modalStyles from '@/components/elements/modal/styles';

import type { PropsWithChildren } from 'react';

export const ScenarioRegisterDialog = ({ children }: PropsWithChildren) => {
  return (
    <Dialog.Root closeOnInteractOutside lazyMount unmountOnExit>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={modalStyles.backdrop} />
        <Dialog.Positioner className={modalStyles.positioner}>
          <Dialog.Content className={styles.content}>
            <header className={styles.header}>
              <Dialog.Title className={styles.title}>
                シナリオを登録
              </Dialog.Title>
              <Dialog.CloseTrigger
                className={styles.closeButton}
                aria-label="閉じる"
              >
                <X size={20} />
              </Dialog.CloseTrigger>
            </header>
            <nav className={styles.nav}>
              <Dialog.CloseTrigger asChild>
                <Link href="/scenarios/new" className={styles.navItem}>
                  <PenLine size={20} />
                  <span>手動で入力</span>
                </Link>
              </Dialog.CloseTrigger>
              <Dialog.CloseTrigger asChild>
                <Link href="/scenarios/import" className={styles.navItem}>
                  <Link2 size={20} />
                  <span>URLからインポート</span>
                </Link>
              </Dialog.CloseTrigger>
            </nav>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
