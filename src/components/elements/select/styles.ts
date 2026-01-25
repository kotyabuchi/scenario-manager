import { css, cva } from '@/styled-system/css';

/**
 * Select スタイル定義 - 画面設計準拠
 */

export const select_root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  w: 'full',
});

/**
 * Select トリガーのバリアント
 * - form: フォーム入力用（灰色背景）
 * - minimal: ソート切り替えなど（白背景）
 */
export const select_trigger = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    w: 'full',
    h: '44px',
    px: '12px',
    border: 'none',
    borderRadius: '8px',
    color: 'input.text',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    transition: 'all 150ms ease-out',
    _focus: {
      outline: '2px solid',
      outlineColor: 'input.focusBorder',
    },
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      _hover: {
        bg: 'input.bgDisabled',
      },
    },
    '& [data-placeholder]': {
      color: 'input.placeholder',
    },
  },
  variants: {
    variant: {
      form: {
        bg: 'input.bg',
        _hover: {
          bg: 'gray.200',
        },
        _disabled: {
          bg: 'input.bgDisabled',
        },
      },
      minimal: {
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
  defaultVariants: {
    variant: 'form',
  },
});

export const select_icon = css({
  color: 'icon.muted',
  transition: 'transform 150ms ease-out',
  '[data-state=open] &': {
    transform: 'rotate(180deg)',
  },
});

export const select_positioner = css({
  zIndex: 'dropdown',
});

export const select_content = css({
  bg: 'white',
  borderRadius: '8px',
  boxShadow: 'menu.default',
  p: '4px', // 上下左右統一
  outline: 'none',
  maxH: '300px',
  overflowY: 'auto',
  _hidden: {
    display: 'none',
  },
});

export const select_item = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '12px',
  py: '8px',
  fontSize: '14px',
  color: 'menu.itemText',
  cursor: 'pointer',
  borderRadius: '4px', // アイテム自体にも角丸
  transition: 'background-color 100ms ease-out',
  _hover: {
    bg: 'oklch(0.98 0.03 150)', // primary.50相当（緑のアンダートーン）
  },
  _highlighted: {
    bg: 'oklch(0.98 0.03 150)', // ホバーと同じ
  },
  _selected: {
    bg: 'oklch(0.95 0.05 150)', // primary.100相当
    color: 'oklch(0.40 0.15 160)', // primary.800相当
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

export const select_itemIndicator = css({
  color: 'oklch(0.40 0.15 160)', // primary.800相当
});

export const select_itemGroup = css({
  py: '4px',
});

export const select_itemGroupLabel = css({
  px: '12px',
  py: '4px',
  fontSize: '12px',
  fontWeight: '600',
  color: 'text.secondary',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});
