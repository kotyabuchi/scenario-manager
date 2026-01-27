import { css } from '@/styled-system/css';

/**
 * Toastコンテナスタイル
 */
export const toastContainer = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  width: '320px',
  padding: '16px',
  bg: '#FFFFFF',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
});

/**
 * アイコンコンテナスタイル
 */
export const toastIconContainer = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '12px',
  flexShrink: 0,
});

/**
 * コンテンツコンテナスタイル
 */
export const toastContent = css({
  flex: 1,
  minWidth: 0,
});

/**
 * タイトルスタイル
 */
export const toastTitle = css({
  fontSize: '14px',
  fontWeight: 500,
  color: '#1F2937',
});

/**
 * 説明スタイル
 */
export const toastDescription = css({
  fontSize: '13px',
  color: '#6B7280',
  mt: '2px',
});

/**
 * 閉じるボタンスタイル
 */
export const toastCloseButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#9CA3AF',
  flexShrink: 0,
  _hover: { color: '#6B7280' },
});

/**
 * ステータスごとの設定
 */
export const statusConfig = {
  success: {
    iconBg: '#D1FAE5',
    iconColor: '#10B981',
  },
  error: {
    iconBg: '#FEE2E2',
    iconColor: '#EF4444',
  },
  info: {
    iconBg: '#DBEAFE',
    iconColor: '#3B82F6',
  },
  warning: {
    iconBg: '#FEF3C7',
    iconColor: '#F59E0B',
  },
} as const;

/**
 * Successアイコンコンテナスタイル
 */
export const toastIconContainerSuccess = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '12px',
  flexShrink: 0,
  backgroundColor: '#D1FAE5',
  color: '#10B981',
});

/**
 * Errorアイコンコンテナスタイル
 */
export const toastIconContainerError = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '12px',
  flexShrink: 0,
  backgroundColor: '#FEE2E2',
  color: '#EF4444',
});

/**
 * Infoアイコンコンテナスタイル
 */
export const toastIconContainerInfo = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '12px',
  flexShrink: 0,
  backgroundColor: '#DBEAFE',
  color: '#3B82F6',
});

/**
 * Warningアイコンコンテナスタイル
 */
export const toastIconContainerWarning = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '12px',
  flexShrink: 0,
  backgroundColor: '#FEF3C7',
  color: '#F59E0B',
});
