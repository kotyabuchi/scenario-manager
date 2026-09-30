import { css, cva } from '@/styled-system/css';

export const navWrapper = cva({
  base: {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    zIndex: 'modal',
    transitionProperty: '[transform]',
    transitionDuration: 'normal',
    transitionTimingFunction: 'ease-out',
    md: { display: 'none' },
  },
  variants: {
    visible: {
      true: { transform: 'translateY(0)' },
      false: { transform: '[translateY(calc(100% + 16px))]' },
    },
  },
  defaultVariants: { visible: true },
});

export const nav = css({
  display: 'grid',
  gridTemplateColumns: '[repeat(5,minmax(0,1fr))]',
  alignItems: 'center',
  height: '[calc(104px + env(safe-area-inset-bottom))]',
  pb: '[calc(20px + env(safe-area-inset-bottom))]',
  bg: 'bg.card',
  borderTopLeftRadius: '2xl',
  borderTopRightRadius: '2xl',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderColor: 'border.paper',
  boxShadow: 'card.default',
});

export const navItem = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'full',
    height: 'full',
    minW: '0',
    gap: '0.5',
    pt: '1',
    color: 'text.secondary',
    cursor: 'pointer',
    textDecoration: 'none',
    transitionProperty: '[color]',
    transitionDuration: 'fast',
    _focusVisible: { outline: 'focusRing', outlineOffset: '[-2px]' },
  },
  variants: {
    active: {
      true: { color: 'primary.default', fontWeight: 'semibold' },
      false: {},
    },
  },
});

export const navIcon = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16',
    height: '11',
    borderRadius: 'full',
  },
  variants: {
    active: {
      true: { bg: 'primary.subtleHover' },
      false: { bg: 'transparent' },
    },
  },
});

export const navLabel = css({
  fontSize: 'sm',
  lineHeight: 'tight',
  whiteSpace: 'nowrap',
  '@media (max-width: 359px)': { fontSize: 'xs' },
});

export const fabWrapper = css({
  position: 'relative',
  width: 'full',
  height: 'full',
});

export const fab = css({
  position: 'relative',
  zIndex: '[3]',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: 'full',
  height: 'full',
  pb: '2',
  border: 'none',
  bg: 'transparent',
  cursor: 'pointer',
  _focusVisible: { outline: 'focusRing', outlineOffset: '[-2px]' },
});

export const fabCircle = css({
  position: 'absolute',
  top: '-2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '12',
  height: '12',
  borderRadius: 'full',
  bg: 'primary.default',
  color: 'primary.textOnPrimary',
  boxShadow: 'button.primary',
  transitionProperty: '[transform,box-shadow]',
  transitionDuration: 'fast',
  _hover: { transform: 'scale(1.05)', boxShadow: 'button.primaryHover' },
  _active: { transform: 'scale(0.95)' },
});

export const fabLabel = css({
  color: 'primary.default',
  fontSize: 'sm',
  fontWeight: 'semibold',
  lineHeight: 'tight',
});

export const speedDial_overlay = cva({
  base: {
    position: 'fixed',
    inset: '0',
    zIndex: 'overlay',
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

export const speedDial_menu = cva({
  base: {
    position: 'absolute',
    bottom: '[calc(100% + 8px)]',
    left: '[50%]',
    zIndex: '[1]',
    width: '[min(300px,calc(100vw - 32px))]',
    maxH: '[60dvh]',
    overflowY: 'auto',
    px: '2',
    py: '1',
    bg: 'bg.card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border.paper',
    borderRadius: 'xl',
    boxShadow: 'card.default',
    opacity: '[0]',
    visibility: 'hidden',
    pointerEvents: 'none',
    transform: '[translate(-50%, 8px)]',
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
        transform: '[translate(-50%, 0)]',
      },
      false: {},
    },
  },
  defaultVariants: { visible: false },
});
