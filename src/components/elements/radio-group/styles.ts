import { css } from '@/styled-system/css';

/**
 * RadioGroup スタイル定義 - 画面設計準拠
 * チップ風のラジオボタン
 */

export const radioGroup_root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const radioGroup_items = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
});

export const radioGroup_item = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  color: 'text.body',
  px: '12px',
  py: '8px',
  borderRadius: '12px',
  transition: 'all {durations.fast} ease-out',
  bg: 'toggle.uncheckedBg',
  boxShadow: 'input.default',
  _hover: {
    bg: 'primary.subtleHover',
    transform: 'translateY(-1px)',
  },
  _checked: {
    bg: 'primary.subtle',
    color: 'primary.text',
    fontWeight: '500',
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
  w: '16px',
  h: '16px',
  borderRadius: 'full',
  border: '2px solid',
  borderColor: 'text.placeholder',
  transition: 'all {durations.fast} ease-out',
  position: 'relative',
  flexShrink: 0,
  _before: {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) scale(0)',
    w: '8px',
    h: '8px',
    borderRadius: 'full',
    bg: 'primary.text',
    transition: 'transform {durations.fast} ease-out',
  },
  _checked: {
    borderColor: 'primary.text',
    _before: {
      transform: 'translate(-50%, -50%) scale(1)',
    },
  },
});

export const radioGroup_itemText = css({
  userSelect: 'none',
});
