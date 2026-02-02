import { cva } from '@/styled-system/css';

/**
 * Badgeのスタイル
 *
 * バリアント:
 * - success: 緑（公開中、完了）
 * - warning: 黄色（保留中、準備中）
 * - error: 赤（エラー、中止）
 * - neutral: グレー（下書き、非公開）
 */
export const badge = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
    padding: '[4px 10px]',
    borderRadius: 'lg',
    fontSize: '[12px]',
    fontWeight: 'medium',
  },
  variants: {
    variant: {
      success: {
        backgroundColor: 'primary.100',
        color: 'primary.800',
      },
      warning: {
        backgroundColor: 'orange.100',
        color: 'orange.800',
      },
      error: {
        backgroundColor: 'red.100',
        color: 'red.800',
      },
      neutral: {
        backgroundColor: 'gray.100',
        color: 'gray.700',
      },
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});

/**
 * Badgeのドットスタイル
 */
export const badgeDot = cva({
  base: {
    width: '1.5',
    height: '1.5',
    borderRadius: '[3px]',
  },
  variants: {
    variant: {
      success: {
        backgroundColor: 'primary.500',
      },
      warning: {
        backgroundColor: 'orange.500',
      },
      error: {
        backgroundColor: 'red.500',
      },
      neutral: {
        backgroundColor: 'gray.500',
      },
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});

/**
 * Badgeのテキストスタイル
 */
export const badgeText = cva({
  base: {
    fontSize: '[12px]',
    fontWeight: 'medium',
  },
  variants: {
    variant: {
      success: {
        color: 'primary.800',
      },
      warning: {
        color: 'orange.800',
      },
      error: {
        color: 'red.800',
      },
      neutral: {
        color: 'gray.700',
      },
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});
