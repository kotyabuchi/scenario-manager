import { css, cva } from '@/styled-system/css';

/**
 * チェックボックスのルートスタイル
 */
export const checkboxRoot = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  cursor: 'pointer',
  _disabled: {
    cursor: 'not-allowed',
    opacity: 'disabled',
  },
});

/**
 * チェックボックスのコントロール（ボックス）スタイル
 */
export const checkboxControl = cva({
  base: {
    width: '[20px]',
    height: '[20px]',
    borderRadius: 'xs',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    flexShrink: '0',
    _focusVisible: {
      outline: '[2px solid]',
      outlineColor: 'border.focus',
      outlineOffset: '[2px]',
    },
  },
  variants: {
    checked: {
      true: {
        backgroundColor: 'primary.500',
        color: 'white',
      },
      false: {
        backgroundColor: 'white',
        boxShadow: '[0 1px 2px rgba(0,0,0,0.08)]',
      },
    },
    disabled: {
      true: {
        backgroundColor: 'gray.200',
        opacity: 'disabled',
      },
    },
  },
  defaultVariants: {
    checked: false,
    disabled: false,
  },
});

/**
 * チェックボックスのラベルスタイル
 */
export const checkboxLabel = cva({
  base: {
    fontSize: '[14px]',
    userSelect: 'none',
  },
  variants: {
    disabled: {
      true: {
        color: 'gray.400',
      },
      false: {
        color: 'gray.700',
      },
    },
  },
  defaultVariants: {
    disabled: false,
  },
});
