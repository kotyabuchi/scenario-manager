'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WarningCircle } from '@phosphor-icons/react/ssr';

import { type CancelReasonValues, cancelReasonSchema } from './schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { Modal, ModalDismissButton } from '@/components/elements/modal';

type CancelType =
  | 'cancel_session'
  | 'withdraw_application'
  | 'kick_participant';

type CancelModalProps = {
  isOpen: boolean;
  onClose?: () => void;
  onConfirm?: (data: { reason: string }) => void;
  type?: CancelType;
  sessionName?: string;
  participantName?: string;
  isSubmitting?: boolean;
};

const getTitle = (type?: CancelType): string => {
  switch (type) {
    case 'cancel_session':
      return 'セッションをキャンセル';
    case 'withdraw_application':
      return '参加を辞退';
    case 'kick_participant':
      return '参加者を除外';
    default:
      return '確認';
  }
};

const getConfirmButtonText = (type?: CancelType): string => {
  switch (type) {
    case 'cancel_session':
      return 'セッションをキャンセルする';
    case 'withdraw_application':
      return '辞退する';
    case 'kick_participant':
      return '除外する';
    default:
      return '確認';
  }
};

const getWarningMessage = (type?: CancelType): string => {
  switch (type) {
    case 'cancel_session':
      return 'セッションをキャンセルすると、参加者全員に通知されます。この操作は取り消せません。';
    case 'withdraw_application':
      return '辞退すると、GMに通知されます。';
    case 'kick_participant':
      return '参加者を除外すると、その参加者に通知されます。';
    default:
      return 'この操作は取り消せません。';
  }
};

export const CancelModal = ({
  isOpen,
  onClose,
  onConfirm,
  type = 'cancel_session',
  sessionName,
  participantName,
  isSubmitting = false,
}: CancelModalProps) => {
  const { register, handleSubmit, reset } = useForm<CancelReasonValues>({
    resolver: zodResolver(cancelReasonSchema),
    defaultValues: { reason: '' },
  });

  const handleClose = () => {
    onClose?.();
  };

  const handleConfirm = handleSubmit(({ reason }) => {
    onConfirm?.({ reason });
  });

  const footer = (
    <>
      <ModalDismissButton onClick={handleClose}>
        {type === 'cancel_session' ? '継続する' : '戻る'}
      </ModalDismissButton>
      <Button
        type="submit"
        status="danger"
        disabled={isSubmitting}
        loading={isSubmitting}
        loadingText="処理中..."
        form="cancel-modal-form"
      >
        {getConfirmButtonText(type)}
      </Button>
    </>
  );

  return (
    <Modal
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) handleClose();
      }}
      onExitComplete={() => reset()}
      title={getTitle(type)}
      footer={footer}
      mobileSheet
    >
      <form
        id="cancel-modal-form"
        className={styles.content}
        onSubmit={handleConfirm}
      >
        {/* 対象情報 */}
        <div className={styles.targetInfo}>
          {type === 'kick_participant' ? (
            <p className={styles.targetName}>
              対象: <strong>{participantName}</strong>
            </p>
          ) : (
            <p className={styles.targetName}>
              対象セッション: <strong>{sessionName}</strong>
            </p>
          )}
        </div>

        {/* 警告メッセージ */}
        <div className={styles.warningBox}>
          <WarningCircle size={20} weight="fill" aria-hidden="true" />
          <p className={styles.warningText}>{getWarningMessage(type)}</p>
        </div>

        {/* 理由入力 */}
        <div className={styles.field}>
          <label htmlFor="cancel-reason" className={styles.label}>
            理由（任意）
          </label>
          <textarea
            id="cancel-reason"
            className={styles.textarea}
            placeholder={
              type === 'cancel_session'
                ? 'キャンセルの理由を参加者に伝えます'
                : '理由があればご記入ください'
            }
            {...register('reason')}
            maxLength={500}
          />
        </div>
      </form>
    </Modal>
  );
};
