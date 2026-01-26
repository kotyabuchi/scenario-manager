'use client';

import { useState } from 'react';
import { isNil } from 'ramda';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { Modal } from '@/components/elements/modal';

type Applicant = {
  userId: string;
  userName: string;
  message?: string;
  appliedAt?: string;
};

type ApprovalModalProps = {
  isOpen: boolean;
  onClose?: () => void;
  onApprove?: (data: { message: string }) => void;
  onReject?: (data: { message: string }) => void;
  applicant?: Applicant;
  isSubmitting?: boolean;
};

const formatDate = (dateString?: string): string => {
  if (isNil(dateString)) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export const ApprovalModal = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  applicant,
  isSubmitting = false,
}: ApprovalModalProps) => {
  const [message, setMessage] = useState('');

  const handleClose = () => {
    setMessage('');
    onClose?.();
  };

  const handleApprove = () => {
    onApprove?.({ message });
  };

  const handleReject = () => {
    onReject?.({ message });
  };

  const footer = (
    <>
      <Button type="button" variant="ghost" onClick={handleClose}>
        閉じる
      </Button>
      <Button
        type="button"
        variant="subtle"
        status="danger"
        disabled={isSubmitting}
        onClick={handleReject}
      >
        却下
      </Button>
      <Button
        type="button"
        status="primary"
        disabled={isSubmitting}
        loading={isSubmitting}
        loadingText="処理中..."
        onClick={handleApprove}
      >
        承認
      </Button>
    </>
  );

  return (
    <Modal
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) handleClose();
      }}
      title="参加申請の確認"
      footer={footer}
    >
      <div className={styles.content}>
        {/* 申請者情報 */}
        <div className={styles.applicantInfo}>
          <div className={styles.applicantHeader}>
            <span className={styles.applicantName}>{applicant?.userName}</span>
            {applicant?.appliedAt && (
              <span className={styles.appliedAt}>
                {formatDate(applicant.appliedAt)}
              </span>
            )}
          </div>

          {/* 申請者のメッセージ */}
          <div className={styles.messageSection}>
            <span className={styles.label}>申請メッセージ</span>
            {applicant?.message ? (
              <p className={styles.applicantMessage}>{applicant.message}</p>
            ) : (
              <p className={styles.noMessage}>メッセージなし</p>
            )}
          </div>
        </div>

        {/* 返信メッセージ入力 */}
        <div className={styles.field}>
          <label htmlFor="approval-message" className={styles.label}>
            メッセージ（任意）
          </label>
          <textarea
            id="approval-message"
            className={styles.textarea}
            placeholder="承認・却下時に申請者へ送るメッセージ"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
          />
        </div>
      </div>
    </Modal>
  );
};
