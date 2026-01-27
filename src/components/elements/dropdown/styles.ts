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
  gap: '8px',
  px: '12px',
  py: '8px',
  bg: 'white',
  borderRadius: '8px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all {durations.fast} ease-out',
  _hover: {
    bg: '#F9FAFB',
  },
  _focus: {
    outline: '2px solid',
    outlineColor: 'border.focus',
    outlineOffset: '2px',
  },
});

/**
 * Dropdownのメニュースタイル
 */
export const dropdownMenu = css({
  position: 'absolute',
  top: '100%',
  left: 0,
  mt: '4px',
  bg: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  p: '4px',
  minW: '160px',
  zIndex: 10,
});

/**
 * Dropdownのメニューアイテムスタイル
 */
export const dropdownItem = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    w: '100%',
    px: '12px',
    py: '8px',
    borderRadius: '6px',
    fontSize: '13px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all {durations.fast} ease-out',
    _hover: {
      bg: '#F3F4F6',
    },
  },
  variants: {
    selected: {
      true: {
        bg: '#F0FDF4',
        color: '#10B981',
        _hover: {
          bg: '#F0FDF4',
        },
      },
      false: {
        bg: 'transparent',
        color: '#374151',
      },
    },
    disabled: {
      true: {
        cursor: 'not-allowed',
        color: '#9CA3AF',
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
