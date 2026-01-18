import { css, cva } from '@/styled-system/css';

export const menuItem = cva({
  base: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 'sm',
    rounded: 'md',
    textAlign: 'left',
    gap: 'sm',
    outlineOffset: '-2px',
    transition:
      'color {durations.normal} ease-in-out, background {durations.normal} ease-in-out',
    cursor: 'pointer',
  },
  variants: {
    active: {
      true: {
        background: 'primary.default',
        color: 'white',
      },
    },
    variant: {
      default: {
        color: 'foreground.default',
        _hover: {
          background: 'surface.hover',
        },
        _focus: {
          outline: '2px solid {colors.primary.focusRing}',
        },
      },
      login: {
        color: 'primary.foreground.dark',
        background: 'primary.subtle',
        _hover: {
          background: 'primary.muted',
        },
        _focus: {
          outline: '2px solid {colors.primary.focusRing}',
        },
      },
      signup: {
        color: 'primary.foreground.dark',
        background: 'bg.muted',
        _hover: {
          background: 'primary.subtle',
        },
        _focus: {
          outline: '2px solid {colors.primary.focusRing}',
        },
      },
      logout: {
        background: 'danger.subtle',
        color: 'danger.emphasized',
        _hover: {
          background: 'danger.muted',
          color: 'white',
        },
        _focus: {
          outline: '2px solid {colors.danger.focusRing}',
        },
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
