'use client';

import { useState } from 'react';
import { isNil } from 'ramda';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { Modal } from '@/components/elements/modal';

type SessionInfo = {
  sessionName: string;
  gmName: string;
  scenarioName?: string;
  scheduledAt?: string;
};

type ApplicationModalProps = {
  isOpen: boolean;
  onClose?: () => void;
  onSubmit?: (data: { message: string }) => void;
  session?: SessionInfo;
  isSubmitting?: boolean;
};

const formatDate = (dateString?: string): string => {
  if (isNil(dateString)) return '未定';
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
    return '未定';
  }
};

export const ApplicationModal = ({
  isOpen,
  onClose,
  onSubmit,
  session,
  isSubmitting = false,
}: ApplicationModalProps) => {
  const [message, setMessage] = useState('');

  const handleClose = () => {
    setMessage('');
    onClose?.();
  };

  const handleSubmit = () => {
    onSubmit?.({ message });
  };

  const footer = (
    <>
      <Button type="button" variant="ghost" onClick={handleClose}>
        キャンセル
      </Button>
      <Button
        type="button"
        status="primary"
        disabled={isSubmitting}
        loading={isSubmitting}
        loadingText="送信中..."
        onClick={handleSubmit}
      >
        参加申請
      </Button>
    </>
  );

  return (
    <Modal
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) handleClose();
      }}
      title="セッションに参加申請"
      footer={footer}
    >
      <div className={styles.content}>
        {/* セッション情報 */}
        <div className={styles.sessionInfo}>
          <h3 className={styles.sessionName}>{session?.sessionName}</h3>
          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>GM</dt>
              <dd className={styles.infoValue}>{session?.gmName}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt className={styles.infoLabel}>シナリオ</dt>
              <dd className={styles.infoValue}>
                {session?.scenarioName ?? '未定'}
              </dd>
            </div>
            <div className={styles.infoItem} data-testid="schedule">
              <dt className={styles.infoLabel}>日程</dt>
              <dd className={styles.infoValue}>
                {formatDate(session?.scheduledAt)}
              </dd>
            </div>
          </dl>
        </div>

        {/* メッセージ入力 */}
        <div className={styles.field}>
          <label htmlFor="application-message" className={styles.label}>
            メッセージ（任意）
          </label>
          <textarea
            id="application-message"
            className={styles.textarea}
            placeholder="GMへのメッセージがあればご記入ください"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
          />
          <p className={styles.hint}>500文字以内</p>
        </div>
      </div>
    </Modal>
  );
};
