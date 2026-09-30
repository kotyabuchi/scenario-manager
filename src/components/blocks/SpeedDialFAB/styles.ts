import { css, cva } from '@/styled-system/css';

/** Desktop-only container: hidden on mobile, fixed bottom-right */
export const speedDialFAB_container = css({
  position: 'fixed',
  bottom: '8',
  right: '8',
  zIndex: 'modal',
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
  bg: 'primary.default',
  color: 'primary.textOnPrimary',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'button.primary',
  cursor: 'pointer',
  border: 'none',
  _hover: {
    boxShadow: 'button.primaryHover',
  },
  _focusVisible: { outline: 'focusRing', outlineOffset: '[2px]' },
});

export const speedDialFAB_overlay = cva({
  base: {
    position: 'fixed',
    inset: '0',
    zIndex: '[1]',
    bg: 'overlay.backdrop',
    border: 'none',
    appearance: 'none',
    cursor: 'default',
    p: '0',
    opacity: '[0]',
    pointerEvents: 'none',
    transitionProperty: '[opacity]',
    transitionDuration: 'normal',
  },
  variants: {
    visible: {
      true: { opacity: '[1]', pointerEvents: 'auto' },
      false: {},
    },
  },
  defaultVariants: { visible: false },
});

export const speedDialFAB_menu = cva({
  base: {
    position: 'absolute',
    bottom: '[calc(100% + 8px)]',
    right: '0',
    zIndex: '[2]',
    width: '72',
    maxW: '[calc(100vw - 32px)]',
    maxH: '[60dvh]',
    overflowY: 'auto',
    bg: 'bg.card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border.paper',
    borderRadius: 'xl',
    boxShadow: 'card.default',
    px: '2',
    py: '2',
    opacity: '[0]',
    visibility: 'hidden',
    pointerEvents: 'none',
    transform: 'translateY(8px)',
    transitionProperty: '[opacity,transform,visibility]',
    transitionDuration: 'normal',
    transitionTimingFunction: 'ease-out',
  },
  variants: {
    visible: {
      true: {
        opacity: '[1]',
        visibility: 'visible',
        pointerEvents: 'auto',
        transform: 'translateY(0)',
      },
      false: {},
    },
  },
  defaultVariants: { visible: false },
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
  minH: '11',
  '@media (max-width: 767px)': {
    py: '2',
    minH: '10',
  },
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
    bg: 'primary.subtleHover',
    color: 'text.title',
  },
  _focusVisible: { outline: 'focusRing' },
});

/** Shared: menu item icon color */
export const speedDialFAB_menuIcon = css({
  color: 'icon.primary',
  flexShrink: '0',
});

/** Shared: divider style (used by SpeedDialPanel) */
export const speedDialFAB_divider = css({
  height: '[1px]',
  bg: 'border.paper',
  border: 'none',
  mx: '2',
  my: '0.5',
});
