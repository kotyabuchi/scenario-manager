'use client';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { useDiscordAuth } from '@/hooks/useDiscordAuth';

type LoginPromptProps = {
  message: string;
};

export const LoginPrompt = ({ message }: LoginPromptProps) => {
  const { login } = useDiscordAuth();

  return (
    <div className={styles.loginPrompt}>
      <span className={styles.loginPromptText}>{message}</span>
      <Button status="primary" onClick={login}>
        ログイン
      </Button>
    </div>
  );
};
