import { css } from '@/styled-system/css';

/**
 * FieldError スタイル定義 - 画面設計準拠
 */

export const fieldError = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  fontSize: '[12px]',
  color: 'text.error',
  mt: '1',
});

export const fieldError_message = css({
  lineHeight: '[1.4]',
});
