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
    borderRadius: 'full',
    overflow: 'hidden',
    flexShrink: '0',
  },
  variants: {
    size: {
      xs: {
        width: '6',
        height: '6',
      },
      sm: {
        width: '8',
        height: '8',
      },
      md: {
        width: '10',
        height: '10',
      },
      lg: {
        width: '12',
        height: '12',
      },
      xl: {
        width: '16',
        height: '16',
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
    width: 'full',
    height: 'full',
    bg: 'primary.100', // primary.100相当
    color: 'primary.500', // primary.default相当
  },
});

/**
 * 画像のスタイル
 */
export const avatarImage = cva({
  base: {
    width: 'full',
    height: 'full',
    objectFit: 'cover',
  },
});
