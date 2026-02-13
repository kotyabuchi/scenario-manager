import { css, cva } from '@/styled-system/css';

export const nav = css({
  position: 'fixed',
  bottom: '0',
  left: '0',
  right: '0',
  zIndex: 'fixed',
  bg: 'white',
  borderTopWidth: '1px',
  borderColor: 'gray.100',
  shadow: '[0_-4px_20px_-2px_rgba(0,0,0,0.05)]',
  display: 'grid',
  gridTemplateColumns: '[repeat(5,1fr)]',
  height: '16',
  alignItems: 'center',
  transition: 'transform',
  transitionDuration: 'normal',
  transitionTimingFunction: 'ease-out',
  willChange: 'transform',
  // env(safe-area-inset-bottom) でノッチ付き端末に対応
  pb: '[env(safe-area-inset-bottom)]',
  md: {
    display: 'none',
  },
});

export const navItem = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'full',
    height: 'full',
    gap: '0.5',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'colors',
    transitionDuration: 'fast',
  },
  variants: {
    active: {
      true: {
        color: 'primary.default',
      },
      false: {
        color: 'gray.400',
      },
    },
  },
});

export const navLabel = css({
  fontSize: '[10px]',
  fontWeight: 'medium',
});

export const fabWrapper = css({
  position: 'relative',
  width: 'full',
  height: 'full',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

export const fab = css({
  position: 'absolute',
  top: '-3',
  width: '14',
  height: '14',
  borderRadius: 'full',
  bg: 'primary.default',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  shadow: 'lg',
  cursor: 'pointer',
  border: 'none',
  transition: 'transform',
  transitionDuration: 'fast',
  _hover: {
    transform: 'scale(1.05)',
  },
  _active: {
    transform: 'scale(0.95)',
  },
});

export const fabIcon = cva({
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
        transform: 'rotate(45deg)',
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

export const speedDial_overlay = css({
  position: 'fixed',
  inset: '0',
  zIndex: '[1]',
  bg: 'transparent',
  border: 'none',
  appearance: 'none',
  cursor: 'default',
  padding: '0',
});

export const speedDial_menu = css({
  position: 'absolute',
  bottom: '[calc(100%+token(spacing.5))]',
  left: '[50%]',
  transform: '[translateX(-50%)]',
  bg: 'white',
  borderRadius: 'xl',
  shadow: 'card.default',
  minWidth: 'xs',
  px: '2',
  py: '2',
  zIndex: '[2]',
});
