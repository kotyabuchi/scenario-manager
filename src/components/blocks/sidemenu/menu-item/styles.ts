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
    transition:
      'color {durations.normal} ease-in-out, background {durations.normal} ease-in-out',
    cursor: 'pointer',
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
        _hover: {
          background: 'primary.default',
          color: 'primary.foreground.white',
        },
        _focus: {
          outline: '2px solid {colors.primary.focusRing}',
        },
      },
      login: {
        color: 'primary.foreground.dark',
        background: 'primary.300',
        _hover: {
          background: 'primary.default',
          color: 'primary.foreground.white',
        },
        _focus: {
          outline: '2px solid {colors.primary.focusRing}',
        },
      },
      signup: {
        color: 'primary.foreground.dark',
        background: 'background.default',
        _hover: {
          background: 'primary.default',
          color: 'primary.foreground.white',
        },
        _focus: {
          outline: '2px solid {colors.primary.focusRing}',
        },
      },
      logout: {
        background: 'danger.subtle',
        color: 'danger.emphasized',
        _hover: {
          background: 'danger.default',
          color: 'danger.foreground.white',
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
