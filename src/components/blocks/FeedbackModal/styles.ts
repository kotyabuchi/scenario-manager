import { css } from '@/styled-system/css';

export const form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
});

export const field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const label = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.body',
});

export const required = css({
  color: 'error.default',
  ml: '1',
});

export const radioGroup = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '2',
});

export const categoryItem = css({
  minH: '12',
  alignItems: 'center',
  justifyContent: 'flex-start',
  pl: '3',
  py: '2',
  borderRadius: 'lg',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border.default',
  bg: 'bg.card',
  color: 'text.secondary',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _checked: {
    borderColor: 'primary.text',
    bg: 'primary.subtleHover',
    color: 'primary.text',
    '& [data-part="item-text"]': {
      color: 'primary.text',
      fontWeight: 'semibold',
    },
    '& [data-part="item-control"]': {
      bg: 'primary.text',
      borderColor: 'primary.text',
    },
  },
  '&:has(input:focus-visible)': {
    outline: 'focusRing',
  },
  '& [data-part="item-control"]': {
    w: '4.5',
    h: '4.5',
    alignSelf: 'center',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'border.default',
    boxShadow: '[none]',
    bg: 'bg.card',
  },
  '& [data-part="item-text"]': {
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'center',
    lineHeight: 'none',
  },
});

export const categoryOption = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  whiteSpace: 'nowrap',
  fontSize: 'sm',
  lineHeight: 'none',
});

export const hintBox = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  py: '3',
  px: '4',
  borderRadius: 'lg',
  bg: 'primary.subtleHover',
});

export const hintRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const hintIcon = css({
  color: 'icon.idea',
  flexShrink: '0',
});

export const hintText = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.body',
});

export const hintLink = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'primary.text',
  cursor: 'pointer',
  _hover: {
    textDecoration: 'underline',
  },
});

export const hintSpacer = css({
  w: '4',
  h: '4',
  flexShrink: '0',
});

export const noticeRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
});

export const noticeIcon = css({
  color: 'text.secondary',
  flexShrink: '0',
});

export const noticeText = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

export const serverError = css({
  bg: 'error.subtleHover',
  color: 'error.text',
  p: '3',
  borderRadius: 'lg',
  fontSize: 'sm',
});

export const successMessage = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  fontSize: 'sm',
  color: 'text.secondary',
});
