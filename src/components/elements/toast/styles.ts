import { css } from '@/styled-system/css';

/**
 * Toastコンテナスタイル
 */
export const toastContainer = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '3',
  width: '[320px]',
  padding: '4',
  bg: 'white',
  borderRadius: 'md',
  boxShadow: '[0 4px 12px rgba(0, 0, 0, 0.08)]',
});

/**
 * アイコンコンテナスタイル
 */
export const toastIconContainer = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '6',
  height: '6',
  borderRadius: 'lg',
  flexShrink: '0',
});

/**
 * コンテンツコンテナスタイル
 */
export const toastContent = css({
  flex: '1',
  minWidth: '0',
});

/**
 * タイトルスタイル
 */
export const toastTitle = css({
  fontSize: '[14px]',
  fontWeight: 'medium',
  color: 'gray.800',
});

/**
 * 説明スタイル
 */
export const toastDescription = css({
  fontSize: '[13px]',
  color: 'gray.500',
  mt: '[2px]',
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
  color: 'gray.400',
  flexShrink: '0',
  _hover: { color: 'gray.500' },
});

/**
 * ステータスごとの設定
 */
export const statusConfig = {
  success: {
    iconBg: 'primary.100',
    iconColor: 'primary.500',
  },
  error: {
    iconBg: 'red.100',
    iconColor: 'red.500',
  },
  info: {
    iconBg: 'info.100',
    iconColor: 'info.500',
  },
  warning: {
    iconBg: 'orange.100',
    iconColor: 'orange.500',
  },
} as const;

/**
 * Successアイコンコンテナスタイル
 */
export const toastIconContainerSuccess = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '6',
  height: '6',
  borderRadius: 'lg',
  flexShrink: '0',
  backgroundColor: 'primary.100',
  color: 'primary.500',
});

/**
 * Errorアイコンコンテナスタイル
 */
export const toastIconContainerError = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '6',
  height: '6',
  borderRadius: 'lg',
  flexShrink: '0',
  backgroundColor: 'red.100',
  color: 'red.500',
});

/**
 * Infoアイコンコンテナスタイル
 */
export const toastIconContainerInfo = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '6',
  height: '6',
  borderRadius: 'lg',
  flexShrink: '0',
  backgroundColor: 'info.100',
  color: 'info.500',
});

/**
 * Warningアイコンコンテナスタイル
 */
export const toastIconContainerWarning = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '6',
  height: '6',
  borderRadius: 'lg',
  flexShrink: '0',
  backgroundColor: 'orange.100',
  color: 'orange.500',
});
