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
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  variants: {
    variant: {
      success: {
        backgroundColor: '#D1FAE5',
        color: '#065F46',
      },
      warning: {
        backgroundColor: '#FEF3C7',
        color: '#92400E',
      },
      error: {
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
      },
      neutral: {
        backgroundColor: '#F3F4F6',
        color: '#374151',
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
    width: '6px',
    height: '6px',
    borderRadius: '3px',
  },
  variants: {
    variant: {
      success: {
        backgroundColor: '#10B981',
      },
      warning: {
        backgroundColor: '#F59E0B',
      },
      error: {
        backgroundColor: '#EF4444',
      },
      neutral: {
        backgroundColor: '#6B7280',
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
    fontSize: '12px',
    fontWeight: 500,
  },
  variants: {
    variant: {
      success: {
        color: '#065F46',
      },
      warning: {
        color: '#92400E',
      },
      error: {
        color: '#991B1B',
      },
      neutral: {
        color: '#374151',
      },
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});
