'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserMinus, WarningCircle } from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import { withdrawFromSessionAction } from '../actions';
import { type WithdrawValues, withdrawSchema } from '../schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
import { Modal } from '@/components/elements/modal';
import { Textarea } from '@/components/elements/textarea';

type WithdrawDialogProps = {
  sessionId: string;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
};

export const WithdrawDialog = ({
  sessionId,
  open,
  onOpenChange,
}: WithdrawDialogProps) => {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WithdrawValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      reason: '',
    },
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    onOpenChange({ open: false });
  };

  const onSubmit = (data: WithdrawValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await withdrawFromSessionAction(sessionId, data);

      if (!result.success) {
        setServerError(result.error?.message ?? '辞退処理に失敗しました');
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
        status="danger"
        disabled={isPending}
        loading={isPending}
        loadingText="辞退中..."
        form="withdraw-form"
      >
        <UserMinus size={16} />
        辞退する
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="セッションを辞退"
      footer={footer}
    >
      <form
        id="withdraw-form"
        onSubmit={handleSubmit(onSubmit)}
        className={styles.dialog_form}
      >
        <p className={styles.dialog_message}>
          このセッションへの参加を辞退します。辞退後もセッションページは閲覧できますが、参加者としての権限は失われます。
        </p>

        {!isNil(serverError) && (
          <div className={styles.dialog_serverError} role="alert">
            <WarningCircle size={16} weight="fill" aria-hidden="true" />
            {serverError}
          </div>
        )}

        {/* 辞退理由 */}
        <div className={styles.dialog_field}>
          <label htmlFor="withdraw-reason" className={styles.dialog_label}>
            辞退理由（任意）
          </label>
          <Textarea
            id="withdraw-reason"
            {...register('reason')}
            placeholder="GMへのメッセージを入力してください"
            rows={3}
          />
          <FieldError error={errors.reason} />
        </div>
      </form>
    </Modal>
  );
};
