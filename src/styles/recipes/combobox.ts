import { comboboxAnatomy } from '@ark-ui/react/combobox';
import { defineSlotRecipe } from '@pandacss/dev';

/**
 * Combobox スロットレシピ - 画面設計準拠
 */
export const combobox = defineSlotRecipe({
  className: 'combobox',
  slots: comboboxAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      w: 'full',
    },
    control: {
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      h: '44px',
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'all {durations.fast} ease-out',
      _focusWithin: {
        outline: '2px solid',
        outlineColor: 'input.focusBorder',
      },
    },
    input: {
      w: 'full',
      px: '12px',
      py: '8px',
      border: 'none',
      bg: 'transparent',
      color: 'input.text',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      outline: 'none',
      _placeholder: {
        color: 'input.placeholder',
      },
      _disabled: {
        opacity: 'disabled',
        cursor: 'not-allowed',
      },
    },
    trigger: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      px: '8px',
      border: 'none',
      bg: 'transparent',
      color: 'icon.muted',
      cursor: 'pointer',
      transition: 'color {durations.fast} ease-out',
      _hover: {
        color: 'icon.default',
      },
    },
    clearTrigger: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      px: '4px',
      border: 'none',
      bg: 'transparent',
      color: 'icon.muted',
      cursor: 'pointer',
      transition: 'color {durations.fast} ease-out',
      _hover: {
        color: 'icon.default',
      },
      _hidden: {
        display: 'none',
      },
    },
    positioner: {},
    content: {
      zIndex: 'dropdown',
      bg: 'menu.bg',
      borderRadius: '8px',
      boxShadow: 'menu.default',
      py: '4px',
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
      transition: 'background-color {durations.faster} ease-out',
      _hover: {
        bg: 'menu.itemBgHover',
      },
      _highlighted: {
        bg: 'menu.itemBgHover',
      },
      _selected: {
        bg: 'menu.itemBgSelected',
        color: 'menu.itemTextSelected',
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
      color: 'primary.default',
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
        control: {
          bg: 'input.bg',
          _hover: {
            bg: 'gray.200',
          },
        },
      },
      minimal: {
        control: {
          bg: 'white',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          _hover: {
            bg: 'gray.50',
          },
        },
      },
    },
  },
  defaultVariants: {
    variant: 'form',
  },
});
