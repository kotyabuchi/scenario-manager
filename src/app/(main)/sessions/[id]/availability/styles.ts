import { css } from '@/styled-system/css';

export const pageContainer = css({
  display: 'flex',
  flexDirection: 'column',
  minH: 'screen',
  bg: 'gray.50',
});

export const mainContent = css({
  maxW: '[1120px]',
  w: 'full',
  mx: 'auto',
  px: { base: '4', md: '6' },
  py: { base: '6', md: '8' },
});
