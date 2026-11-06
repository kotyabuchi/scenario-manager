import { css } from '@/styled-system/css';

/**
 * ToggleGroupルートスタイル
 */
export const toggleGroupRoot = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(40px, 1fr))',
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
  height: '10',
  px: '[10px]',
  borderRadius: 'sm',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  bg: 'transparent',
  border: 'none',
  color: 'gray.400',
  outlineColor: 'primary.default',
  outlineOffset: '0.5',
  '&[data-state=on]': {
    bg: 'white',
    boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]',
    color: 'gray.800',
    fontWeight: 'bold',
  },
  '&:hover&:not([data-state=on])': {
    color: 'gray.500',
    bg: 'gray.200',
    fontWeight: 'medium',
  },
  _disabled: {
    color: 'gray.300',
    cursor: 'not-allowed',
  },
});
