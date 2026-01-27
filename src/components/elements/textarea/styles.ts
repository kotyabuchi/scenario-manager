import { cva } from '@/styled-system/css';

/**
 * Textarea スタイル定義 - 画面設計準拠
 */
export const textarea = cva({
  base: {
    w: 'full',
    px: '12px',
    py: '12px',
    border: 'none',
    borderRadius: '8px',
    bg: 'input.bg',
    color: 'input.text',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    resize: 'vertical',
    minH: '120px',
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
        px: '8px',
        py: '8px',
        fontSize: '13px',
        minH: '80px',
      },
      md: {
        px: '12px',
        py: '12px',
        fontSize: '14px',
        minH: '120px',
      },
      lg: {
        px: '16px',
        py: '16px',
        fontSize: '14px',
        minH: '160px',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
