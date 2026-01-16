'use client';

import { useState, useTransition } from 'react';
import { isNil } from 'ramda';

import { updateProfile } from '../actions';
import * as styles from './styles';

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
    <div className={styles.editForm_container}>
      <h2 className={styles.editForm_title}>プロフィール編集</h2>

      {!isNil(error) && <div className={styles.editForm_error}>{error}</div>}
      {success && (
        <div className={styles.editForm_success}>
          プロフィールを更新しました
        </div>
      )}

      <form action={handleSubmit} className={styles.editForm_form}>
        <div className={styles.editForm_field}>
          <label htmlFor="userName" className={styles.editForm_label}>
            ユーザー名
          </label>
          <input
            type="text"
            id="userName"
            value={`@${user.userName}`}
            className={styles.editForm_inputDisabled}
            disabled
          />
          <p className={styles.editForm_hint}>ユーザー名は変更できません</p>
        </div>

        <div className={styles.editForm_field}>
          <label htmlFor="nickname" className={styles.editForm_label}>
            表示名
            <span className={styles.editForm_required}>*</span>
          </label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            defaultValue={user.nickname}
            className={styles.editForm_input}
            maxLength={50}
            required
          />
          <p className={styles.editForm_hint}>
            他のユーザーに表示される名前です（50文字以内）
          </p>
        </div>

        <div className={styles.editForm_field}>
          <label htmlFor="bio" className={styles.editForm_label}>
            自己紹介
          </label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={user.bio ?? ''}
            className={styles.editForm_textarea}
            maxLength={500}
            rows={4}
            placeholder="自己紹介を入力してください..."
          />
          <p className={styles.editForm_hint}>500文字以内</p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={styles.editForm_submitButton}
        >
          {isPending ? '更新中...' : '更新する'}
        </button>
      </form>
    </div>
  );
};
