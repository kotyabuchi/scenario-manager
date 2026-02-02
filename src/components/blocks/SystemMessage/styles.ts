import { css, cva } from '@/styled-system/css';

export const container = css({
  position: 'fixed',
  top: '0',
  left: '0',
  right: '0',
  zIndex: '[1000]',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2',
  p: '4',
  pointerEvents: 'none',
});

export const messageItem = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    w: 'full',
    maxW: '[600px]',
    px: '4',
    py: '2',
    borderRadius: 'lg',
    shadow: 'card.default',
    pointerEvents: 'auto',
    animation: '[slideInFromTop 0.3s ease-out]',
  },
  variants: {
    level: {
      success: {
        bg: 'primary.subtle',
        color: 'primary.text',
      },
      error: {
        bg: 'error.subtle',
        color: 'error.textDark',
      },
      warning: {
        bg: 'warning.subtle',
        color: 'warning.text',
      },
      info: {
        bg: 'info.subtle',
        color: 'info.text',
      },
    },
  },
  defaultVariants: {
    level: 'info',
  },
});

export const icon = css({
  flexShrink: '0',
});

export const messageText = css({
  flex: '1',
  fontSize: 'sm',
  fontWeight: 'medium',
});

export const closeButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '6',
  h: '6',
  borderRadius: 'full',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  flexShrink: '0',
  transitionProperty: 'background',
  transitionDuration: 'fast',
  _hover: {
    bg: '[rgba(0, 0, 0, 0.05)]',
  },
});
