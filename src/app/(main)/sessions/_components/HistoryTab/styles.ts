import { css } from '@/styled-system/css';

export const contentArea_history = css({
  maxW: '[1440px]',
  mx: 'auto',
  w: 'full',
  pt: '4',
  px: '8',
  pb: '8',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const resultHeader = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const resultHeader_count = css({
  fontSize: '[14px]',
  color: 'gray.500',
});

export const resultHeader_sortArea = css({
  display: 'flex',
  gap: '2',
  alignItems: 'center',
});

export const resultHeader_sortLabel = css({
  fontSize: '[13px]',
  color: 'gray.500',
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

export const moreButtonArea = css({
  display: 'flex',
  justifyContent: 'center',
  pt: '4',
});
