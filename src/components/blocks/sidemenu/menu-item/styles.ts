import { css, cva } from '@/styled-system/css';

export const menuItem = cva({
  base: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: '6px',
    rounded: 'md',
    textAlign: 'left',
    gap: '8px',
    outlineOffset: '-2px',
    color: 'primary.foreground.dark',
    transition:
      'color {durations.normal} ease-in-out, background {durations.normal} ease-in-out',
    _hover: {
      background: 'primary.default',
      color: 'primary.foreground.white',
    },
    _focus: {
      outline: '2px solid {colors.primary.focusRing}',
    },
  },
  variants: {
    active: {
      true: {
        background: 'primary.default',
        color: 'primary.foreground.white',
      },
    },
    variant: {
      default: {
        color: 'primary.foreground.dark',
      },
      active: {
        background: 'primary.default',
        color: 'primary.foreground.white',
      },
    },
  },
});

export const menuItemIcon = css({
  flexShrink: 0,
});

export const menuItemText = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
});
