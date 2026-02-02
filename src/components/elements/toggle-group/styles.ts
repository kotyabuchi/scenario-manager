import { css } from '@/styled-system/css';

/**
 * ToggleGroupルートスタイル
 */
export const toggleGroupRoot = css({
  display: 'flex',
  gap: '1',
  padding: '1',
  bg: 'gray.100',
  borderRadius: 'md',
});

/**
 * ToggleGroupアイテムスタイル
 */
export const toggleGroupItem = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '10',
  height: '10',
  borderRadius: 'sm',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  bg: 'transparent',
  border: 'none',
  color: 'gray.400',
  '&[data-state=on]': {
    bg: 'white',
    boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]',
    color: 'gray.800',
  },
  _hover: {
    color: 'gray.500',
    bg: 'gray.200',
  },
  _disabled: {
    color: 'gray.300',
    cursor: 'not-allowed',
  },
});
