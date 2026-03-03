'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, LockSimple, WarningCircle } from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import { cancelSessionAction } from '../actions';
import { type CancelSessionValues, cancelSessionSchema } from '../schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
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
        <LockSimple size={16} weight="fill" />
        キャンセルする
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="セッションをキャンセルしますか？"
      headerVariant="danger"
      headerIcon={<WarningCircle size={24} weight="fill" />}
      footer={footer}
    >
      <form
        id="cancel-session-form"
        onSubmit={handleSubmit(onSubmit)}
        className={styles.dialog_form}
      >
        {/* 情報ボックス */}
        <div className={styles.dialog_infoBox}>
          <Info
            size={20}
            weight="fill"
            className={styles.dialog_infoBox_icon}
            aria-hidden="true"
          />
          <div className={styles.dialog_infoBox_content}>
            <p className={styles.dialog_infoBox_title}>
              この操作は取り消せません。
            </p>
            <p className={styles.dialog_infoBox_description}>
              セッションをキャンセルすると、参加予定のプレイヤー全員に通知が送信されます。また、このセッションのスケジュールは削除されます。
            </p>
          </div>
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
            キャンセル理由
            <span className={styles.optionalBadge}>（任意）</span>
          </label>
          <Textarea
            id="cancel-reason"
            {...register('reason')}
            placeholder="急用が入ってしまったため、やむを得ずキャンセルいたします..."
            rows={4}
          />
          <FieldError error={errors.reason} />
        </div>
      </form>
    </Modal>
  );
};
