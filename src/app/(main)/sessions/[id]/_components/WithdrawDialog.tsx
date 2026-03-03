'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BellRinging, SignOut, WarningCircle } from '@phosphor-icons/react/ssr';
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
    watch,
    formState: { errors },
  } = useForm<WithdrawValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      reason: '',
    },
  });

  const reasonLength = watch('reason')?.length ?? 0;

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
        戻る
      </Button>
      <Button
        type="submit"
        status="danger"
        disabled={isPending}
        loading={isPending}
        loadingText="辞退中..."
        form="withdraw-form"
      >
        辞退する
        <SignOut size={16} />
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="セッションから辞退しますか？"
      footer={footer}
    >
      <form
        id="withdraw-form"
        onSubmit={handleSubmit(onSubmit)}
        className={styles.dialog_form}
      >
        {/* 警告ボックス */}
        <div className={styles.dialog_warningBox}>
          <BellRinging
            size={20}
            weight="fill"
            className={styles.dialog_warningBox_icon}
            aria-hidden="true"
          />
          <div className={styles.dialog_warningBox_content}>
            <p className={styles.dialog_warningBox_title}>
              GMに参加辞退の連絡を送ります。
            </p>
            <p className={styles.dialog_warningBox_description}>
              円滑なセッション運営のため、無断欠席は避けましょう。辞退の理由はGMにのみ通知されます。
            </p>
          </div>
        </div>

        {!isNil(serverError) && (
          <div className={styles.dialog_serverError} role="alert">
            <WarningCircle size={16} weight="fill" aria-hidden="true" />
            {serverError}
          </div>
        )}

        {/* 辞退理由 */}
        <div className={styles.dialog_field}>
          <label htmlFor="withdraw-reason" className={styles.dialog_label}>
            辞退の理由
            <span className={styles.dialog_requiredBadge}>必須</span>
          </label>
          <Textarea
            id="withdraw-reason"
            {...register('reason')}
            placeholder="体調不良のため、参加が難しくなりました..."
            rows={4}
            maxLength={200}
          />
          <FieldError error={errors.reason} />
          <p
            className={styles.cx(
              styles.charCount,
              reasonLength > 200 && styles.charCount_warning,
            )}
          >
            {reasonLength} / 200文字
          </p>
        </div>
      </form>
    </Modal>
  );
};
