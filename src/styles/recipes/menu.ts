import { defineSlotRecipe } from '@pandacss/dev';

export const menu = defineSlotRecipe({
  className: 'menu',
  slots: [
    'root',
    'trigger',
    'positioner',
    'content',
    'item',
    'itemText',
    'itemIndicator',
    'itemGroup',
    'itemGroupLabel',
    'separator',
    'arrow',
    'arrowTip',
  ],
  base: {
    trigger: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'xs',
      cursor: 'pointer',
      outline: 'none',
      _focusVisible: {
        outline: '2px solid',
        outlineColor: 'primary.focusRing',
        outlineOffset: '2px',
        borderRadius: 'md',
      },
    },
    positioner: {
      zIndex: 'dropdown',
    },
    content: {
      bg: 'menu.bg',
      borderRadius: 'lg',
      boxShadow: 'menu.default',
      display: 'flex',
      flexDirection: 'column',
      outline: 'none',
      overflow: 'hidden',
      p: 'xs',
      minWidth: '180px',
      _hidden: {
        display: 'none',
      },
      _open: {
        animation: 'fadeIn 0.2s ease-out',
      },
      _closed: {
        animation: 'fadeOut 0.15s ease-in',
      },
    },
    item: {
      alignItems: 'center',
      borderRadius: 'md',
      cursor: 'pointer',
      display: 'flex',
      gap: 'sm',
      outline: 'none',
      px: 'sm',
      py: 'xs',
      textStyle: 'sm',
      transitionDuration: 'fast',
      transitionProperty: 'background, color',
      transitionTimingFunction: 'default',
      _highlighted: {
        bg: 'menu.itemBgHighlighted',
      },
      _disabled: {
        color: 'text.muted',
        cursor: 'not-allowed',
        opacity: 0.5,
      },
      '& :where(svg)': {
        width: '1em',
        height: '1em',
        flexShrink: 0,
      },
    },
    itemText: {
      flex: 1,
    },
    itemIndicator: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ml: 'auto',
      '& :where(svg)': {
        width: '0.875em',
        height: '0.875em',
      },
    },
    itemGroup: {
      display: 'flex',
      flexDirection: 'column',
    },
    itemGroupLabel: {
      px: 'sm',
      py: 'xs',
      textStyle: 'xs',
      fontWeight: 'semibold',
      color: 'text.muted',
      textTransform: 'uppercase',
      letterSpacing: 'wide',
    },
    separator: {
      borderTopWidth: '1px',
      borderColor: 'menu.separator',
      my: 'xs',
    },
    arrow: {
      '--arrow-size': '8px',
      '--arrow-background': '{colors.menu.bg}',
    },
    arrowTip: {
      borderTopWidth: '1px',
      borderLeftWidth: '1px',
      borderColor: 'menu.separator',
    },
  },
  variants: {
    size: {
      sm: {
        content: {
          p: '1',
          minWidth: '140px',
        },
        item: {
          px: 'xs',
          py: '1',
          textStyle: 'xs',
          gap: 'xs',
        },
        itemGroupLabel: {
          px: 'xs',
          py: '1',
          textStyle: 'xs',
        },
      },
      md: {
        content: {
          p: 'xs',
          minWidth: '180px',
        },
        item: {
          px: 'sm',
          py: 'xs',
          textStyle: 'sm',
          gap: 'sm',
        },
        itemGroupLabel: {
          px: 'sm',
          py: 'xs',
          textStyle: 'xs',
        },
      },
      lg: {
        content: {
          p: 'sm',
          minWidth: '220px',
        },
        item: {
          px: 'md',
          py: 'sm',
          textStyle: 'md',
          gap: 'md',
        },
        itemGroupLabel: {
          px: 'md',
          py: 'sm',
          textStyle: 'sm',
        },
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
