'use client';

import { type FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  type SessionFormInput,
  type SessionFormValues,
  sessionFormSchema,
} from '../schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';

type SessionFormProps = {
  onSubmit?: (data: SessionFormValues) => void;
  defaultValues?: Partial<SessionFormInput>;
  isSubmitting?: boolean;
  errors?: FieldErrors<SessionFormInput>;
};

export const SessionForm = ({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  errors: externalErrors,
}: SessionFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SessionFormInput>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      sessionName: defaultValues?.sessionName ?? '',
      sessionDescription: defaultValues?.sessionDescription ?? '',
      scenarioId: defaultValues?.scenarioId ?? null,
      scheduledAt: defaultValues?.scheduledAt ?? null,
      recruitedPlayerCount: defaultValues?.recruitedPlayerCount ?? null,
      tools: defaultValues?.tools ?? null,
      isBeginnerFriendly: defaultValues?.isBeginnerFriendly ?? false,
      visibility: defaultValues?.visibility ?? 'PUBLIC',
    },
  });

  const onFormSubmit = (data: SessionFormInput) => {
    // zodResolverがバリデーション済みなのでデフォルト値が適用されている
    // 空文字列をnullに変換して SessionFormValues として渡す
    const normalizedData: SessionFormValues = {
      sessionName: data.sessionName,
      sessionDescription: data.sessionDescription,
      scenarioId: data.scenarioId || null,
      scheduledAt: data.scheduledAt || null,
      recruitedPlayerCount: data.recruitedPlayerCount ?? null,
      tools: data.tools || null,
      isBeginnerFriendly: data.isBeginnerFriendly ?? false,
      visibility: data.visibility ?? 'PUBLIC',
    };
    onSubmit?.(normalizedData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className={styles.form}>
      {/* セッション名（必須） */}
      <div className={styles.field}>
        <label htmlFor="sessionName" className={styles.label}>
          セッション名
          <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="sessionName"
          {...register('sessionName')}
          className={styles.input}
          placeholder="例: 週末CoC7版セッション"
          maxLength={100}
        />
        <FieldError error={errors.sessionName ?? externalErrors?.sessionName} />
      </div>

      {/* 募集文（必須） */}
      <div className={styles.field}>
        <label htmlFor="sessionDescription" className={styles.label}>
          募集文
          <span className={styles.required}>*</span>
        </label>
        <textarea
          id="sessionDescription"
          {...register('sessionDescription')}
          className={styles.textarea}
          placeholder="セッションの概要や参加者への呼びかけを書いてください"
          maxLength={500}
        />
        <FieldError
          error={
            errors.sessionDescription ?? externalErrors?.sessionDescription
          }
        />
      </div>

      {/* シナリオ選択（任意） */}
      <div className={styles.field}>
        <label htmlFor="scenarioId" className={styles.label}>
          シナリオ
        </label>
        <select
          id="scenarioId"
          {...register('scenarioId')}
          className={styles.select}
        >
          <option value="">未定</option>
          {/* TODO: シナリオ一覧を動的に取得 */}
        </select>
      </div>

      {/* 日時（任意） */}
      <div className={styles.field}>
        <label htmlFor="scheduledAt" className={styles.label}>
          日時
        </label>
        <input
          type="datetime-local"
          id="scheduledAt"
          {...register('scheduledAt')}
          className={styles.input}
        />
      </div>

      {/* 募集人数（任意） */}
      <div className={styles.field}>
        <label htmlFor="recruitedPlayerCount" className={styles.label}>
          募集人数
        </label>
        <input
          type="number"
          id="recruitedPlayerCount"
          {...register('recruitedPlayerCount', { valueAsNumber: true })}
          className={styles.input}
          min={1}
          max={10}
          placeholder="未定"
        />
        <FieldError error={errors.recruitedPlayerCount} />
      </div>

      {/* 使用ツール（任意） */}
      <div className={styles.field}>
        <label htmlFor="tools" className={styles.label}>
          使用ツール
        </label>
        <input
          type="text"
          id="tools"
          {...register('tools')}
          className={styles.input}
          placeholder="例: Discord + ココフォリア"
          maxLength={200}
        />
      </div>

      {/* 初心者歓迎 */}
      <div className={styles.checkboxField}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            {...register('isBeginnerFriendly')}
            className={styles.checkbox}
          />
          初心者歓迎
        </label>
      </div>

      {/* 公開範囲 */}
      <div className={styles.field}>
        <span className={styles.label}>公開範囲</span>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              {...register('visibility')}
              value="PUBLIC"
              className={styles.radio}
            />
            全体公開
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              {...register('visibility')}
              value="FOLLOWERS_ONLY"
              className={styles.radio}
            />
            フォロワーのみ
          </label>
        </div>
      </div>

      {/* 送信ボタン */}
      <div className={styles.submitArea}>
        <Button
          type="submit"
          status="primary"
          disabled={isSubmitting}
          loading={isSubmitting}
          loadingText="投稿中..."
        >
          募集を投稿
        </Button>
      </div>
    </form>
  );
};
