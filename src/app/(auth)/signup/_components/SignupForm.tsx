'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { isNil } from 'ramda';

import { createUser } from '../actions';

import { css } from '@/styled-system/css';

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

const styles = {
  container: css({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bg: 'gray.50',
    px: '4',
    py: '8',
  }),
  card: css({
    bg: 'white',
    borderRadius: 'xl',
    boxShadow: 'lg',
    p: '8',
    w: 'full',
    maxW: '400px',
  }),
  title: css({
    fontSize: 'xl',
    fontWeight: 'bold',
    color: 'gray.900',
    textAlign: 'center',
    mb: '2',
  }),
  subtitle: css({
    fontSize: 'sm',
    color: 'gray.500',
    textAlign: 'center',
    mb: '6',
  }),
  avatarWrapper: css({
    display: 'flex',
    justifyContent: 'center',
    mb: '6',
  }),
  avatar: css({
    w: '80px',
    h: '80px',
    borderRadius: 'full',
    border: '3px solid',
    borderColor: 'gray.200',
  }),
  error: css({
    bg: 'red.50',
    color: 'red.700',
    p: '3',
    borderRadius: 'md',
    fontSize: 'sm',
    mb: '4',
  }),
  form: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '5',
  }),
  field: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1',
  }),
  label: css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'gray.700',
  }),
  required: css({
    color: 'red.500',
    ml: '1',
  }),
  input: css({
    w: 'full',
    px: '3',
    py: '2',
    border: '1px solid',
    borderColor: 'gray.300',
    borderRadius: 'md',
    fontSize: 'sm',
    outline: 'none',
    transition: 'border-color {durations.normal}',
    _focus: {
      borderColor: 'primary.500',
      boxShadow: '0 0 0 1px var(--colors-primary-500)',
    },
    _placeholder: {
      color: 'gray.400',
    },
  }),
  hint: css({
    fontSize: 'xs',
    color: 'gray.400',
  }),
  submitButton: css({
    w: 'full',
    py: '3',
    px: '4',
    bg: 'primary.600',
    color: 'primary.foreground.white',
    borderRadius: 'lg',
    fontWeight: 'medium',
    cursor: 'pointer',
    transition: 'background {durations.normal}',
    border: 'none',
    fontSize: 'md',
    mt: '2',
    _hover: {
      bg: 'primary.700',
    },
    _disabled: {
      bg: 'gray.400',
      cursor: 'not-allowed',
    },
  }),
};
