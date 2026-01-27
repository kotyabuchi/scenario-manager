import { selectAnatomy } from '@ark-ui/react/select';
import { defineSlotRecipe } from '@pandacss/dev';

/**
 * Select スロットレシピ - 画面設計準拠
 */
export const select = defineSlotRecipe({
  className: 'select',
  slots: selectAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      w: 'full',
    },
    trigger: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      w: 'full',
      h: '44px',
      px: '12px',
      gap: '8px',
      border: 'none',
      borderRadius: '8px',
      color: 'input.text',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      cursor: 'pointer',
      transition: 'all {durations.fast} ease-out',
      _focus: {
        outline: '2px solid',
        outlineColor: 'input.focusBorder',
      },
      _disabled: {
        opacity: 'disabled',
        cursor: 'not-allowed',
      },
      '& [data-placeholder]': {
        color: 'input.placeholder',
      },
    },
    indicator: {
      color: 'icon.muted',
      transition: 'transform {durations.fast} ease-out',
      '[data-state=open] &': {
        transform: 'rotate(180deg)',
      },
    },
    positioner: {},
    content: {
      zIndex: 'dropdown',
      bg: 'white',
      borderRadius: '8px',
      boxShadow: 'menu.default',
      p: '4px',
      outline: 'none',
      maxH: '300px',
      overflowY: 'auto',
      _hidden: {
        display: 'none',
      },
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      px: '12px',
      py: '8px',
      fontSize: '14px',
      color: 'menu.itemText',
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'background-color {durations.faster} ease-out',
      _hover: {
        bg: 'oklch(0.98 0.03 150)',
      },
      _highlighted: {
        bg: 'oklch(0.98 0.03 150)',
      },
      _selected: {
        bg: 'oklch(0.95 0.05 150)',
        color: 'oklch(0.40 0.15 160)',
        fontWeight: '500',
      },
      _disabled: {
        opacity: 'disabled',
        cursor: 'not-allowed',
        _hover: {
          bg: 'transparent',
        },
      },
    },
    itemIndicator: {
      color: 'oklch(0.40 0.15 160)',
    },
    itemGroup: {
      py: '4px',
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
  },
  variants: {
    variant: {
      form: {
        trigger: {
          bg: 'input.bg',
          _hover: {
            bg: 'gray.200',
          },
          _disabled: {
            bg: 'input.bgDisabled',
          },
        },
      },
      minimal: {
        trigger: {
          bg: 'white',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          _hover: {
            bg: 'gray.50',
          },
          _disabled: {
            bg: 'gray.100',
          },
        },
      },
    },
  },
  defaultVariants: {
    variant: 'form',
  },
});
