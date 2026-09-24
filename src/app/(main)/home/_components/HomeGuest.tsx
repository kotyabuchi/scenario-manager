'use client';

import * as styles from '../styles';

import { useAuthPrompt } from '@/components/blocks/AuthPrompt';
import { Button } from '@/components/elements/button/button';

export const HomeGuest = () => {
  const openAuthPrompt = useAuthPrompt();

  return (
    <section className={styles.guestCard}>
      <h1 className={styles.guestTitle}>ホームはログイン後に利用できます</h1>
      <p className={styles.guestDescription}>
        参加予定のセッションや最近の活動を、ここでまとめて確認できます。
      </p>
      <Button
        status="primary"
        onClick={() =>
          openAuthPrompt({
            message: 'ホームを見るにはログインが必要です。',
            returnTo: '/home',
          })
        }
      >
        ログイン / 新規登録
      </Button>
    </section>
  );
};
