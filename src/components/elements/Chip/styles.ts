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
    gap: '1',
    px: '3',
    py: '1.5',
    fontSize: '[13px]',
    fontWeight: 'medium',
    fontFamily: '[Inter, sans-serif]',
    borderRadius: 'full',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    border: 'none',
    outline: 'none',
    userSelect: 'none',
    _focusVisible: {
      outline: '[2px solid]',
      outlineColor: 'border.focus',
      outlineOffset: '[2px]',
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
          opacity: 'hover',
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
        boxShadow: '[inset 0 0 0 1px token(colors.chip.outlineBorder)]',
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
        px: '2',
        py: '1',
        fontSize: '[12px]',
      },
      md: {
        px: '3',
        py: '1.5',
        fontSize: '[13px]',
      },
      lg: {
        px: '4',
        py: '2',
        fontSize: '[14px]',
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
        boxShadow: '[inset 0 0 0 1px token(colors.chip.outlineBorder)]',
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
