import { cva } from '@/styled-system/css';

/**
 * チップのスタイル（選択可能なボタン・タグ）
 * デザインシステム準拠：ボーダーレス、セマンティックトークン使用
 */
export const chip = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'xs',
    px: 'md',
    py: '5px',
    fontSize: 'sm',
    fontWeight: 'medium',
    borderRadius: 'full',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    border: 'none',
    outline: 'none',
    userSelect: 'none',
    _focusVisible: {
      boxShadow:
        '0 0 0 2px {colors.bg.card}, 0 0 0 4px {colors.primary.focusRing}',
    },
  },
  variants: {
    selected: {
      true: {
        bg: 'primary.default',
        color: 'primary.foreground.white',
        shadow: 'chip.selected',
        _hover: {
          bg: 'primary.emphasized',
          shadow: 'chip.selectedHover',
        },
      },
      false: {
        bg: 'chip.default',
        color: 'text.primary',
        shadow: 'chip.default',
        _hover: {
          bg: 'chip.hover',
          shadow: 'chip.hover',
        },
      },
    },
    size: {
      sm: {
        px: 'sm',
        py: '3px',
        fontSize: 'xs',
      },
      md: {
        px: 'md',
        py: '5px',
        fontSize: 'sm',
      },
      lg: {
        px: 'lg',
        py: '7px',
        fontSize: 'md',
      },
    },
  },
  defaultVariants: {
    selected: false,
    size: 'md',
  },
});
