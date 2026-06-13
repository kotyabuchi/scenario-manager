'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Notepad, PencilSimple } from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import { updateMemoAction } from '../actions';
import { type SessionMemoValues, sessionMemoSchema } from '../schema';
import * as styles from '../styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
import { Textarea } from '@/components/elements/textarea/textarea';

type GMNotesSectionProps = {
  memo: string | null;
  sessionId: string;
  showEditButton?: boolean;
};

export const GMNotesSection = ({
  memo,
  sessionId,
  showEditButton = false,
}: GMNotesSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticMemo, setOptimisticMemo] = useOptimistic(memo);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SessionMemoValues>({
    resolver: zodResolver(sessionMemoSchema),
    defaultValues: {
      memo: memo ?? '',
    },
  });

  const watchedMemo = watch('memo');

  const onSubmit = (data: SessionMemoValues) => {
    setServerError(null);

    startTransition(async () => {
      setOptimisticMemo(data.memo || null);
      try {
        const result = await updateMemoAction(sessionId, data.memo);
        if (!result.success) {
          setServerError(result.error?.message ?? 'メモの更新に失敗しました');
        } else {
          setIsEditing(false);
          reset({ memo: data.memo });
        }
      } catch {
        setServerError('メモの更新に失敗しました');
      }
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setServerError(null);
    reset({ memo: memo ?? '' });
  };

  return (
    <section className={styles.card}>
      {/* ヘッダー */}
      <div className={styles.memo_header}>
        <div className={styles.cardTitle}>
          <Notepad
            size={20}
            weight="fill"
            className={styles.sectionHeaderIconPrimary}
          />
          <h2>GMメモ</h2>
        </div>
        <div className={styles.sessionActions_secondaryGroup}>
          {showEditButton && !isEditing && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              status="primary"
              className={styles.editButton}
              prefix={<PencilSimple size={16} />}
              aria-label="GMメモを編集"
              onClick={() => setIsEditing(true)}
            >
              編集
            </Button>
          )}
          <span className={styles.memo_badge}>GMのみ閲覧可</span>
        </div>
      </div>
      <hr className={styles.subtleHr} />

      {/* 編集モード */}
      {isEditing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={styles.memo_editForm}
        >
          <Textarea
            rows={6}
            placeholder="メモを入力..."
            {...register('memo')}
          />
          <FieldError error={errors.memo} />
          {!isNil(serverError) && (
            <p className={styles.memo_editError}>{serverError}</p>
          )}
          <div className={styles.memo_editFooter}>
            <span className={styles.memo_editCharCount}>
              {watchedMemo.length} / 2000
            </span>
          </div>
          <div className={styles.memo_editActions}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleCancel}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="solid"
              size="sm"
              loading={isPending}
              loadingText="保存中..."
            >
              保存
            </Button>
          </div>
        </form>
      ) : optimisticMemo ? (
        <p className={styles.memo_content}>{optimisticMemo}</p>
      ) : (
        <p className={styles.memo_empty}>メモはありません</p>
      )}
    </section>
  );
};

export type { GMNotesSectionProps };
