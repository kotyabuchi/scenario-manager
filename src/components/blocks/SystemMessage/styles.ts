import { css } from '@/styled-system/css';

export const container = css({
  position: 'fixed',
  top: '0',
  left: '0',
  right: '0',
  zIndex: '[1000]',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2',
  p: '4',
  pointerEvents: 'none',
});
