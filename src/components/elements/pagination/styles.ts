import { css, cva } from '@/styled-system/css';

/**
 * Paginationのルートスタイル
 */
export const paginationRoot = css({
  display: 'flex',
  gap: '4px',
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
    w: '36px',
    h: '36px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all {durations.fast}',
  },
  variants: {
    variant: {
      nav: {
        bg: 'white',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        color: '#6B7280',
        _disabled: {
          opacity: 'disabled',
          cursor: 'not-allowed',
        },
        _hover: {
          bg: '#F3F4F6',
        },
      },
      page: {
        bg: 'white',
        color: '#374151',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        fontWeight: 'normal',
        _hover: {
          bg: '#F3F4F6',
        },
      },
      active: {
        bg: '#10B981',
        color: 'white',
        boxShadow: 'none',
        fontWeight: 500,
        _hover: {
          bg: '#10B981',
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
  w: '36px',
  h: '36px',
  color: '#6B7280',
  fontSize: '14px',
});
