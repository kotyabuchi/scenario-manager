import { css } from '@/styled-system/css';

export const pageContainer = css({
  maxW: '1000px',
  mx: 'auto',
  px: 'lg',
  py: 'xl',
});

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 'lg',
});

export const header_back = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  color: 'text.secondary',
  fontSize: 'sm',
  cursor: 'pointer',
  transition: 'color {durations.normal}',
  _hover: {
    color: 'text.primary',
  },
});

export const header_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
});

export const actions = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'sm',
  mt: 'lg',
});

export const divider = css({
  border: 'none',
  h: '1px',
  bg: 'border.subtle',
  my: 'xl',
});
