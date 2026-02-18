'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import { completeSessionAction } from '../actions';
import { type CompleteSessionValues, completeSessionSchema } from '../schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
import { Modal } from '@/components/elements/modal';
import { Textarea } from '@/components/elements/textarea';

type CompleteSessionDialogProps = {
  sessionId: string;
  expectedUpdatedAt: string;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
};

export const CompleteSessionDialog = ({
  sessionId,
  expectedUpdatedAt,
  open,
  onOpenChange,
}: CompleteSessionDialogProps) => {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompleteSessionValues>({
    resolver: zodResolver(completeSessionSchema),
    defaultValues: {
      note: '',
    },
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    onOpenChange({ open: false });
  };

  const onSubmit = (data: CompleteSessionValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await completeSessionAction(
        sessionId,
        expectedUpdatedAt,
        data,
      );

      if (!result.success) {
        setServerError(
          result.error?.message ?? 'セッションの完了処理に失敗しました',
        );
      } else {
        reset();
        onOpenChange({ open: false });
      }
    });
  };

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        status="primary"
        onClick={handleClose}
        disabled={isPending}
      >
        キャンセル
      </Button>
      <Button
        type="submit"
        status="primary"
        disabled={isPending}
        loading={isPending}
        loadingText="完了処理中..."
        form="complete-session-form"
      >
        <CheckCircle size={16} weight="fill" />
        セッションを完了する
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="セッションを完了"
      footer={footer}
    >
      <form
        id="complete-session-form"
        onSubmit={handleSubmit(onSubmit)}
        className={styles.dialog_form}
      >
        {/* 完了ヘッダー */}
        <div className={styles.dialog_successHeader}>
          <CheckCircle
            size={24}
            weight="fill"
            className={styles.dialog_successIcon}
          />
          <span className={styles.dialog_successTitle}>お疲れさまでした！</span>
        </div>

        <p className={styles.dialog_message}>
          セッションを完了状態に移行します。完了後はセッションのステータスが「完了」に変更され、レビューを書けるようになります。
        </p>

        {!isNil(serverError) && (
          <div className={styles.dialog_serverError} role="alert">
            <WarningCircle size={16} weight="fill" />
            {serverError}
          </div>
        )}

        {/* 完了メモ */}
        <div className={styles.dialog_field}>
          <label htmlFor="complete-note" className={styles.dialog_label}>
            完了メモ（任意）
          </label>
          <Textarea
            id="complete-note"
            {...register('note')}
            placeholder="セッションの感想や次回への引き継ぎメモを残してください"
            rows={4}
          />
          <FieldError error={errors.note} />
        </div>
      </form>
    </Modal>
  );
};
