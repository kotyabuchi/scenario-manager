import { css, cva } from '@/styled-system/css';

/**
 * チェックボックスのルートスタイル
 */
export const checkboxRoot = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  _disabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
});

/**
 * チェックボックスのコントロール（ボックス）スタイル
 */
export const checkboxControl = cva({
  base: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease-out',
    flexShrink: 0,
    _focusVisible: {
      outline: '2px solid',
      outlineColor: 'primary.default',
      outlineOffset: '2px',
    },
  },
  variants: {
    checked: {
      true: {
        backgroundColor: '#10B981',
        color: 'white',
      },
      false: {
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      },
    },
    disabled: {
      true: {
        backgroundColor: '#E5E7EB',
        opacity: 0.5,
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
    fontSize: '14px',
    userSelect: 'none',
  },
  variants: {
    disabled: {
      true: {
        color: '#9CA3AF',
      },
      false: {
        color: '#374151',
      },
    },
  },
  defaultVariants: {
    disabled: false,
  },
});
