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
      true: {},
      false: {},
    },
    variant: {
      default: {
        color: 'foreground.default',
        _focus: {
          outline: '2px solid {colors.primary.focusRing}',
        },
      },
      login: {
        color: 'primary.foreground.dark',
        background: 'primary.subtle',
        _hover: {
          background: 'primary.muted',
          color: 'primary.foreground.white',
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
          color: 'danger.foreground.white',
        },
        _focus: {
          outline: '2px solid {colors.danger.focusRing}',
        },
      },
    },
  },
  compoundVariants: [
    // 選択中のdefaultスタイル
    {
      active: true,
      variant: 'default',
      css: {
        background: 'primary.default',
        color: 'primary.foreground.white',
        _hover: {
          background: 'primary.emphasized',
        },
        _focus: {
          outline: '2px solid {colors.primary.focusRing}',
          outlineOffset: '2px',
        },
      },
    },
    // 未選択のdefaultホバースタイル
    {
      active: false,
      variant: 'default',
      css: {
        _hover: {
          background: 'primary.subtle',
        },
      },
    },
  ],
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
