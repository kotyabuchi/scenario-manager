import { css, cva } from '@/styled-system/css';

/**
 * Combobox スタイル定義 - 画面設計準拠
 */

export const combobox_root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  w: 'full',
});

/**
 * Combobox コントロールのバリアント
 * - form: フォーム入力用（灰色背景）
 * - minimal: ソート切り替えなど（白背景）
 */
export const combobox_control = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    h: '44px',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'all 150ms ease-out',
    _focusWithin: {
      outline: '2px solid',
      outlineColor: 'input.focusBorder',
    },
  },
  variants: {
    variant: {
      form: {
        bg: 'input.bg',
        _hover: {
          bg: 'gray.200',
        },
      },
      minimal: {
        bg: 'white',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        _hover: {
          bg: 'gray.50',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'form',
  },
});

export const combobox_input = css({
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
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

export const combobox_trigger = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '8px',
  border: 'none',
  bg: 'transparent',
  color: 'icon.muted',
  cursor: 'pointer',
  transition: 'color 150ms ease-out',
  _hover: {
    color: 'icon.default',
  },
});

export const combobox_clearTrigger = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '4px',
  border: 'none',
  bg: 'transparent',
  color: 'icon.muted',
  cursor: 'pointer',
  transition: 'color 150ms ease-out',
  _hover: {
    color: 'icon.default',
  },
  _hidden: {
    display: 'none',
  },
});

export const combobox_positioner = css({
  zIndex: 'dropdown',
});

export const combobox_content = css({
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
});

export const combobox_item = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '12px',
  py: '8px',
  fontSize: '14px',
  color: 'menu.itemText',
  cursor: 'pointer',
  transition: 'background-color 100ms ease-out',
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
    opacity: 0.5,
    cursor: 'not-allowed',
    _hover: {
      bg: 'transparent',
    },
  },
});

export const combobox_itemIndicator = css({
  color: 'primary.default',
});

export const combobox_noResults = css({
  px: '12px',
  py: '8px',
  fontSize: '14px',
  color: 'text.secondary',
  textAlign: 'center',
});
