import { css } from '@/styled-system/css';

export const content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
});

export const targetInfo = css({
  color: 'text.body',
});

export const targetName = css({
  color: 'text.body',
  fontSize: 'sm',
  '& strong': {
    fontWeight: 'semibold',
  },
});

export const warningBox = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '3',
  bg: 'error.subtleHover',
  borderRadius: 'xl',
  p: '4',
  color: 'error.default',
});

export const warningText = css({
  color: 'error.textDark',
  fontSize: 'sm',
  lineHeight: 'relaxed',
});

export const field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const label = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.body',
});

export const textarea = css({
  px: '3',
  py: '2',
  borderRadius: 'md',
  bg: 'input.bg',
  border: 'none',
  outline: 'none',
  color: 'input.text',
  minH: '[80px]',
  resize: 'vertical',
  _placeholder: {
    color: 'input.placeholder',
  },
  _focusVisible: {
    outline: 'focusRing',
  },
});
