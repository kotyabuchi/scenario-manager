import { cva } from '@/styled-system/css';

/**
 * Input スタイル定義 - 画面設計準拠
 */
export const input = cva({
  base: {
    w: 'full',
    h: '44px',
    px: '12px',
    border: 'none',
    borderRadius: '8px',
    bg: 'input.bg',
    color: 'input.text',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'all {durations.fast} ease-out',
    _hover: {
      bg: 'gray.200',
    },
    _focus: {
      outline: '2px solid',
      outlineColor: 'border.focus',
    },
    _placeholder: {
      color: 'input.placeholder',
    },
    _disabled: {
      opacity: 'disabled',
      cursor: 'not-allowed',
      bg: 'input.bgDisabled',
      _hover: {
        bg: 'input.bgDisabled',
      },
    },
  },
  variants: {
    /** エラー状態 */
    hasError: {
      true: {
        bg: 'input.bgError',
        outline: '1px solid',
        outlineColor: 'input.errorBorder',
        _focus: {
          outlineColor: 'input.errorBorder',
        },
      },
    },
    /** サイズバリアント */
    size: {
      sm: {
        h: '36px',
        fontSize: '13px',
      },
      md: {
        h: '44px',
        fontSize: '14px',
      },
      lg: {
        h: '48px',
        fontSize: '14px',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
