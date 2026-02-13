import { css, cva } from '@/styled-system/css';

/** Desktop-only container: hidden on mobile, fixed bottom-right */
export const speedDialFAB_container = css({
  position: 'fixed',
  bottom: '8',
  right: '8',
  zIndex: 'overlay',
  display: 'none',
  md: {
    display: 'block',
  },
});

export const speedDialFAB_fab = css({
  position: 'relative',
  zIndex: '[3]',
  width: '14',
  height: '14',
  borderRadius: 'full',
  bg: 'primary.500',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  shadow: 'card.default',
  cursor: 'pointer',
  border: 'none',
  _hover: {
    shadow: 'card.hover',
  },
});

export const speedDialFAB_overlay = css({
  position: 'fixed',
  inset: '0',
  zIndex: '[1]',
  bg: 'transparent',
  border: 'none',
  appearance: 'none',
  cursor: 'default',
  padding: '0',
});

export const speedDialFAB_menu = css({
  position: 'absolute',
  bottom: '16',
  right: '0',
  zIndex: '[2]',
  bg: 'white',
  borderRadius: 'xl',
  shadow: 'card.default',
  minWidth: 'xs',
  px: '2',
  py: '2',
});

/** FAB icon animation (used by SpeedDialFAB) */
export const speedDialFAB_fabIcon = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform',
    transitionDuration: 'normal',
    transitionTimingFunction: 'ease-in-out',
  },
  variants: {
    open: {
      true: {
        transform: 'rotate(90deg)',
      },
      false: {
        transform: 'rotate(0deg)',
      },
    },
  },
  defaultVariants: {
    open: false,
  },
});

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
