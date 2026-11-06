import { css } from '@/styled-system/css';

export const emptyState = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '[1]',
  minH: '[400px]',
  gap: '4',
});

export const emptyState_icon = css({
  w: '[48px]',
  h: '12',
  color: 'gray.300',
});

export const emptyState_title = css({
  fontSize: '[16px]',
  color: 'gray.500',
});

export const emptyState_subtitle = css({
  fontSize: '[13px]',
  color: 'gray.400',
});
