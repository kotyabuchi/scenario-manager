import { css } from '@/styled-system/css';

// MobileSearchBar（SP 検索バー、lg 未満のみ表示）

export const mobileSearchBar = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  bg: 'white',
  px: '6',
  py: '4',
  shadow: 'subHeader.default',
  lg: {
    display: 'none',
  },
});

export const mobileSearchBar_row = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

export const mobileSearchBar_systemSelect = css({
  flex: '1',
  minW: '0',
});
