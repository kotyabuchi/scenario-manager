import { css } from '@/styled-system/css';

export const pageContainer = css({
  display: 'flex',
  flexDirection: 'column',
  minH: 'screen',
  maxW: '[1220px]',
  w: 'full',
  mx: 'auto',
});

export const mainContent = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8',
  maxW: '[800px]',
  w: 'full',
  mx: 'auto',
  px: '4',
  py: '8',
});
