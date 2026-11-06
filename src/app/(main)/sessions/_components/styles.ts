import { css, cva } from '@/styled-system/css';

export const pageContainer = css({
  bg: 'bg.page',
  minH: '[100vh]',
});

export const pageLayout = css({
  display: 'flex',
  flexDirection: 'column',
});

export const tabBar = css({
  bg: 'white',
  h: '[56px]',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  px: '8',
  shadow: '[0 2px 4px rgba(0, 0, 0, 0.05)]',
});

export const tabContainer = css({
  display: 'flex',
  bg: 'gray.100',
  borderRadius: 'md',
  p: '1',
});

export const tabButton = cva({
  base: {
    border: 'none',
    borderRadius: 'md',
    fontSize: '[14px]',
    fontFamily: 'body',
    px: '4',
    h: '9',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _hover: {
      color: 'gray.800',
    },
    _disabled: {
      opacity: '[0.5]',
      cursor: 'not-allowed',
    },
  },
  variants: {
    active: {
      true: {
        bg: 'white',
        color: 'gray.800',
        fontWeight: 'medium',
        shadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]',
      },
      false: {
        bg: 'transparent',
        color: 'gray.500',
        fontWeight: 'normal',
        shadow: '[none]',
      },
    },
  },
});

export const emptyState = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '[1]',
  minH: '[400px]',
  gap: '4',
});

export const emptyState_title = css({
  fontSize: '[16px]',
  color: 'gray.500',
});
