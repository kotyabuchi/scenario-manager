import { css } from '@/styled-system/css';

/**
 * Select スタイル定義 - 画面設計準拠
 */

export const select_root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  w: 'full',
});

export const select_trigger = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  w: 'full',
  h: '44px',
  px: '12px',
  border: 'none',
  borderRadius: '8px',
  bg: 'input.bg',
  color: 'input.text',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  cursor: 'pointer',
  transition: 'all 150ms ease-out',
  _hover: {
    bg: 'gray.200',
  },
  _focus: {
    outline: '2px solid',
    outlineColor: 'input.focusBorder',
  },
  _disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    bg: 'input.bgDisabled',
    _hover: {
      bg: 'input.bgDisabled',
    },
  },
  '& [data-placeholder]': {
    color: 'input.placeholder',
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

export const select_item = css({
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

export const select_itemIndicator = css({
  color: 'primary.default',
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
