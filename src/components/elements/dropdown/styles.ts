import { css, cva } from '@/styled-system/css';

/**
 * Dropdownのルートスタイル
 */
export const dropdownRoot = css({
  position: 'relative',
  display: 'inline-block',
});

/**
 * Dropdownのトリガーボタンスタイル
 */
export const dropdownTrigger = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  px: '3',
  py: '2',
  bg: 'white',
  borderRadius: 'md',
  boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.08)]',
  fontSize: '[14px]',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    bg: 'gray.50',
  },
  _focus: {
    outline: '[2px solid]',
    outlineColor: 'border.focus',
    outlineOffset: '[2px]',
  },
});

/**
 * Dropdownのメニュースタイル
 */
export const dropdownMenu = css({
  position: 'absolute',
  top: '[100%]',
  left: '0',
  mt: '1',
  bg: 'white',
  borderRadius: 'md',
  boxShadow: '[0 4px 16px rgba(0, 0, 0, 0.08)]',
  p: '1',
  minW: '[160px]',
  zIndex: '[10]',
});

/**
 * Dropdownのメニューアイテムスタイル
 */
export const dropdownItem = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    w: 'full',
    px: '3',
    py: '2',
    borderRadius: 'sm',
    fontSize: '[13px]',
    textAlign: 'left',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    _hover: {
      bg: 'gray.100',
    },
  },
  variants: {
    selected: {
      true: {
        bg: 'green.50',
        color: 'primary.500',
        _hover: {
          bg: 'green.50',
        },
      },
      false: {
        bg: 'transparent',
        color: 'gray.700',
      },
    },
    disabled: {
      true: {
        cursor: 'not-allowed',
        color: 'gray.400',
        opacity: 'disabled',
        _hover: {
          bg: 'transparent',
        },
      },
    },
  },
  defaultVariants: {
    selected: false,
    disabled: false,
  },
});
