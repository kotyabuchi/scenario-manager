'use client';

import { useState, useTransition } from 'react';
import { isNil } from 'ramda';

import { updateProfile } from '../actions';

import { css } from '@/styled-system/css';

import type { ProfileEditFormProps } from '../interface';

export const ProfileEditForm = ({ user }: ProfileEditFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(false);

    const nickname = formData.get('nickname') as string;
    const bio = formData.get('bio') as string;

    // バリデーション
    if (isNil(nickname) || nickname.trim() === '') {
      setError('表示名を入力してください');
      return;
    }

    if (nickname.length > 50) {
      setError('表示名は50文字以内で入力してください');
      return;
    }

    if (!isNil(bio) && bio.length > 500) {
      setError('自己紹介は500文字以内で入力してください');
      return;
    }

    startTransition(async () => {
      const result = await updateProfile({
        nickname,
        bio: bio || undefined,
      });

      if (!result.success) {
        setError(result.error.message);
      } else {
        setSuccess(true);
      }
    });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>プロフィール編集</h2>

      {!isNil(error) && <div className={styles.error}>{error}</div>}
      {success && (
        <div className={styles.success}>プロフィールを更新しました</div>
      )}

      <form action={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="userName" className={styles.label}>
            ユーザー名
          </label>
          <input
            type="text"
            id="userName"
            value={`@${user.userName}`}
            className={styles.inputDisabled}
            disabled
          />
          <p className={styles.hint}>ユーザー名は変更できません</p>
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
            defaultValue={user.nickname}
            className={styles.input}
            maxLength={50}
            required
          />
          <p className={styles.hint}>
            他のユーザーに表示される名前です（50文字以内）
          </p>
        </div>

        <div className={styles.field}>
          <label htmlFor="bio" className={styles.label}>
            自己紹介
          </label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={user.bio ?? ''}
            className={styles.textarea}
            maxLength={500}
            rows={4}
            placeholder="自己紹介を入力してください..."
          />
          <p className={styles.hint}>500文字以内</p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={styles.submitButton}
        >
          {isPending ? '更新中...' : '更新する'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: css({
    bg: 'white',
    borderRadius: 'xl',
    boxShadow: 'md',
    p: '6',
  }),
  title: css({
    fontSize: 'lg',
    fontWeight: 'bold',
    color: 'gray.900',
    mb: '4',
  }),
  error: css({
    bg: 'red.50',
    color: 'red.700',
    p: '3',
    borderRadius: 'md',
    fontSize: 'sm',
    mb: '4',
  }),
  success: css({
    bg: 'green.50',
    color: 'green.700',
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
    transition: 'border-color 0.2s',
    _focus: {
      borderColor: 'blue.500',
      boxShadow: '0 0 0 1px var(--colors-blue-500)',
    },
    _placeholder: {
      color: 'gray.400',
    },
  }),
  inputDisabled: css({
    w: 'full',
    px: '3',
    py: '2',
    border: '1px solid',
    borderColor: 'gray.200',
    borderRadius: 'md',
    fontSize: 'sm',
    bg: 'gray.50',
    color: 'gray.500',
    cursor: 'not-allowed',
  }),
  textarea: css({
    w: 'full',
    px: '3',
    py: '2',
    border: '1px solid',
    borderColor: 'gray.300',
    borderRadius: 'md',
    fontSize: 'sm',
    outline: 'none',
    resize: 'vertical',
    minH: '100px',
    transition: 'border-color 0.2s',
    _focus: {
      borderColor: 'blue.500',
      boxShadow: '0 0 0 1px var(--colors-blue-500)',
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
    bg: 'blue.600',
    color: 'white',
    borderRadius: 'lg',
    fontWeight: 'medium',
    cursor: 'pointer',
    transition: 'background 0.2s',
    border: 'none',
    fontSize: 'md',
    mt: '2',
    _hover: {
      bg: 'blue.700',
    },
    _disabled: {
      bg: 'gray.400',
      cursor: 'not-allowed',
    },
  }),
};
