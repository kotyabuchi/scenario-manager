import { css } from '@/styled-system/css';

/**
 * Switchのルートスタイル
 */
export const switchRoot = css({
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
 * Switchのコントロールスタイル
 */
export const switchControl = css({
  position: 'relative',
  w: '[44px]',
  h: '6',
  borderRadius: 'lg',
  bg: 'gray.200',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _checked: {
    bg: 'primary.500',
  },
});

/**
 * Switchのサムスタイル
 */
export const switchThumb = css({
  position: 'absolute',
  top: '[2px]',
  left: '[2px]',
  w: '5',
  h: '5',
  borderRadius: '[10px]',
  bg: 'white',
  boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.12)]',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _checked: {
    transform: '[translateX(20px)]',
  },
});

/**
 * Switchのラベルスタイル
 */
export const switchLabel = css({
  fontSize: '[14px]',
  color: 'gray.700',
  _disabled: {
    color: 'gray.400',
  },
});
