import { css } from '@/styled-system/css';

// SearchTopBar（PC 上部検索バー、lg 以上のみ表示）

export const searchTopBar = css({
  display: 'none',
  lg: {
    display: 'flex',
    alignItems: 'center',
    gap: '4',
    bg: 'white',
    px: '8',
    py: '4',
    shadow: 'subHeader.default',
    position: 'sticky',
    top: '0',
    zIndex: 'sticky',
  },
});

export const searchTopBar_systemSelect = css({
  width: '[280px]',
  flexShrink: '0',
});

export const searchTopBar_keywordInput = css({
  flex: '1',
  height: '[44px]',
  px: '4',
  border: 'none',
  borderRadius: 'md',
  bg: 'gray.100',
  color: 'gray.800',
  fontSize: 'sm',
  outline: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'gray.200',
  },
  _focus: {
    bg: 'gray.100',
    outline: '[2px solid]',
    outlineColor: 'primary.500',
  },
  _placeholder: {
    color: 'gray.400',
  },
});

export const searchTopBar_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexShrink: '0',
});
