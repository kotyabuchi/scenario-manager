'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isNil } from 'ramda';

import { updateProfile } from '../actions';
import { type ProfileFormValues, profileFormSchema } from './schema';
import * as styles from './styles';

import { FieldError } from '@/components/elements';

import type { ProfileEditFormProps } from '../interface';

export const ProfileEditForm = ({ user }: ProfileEditFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nickname: user.nickname,
      bio: user.bio ?? '',
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    setServerError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateProfile(data);

      if (!result.success) {
        setServerError(result.error.message);
      } else {
        setSuccess(true);
      }
    });
  };

  return (
    <div className={styles.editForm_container}>
      <h2 className={styles.editForm_title}>プロフィール編集</h2>

      {!isNil(serverError) && (
        <div className={styles.editForm_error}>{serverError}</div>
      )}
      {success && (
        <div className={styles.editForm_success}>
          プロフィールを更新しました
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.editForm_form}>
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
            {...register('nickname')}
            className={styles.editForm_input}
            maxLength={50}
          />
          <FieldError error={errors.nickname} />
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
            {...register('bio')}
            className={styles.editForm_textarea}
            maxLength={500}
            rows={4}
            placeholder="自己紹介を入力してください..."
          />
          <FieldError error={errors.bio} />
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
