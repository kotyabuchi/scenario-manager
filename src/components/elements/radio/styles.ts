import { css } from '@/styled-system/css';

/**
 * RadioGroupのルートスタイル
 */
export const radioGroupRoot = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

/**
 * RadioItemのスタイル
 */
export const radioItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  cursor: 'pointer',
  _disabled: {
    cursor: 'not-allowed',
    opacity: 'disabled',
  },
});

/**
 * RadioControlのスタイル
 */
export const radioControl = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '5',
  h: '5',
  borderRadius: 'full',
  bg: 'white',
  boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.08)]',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  flexShrink: '0',
  _checked: {
    bg: 'primary.500',
    boxShadow: '[none]',
  },
  _disabled: {
    bg: 'gray.200',
    boxShadow: '[none]',
  },
  _focusVisible: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
    outlineOffset: '[2px]',
  },
});

/**
 * RadioIndicatorのスタイル
 */
export const radioIndicator = css({
  w: '2',
  h: '2',
  borderRadius: 'full',
  bg: 'white',
});

/**
 * RadioTextのスタイル
 */
export const radioText = css({
  fontSize: '[14px]',
  color: 'gray.700',
  _disabled: {
    color: 'gray.400',
  },
});
