import { css } from '@/styled-system/css';

export const content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
});

export const sessionInfo = css({
  bg: 'surface.subtle',
  rounded: 'lg',
  p: '4',
});

export const sessionName = css({
  fontSize: 'lg',
  fontWeight: 'semibold',
  color: 'text.default',
  mb: '3',
});

export const infoList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const infoItem = css({
  display: 'flex',
  gap: '2',
});

export const infoLabel = css({
  color: 'text.muted',
  minW: '80px',
  flexShrink: 0,
});

export const infoValue = css({
  color: 'text.default',
});

export const field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const label = css({
  fontWeight: 'medium',
  color: 'text.default',
});

export const textarea = css({
  px: '3',
  py: '2',
  rounded: 'md',
  bg: 'surface.input',
  border: 'none',
  outline: 'none',
  color: 'text.default',
  minH: '100px',
  resize: 'vertical',
  _placeholder: {
    color: 'text.placeholder',
  },
  _focus: {
    ring: '2',
    ringColor: 'primary.500',
  },
});

export const hint = css({
  fontSize: 'sm',
  color: 'text.muted',
});
