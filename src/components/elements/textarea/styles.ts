import { cva } from '@/styled-system/css';

/**
 * Textarea スタイル定義 - 画面設計準拠
 */
export const textarea = cva({
  base: {
    w: 'full',
    px: '3',
    py: '3',
    border: 'none',
    borderRadius: 'md',
    bg: 'input.bg',
    color: 'input.text',
    fontSize: '[14px]',
    fontFamily: '[Inter, sans-serif]',
    outline: 'none',
    resize: 'vertical',
    minH: '[120px]',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    _hover: {
      bg: 'gray.200',
    },
    _focusVisible: {
      outline: '[2px solid]',
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
        outline: '[1px solid]',
        outlineColor: 'input.errorBorder',
        _focusVisible: {
          outlineColor: 'input.errorBorder',
        },
      },
    },
    /** サイズバリアント */
    size: {
      sm: {
        px: '2',
        py: '2',
        fontSize: '[13px]',
        minH: '[80px]',
      },
      md: {
        px: '3',
        py: '3',
        fontSize: '[14px]',
        minH: '[120px]',
      },
      lg: {
        px: '4',
        py: '4',
        fontSize: '[14px]',
        minH: '[160px]',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
