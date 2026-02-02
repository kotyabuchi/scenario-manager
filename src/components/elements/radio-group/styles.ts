import { css } from '@/styled-system/css';

/**
 * RadioGroup スタイル定義 - 画面設計準拠
 * チップ風のラジオボタン
 */

export const radioGroup_root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const radioGroup_items = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
});

export const radioGroup_item = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  cursor: 'pointer',
  fontSize: '[14px]',
  color: 'text.body',
  px: '3',
  py: '2',
  borderRadius: 'lg',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  bg: 'toggle.uncheckedBg',
  boxShadow: 'input.default',
  _hover: {
    bg: 'primary.subtleHover',
    transform: '[translateY(-1px)]',
  },
  _checked: {
    bg: 'primary.subtle',
    color: 'primary.text',
    fontWeight: 'medium',
  },
  _disabled: {
    opacity: 'disabled',
    cursor: 'not-allowed',
    _hover: {
      bg: 'toggle.uncheckedBg',
      transform: 'none',
    },
  },
});

export const radioGroup_itemControl = css({
  w: '4',
  h: '4',
  borderRadius: 'full',
  border: '[2px solid]',
  borderColor: 'text.placeholder',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  position: 'relative',
  flexShrink: '0',
  _before: {
    content: '""',
    position: 'absolute',
    top: '[50%]',
    left: '[50%]',
    transform: '[translate(-50%, -50%) scale(0)]',
    w: '2',
    h: '2',
    borderRadius: 'full',
    bg: 'primary.text',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
  },
  _checked: {
    borderColor: 'primary.text',
    _before: {
      transform: '[translate(-50%, -50%) scale(1)]',
    },
  },
});

export const radioGroup_itemText = css({
  userSelect: 'none',
});
