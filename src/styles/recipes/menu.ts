import { defineSlotRecipe } from '@pandacss/dev';

/**
 * メニューレシピ - 画面設計準拠
 */
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
      gap: '4px',
      cursor: 'pointer',
      outline: 'none',
      _focusVisible: {
        outline: '2px solid',
        outlineColor: 'primary.default',
        outlineOffset: '2px',
        borderRadius: '8px',
      },
    },
    positioner: {},
    content: {
      zIndex: 'dropdown',
      bg: 'menu.bg',
      borderRadius: '12px',
      boxShadow: 'menu.default',
      display: 'flex',
      flexDirection: 'column',
      outline: 'none',
      overflow: 'hidden',
      p: '4px',
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
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      gap: '8px',
      outline: 'none',
      px: '12px',
      py: '8px',
      fontSize: '14px',
      color: 'menu.itemText',
      transitionDuration: '100ms',
      transitionProperty: 'background, color',
      transitionTimingFunction: 'ease-out',
      _hover: {
        bg: 'menu.itemBgHover',
      },
      _highlighted: {
        bg: 'menu.itemBgHover',
      },
      _disabled: {
        color: 'text.placeholder',
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
      color: 'primary.default',
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
      px: '12px',
      py: '4px',
      fontSize: '12px',
      fontWeight: '600',
      color: 'text.secondary',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    separator: {
      borderTopWidth: '1px',
      borderColor: 'border.subtle',
      my: '4px',
    },
    arrow: {
      '--arrow-size': '8px',
      '--arrow-background': 'token(colors.menu.bg)',
    },
    arrowTip: {
      borderTopWidth: '1px',
      borderLeftWidth: '1px',
      borderColor: 'border.subtle',
    },
  },
  variants: {
    size: {
      sm: {
        content: {
          p: '2px',
          minWidth: '140px',
        },
        item: {
          px: '8px',
          py: '4px',
          fontSize: '13px',
          gap: '4px',
        },
        itemGroupLabel: {
          px: '8px',
          py: '2px',
          fontSize: '11px',
        },
      },
      md: {
        content: {
          p: '4px',
          minWidth: '180px',
        },
        item: {
          px: '12px',
          py: '8px',
          fontSize: '14px',
          gap: '8px',
        },
        itemGroupLabel: {
          px: '12px',
          py: '4px',
          fontSize: '12px',
        },
      },
      lg: {
        content: {
          p: '8px',
          minWidth: '220px',
        },
        item: {
          px: '16px',
          py: '12px',
          fontSize: '14px',
          gap: '12px',
        },
        itemGroupLabel: {
          px: '16px',
          py: '8px',
          fontSize: '13px',
        },
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
