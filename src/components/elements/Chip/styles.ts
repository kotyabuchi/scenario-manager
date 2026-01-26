import { cva } from '@/styled-system/css';

/**
 * チップのスタイル - 画面設計準拠
 *
 * バリアント:
 * - selectable: 選択可能なチップ（緑）
 * - label: ラベル用チップ（グレー）
 * - error: エラー表示チップ（赤）
 * - outline: アウトラインチップ
 */
export const chip = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    px: '12px',
    py: '6px',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
    borderRadius: 'full',
    cursor: 'pointer',
    transition: 'all 150ms ease-out',
    border: 'none',
    outline: 'none',
    userSelect: 'none',
    _focusVisible: {
      outline: '2px solid',
      outlineColor: 'primary.default',
      outlineOffset: '2px',
    },
  },
  variants: {
    /** チップのスタイルバリアント */
    variant: {
      // 選択可能チップ（緑）
      selectable: {
        bg: 'chip.selectableBg',
        color: 'chip.selectableText',
        _hover: {
          opacity: 0.9,
        },
      },
      // ラベルチップ（グレー）
      label: {
        bg: 'chip.labelBg',
        color: 'chip.labelText',
        cursor: 'default',
      },
      // エラーチップ（赤）
      error: {
        bg: 'chip.errorBg',
        color: 'chip.errorText',
      },
      // アウトラインチップ
      outline: {
        bg: 'chip.outlineBg',
        color: 'chip.outlineText',
        boxShadow: 'inset 0 0 0 1px token(colors.chip.outlineBorder)',
      },
    },
    /** 選択状態（selectable バリアント用） */
    selected: {
      true: {},
      false: {},
    },
    /** サイズバリアント */
    size: {
      sm: {
        px: '8px',
        py: '4px',
        fontSize: '12px',
      },
      md: {
        px: '12px',
        py: '6px',
        fontSize: '13px',
      },
      lg: {
        px: '16px',
        py: '8px',
        fontSize: '14px',
      },
    },
  },
  compoundVariants: [
    // 選択可能チップで選択状態
    {
      variant: 'selectable',
      selected: true,
      css: {
        bg: 'chip.selectableBg',
        color: 'chip.selectableText',
      },
    },
    // 選択可能チップで非選択状態
    {
      variant: 'selectable',
      selected: false,
      css: {
        bg: 'chip.outlineBg',
        color: 'chip.outlineText',
        boxShadow: 'inset 0 0 0 1px token(colors.chip.outlineBorder)',
        _hover: {
          bg: 'gray.50',
        },
      },
    },
  ],
  defaultVariants: {
    variant: 'selectable',
    selected: false,
    size: 'md',
  },
});
