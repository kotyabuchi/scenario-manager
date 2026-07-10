import { css, cva } from '@/styled-system/css';

/**
 * Pill のスタイル基盤（Badge / Chip の共有基盤）
 *
 * - tone: 色（状態・カテゴリ）
 * - variant: 塗り（subtle=淡色塗り / outline=白地＋枠）
 * - shape: 形状（rounded=8px / pill=全角丸）
 * - size: サイズ
 * - interactive: 操作可能（button化）時のカーソル・ホバー
 * - disabled: 無効
 */
export const pill = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
    fontWeight: 'medium',
    fontFamily: '[Inter, sans-serif]',
    border: 'none',
    outline: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    _focusVisible: {
      outline: '[2px solid]',
      outlineColor: 'border.focus',
      outlineOffset: '[-1px]',
    },
  },
  variants: {
    tone: {
      gray: {},
      green: {},
      pink: {},
      orange: {},
      red: {},
      purple: {},
      // データ駆動の動的色（CSS変数で注入。Tag コンポーネントが使用）
      custom: {},
    },
    variant: {
      subtle: {},
      outline: {
        bg: 'chip.outlineBg',
        color: 'chip.outlineText',
        boxShadow: '[inset 0 0 0 1px token(colors.chip.outlineBorder)]',
      },
    },
    shape: {
      rounded: { borderRadius: 'lg' },
      pill: { borderRadius: 'full' },
    },
    size: {
      // textTrim でハーフレディングが消える分、上下は 8px で確保する
      sm: { px: '2', py: '2', fontSize: '[12px]' },
      md: { px: '3', py: '2', fontSize: '[13px]' },
      lg: { px: '4', py: '2', fontSize: '[14px]' },
    },
    interactive: {
      true: { cursor: 'pointer' },
      false: { cursor: 'default' },
    },
    disabled: {
      true: { opacity: 'disabled', cursor: 'not-allowed' },
      false: {},
    },
  },
  compoundVariants: [
    // subtle × tone（淡色塗り）
    {
      variant: 'subtle',
      tone: 'gray',
      css: { bg: 'gray.100', color: 'gray.700' },
    },
    {
      variant: 'subtle',
      tone: 'green',
      css: { bg: 'primary.100', color: 'primary.800' },
    },
    {
      variant: 'subtle',
      tone: 'pink',
      css: { bg: 'pink.100', color: 'pink.700' },
    },
    {
      variant: 'subtle',
      tone: 'orange',
      css: { bg: 'orange.100', color: 'orange.800' },
    },
    {
      variant: 'subtle',
      tone: 'red',
      css: { bg: 'red.100', color: 'red.800' },
    },
    {
      variant: 'subtle',
      tone: 'purple',
      css: { bg: 'purple.100', color: 'purple.800' },
    },
    // データ駆動の動的色（CSS変数。Tag が --pill-bg / --pill-text を注入）
    {
      variant: 'subtle',
      tone: 'custom',
      css: {
        bg: '[var(--pill-bg, token(colors.gray.100))]',
        color: '[var(--pill-text, token(colors.gray.700))]',
      },
    },
    // 操作可能時のホバー
    {
      variant: 'subtle',
      interactive: true,
      disabled: false,
      css: { _hover: { opacity: 'hover' } },
    },
    {
      variant: 'outline',
      interactive: true,
      disabled: false,
      css: { _hover: { bg: 'gray.50' } },
    },
  ],
  defaultVariants: {
    tone: 'gray',
    variant: 'subtle',
    shape: 'rounded',
    size: 'md',
    interactive: false,
    disabled: false,
  },
});

/**
 * Pill のステータスドット
 */
export const pillDot = cva({
  base: {
    width: '1.5',
    height: '1.5',
    mx: '0.5',
    borderRadius: 'full',
    flexShrink: '0',
  },
  variants: {
    tone: {
      gray: { backgroundColor: 'gray.500' },
      green: { backgroundColor: 'primary.500' },
      pink: { backgroundColor: 'pink.500' },
      orange: { backgroundColor: 'orange.500' },
      red: { backgroundColor: 'red.500' },
      purple: { backgroundColor: 'purple.500' },
      custom: {
        backgroundColor:
          '[var(--pill-dot, var(--pill-text, token(colors.gray.500)))]',
      },
    },
  },
  defaultVariants: {
    tone: 'gray',
  },
});

/**
 * ラベルのスタイル
 * ハーフレディングを刈り取り、ドット/削除アイコンと光学的に上下中央を揃える
 */
export const pillLabel = css({
  textTrim: true,
});

/**
 * 削除アイコンのスタイル
 */
export const pillRemove = css({
  cursor: 'pointer',
  flexShrink: '0',
  opacity: '[0.7]',
  _hover: {
    opacity: '[1]',
  },
});
