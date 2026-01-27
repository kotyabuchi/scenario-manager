import { css } from '@/styled-system/css';

export const form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
});

export const field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const label = css({
  fontSize: '13px',
  fontWeight: '500',
  color: 'text.secondary',
});

export const required = css({
  color: 'error.default',
  ml: '1',
});

export const radioGroup = css({
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '16px',
});

export const hintBox = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  p: '12px 16px',
  borderRadius: '12px',
  bg: 'bg.subtle',
  border: '1px solid',
  borderColor: 'border.subtle',
});

export const hintRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

export const hintIcon = css({
  color: 'warning.default',
  flexShrink: 0,
});

export const hintText = css({
  fontSize: '13px',
  fontWeight: '500',
  color: 'text.secondary',
});

export const hintLink = css({
  fontSize: '13px',
  fontWeight: '500',
  color: 'primary.default',
  cursor: 'pointer',
  _hover: {
    textDecoration: 'underline',
  },
});

export const hintSpacer = css({
  w: '16px',
  h: '16px',
  flexShrink: 0,
});

export const noticeRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

export const noticeIcon = css({
  color: 'text.muted',
  flexShrink: 0,
});

export const noticeText = css({
  fontSize: '12px',
  color: 'text.muted',
});

export const serverError = css({
  bg: 'error.subtle',
  color: 'error.text',
  p: '12px',
  borderRadius: '12px',
  fontSize: '14px',
});

export const successMessage = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  fontSize: '14px',
  color: 'text.secondary',
});
