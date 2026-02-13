import { css } from '@/styled-system/css';

export const container = css({
  position: 'fixed',
  top: '0',
  left: '[50%]',
  transform: 'translateX(-50%)',
  zIndex: '[1000]',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2',
  p: '4',
  w: 'full',
  maxW: '[800px]',
  pointerEvents: 'none',
  '& > *': {
    pointerEvents: 'auto',
    animation: '[slideInFromTop 0.3s ease-out]',
  },
});
