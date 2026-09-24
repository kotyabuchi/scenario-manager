'use client';

import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { SignIn, X } from '@phosphor-icons/react/ssr';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import * as modalStyles from '@/components/elements/modal/styles';

import type { AuthPromptRequest } from './authPromptContext';

type AuthPromptDialogProps = {
  open: boolean;
  request: AuthPromptRequest | null;
  onClose: () => void;
  onContinue: () => void;
};

export const AuthPromptDialog = ({
  open,
  request,
  onClose,
  onContinue,
}: AuthPromptDialogProps) => (
  <Dialog.Root
    open={open}
    onOpenChange={({ open: isOpen }) => {
      if (!isOpen) onClose();
    }}
    lazyMount
    unmountOnExit
  >
    <Portal>
      <Dialog.Backdrop className={modalStyles.backdrop} />
      <Dialog.Positioner className={styles.positioner}>
        <Dialog.Content className={styles.content}>
          <div className={styles.handle} aria-hidden="true" />
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>
              ログイン / 新規登録
            </Dialog.Title>
            <Dialog.CloseTrigger
              className={styles.closeButton}
              aria-label="閉じる"
            >
              <X size={20} />
            </Dialog.CloseTrigger>
          </div>
          <Dialog.Description className={styles.description}>
            {request?.message}
          </Dialog.Description>
          <p className={styles.note}>
            Discordアカウントで続けられます。初めての方は認証後にプロフィールを登録できます。
          </p>
          <div className={styles.actions}>
            <Button
              status="primary"
              onClick={onContinue}
              prefix={<SignIn size={18} />}
            >
              Discordで続ける
            </Button>
            <Button variant="ghost" onClick={onClose}>
              あとで
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
);

export type { AuthPromptDialogProps };
