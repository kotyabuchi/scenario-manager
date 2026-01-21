import { css } from '@/styled-system/css';

export const fieldError = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  fontSize: 'xs',
  color: 'danger.default',
  mt: '1',
});

export const fieldError_icon = css({
  flexShrink: 0,
  width: '14px',
  height: '14px',
});

export const fieldError_message = css({
  lineHeight: '1.4',
});
