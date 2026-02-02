import { css, cva } from '@/styled-system/css';

/**
 * Tabsルートスタイル
 */
export const tabsRoot = css({
  width: 'full',
});

/**
 * タブリストスタイル
 */
export const tabsList = cva({
  base: {
    display: 'flex',
    gap: '1',
    padding: '1',
  },
  variants: {
    variant: {
      default: {
        bg: 'gray.100',
        borderRadius: 'md',
      },
      underline: {
        bg: 'transparent',
        borderRadius: '[0]',
        borderBottom: '[2px solid #E5E7EB]',
        padding: '[0]',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/**
 * タブトリガースタイル
 */
export const tabsTrigger = cva({
  base: {
    fontSize: '[14px]',
    fontWeight: 'medium',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    color: 'gray.500',
    bg: 'transparent',
    border: 'none',
    position: 'relative',
    _disabled: {
      opacity: 'disabled',
      cursor: 'not-allowed',
    },
  },
  variants: {
    variant: {
      default: {
        padding: '[0 16px]',
        height: '9',
        borderRadius: 'sm',
        _selected: {
          color: 'gray.800',
          bg: 'white',
          boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]',
        },
      },
      underline: {
        padding: '[12px 16px]',
        height: 'auto',
        borderRadius: '[0]',
        _selected: {
          color: 'primary.500',
          bg: 'transparent',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/**
 * アンダーラインインジケーター
 */
export const tabsIndicator = css({
  position: 'absolute',
  bottom: '[-2px]',
  left: '0',
  right: '0',
  height: '[2px]',
  borderRadius: '[1px]',
  bg: 'transparent',
  transitionProperty: 'background',
  transitionDuration: 'fast',
});

/**
 * タブコンテンツスタイル
 */
export const tabsContent = css({
  padding: '4',
});
