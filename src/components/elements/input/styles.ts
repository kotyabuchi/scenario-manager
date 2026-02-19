import { css, cva } from '@/styled-system/css';

/**
 * Input スタイル定義 - 画面設計準拠
 */
export const input = cva({
  base: {
    w: 'full',
    h: '[44px]',
    px: '3',
    border: 'none',
    borderRadius: 'md',
    bg: 'input.bg',
    color: 'input.text',
    fontSize: '[14px]',
    fontFamily: '[Inter, sans-serif]',
    outline: 'none',
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
        h: '9',
        fontSize: '[13px]',
      },
      md: {
        h: '[44px]',
        fontSize: '[14px]',
      },
      lg: {
        h: '12',
        fontSize: '[14px]',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

/**
 * prefix/suffix 使用時の内部 input スタイル（utilities層でrecipes層をオーバーライド）
 */
export const inputInner = css({
  flex: '1',
  h: 'full',
  px: '0',
  bg: 'transparent',
  borderRadius: '0',
  _hover: { bg: 'transparent' },
  _focusVisible: { outline: 'none', outlineColor: 'transparent' },
  _disabled: {
    opacity: '[1]',
    bg: 'transparent',
    _hover: { bg: 'transparent' },
  },
});

/** prefix/suffix ラッパーコンテナ */
export const inputWrapper = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    w: 'full',
    h: '[44px]',
    px: '3',
    border: 'none',
    borderRadius: 'md',
    bg: 'input.bg',
    color: 'input.text',
    fontSize: '[14px]',
    fontFamily: '[Inter, sans-serif]',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    _hover: {
      bg: 'gray.200',
    },
    '&:has(input:focus-visible)': {
      outline: '[2px solid]',
      outlineColor: 'border.focus',
    },
    '&:has(input:disabled)': {
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
        '&:has(input:focus-visible)': {
          outlineColor: 'input.errorBorder',
        },
      },
    },
    /** サイズバリアント */
    size: {
      sm: {
        h: '9',
        fontSize: '[13px]',
      },
      md: {
        h: '[44px]',
        fontSize: '[14px]',
      },
      lg: {
        h: '12',
        fontSize: '[14px]',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

/** prefix/suffix の addon スタイル */
export const inputAddon = css({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  color: 'input.placeholder',
});
