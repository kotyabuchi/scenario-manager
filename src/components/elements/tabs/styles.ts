import { css, cva } from '@/styled-system/css';

/**
 * Tabsルートスタイル
 */
export const tabsRoot = css({
  width: '100%',
});

/**
 * タブリストスタイル
 */
export const tabsList = cva({
  base: {
    display: 'flex',
    gap: '4px',
    padding: '4px',
  },
  variants: {
    variant: {
      default: {
        bg: '#F3F4F6',
        borderRadius: '8px',
      },
      underline: {
        bg: 'transparent',
        borderRadius: '0',
        borderBottom: '2px solid #E5E7EB',
        padding: '0',
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
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    color: '#6B7280',
    bg: 'transparent',
    border: 'none',
    position: 'relative',
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  variants: {
    variant: {
      default: {
        padding: '0 16px',
        height: '36px',
        borderRadius: '6px',
        _selected: {
          color: '#1F2937',
          bg: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        },
      },
      underline: {
        padding: '12px 16px',
        height: 'auto',
        borderRadius: '0',
        _selected: {
          color: '#10B981',
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
  bottom: '-2px',
  left: 0,
  right: 0,
  height: '2px',
  borderRadius: '1px',
  bg: 'transparent',
  transition: 'background 0.15s',
});

/**
 * タブコンテンツスタイル
 */
export const tabsContent = css({
  padding: '16px',
});
