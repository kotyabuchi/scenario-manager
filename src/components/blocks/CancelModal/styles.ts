import { css } from '@/styled-system/css';

export const content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
});

export const targetInfo = css({
  bg: 'surface.subtle',
  rounded: 'lg',
  p: '4',
});

export const targetName = css({
  color: 'text.default',
  fontSize: 'md',
  '& strong': {
    fontWeight: 'semibold',
  },
});

export const warningBox = css({
  bg: 'danger.surface',
  rounded: 'lg',
  p: '4',
  borderLeft: '4px solid',
  borderColor: 'danger.border',
});

export const warningText = css({
  color: 'danger.text',
  fontSize: 'sm',
  lineHeight: '1.6',
});

export const field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const label = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.muted',
});

export const textarea = css({
  px: '3',
  py: '2',
  rounded: 'md',
  bg: 'surface.input',
  border: 'none',
  outline: 'none',
  color: 'text.default',
  minH: '80px',
  resize: 'vertical',
  _placeholder: {
    color: 'text.placeholder',
  },
  _focus: {
    ring: '2',
    ringColor: 'primary.500',
  },
});
