import { cva } from '@/styled-system/css';

/**
 * アバターのスタイル
 *
 * サイズバリアント:
 * - xs: 24px
 * - sm: 32px
 * - md: 40px (デフォルト)
 * - lg: 48px
 * - xl: 64px
 */
export const avatar = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
  },
  variants: {
    size: {
      xs: {
        width: '24px',
        height: '24px',
      },
      sm: {
        width: '32px',
        height: '32px',
      },
      md: {
        width: '40px',
        height: '40px',
      },
      lg: {
        width: '48px',
        height: '48px',
      },
      xl: {
        width: '64px',
        height: '64px',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

/**
 * フォールバック表示のスタイル
 */
export const avatarFallback = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    bg: '#D1FAE5', // primary.100相当
    color: '#10B981', // primary.default相当
  },
});

/**
 * 画像のスタイル
 */
export const avatarImage = cva({
  base: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});
