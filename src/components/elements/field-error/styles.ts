import { css } from '@/styled-system/css';

/**
 * FieldError スタイル定義 - 画面設計準拠
 */

export const fieldError = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12px',
  color: 'text.error',
  mt: '4px',
});

export const fieldError_icon = css({
  flexShrink: 0,
  width: '14px',
  height: '14px',
  color: 'icon.error',
});

export const fieldError_message = css({
  lineHeight: '1.4',
});
