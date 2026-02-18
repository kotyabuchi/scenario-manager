'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WarningCircle } from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import { cancelSessionAction } from '../actions';
import { type CancelSessionValues, cancelSessionSchema } from '../schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
import { Input } from '@/components/elements/input';
import { Modal } from '@/components/elements/modal';
import { Textarea } from '@/components/elements/textarea';

type CancelSessionDialogProps = {
  sessionId: string;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
};

export const CancelSessionDialog = ({
  sessionId,
  open,
  onOpenChange,
}: CancelSessionDialogProps) => {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CancelSessionValues>({
    resolver: zodResolver(cancelSessionSchema),
    defaultValues: {
      reason: '',
      confirmText: '',
    },
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    onOpenChange({ open: false });
  };

  const onSubmit = (data: CancelSessionValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await cancelSessionAction(sessionId, data);

      if (!result.success) {
        setServerError(result.error?.message ?? 'キャンセルに失敗しました');
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
        戻る
      </Button>
      <Button
        type="submit"
        status="danger"
        disabled={isPending}
        loading={isPending}
        loadingText="キャンセル中..."
        form="cancel-session-form"
      >
        <WarningCircle size={16} weight="fill" />
        キャンセルする
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="セッションをキャンセル"
      footer={footer}
    >
      <form
        id="cancel-session-form"
        onSubmit={handleSubmit(onSubmit)}
        className={styles.dialog_form}
      >
        {/* 警告ヘッダー */}
        <div className={styles.dialog_warningHeader}>
          <WarningCircle
            size={24}
            weight="fill"
            className={styles.dialog_warningIcon}
          />
          <span className={styles.dialog_warningTitle}>
            この操作は取り消せません
          </span>
        </div>

        {/* 影響説明ボックス */}
        <div className={styles.dialog_impactBox}>
          <p className={styles.dialog_impactTitle}>キャンセルすると：</p>
          <ul className={styles.dialog_impactList}>
            <li>参加者全員に通知されます</li>
            <li>セッションのステータスがキャンセルに変更されます</li>
            <li>この操作は元に戻せません</li>
          </ul>
        </div>

        {!isNil(serverError) && (
          <div className={styles.dialog_serverError} role="alert">
            <WarningCircle size={16} weight="fill" aria-hidden="true" />
            {serverError}
          </div>
        )}

        {/* キャンセル理由 */}
        <div className={styles.dialog_field}>
          <label htmlFor="cancel-reason" className={styles.dialog_label}>
            キャンセル理由（任意）
          </label>
          <Textarea
            id="cancel-reason"
            {...register('reason')}
            placeholder="参加者へのメッセージを入力してください"
            rows={3}
          />
          <FieldError error={errors.reason} />
        </div>

        {/* 二重確認 */}
        <div className={styles.dialog_field}>
          <label htmlFor="cancel-confirm" className={styles.dialog_label}>
            確認のため「キャンセル」と入力してください
            <span className={styles.dialog_required}>*</span>
          </label>
          <Input
            type="text"
            id="cancel-confirm"
            {...register('confirmText')}
            placeholder="キャンセル"
          />
          <FieldError error={errors.confirmText} />
          <p className={styles.dialog_confirmHint}>
            「キャンセル」と入力すると実行ボタンが有効になります
          </p>
        </div>
      </form>
    </Modal>
  );
};
