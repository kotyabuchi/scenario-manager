import { css } from '@/styled-system/css';

export const container = css({
  position: 'fixed',
  bottom: '8',
  right: '8',
  zIndex: 'fixed',
  display: 'none',
  md: {
    display: 'block',
  },
});

export const button = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '[56px]',
  h: '[56px]',
  borderRadius: 'xl',
  bg: '[oklch(0.50 0.105 163)]',
  color: 'white',
  cursor: 'pointer',
  border: 'none',
  boxShadow: '[0 4px 12px rgba(0, 0, 0, 0.15)]',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  _hover: {
    bg: '[oklch(0.43 0.09 163)]',
    transform: '[translateY(-2px)]',
    boxShadow: '[0 6px 16px rgba(0, 0, 0, 0.20)]',
  },
  _active: {
    transform: '[translateY(0)]',
    boxShadow: '[0 2px 8px rgba(0, 0, 0, 0.15)]',
  },
});
