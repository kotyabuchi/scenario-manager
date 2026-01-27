import { css } from '@/styled-system/css';

export const container = css({
  position: 'fixed',
  bottom: 'xl',
  right: 'xl',
  zIndex: 50,
});

export const button = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '56px',
  h: '56px',
  borderRadius: '16px',
  bg: 'oklch(0.45 0.15 160)',
  color: 'white',
  cursor: 'pointer',
  border: 'none',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  transition: 'all {durations.normal}',
  _hover: {
    bg: 'oklch(0.40 0.15 160)',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.20)',
  },
  _active: {
    transform: 'translateY(0)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
});
