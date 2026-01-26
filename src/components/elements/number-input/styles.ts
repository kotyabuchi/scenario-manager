import { css } from '@/styled-system/css';

/**
 * NumberInput スタイル定義 - 画面設計準拠
 *
 * 設計書仕様:
 * - ラベル上部
 * - 白背景ボックスに影効果
 * - 左側に値表示/入力エリア
 * - 右側に縦並びの上下ボタン（chevron-up/down）
 */

export const numberInput_root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  w: 'full',
  minW: 0,
});

export const numberInput_label = css({
  fontSize: '13px',
  fontWeight: '500',
  color: 'gray.700',
  letterSpacing: '0.01em',
});

export const numberInput_wrapper = css({
  display: 'flex',
  alignItems: 'stretch',
  h: '44px',
  borderRadius: '8px',
  bg: 'white',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  _focusWithin: {
    outline: '2px solid',
    outlineColor: 'primary.default',
    outlineOffset: '2px',
  },
});

export const numberInput_control = css({
  display: 'flex',
  flexDirection: 'column',
  width: '32px',
  flexShrink: 0,
});

export const numberInput_input = css({
  flex: 1,
  minWidth: 0,
  px: '12px',
  py: '8px',
  border: 'none',
  bg: 'transparent',
  color: 'gray.800',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  _placeholder: {
    color: 'gray.400',
  },
  _disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

export const numberInput_button = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  w: '32px',
  border: 'none',
  bg: 'gray.50',
  color: 'gray.500',
  cursor: 'pointer',
  transition: 'all 150ms ease-out',
  _hover: {
    bg: 'gray.100',
    color: 'gray.700',
  },
  _disabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
    _hover: {
      bg: 'gray.50',
    },
  },
});

export const numberInput_incrementButton = css({
  borderTopRightRadius: '8px',
});

export const numberInput_decrementButton = css({
  borderBottomRightRadius: '8px',
});
