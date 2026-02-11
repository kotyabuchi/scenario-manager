import { css } from '@/styled-system/css';

export const header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  h: '[56px]',
  w: 'full',
  px: '8',
  py: '2',
  bg: 'white',
  shadow: 'subHeader.default',
});

export const header_left = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
  minW: '0',
});

export const header_title = css({
  fontSize: '[18px]',
  fontWeight: 'bold',
  color: 'gray.800',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
