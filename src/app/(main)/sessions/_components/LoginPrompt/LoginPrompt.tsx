'use client';

import * as styles from './styles';

import { useAuthPrompt } from '@/components/blocks/AuthPrompt';
import { Button } from '@/components/elements/button/button';

type LoginPromptProps = {
  message: string;
};

export const LoginPrompt = ({ message }: LoginPromptProps) => {
  const openAuthPrompt = useAuthPrompt();

  return (
    <div className={styles.loginPrompt}>
      <span className={styles.loginPromptText}>{message}</span>
      <Button status="primary" onClick={() => openAuthPrompt({ message })}>
        ログイン / 新規登録
      </Button>
    </div>
  );
};
