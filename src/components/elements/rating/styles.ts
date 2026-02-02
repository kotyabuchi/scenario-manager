import { css } from '@/styled-system/css';

/**
 * Ratingのルートスタイル
 */
export const ratingRoot = css({
  display: 'flex',
  alignItems: 'center',
});

/**
 * 星ボタンのスタイル
 */
export const ratingButton = css({
  p: '0',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  transitionProperty: '[transform]',
  transitionDuration: 'faster',
  _hover: {
    transform: '[scale(1.1)]',
  },
  _disabled: {
    cursor: 'default',
    _hover: {
      transform: '[none]',
    },
  },
});

/**
 * サイズマップ
 */
export const sizeMap = {
  sm: { iconSize: 16, gap: '[2px]' },
  md: { iconSize: 20, gap: '1' },
  lg: { iconSize: 24, gap: '1.5' },
} as const;

/**
 * アイコンカラー
 */
export const colors = {
  filled: 'orange.400',
  empty: 'gray.200',
} as const;
