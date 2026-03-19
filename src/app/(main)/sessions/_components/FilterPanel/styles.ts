import { css } from '@/styled-system/css';

export const filterPanel = css({
  bg: 'white',
  shadow: '[0 2px 4px rgba(0, 0, 0, 0.05)]',
  py: '6',
  px: '8',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const filterPanel_row = css({
  display: 'flex',
  gap: '4',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
});

export const filterPanel_fieldSystem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  w: '[180px]',
});

export const filterPanel_fieldRole = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  w: '[140px]',
});

export const filterPanel_fieldStatus = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  w: '[140px]',
});

export const filterPanel_label = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'gray.500',
});
