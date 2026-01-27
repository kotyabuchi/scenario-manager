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
  p: 0,
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  transition: 'transform 0.1s',
  _hover: {
    transform: 'scale(1.1)',
  },
  _disabled: {
    cursor: 'default',
    _hover: {
      transform: 'none',
    },
  },
});

/**
 * サイズマップ
 */
export const sizeMap = {
  sm: { iconSize: 16, gap: '2px' },
  md: { iconSize: 20, gap: '4px' },
  lg: { iconSize: 24, gap: '6px' },
} as const;

/**
 * アイコンカラー
 */
export const colors = {
  filled: '#FBBF24',
  empty: '#E5E7EB',
} as const;
