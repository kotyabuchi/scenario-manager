'use client';

import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { Link, PencilLine, X } from '@phosphor-icons/react/ssr';
import NextLink from 'next/link';

import * as styles from './styles';

import * as modalStyles from '@/components/elements/modal/styles';

import type { PropsWithChildren } from 'react';

type ScenarioRegisterDialogProps = PropsWithChildren<{
  /** 制御モード: 外部から開閉を管理する場合に指定 */
  open?: boolean;
  onOpenChange?: (details: { open: boolean }) => void;
}>;

const DialogContent = () => (
  <>
    <header className={styles.header}>
      <Dialog.Title className={styles.title}>シナリオを登録</Dialog.Title>
      <Dialog.CloseTrigger className={styles.closeButton} aria-label="閉じる">
        <X size={20} />
      </Dialog.CloseTrigger>
    </header>
    <nav className={styles.nav}>
      <Dialog.CloseTrigger asChild>
        <NextLink href="/scenarios/new" className={styles.navItem}>
          <PencilLine size={20} />
          <span>手動で入力</span>
        </NextLink>
      </Dialog.CloseTrigger>
      <Dialog.CloseTrigger asChild>
        <NextLink href="/scenarios/import" className={styles.navItem}>
          <Link size={20} />
          <span>URLからインポート</span>
        </NextLink>
      </Dialog.CloseTrigger>
    </nav>
  </>
);

export const ScenarioRegisterDialog = ({
  children,
  open,
  onOpenChange,
}: ScenarioRegisterDialogProps) => {
  // 制御モード: open/onOpenChange で外部から管理
  if (open !== undefined) {
    if (!open) return null;

    return (
      <Dialog.Root
        open={true}
        onOpenChange={onOpenChange}
        closeOnInteractOutside
      >
        <Portal>
          <Dialog.Backdrop className={modalStyles.backdrop} />
          <Dialog.Positioner className={modalStyles.positioner}>
            <Dialog.Content className={styles.content}>
              <DialogContent />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  }

  // 非制御モード: Dialog.Trigger で自己管理
  return (
    <Dialog.Root closeOnInteractOutside lazyMount unmountOnExit>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={modalStyles.backdrop} />
        <Dialog.Positioner className={modalStyles.positioner}>
          <Dialog.Content className={styles.content}>
            <DialogContent />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
