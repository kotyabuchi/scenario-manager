import { css } from '@/styled-system/css';

/** Shared: menu item style (used by SpeedDialPanel) */
export const speedDialFAB_menuItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  px: '3',
  py: '3',
  borderRadius: 'lg',
  color: 'text.body',
  fontSize: 'sm',
  fontWeight: 'medium',
  cursor: 'pointer',
  border: 'none',
  width: 'full',
  textAlign: 'left',
  bg: 'transparent',
  textDecoration: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'gray.100',
    color: 'text.title',
  },
});

/** Shared: menu item icon color */
export const speedDialFAB_menuIcon = css({
  color: 'primary.500',
  flexShrink: '0',
});

/** Shared: divider style (used by SpeedDialPanel) */
export const speedDialFAB_divider = css({
  height: '[1px]',
  bg: 'gray.200',
  border: 'none',
  mx: '2',
  my: '1',
});
