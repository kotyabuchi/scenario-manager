import { defineTokens } from '@pandacss/dev';

/**
 * Spacing tokens - Apple式 4px単位グリッド
 *
 * 基本単位: 4px
 * 用途の目安:
 * - 0-2: 微調整（アイコン内、密なUI）
 * - 3-4: コンポーネント内の間隔
 * - 5-6: 関連要素間
 * - 7-8: セクション間
 * - 9以上: ページレベルの余白
 */
export const spacing = defineTokens.spacing({
  // 基本スケール（4px単位）
  0: { value: '0' },
  1: { value: '4px' },
  2: { value: '8px' },
  3: { value: '12px' },
  4: { value: '16px' },
  5: { value: '20px' },
  6: { value: '24px' },
  7: { value: '28px' },
  8: { value: '32px' },
  9: { value: '36px' },
  10: { value: '40px' },
  12: { value: '48px' },
  14: { value: '56px' },
  16: { value: '64px' },
  20: { value: '80px' },
  24: { value: '96px' },

  // セマンティックエイリアス（後方互換 + 可読性）
  xs: { value: '{spacing.1}' }, // 4px
  sm: { value: '{spacing.2}' }, // 8px
  md: { value: '{spacing.4}' }, // 16px
  lg: { value: '{spacing.6}' }, // 24px
  xl: { value: '{spacing.8}' }, // 32px
  '2xl': { value: '{spacing.12}' }, // 48px
  '3xl': { value: '{spacing.16}' }, // 64px
});
