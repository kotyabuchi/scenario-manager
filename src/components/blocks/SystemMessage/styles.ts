import { css, cva } from '@/styled-system/css';

export const container = css({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'sm',
  p: 'md',
  pointerEvents: 'none',
});

export const messageItem = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: 'sm',
    w: 'full',
    maxW: '600px',
    px: 'md',
    py: 'sm',
    borderRadius: 'lg',
    shadow: 'card.default',
    pointerEvents: 'auto',
    animation: 'slideInFromTop 0.3s ease-out',
  },
  variants: {
    level: {
      success: {
        bg: 'success.subtle',
        color: 'success.emphasized',
      },
      error: {
        bg: 'danger.subtle',
        color: 'danger.emphasized',
      },
      warning: {
        bg: 'warning.subtle',
        color: 'warning.emphasized',
      },
      info: {
        bg: 'info.subtle',
        color: 'info.emphasized',
      },
    },
  },
  defaultVariants: {
    level: 'info',
  },
});

export const icon = css({
  flexShrink: 0,
});

export const messageText = css({
  flex: 1,
  fontSize: 'sm',
  fontWeight: 'medium',
});

export const closeButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '24px',
  h: '24px',
  borderRadius: 'full',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background {durations.fast}',
  _hover: {
    bg: 'bg.emphasized',
  },
});
