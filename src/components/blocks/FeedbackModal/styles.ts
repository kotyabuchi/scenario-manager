import { css } from '@/styled-system/css';

export const form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
});

export const field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const label = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'text.secondary',
});

export const required = css({
  color: 'error.default',
  ml: '1',
});

export const radioGroup = css({
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '4',
});

export const hintBox = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  py: '3',
  px: '4',
  borderRadius: '[3]',
  bg: '[bg.subtle]',
  border: '[1px solid]',
  borderColor: '[border.subtle]',
});

export const hintRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const hintIcon = css({
  color: 'warning.default',
  flexShrink: '0',
});

export const hintText = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'text.secondary',
});

export const hintLink = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'primary.default',
  cursor: 'pointer',
  _hover: {
    textDecoration: 'underline',
  },
});

export const hintSpacer = css({
  w: '4',
  h: '4',
  flexShrink: '0',
});

export const noticeRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
});

export const noticeIcon = css({
  color: 'text.secondary',
  flexShrink: '0',
});

export const noticeText = css({
  fontSize: '[12px]',
  color: 'text.secondary',
});

export const serverError = css({
  bg: '[error.subtle]',
  color: '[error.text]',
  p: '3',
  borderRadius: '[3]',
  fontSize: '[14px]',
});

export const successMessage = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  fontSize: '[14px]',
  color: 'text.secondary',
});
