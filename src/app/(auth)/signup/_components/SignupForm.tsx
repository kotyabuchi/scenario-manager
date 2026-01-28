'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { isNil } from 'ramda';

import { createUser } from '../actions';
import * as styles from './styles';

type SignupFormProps = {
  defaultNickname: string;
  avatarUrl: string;
};

export const SignupForm = ({ defaultNickname, avatarUrl }: SignupFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);

    const userName = formData.get('userName') as string;
    const nickname = formData.get('nickname') as string;

    // バリデーション
    if (isNil(userName) || userName.trim() === '') {
      setError('ユーザー名を入力してください');
      return;
    }

    if (userName.length < 3 || userName.length > 20) {
      setError('ユーザー名は3〜20文字で入力してください');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(userName)) {
      setError('ユーザー名は英数字とアンダースコアのみ使用できます');
      return;
    }

    if (isNil(nickname) || nickname.trim() === '') {
      setError('表示名を入力してください');
      return;
    }

    if (nickname.length > 50) {
      setError('表示名は50文字以内で入力してください');
      return;
    }

    startTransition(async () => {
      const result = await createUser({ userName, nickname });

      if (!result.success) {
        setError(result.error.message);
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>プロフィール設定</h1>
        <p className={styles.subtitle}>
          はじめに、あなたのプロフィールを設定してください
        </p>

        {!isNil(avatarUrl) && avatarUrl !== '' && (
          <div className={styles.avatarWrapper}>
            <Image
              src={avatarUrl}
              alt="アバター"
              width={80}
              height={80}
              className={styles.avatar}
            />
          </div>
        )}

        {!isNil(error) && <div className={styles.error}>{error}</div>}

        <form action={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="userName" className={styles.label}>
              ユーザー名
              <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="userName"
              name="userName"
              placeholder="例: taro_yamada"
              className={styles.input}
              maxLength={20}
              pattern="^[a-zA-Z0-9_]+$"
              required
            />
            <p className={styles.hint}>英数字とアンダースコア、3〜20文字</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="nickname" className={styles.label}>
              表示名
              <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              placeholder="例: たろう"
              defaultValue={defaultNickname}
              className={styles.input}
              maxLength={50}
              required
            />
            <p className={styles.hint}>他のユーザーに表示される名前です</p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={styles.submitButton}
          >
            {isPending ? '登録中...' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  );
};
