import { css, cva } from '@/styled-system/css';

/**
 * Paginationのルートスタイル
 */
export const paginationRoot = css({
  display: 'flex',
  gap: '1',
  alignItems: 'center',
});

/**
 * 共通ボタンスタイル
 */
export const paginationButton = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    w: '9',
    h: '9',
    borderRadius: 'sm',
    fontSize: '[14px]',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
  },
  variants: {
    variant: {
      nav: {
        bg: 'white',
        boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]',
        color: 'gray.500',
        _disabled: {
          opacity: 'disabled',
          cursor: 'not-allowed',
        },
        _hover: {
          bg: 'gray.100',
        },
      },
      page: {
        bg: 'white',
        color: 'gray.700',
        boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]',
        fontWeight: 'normal',
        _hover: {
          bg: 'gray.100',
        },
      },
      active: {
        bg: 'primary.500',
        color: 'white',
        boxShadow: '[none]',
        fontWeight: 'medium',
        _hover: {
          bg: 'primary.500',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'page',
  },
});

/**
 * 省略記号スタイル
 */
export const paginationEllipsis = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '9',
  h: '9',
  color: 'gray.500',
  fontSize: '[14px]',
});
