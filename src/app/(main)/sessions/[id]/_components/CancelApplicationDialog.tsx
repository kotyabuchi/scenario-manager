'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WarningCircle, XCircle } from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import { cancelApplicationAction } from '../actions';
import {
  type CancelApplicationValues,
  cancelApplicationSchema,
} from '../schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { Modal } from '@/components/elements/modal';

type CancelApplicationDialogProps = {
  sessionId: string;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
};

export const CancelApplicationDialog = ({
  sessionId,
  open,
  onOpenChange,
}: CancelApplicationDialogProps) => {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const { handleSubmit, reset } = useForm<CancelApplicationValues>({
    resolver: zodResolver(cancelApplicationSchema),
    defaultValues: {},
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    onOpenChange({ open: false });
  };

  const onSubmit = (_data: CancelApplicationValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await cancelApplicationAction(sessionId, _data);

      if (!result.success) {
        setServerError(result.error?.message ?? '申請の取り消しに失敗しました');
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
        loadingText="取り消し中..."
        form="cancel-application-form"
      >
        <XCircle size={16} />
        申請を取り消す
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="参加申請を取り消す"
      footer={footer}
    >
      <form
        id="cancel-application-form"
        onSubmit={handleSubmit(onSubmit)}
        className={styles.dialog_form}
      >
        <p className={styles.dialog_message}>
          このセッションへの参加申請を取り消します。取り消し後、再度申請することができます（セッションが募集中の場合）。
        </p>

        {!isNil(serverError) && (
          <div className={styles.dialog_serverError} role="alert">
            <WarningCircle size={16} weight="fill" aria-hidden="true" />
            {serverError}
          </div>
        )}
      </form>
    </Modal>
  );
};
