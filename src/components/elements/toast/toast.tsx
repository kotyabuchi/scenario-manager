'use client';

import { useEffect, useState } from 'react';
import { Check, Info, Warning, X } from '@phosphor-icons/react/ssr';

import * as styles from './styles';

export type ToastStatus = 'success' | 'error' | 'info' | 'warning';

export type ToastProps = {
  /**
   * タイトル
   */
  title: string;

  /**
   * 説明
   */
  description?: string;

  /**
   * ステータス
   * @default 'info'
   */
  status?: ToastStatus;

  /**
   * 自動非表示までの時間（ms）。0の場合は自動非表示しない
   * @default 5000
   */
  duration?: number;

  /**
   * 閉じた時のコールバック
   */
  onClose?: () => void;

  /**
   * 追加のクラス名
   */
  className?: string;
};

const iconMap = {
  success: Check,
  error: Warning,
  info: Info,
  warning: Warning,
} as const;

/**
 * トーストコンポーネント
 *
 * 一時的な通知メッセージを表示する。
 *
 * @example
 * <Toast
 *   title="Success"
 *   description="Your changes have been saved."
 *   status="success"
 *   duration={5000}
 *   onClose={() => console.log('closed')}
 * />
 */
export const Toast = ({
  title,
  description,
  status = 'info',
  duration = 5000,
  onClose,
  className,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = iconMap[status];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const getIconContainerStyle = () => {
    switch (status) {
      case 'success':
        return styles.toastIconContainerSuccess;
      case 'error':
        return styles.toastIconContainerError;
      case 'warning':
        return styles.toastIconContainerWarning;
      default:
        return styles.toastIconContainerInfo;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      data-status={status}
      className={`${styles.toastContainer} ${className ?? ''}`}
    >
      <div className={getIconContainerStyle()}>
        <Icon size={14} />
      </div>
      <div className={styles.toastContent}>
        <div className={styles.toastTitle}>{title}</div>
        {description && (
          <div className={styles.toastDescription}>{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={handleClose}
        className={styles.toastCloseButton}
        aria-label="閉じる"
      >
        <X size={16} />
      </button>
    </div>
  );
};
