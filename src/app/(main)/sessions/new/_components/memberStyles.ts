import { css } from '@/styled-system/css';

// MemberSearchInput styles
export const memberSearch = css({
  position: 'relative',
});

export const memberSearch_inputWrapper = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const memberSearch_prefixIcon = css({
  position: 'absolute',
  left: '3',
  color: 'text.secondary',
  fontSize: 'lg',
  zIndex: '[1]',
  pointerEvents: 'none',
});

export const memberSearch_loadingIcon = css({
  position: 'absolute',
  right: '3',
  color: 'text.secondary',
  animation: 'spin',
});

export const memberSearch_dropdown = css({
  position: 'absolute',
  top: '[100%]',
  left: '[0]',
  right: '[0]',
  mt: '1',
  bg: 'bg.card',
  shadow: 'card.default',
  rounded: 'xl',
  overflow: 'hidden',
  zIndex: '[10]',
  listStyle: 'none',
  p: '1',
});

export const memberSearch_item = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  w: 'full',
  px: '3',
  py: '2',
  rounded: 'lg',
  cursor: 'pointer',
  bg: 'transparent',
  border: 'none',
  textAlign: 'left',
  _hover: {
    bg: 'gray.50',
  },
});

export const memberSearch_itemText = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
});

export const memberSearch_nickname = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.title',
});

export const memberSearch_username = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

// MemberListItem styles
export const memberItem = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  px: '3',
  py: '2',
  rounded: 'lg',
  bg: 'gray.50',
});

export const memberItem_info = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  minW: '[0]',
});

export const memberItem_text = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
  minW: '[0]',
});

export const memberItem_nickname = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.title',
  truncate: true,
});

export const memberItem_username = css({
  fontSize: 'xs',
  color: 'text.secondary',
  truncate: true,
});

export const memberItem_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flexShrink: 0,
});
