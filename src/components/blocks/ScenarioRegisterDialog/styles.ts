import { css } from '@/styled-system/css';

export const content = css({
  bg: 'dialog.bg',
  borderRadius: 'xl',
  boxShadow: 'dialog.default',
  outline: 'none',
  maxW: '[400px]',
  w: 'full',
  _open: {
    animation: '[slideInUp var(--durations-normal) ease-out]',
  },
  _closed: {
    animation: '[slideOutDown var(--durations-normal) ease-in]',
  },
});

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '6',
  pt: '5',
  pb: '3',
});

export const title = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: 'dialog.title',
});

export const nav = css({
  display: 'flex',
  flexDirection: 'column',
  px: '3',
  pb: '3',
});

export const navItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  px: '3',
  py: '3',
  borderRadius: 'lg',
  color: 'text.body',
  fontSize: 'sm',
  fontWeight: 'medium',
  cursor: 'pointer',
  textDecoration: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'gray.100',
    color: 'text.title',
  },
});
